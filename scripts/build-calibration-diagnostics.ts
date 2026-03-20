#!/usr/bin/env bun
/**
 * build-calibration-diagnostics.ts — Segment-level calibration diagnostics for
 * structural risk validation quality.
 *
 * This artifact answers a trust-critical question:
 * do direct mappings and higher-confidence scores validate better than fallback
 * mappings and lower-confidence scores when cross-checked against external BLS
 * projections?
 *
 * Outputs:
 *   data/backtests/calibration-diagnostics.json
 *   src/lib/data/backtests/calibration-diagnostics.json
 *   static/data/backtests/calibration-diagnostics.json
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE, getRiskBand } from '../src/lib/data/scoring-constants';
import { ssocToSocCodes } from './crosswalk';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'backtests', 'calibration-diagnostics.json');
const SRC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'src',
	'lib',
	'data',
	'backtests',
	'calibration-diagnostics.json'
);
const STATIC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	'backtests',
	'calibration-diagnostics.json'
);
const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const BLS_FILE = path.join(DATA_DIR, 'raw', 'external', 'bls_projections_2024_2034.xlsx');

type MatchQuality = 'direct' | 'submajor_fallback' | 'major_fallback';
type ConfidenceLevel = 'high' | 'medium' | 'low';
type RiskBand = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

interface Occupation {
	ssoc: string;
	title: string;
	net_risk: number;
	match_quality: MatchQuality;
	confidence: {
		level: ConfidenceLevel;
		exposure_source_count?: number;
	};
}

interface MatchedOccupation extends Occupation {
	risk_band: RiskBand;
	bls_pct_change: number;
}

interface SegmentStats {
	sample_size: number;
	share_of_matched_sample: number;
	share_of_total_occupations: number;
	spearman_rho: number | null;
	t_statistic: number | null;
	p_value_below_001: boolean | null;
	p_value_below_01: boolean | null;
	avg_net_risk: number;
	avg_bls_change: number;
	negative_direction: boolean | null;
}

interface SegmentCollection {
	[key: string]: SegmentStats;
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
		0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.3234287776531,
		-176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6,
		1.5056327351493117e-7
	];
	if (z < 0.5) {
		return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
	}
	z -= 1;
	let x = c[0];
	for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
	const t = z + g + 0.5;
	return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function tDistPValue(t: number, df: number): number {
	if (df > 300) {
		const z = Math.abs(t);
		const p = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
		const a1 = 0.254829592;
		const a2 = -0.284496736;
		const a3 = 1.421413741;
		const a4 = -1.453152027;
		const a5 = 1.061405429;
		const k = 1 / (1 + 0.3275911 * z);
		const cdf = 1 - p * (a1 * k + a2 * k ** 2 + a3 * k ** 3 + a4 * k ** 4 + a5 * k ** 5);
		return 2 * (1 - cdf);
	}
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

function buildMatchedOccupations(): MatchedOccupation[] {
	const occupations: Occupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	const socPctChange = readSocPctChange();

	return occupations.flatMap(occupation => {
		const socCodes = ssocToSocCodes(occupation.ssoc);
		const matchedChanges = socCodes
			.map(code => socPctChange.get(code))
			.filter((value): value is number => typeof value === 'number');

		if (matchedChanges.length === 0) return [];

		return [
			{
				...occupation,
				risk_band: getRiskBand(occupation.net_risk),
				bls_pct_change: round(average(matchedChanges), 3)
			}
		];
	});
}

function summarizeSegment(
	rows: MatchedOccupation[],
	matchedTotal: number,
	totalOccupations: number
): SegmentStats {
	const risks = rows.map(row => row.net_risk);
	const bls = rows.map(row => row.bls_pct_change);
	const rho = rows.length >= 3 ? spearmanCorrelation(risks, bls) : NaN;
	const t = Number.isFinite(rho) ? tStatistic(rho, rows.length) : NaN;
	const p = Number.isFinite(t) && rows.length >= 3 ? tDistPValue(t, rows.length - 2) : NaN;

	return {
		sample_size: rows.length,
		share_of_matched_sample: round(rows.length / matchedTotal),
		share_of_total_occupations: round(rows.length / totalOccupations),
		spearman_rho: Number.isFinite(rho) ? round(rho) : null,
		t_statistic: Number.isFinite(t) ? round(t, 2) : null,
		p_value_below_001: Number.isFinite(p) ? p < 0.001 : null,
		p_value_below_01: Number.isFinite(p) ? p < 0.01 : null,
		avg_net_risk: round(average(risks)),
		avg_bls_change: round(average(bls), 2),
		negative_direction: Number.isFinite(rho) ? rho < 0 : null
	};
}

function summarizeCollection(
	keys: string[],
	groupBy: (row: MatchedOccupation) => string | number | undefined
): SegmentCollection {
	const rows = buildMatchedOccupationsCache;
	const totalOccupations = allOccupationsCount;
	return Object.fromEntries(
		keys.map(key => {
			const segmentRows = rows.filter(row => String(groupBy(row)) === key);
			return [key, summarizeSegment(segmentRows, rows.length, totalOccupations)];
		})
	);
}

const buildMatchedOccupationsCache = buildMatchedOccupations();
const allOccupationsCount = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8')).length as number;

const byMatchQuality = summarizeCollection(
	['direct', 'submajor_fallback', 'major_fallback'],
	row => row.match_quality
);
const byConfidenceLevel = summarizeCollection(
	['high', 'medium', 'low'],
	row => row.confidence.level
);
const byExposureSourceCount = summarizeCollection(['1', '2', '3', '4'], row =>
	row.confidence.exposure_source_count ? String(row.confidence.exposure_source_count) : undefined
);

const directRho = byMatchQuality.direct.spearman_rho ?? 0;
const fallbackRows = buildMatchedOccupationsCache.filter(row => row.match_quality !== 'direct');
const fallbackStats = summarizeSegment(
	fallbackRows,
	buildMatchedOccupationsCache.length,
	allOccupationsCount
);
const highOrMediumRows = buildMatchedOccupationsCache.filter(
	row => row.confidence.level === 'high' || row.confidence.level === 'medium'
);
const highOrMediumStats = summarizeSegment(
	highOrMediumRows,
	buildMatchedOccupationsCache.length,
	allOccupationsCount
);
const highConfidenceRho = byConfidenceLevel.high.spearman_rho ?? 0;
const lowConfidenceRho = byConfidenceLevel.low.spearman_rho ?? 0;

const diagnostics = {
	validation_date: new Date().toISOString().slice(0, 10),
	model_version: DATA_VINTAGE.model_version,
	bls_data_period: '2024-2034 projections',
	total_occupations: allOccupationsCount,
	matched_sample_size: buildMatchedOccupationsCache.length,
	segments: {
		by_match_quality: {
			...byMatchQuality,
			all_fallback: fallbackStats
		},
		by_confidence_level: {
			...byConfidenceLevel,
			high_or_medium: highOrMediumStats
		},
		by_exposure_source_count: byExposureSourceCount
	},
	summary: {
		direct_vs_fallback_rho_gap: round(
			Math.abs(directRho) - Math.abs(fallbackStats.spearman_rho ?? 0)
		),
		high_vs_low_confidence_rho_gap: round(Math.abs(highConfidenceRho) - Math.abs(lowConfidenceRho)),
		direct_segment_significant_negative:
			byMatchQuality.direct.negative_direction === true &&
			byMatchQuality.direct.p_value_below_01 === true,
		high_or_medium_significant_negative:
			highOrMediumStats.negative_direction === true && highOrMediumStats.p_value_below_01 === true,
		low_confidence_sample_small: byConfidenceLevel.low.sample_size < 15,
		interpretation:
			'Direct mappings should carry the most stable external validation because they dominate the matched sample. Confidence-tier diagnostics are more reliable when high and medium are read together; the low-confidence tier is intentionally small and statistically noisy. Treat these as calibration diagnostics, not Singapore outcome truth.'
	},
	caveats: [
		'These diagnostics inherit the same cross-country limitations as the BLS crosswalk validation.',
		'Small low-confidence and major-fallback samples can make segment-level correlations noisy.',
		'This is a calibration check for confidence and mapping quality, not a separate occupation-level prediction benchmark.'
	]
};

for (const filePath of [OUTPUT_FILE, SRC_OUTPUT_FILE, STATIC_OUTPUT_FILE]) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(diagnostics, null, 2), 'utf-8');
}

console.log(`Built calibration diagnostics at ${OUTPUT_FILE}`);
