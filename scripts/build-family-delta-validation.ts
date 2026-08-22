#!/usr/bin/env bun
/**
 * build-family-delta-validation.ts — Aggregate live occupation scores to the
 * published 2-digit occupation-family level and compare them with 2024→2025
 * Labour Force Section D deltas.
 *
 * Outputs:
 *   - data/family-delta-validation-2025.json
 *   - src/lib/data/family-delta-validation-2025.json
 *   - static/data/family-delta-validation-2025.json
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');

const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const LFR_SIGNALS_FILE = path.join(DATA_DIR, 'lfr-section-d-signals.json');
const OUT_FILE = path.join(DATA_DIR, 'family-delta-validation-2025.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'family-delta-validation-2025.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'family-delta-validation-2025.json');

interface OccupationRow {
	ssoc: string;
	title: string;
	employment_thousands?: number | null;
	net_risk: number;
	transition_adjusted_risk?: number | null;
	realized_risk_proxy?: number | null;
	v8?: { ai_exposure_rank?: { points?: number } };
}

interface FamilySignal {
	code: string;
	label: string;
	total_2024: number;
	total_2025: number;
	delta_k: number;
	delta_pct: number | null;
}

function round(value: number, digits: number = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function pearson(xs: number[], ys: number[]): number | null {
	if (xs.length !== ys.length || xs.length < 2) return null;
	const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
	const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
	let numerator = 0;
	let denomX = 0;
	let denomY = 0;
	for (let index = 0; index < xs.length; index++) {
		const dx = xs[index]! - meanX;
		const dy = ys[index]! - meanY;
		numerator += dx * dy;
		denomX += dx * dx;
		denomY += dy * dy;
	}
	if (denomX === 0 || denomY === 0) return null;
	return round(numerator / Math.sqrt(denomX * denomY));
}

function ranks(values: number[]): number[] {
	const indexed = values
		.map((value, index) => ({ value, index }))
		.sort((a, b) => a.value - b.value);
	const result = Array(values.length).fill(0) as number[];
	for (let start = 0; start < indexed.length; ) {
		let end = start + 1;
		while (end < indexed.length && indexed[end]!.value === indexed[start]!.value) end++;
		const averageRank = (start + 1 + end) / 2;
		for (let cursor = start; cursor < end; cursor++) result[indexed[cursor]!.index] = averageRank;
		start = end;
	}
	return result;
}

function spearman(xs: number[], ys: number[]): number | null {
	return pearson(ranks(xs), ranks(ys));
}

const occupations = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8')) as OccupationRow[];
const signals = JSON.parse(fs.readFileSync(LFR_SIGNALS_FILE, 'utf-8')) as {
	family_employment: Record<string, FamilySignal>;
};

const byFamily = new Map<string, OccupationRow[]>();
for (const occupation of occupations) {
	const familyCode = occupation.ssoc.slice(0, 2);
	if (!byFamily.has(familyCode)) byFamily.set(familyCode, []);
	byFamily.get(familyCode)?.push(occupation);
}

const families = Object.values(signals.family_employment)
	.map(signal => {
		const occupationsInFamily = byFamily.get(signal.code) ?? [];
		const weightedEmployment = occupationsInFamily.reduce(
			(sum, occupation) => sum + (occupation.employment_thousands ?? 0),
			0
		);
		const safeWeight =
			weightedEmployment > 0 ? weightedEmployment : occupationsInFamily.length || 1;
		const weightedAverage = (
			pick: (occupation: OccupationRow) => number | null | undefined
		): number | null => {
			let numerator = 0;
			let denominator = 0;
			for (const occupation of occupationsInFamily) {
				const value = pick(occupation);
				if (value === null || value === undefined || !Number.isFinite(value)) continue;
				const weight =
					occupation.employment_thousands && occupation.employment_thousands > 0
						? occupation.employment_thousands
						: safeWeight / (occupationsInFamily.length || 1);
				numerator += value * weight;
				denominator += weight;
			}
			return denominator > 0 ? round(numerator / denominator) : null;
		};
		return {
			code: signal.code,
			label: signal.label,
			occupation_count: occupationsInFamily.length,
			total_2024: signal.total_2024,
			total_2025: signal.total_2025,
			delta_k: signal.delta_k,
			delta_pct: signal.delta_pct,
			avg_net_risk: weightedAverage(occupation => occupation.net_risk),
			avg_v8_ai_exposure_rank: weightedAverage(
				occupation => occupation.v8?.ai_exposure_rank?.points
			),
			avg_transition_adjusted_risk: weightedAverage(
				occupation => occupation.transition_adjusted_risk
			),
			avg_realized_risk_proxy: weightedAverage(occupation => occupation.realized_risk_proxy)
		};
	})
	.sort((a, b) => Math.abs(b.delta_k) - Math.abs(a.delta_k));

const familiesWithDeltaPct = families.filter(family => family.delta_pct !== null);
const deltaPcts = familiesWithDeltaPct.map(family => family.delta_pct as number);
const netRiskRows = familiesWithDeltaPct.filter(family => family.avg_net_risk !== null);
const v8ExposureRows = familiesWithDeltaPct.filter(
	family => family.avg_v8_ai_exposure_rank !== null
);
const transitionRows = familiesWithDeltaPct.filter(
	family => family.avg_transition_adjusted_risk !== null
);
const realizedRows = familiesWithDeltaPct.filter(family => family.avg_realized_risk_proxy !== null);

const output = {
	data_as_of: '2025',
	summary: {
		family_count: families.length,
		families_with_v8_exposure_and_delta: v8ExposureRows.length,
		spearman_delta_pct_vs_avg_v8_ai_exposure_rank: spearman(
			v8ExposureRows.map(row => row.delta_pct as number),
			v8ExposureRows.map(row => row.avg_v8_ai_exposure_rank as number)
		),
		correlation_delta_pct_vs_avg_net_risk: pearson(
			netRiskRows.map(row => row.delta_pct as number),
			netRiskRows.map(row => row.avg_net_risk as number)
		),
		correlation_delta_pct_vs_avg_transition_adjusted_risk: pearson(
			transitionRows.map(row => row.delta_pct as number),
			transitionRows.map(row => row.avg_transition_adjusted_risk as number)
		),
		correlation_delta_pct_vs_avg_realized_risk_proxy: pearson(
			realizedRows.map(row => row.delta_pct as number),
			realizedRows.map(row => row.avg_realized_risk_proxy as number)
		),
		median_family_delta_pct:
			deltaPcts.length > 0
				? round(deltaPcts.slice().sort((a, b) => a - b)[Math.floor(deltaPcts.length / 2)] ?? 0)
				: null
	},
	interpretation:
		'A contemporaneous, descriptive comparison between the current V8 AI Exposure Rank and official 2024 to 2025 employment movement across 2-digit occupation families. It is a broader local check than the three-cluster quarterly panel, but it is not causal and is not an out-of-sample forecast.',
	limitations: [
		'Employment movement reflects demand, migration, demographics, wages, policy and sampling variation as well as technology.',
		'The score and outcome periods overlap, so this is convergent evidence rather than forecast validation.',
		'Family averages inherit detailed occupation employment estimates and should not be read as official detailed-occupation results.'
	],
	families
};

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
fs.mkdirSync(STATIC_DATA_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
fs.writeFileSync(SRC_OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
fs.writeFileSync(STATIC_OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');

console.log(`Built family delta validation for ${families.length} 2-digit occupation families.`);
