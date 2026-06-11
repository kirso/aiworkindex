#!/usr/bin/env bun
/**
 * build-imf-convergence.ts — Singapore macro convergence check against the IMF
 * SIP/2024/040 exposure x complementarity estimates (Khan, 2024).
 *
 * Framing caveat (leads every output): the IMF reports ABSOLUTE economy-wide
 * employment shares (77% of Singapore workers highly exposed, split ~39%
 * high-complementarity / ~38% low-complementarity). This repo's exposure is
 * PERCENTILE-RANKED within 562 Singapore occupations, so it cannot reproduce
 * absolute shares by construction. The comparison is therefore directional:
 * does the employment-weighted complementarity split among our most-exposed
 * occupations match the IMF's roughly even high:low split?
 *
 * Method: bin each occupation by an exposure cut (top-half AND top-quartile of
 * the exposure distribution — "highly exposed" is ambiguous against a
 * percentile measure, so both cuts are reported) x a complementarity cut
 * (Pizzinelli theta above/below its median). Sum employment_thousands per bin
 * and normalize to workforce shares. NOT derived from scores.category (a
 * backward-compat impact-type mapping, not an exposure x complementarity bin).
 *
 * Outputs:
 *   data/backtests/imf-convergence.json
 *   src/lib/data/backtests/imf-convergence.json
 *   static/data/backtests/imf-convergence.json
 */

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import benchmarks from '../src/lib/data/validation-benchmarks.json';

const ROOT_DIR = path.join(import.meta.dir, '..');
const OCCUPATIONS_FILE = path.join(ROOT_DIR, 'data', 'occupations.json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'backtests', 'imf-convergence.json');
const SRC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'src',
	'lib',
	'data',
	'backtests',
	'imf-convergence.json'
);
const STATIC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	'backtests',
	'imf-convergence.json'
);

interface Occupation {
	ssoc: string;
	title: string;
	exposure: number;
	employment_thousands: number | null;
	raw: { theta: number };
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
		: (sorted[mid] ?? 0);
}

