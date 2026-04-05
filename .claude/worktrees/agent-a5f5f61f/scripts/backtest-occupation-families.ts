#!/usr/bin/env bun
/**
 * backtest-occupation-families.ts — Family-level convergent validation.
 *
 * Aggregates occupations into 2-digit SSOC families, matches them through the
 * BLS crosswalk, and checks whether higher-risk families show weaker projected
 * employment change on average.
 *
 * Outputs:
 *   data/backtests/occupation-family-validation.json
 *   src/lib/data/backtests/occupation-family-validation.json
 *   static/data/backtests/occupation-family-validation.json
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import { ssocToSocCodes } from './crosswalk';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BLS_FILE = path.join(DATA_DIR, 'raw', 'external', 'bls_projections_2024_2034.xlsx');
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'backtests', 'occupation-family-validation.json');
const SRC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'src',
	'lib',
	'data',
	'backtests',
	'occupation-family-validation.json'
);
const STATIC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	'backtests',
	'occupation-family-validation.json'
);

interface Occupation {
	ssoc: string;
	title: string;
	major_group: string;
	net_risk: number;
	match_quality: string;
}

interface FamilyRow {
	prefix: string;
	label: string;
	occupation_count: number;
	matched_occupation_count: number;
	avg_net_risk: number;
	avg_bls_change: number;
	direct_share: number;
}

function round(value: number, decimals = 3): number {
	return Number(value.toFixed(decimals));
}

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function spearmanCorrelation(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length < 3) return NaN;
	const n = x.length;

	function averageRank(arr: number[]): number[] {
		const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
		const ranks = new Array<number>(n);
		let i = 0;
		while (i < n) {
			let j = i;
			while (j < n - 1 && indexed[j + 1].v === indexed[j].v) j++;
			const avgRank = (i + j) / 2 + 1;
			for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank;
			i = j + 1;
		}
		return ranks;
	}

	const rx = averageRank(x);
	const ry = averageRank(y);
	const meanRx = average(rx);
	const meanRy = average(ry);
	let numerator = 0;
	let denX = 0;
	let denY = 0;
	for (let i = 0; i < n; i++) {
		const dx = rx[i] - meanRx;
		const dy = ry[i] - meanRy;
		numerator += dx * dy;
		denX += dx * dx;
		denY += dy * dy;
	}
	return denX === 0 || denY === 0 ? 0 : numerator / Math.sqrt(denX * denY);
}

function tStatistic(rho: number, n: number): number {
	if (Math.abs(rho) >= 1) return rho > 0 ? Infinity : -Infinity;
	return rho * Math.sqrt((n - 2) / (1 - rho * rho));
}

function betaIncomplete(a: number, b: number, x: number): number {
	if (x < 0 || x > 1) return NaN;
	if (x === 0) return 0;
	if (x === 1) return 1;

	const maxIter = 200;
	const eps = 1e-10;
	const lnBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
	const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

	let f = 1;
	let c = 1;
	let d = 1 - ((a + b) * x) / (a + 1);
	if (Math.abs(d) < 1e-30) d = 1e-30;
	d = 1 / d;
	f = d;

	for (let m = 1; m <= maxIter; m++) {
		let numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
		d = 1 + numerator * d;
		if (Math.abs(d) < 1e-30) d = 1e-30;
		c = 1 + numerator / c;
		if (Math.abs(c) < 1e-30) c = 1e-30;
		d = 1 / d;
		f *= d * c;

		numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
		d = 1 + numerator * d;
		if (Math.abs(d) < 1e-30) d = 1e-30;
		c = 1 + numerator / c;
		if (Math.abs(c) < 1e-30) c = 1e-30;
		d = 1 / d;
		const delta = d * c;
		f *= delta;
		if (Math.abs(delta - 1) < eps) break;
	}

	return front * f;
}

function lgamma(z: number): number {
	const g = 7;
	const c = [
		0.9999999999998099, 676.5203681218851, -1259.1392167224028, 771.3234287776531,
		-176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6,
		1.5056327351493117e-7
	];
	if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
	z -= 1;
	let x = c[0];
	for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
	const t = z + g + 0.5;
	return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function tDistPValue(t: number, df: number): number {
	const x = df / (df + t * t);
	return betaIncomplete(df / 2, 0.5, x);
}

function readSocPctChange(): Map<string, number> {
	const wb = XLSX.readFile(BLS_FILE);
	const ws = wb.Sheets['Table 1.2'];
	const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
	const socPctChange = new Map<string, number>();
	for (let i = 2; i < rows.length; i++) {
		const row = rows[i];
		if (!row || row[2] !== 'Line item') continue;
		const socCode = row[1];
		const pctChange = row[8];
		if (typeof socCode === 'string' && typeof pctChange === 'number') {
			socPctChange.set(socCode, pctChange);
		}
	}
	return socPctChange;
}

function main() {
	const occupations: Occupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	const socPctChange = readSocPctChange();

	const familyMap = new Map<
		string,
		{
			label: string;
			rows: Array<Occupation & { bls_pct_change: number }>;
			totalOccupationCount: number;
		}
	>();

	for (const occupation of occupations) {
		const prefix = occupation.ssoc.slice(0, 2);
		const existing = familyMap.get(prefix) ?? {
			label: occupation.major_group ?? prefix,
			rows: [],
			totalOccupationCount: 0
		};
		existing.totalOccupationCount += 1;
		const matchedChanges = ssocToSocCodes(occupation.ssoc)
			.map(code => socPctChange.get(code))
			.filter((value): value is number => typeof value === 'number');
		if (matchedChanges.length > 0) {
			existing.rows.push({
				...occupation,
				bls_pct_change: round(average(matchedChanges), 3)
			});
		}
		familyMap.set(prefix, existing);
	}

	const families: FamilyRow[] = [...familyMap.entries()]
		.filter(([, family]) => family.totalOccupationCount >= 5 && family.rows.length >= 3)
		.map(([prefix, family]) => ({
			prefix,
			label: family.label,
			occupation_count: family.totalOccupationCount,
			matched_occupation_count: family.rows.length,
			avg_net_risk: round(average(family.rows.map(row => row.net_risk)), 4),
			avg_bls_change: round(average(family.rows.map(row => row.bls_pct_change)), 2),
			direct_share: round(
				family.rows.filter(row => row.match_quality === 'direct').length / family.rows.length
			)
		}))
		.sort((a, b) => b.avg_net_risk - a.avg_net_risk);

	const rho = spearmanCorrelation(
		families.map(family => family.avg_net_risk),
		families.map(family => family.avg_bls_change)
	);
	const t = Number.isFinite(rho) ? tStatistic(rho, families.length) : NaN;
	const p = Number.isFinite(t) ? tDistPValue(t, families.length - 2) : NaN;

	const result = {
		validation_date: new Date().toISOString().slice(0, 10),
		model_version: DATA_VINTAGE.model_version,
		bls_data_period: '2024-2034 projections',
		family_definition:
			'2-digit SSOC occupation families with at least 5 occupations overall and 3 BLS-matched occupations',
		family_count: families.length,
		spearman_rho: round(rho),
		t_statistic: round(t, 2),
		p_value_below_001: Number.isFinite(p) ? p < 0.001 : false,
		p_value_below_01: Number.isFinite(p) ? p < 0.01 : false,
		negative_direction: Number.isFinite(rho) ? rho < 0 : false,
		interpretation:
			'Aggregating to occupation families gives a more granular convergent check than the 3 labour clusters without pretending to have official occupation-level outcome data. Higher-risk families should show weaker projected employment change on average.',
		top_high_risk_families: families.slice(0, 10),
		top_low_growth_families: [...families]
			.sort((a, b) => a.avg_bls_change - b.avg_bls_change)
			.slice(0, 10),
		caveats: [
			'This remains a cross-country convergent check built on the BLS crosswalk rather than Singapore realised family-level outcomes.',
			'Two-digit SSOC families are broader than individual occupations and can still mask substantial within-family variation.',
			'Family labels are structural group labels, not official outcome categories.'
		]
	};

	for (const filePath of [OUTPUT_FILE, SRC_OUTPUT_FILE, STATIC_OUTPUT_FILE]) {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
	}

	console.log(`Built occupation-family validation at ${OUTPUT_FILE}`);
}

main();