function round1(value: number): number {
	return Math.round(value * 10) / 10;
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

interface BinShares {
	exposure_cut: string;
	exposure_threshold: number;
	exposed_share_pct: number;
	exposed_high_complementarity_pct: number;
	exposed_low_complementarity_pct: number;
	not_exposed_pct: number;
	high_to_low_ratio: number;
	exposed_occupation_count: number;
}

function main() {
	console.log('=== IMF Singapore Convergence Check ===\n');

	const occs: Occupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	const withEmployment = occs.filter(occ => (occ.employment_thousands ?? 0) > 0);
	const totalEmployment = withEmployment.reduce(
		(sum, occ) => sum + (occ.employment_thousands ?? 0),
		0
	);
	console.log(
		`Occupations: ${occs.length} (${withEmployment.length} with employment, ${round1(totalEmployment)}k total)`
	);

	const thetaMedian = median(occs.map(occ => occ.raw.theta));
	console.log(`Theta median (complementarity cut): ${round2(thetaMedian)}\n`);

	const exposureSorted = [...occs.map(occ => occ.exposure)].sort((a, b) => a - b);
	const cuts: Array<{ key: string; label: string; quantile: number }> = [
		{ key: 'top_half', label: 'Top half of exposure distribution', quantile: 0.5 },
		{ key: 'top_quartile', label: 'Top quartile of exposure distribution', quantile: 0.75 }
	];

	const bins: Record<string, BinShares> = {};
	for (const cut of cuts) {
		const threshold = exposureSorted[Math.floor(cut.quantile * (exposureSorted.length - 1))] ?? 0;
		let exposedHigh = 0;
		let exposedLow = 0;
		let notExposed = 0;
		let exposedCount = 0;
		for (const occ of withEmployment) {
			const employment = occ.employment_thousands ?? 0;
			if (occ.exposure >= threshold) {
				exposedCount++;
				if (occ.raw.theta >= thetaMedian) exposedHigh += employment;
				else exposedLow += employment;
			} else {
				notExposed += employment;
			}
		}
		bins[cut.key] = {
			exposure_cut: cut.label,
			exposure_threshold: round2(threshold),
			exposed_share_pct: round1(((exposedHigh + exposedLow) / totalEmployment) * 100),
			exposed_high_complementarity_pct: round1((exposedHigh / totalEmployment) * 100),
			exposed_low_complementarity_pct: round1((exposedLow / totalEmployment) * 100),
			not_exposed_pct: round1((notExposed / totalEmployment) * 100),
			high_to_low_ratio: exposedLow > 0 ? round2(exposedHigh / exposedLow) : NaN,
			exposed_occupation_count: exposedCount
		};
		console.log(
			`${cut.label}: exposed ${bins[cut.key].exposed_share_pct}% of employment ` +
				`(high-comp ${bins[cut.key].exposed_high_complementarity_pct}% : low-comp ${bins[cut.key].exposed_low_complementarity_pct}%, ratio ${bins[cut.key].high_to_low_ratio})`
		);
	}

	// Secondary continuous diagnostic — clearly distinguished from the share metric
	const meanExposure =
		withEmployment.reduce((sum, occ) => sum + occ.exposure * (occ.employment_thousands ?? 0), 0) /
		totalEmployment;
	const meanExposureComp =
		withEmployment.reduce(
			(sum, occ) => sum + occ.exposure * occ.raw.theta * (occ.employment_thousands ?? 0),
			0
		) / totalEmployment;

	const imf = benchmarks.khan_imf_singapore_2024;
	const imfRatio = imf.high_complementarity_pct / imf.low_complementarity_pct;

	const verdicts: string[] = [];
	for (const cut of cuts) {
		const bin = bins[cut.key];
		const direction =
			bin.high_to_low_ratio > imfRatio
				? 'more optimistic on complementarity than'
				: bin.high_to_low_ratio < imfRatio
					? 'less optimistic on complementarity than'
					: 'aligned with';
		verdicts.push(
			`${bin.exposure_cut}: employment-weighted complementarity split among exposed workers is ` +
				`${bin.exposed_high_complementarity_pct}:${bin.exposed_low_complementarity_pct} high:low ` +
				`(ratio ${bin.high_to_low_ratio}) vs IMF ~${imf.high_complementarity_pct}:${imf.low_complementarity_pct} ` +
				`(ratio ${round2(imfRatio)}) — the model is ${direction} the IMF benchmark at this cut.`
		);
	}
	const anyDivergent = cuts.some(cut => {
		const ratio = bins[cut.key].high_to_low_ratio;
		return ratio > imfRatio * 1.25 || ratio < imfRatio * 0.8;
	});
	verdicts.push(
		anyDivergent
			? 'At least one cut diverges meaningfully from the IMF split — disclosed as a candidate recalibration signal, not hidden.'
			: 'Both cuts are broadly consistent with the IMF complementarity split — directional convergence.'
	);

	const payload = {
		validation_date: new Date().toISOString().split('T')[0],
		model_version: DATA_VINTAGE.model_version,
		framing_caveat:
			"The IMF reports absolute economy-wide employment shares (77% of Singapore workers highly exposed); this model's exposure is percentile-ranked within 562 SG occupations and cannot reproduce absolute shares by construction. Only the employment-weighted complementarity split among the most-exposed occupations and its direction are comparable. This is a convergent-directional check, not occupation-level validation.",
		imf_targets: imf,
		complementarity_cut: {
			variable: 'raw.theta (Pizzinelli complementarity)',
			median_threshold: round2(thetaMedian),
			note: 'High complementarity = theta at or above the cross-occupation median.'
		},
		employment_weighted_bins: bins,
		exposure_mass_diagnostic: {
			employment_weighted_mean_exposure: round2(meanExposure),
			employment_weighted_mean_exposure_x_complementarity: round2(meanExposureComp),
			note: 'Continuous secondary diagnostic only — not comparable to IMF share targets.'
		},
		verdicts,
		caveats: [
			'Employment weights are estimated per-occupation figures derived from published sub-major totals, not official per-occupation headcounts.',
			'The theta median split is a coarse two-way complementarity classification; the IMF uses the Cazzaniga et al. (2024) framework with different thresholds.',
			'Exposure cuts at the top half and top quartile bracket the ambiguity of "highly exposed" against a percentile-internal measure.',
			'This check is a Singapore macro benchmark; the MOM AI-adoption survey (April 2026) remains adoption/context evidence, and the BLS slope specification remains the occupation-level external check.'
		]
	};

	for (const filePath of [OUTPUT_FILE, SRC_OUTPUT_FILE, STATIC_OUTPUT_FILE]) {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
	}
	console.log(`\n${verdicts[verdicts.length - 1]}`);
	console.log(`Built IMF convergence check at ${OUTPUT_FILE}`);
}

main();
