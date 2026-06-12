#!/usr/bin/env bun
/**
 * build-sensitivity-analysis.ts — Robustness evidence for the hand-set V7 constants.
 *
 * This artifact answers a trust-critical question: do the occupation rankings
 * depend on the specific values of the model's hand-set constants (Hampole
 * buffer lambda, demand weights, SOL/JiD bonuses, ensemble reliabilities), or
 * are they stable under perturbation?
 *
 * Method:
 *   1. Self-fidelity gate — recompute net_risk for all occupations from their
 *      stored inputs with baseline constants; assert it reproduces the stored
 *      score (4dp inputs => tolerance 5e-4). Guards against formula drift.
 *   2. One-at-a-time (OAT) — perturb each constant to ±25% / ±50%, recompute
 *      all occupations, record Spearman rank correlation vs baseline ranking,
 *      risk-band flips, and top-20/top-50 Jaccard overlap.
 *   3. Joint Monte-Carlo — N seeded draws perturbing ALL constants by
 *      independent ±25% uniform factors; report the Spearman distribution and
 *      top-20 stability share.
 *
 * Outputs:
 *   data/backtests/sensitivity-analysis.json
 *   src/lib/data/backtests/sensitivity-analysis.json
 *   static/data/backtests/sensitivity-analysis.json
 */

import * as fs from 'fs';
import * as path from 'path';

import {
	DATA_VINTAGE,
	DEMAND_RESILIENCE_CONSTANTS,
	MARKET_CONSTANTS,
	V7_CONSTANTS,
	EXPOSURE_SOURCE_METADATA,
	getExposureSourceReliability,
	getRiskBand,
	type ExposureSourceKey
} from '../src/lib/data/scoring-constants';
import {
	clamp01,
	computeExposureV7,
	computeDemandPersistence,
	computeDemandResilienceV7,
	computeDisplacementPressure,
	computeHeadlineRisk
} from '../src/lib/data/methodology-core';
import {
	spearmanCorrelation,
	jaccard,
	quantile,
	mulberry32,
	seedFromInputs
} from '../src/lib/utils/validation-stats';

const ROOT_DIR = path.join(import.meta.dir, '..');
const OCCUPATIONS_FILE = path.join(ROOT_DIR, 'data', 'occupations.json');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'backtests', 'sensitivity-analysis.json');
const SRC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'src',
	'lib',
	'data',
	'backtests',
	'sensitivity-analysis.json'
);
const STATIC_OUTPUT_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	'backtests',
	'sensitivity-analysis.json'
);

const FIDELITY_TOLERANCE = 5e-4; // stored inputs are rounded to 4dp
const MONTE_CARLO_DRAWS = 1000;
const MONTE_CARLO_PERTURBATION = 0.25;
const OAT_FACTORS = [0.5, 0.75, 1.25, 1.5];

interface StoredOccupation {
	ssoc: string;
	title: string;
	exposure: number;
	bottleneck: number;
	net_risk: number;
	risk_band: string;
	demand_signal_bonus: number;
	task_signal: number;
	demand_persistence_inputs: {
		market_momentum_rank: number;
		vacancy_trend_rank: number;
		scarcity_rank: number;
		demand_signal_bonus_rank: number;
	};
	market: {
		market_momentum: number;
		occupation_scarcity: number;
	};
	evidence: {
		sol_match: 'exact' | 'prefix' | false;
		jobs_in_demand_match: 'exact' | 'prefix' | false;
		exposure_source_keys: string[];
		exposure_source_pctiles: Partial<Record<ExposureSourceKey, number>>;
	};
}

/** The full perturbable parameter set, baseline = live model constants. */
interface Params {
	task_concentration_lambda: number;
	base_weight: number;
	demand_persist_lambda: number;
	persistence_weights: {
		market_momentum: number;
		vacancy_trend: number;
		scarcity: number;
		demand_signal_bonus: number;
	};
	bonuses: { sol_exact: number; sol_prefix: number; jid_exact: number; jid_prefix: number };
	momentum_weight: number;
	/** Multiplicative factor on each exposure source's reliability before renormalization. */
	reliability_factor: Record<ExposureSourceKey, number>;
}

const SOURCE_KEYS = Object.keys(EXPOSURE_SOURCE_METADATA) as ExposureSourceKey[];

function baselineParams(): Params {
	return {
		task_concentration_lambda: V7_CONSTANTS.TASK_CONCENTRATION_LAMBDA,
		base_weight: DEMAND_RESILIENCE_CONSTANTS.base_weight,
		demand_persist_lambda: V7_CONSTANTS.DEMAND_PERSIST_LAMBDA,
		persistence_weights: { ...V7_CONSTANTS.DEMAND_PERSISTENCE_WEIGHTS },
		bonuses: {
			sol_exact: DEMAND_RESILIENCE_CONSTANTS.sol_exact,
			sol_prefix: DEMAND_RESILIENCE_CONSTANTS.sol_prefix,
			jid_exact: DEMAND_RESILIENCE_CONSTANTS.jid_exact,
			jid_prefix: DEMAND_RESILIENCE_CONSTANTS.jid_prefix
		},
		momentum_weight: MARKET_CONSTANTS.momentum_weight,
		reliability_factor: { aioe: 1, anthropic: 1, eloundou: 1, ilo: 1 }
	};
}

function demandSignalBonus(occ: StoredOccupation, params: Params): number {
	let bonus = 0;
	if (occ.evidence.sol_match === 'exact') bonus += params.bonuses.sol_exact;
	else if (occ.evidence.sol_match === 'prefix') bonus += params.bonuses.sol_prefix;
	if (occ.evidence.jobs_in_demand_match === 'exact') bonus += params.bonuses.jid_exact;
	else if (occ.evidence.jobs_in_demand_match === 'prefix') bonus += params.bonuses.jid_prefix;
	return bonus;
}

/**
 * Ensemble perturbation as a ratio adjustment: reliability-derived weights over
 * the occupation's stored source percentiles, perturbed vs unperturbed. At
 * factor = 1 the ratio is exactly 1, so the fidelity gate is unaffected even
 * for occupations whose stored blend used calibration steps beyond the plain
 * reliability weighting.
 */
function ensembleRatio(occ: StoredOccupation, params: Params): number {
	const sources = occ.evidence.exposure_source_keys.filter((key): key is ExposureSourceKey =>
		SOURCE_KEYS.includes(key as ExposureSourceKey)
	);
	if (sources.length === 0) return 1;
	let baseSum = 0;
	let baseWeight = 0;
	let pertSum = 0;
	let pertWeight = 0;
	for (const source of sources) {
		const pctile = occ.evidence.exposure_source_pctiles[source];
		if (pctile === undefined) continue;
		const reliability = getExposureSourceReliability(source);
		const perturbed = reliability * params.reliability_factor[source];
		baseSum += reliability * pctile;
		baseWeight += reliability;
		pertSum += perturbed * pctile;
		pertWeight += perturbed;
	}
	if (baseWeight === 0 || pertWeight === 0 || baseSum === 0) return 1;
	return pertSum / pertWeight / (baseSum / baseWeight);
}

/**
 * Faithful recompute of stored net_risk from stored per-occupation inputs.
 * Approximation note: the four demand-persistence rank inputs are percentile
 * ranks across the full cross-section; they are held fixed under perturbation
 * (ranks are invariant to monotone rescaling, and the pathway contributes at
 * most persist_lambda x weight ~= 1% of demand resilience).
 */
function recomputeNetRisk(occ: StoredOccupation, params: Params): number {
	const momentumWeight = clamp01(params.momentum_weight);
	const baseResilience =
		momentumWeight * occ.market.market_momentum +
		(1 - momentumWeight) * occ.market.occupation_scarcity;

	const pw = params.persistence_weights;
	const pwSum = pw.market_momentum + pw.vacancy_trend + pw.scarcity + pw.demand_signal_bonus;
	const persistence = computeDemandPersistence(occ.demand_persistence_inputs, {
		market_momentum: pw.market_momentum / pwSum,
		vacancy_trend: pw.vacancy_trend / pwSum,
		scarcity: pw.scarcity / pwSum,
		demand_signal_bonus: pw.demand_signal_bonus / pwSum
	});

	const resilience = computeDemandResilienceV7({
		base_resilience: baseResilience,
		demand_signal_bonus: demandSignalBonus(occ, params),
		demand_persistence: persistence,
		base_weight: clamp01(params.base_weight),
		persist_lambda: clamp01(params.demand_persist_lambda)
	});

	const exposure = clamp01(occ.exposure * ensembleRatio(occ, params));
	const exposureV7 = computeExposureV7(
		exposure,
		occ.task_signal,
		clamp01(params.task_concentration_lambda)
	);
	const displacement = computeDisplacementPressure({
		exposure: exposureV7,
		bottleneck: occ.bottleneck
	});
	return computeHeadlineRisk({
		displacement_pressure: displacement,
		demand_resilience: resilience
	});
}

function round4(value: number): number {
	return Math.round(value * 10000) / 10000;
}

function topSet(occs: StoredOccupation[], risks: number[], n: number): Set<string> {
	const order = occs
		.map((occ, i) => ({ ssoc: occ.ssoc, risk: risks[i] }))
		.sort((a, b) => b.risk - a.risk || a.ssoc.localeCompare(b.ssoc));
	return new Set(order.slice(0, n).map(item => item.ssoc));
}

interface PerturbationMetrics {
	factor: number;
	value: number | string;
	spearman: number;
	band_flips: number;
	top20_jaccard: number;
	top50_jaccard: number;
}

function evaluate(
	occs: StoredOccupation[],
	baselineRisks: number[],
	baselineBands: string[],
	baselineTop20: Set<string>,
	baselineTop50: Set<string>,
	params: Params
): Omit<PerturbationMetrics, 'factor' | 'value'> {
	const risks = occs.map(occ => recomputeNetRisk(occ, params));
	let bandFlips = 0;
	for (let i = 0; i < occs.length; i++) {
		if (getRiskBand(round4(risks[i])) !== baselineBands[i]) bandFlips++;
	}
	return {
		spearman: spearmanCorrelation(baselineRisks, risks),
		band_flips: bandFlips,
		top20_jaccard: jaccard(baselineTop20, topSet(occs, risks, 20)),
		top50_jaccard: jaccard(baselineTop50, topSet(occs, risks, 50))
	};
}

function main() {
	console.log('=== V7 Sensitivity Analysis ===');
	const occs: StoredOccupation[] = JSON.parse(fs.readFileSync(OCCUPATIONS_FILE, 'utf-8'));
	console.log(`  Loaded ${occs.length} occupations`);

	const base = baselineParams();

	// 1. Self-fidelity gate
	let maxDiff = 0;
	let worstSsoc = '';
	for (const occ of occs) {
		const diff = Math.abs(round4(recomputeNetRisk(occ, base)) - occ.net_risk);
		if (diff > maxDiff) {
			maxDiff = diff;
			worstSsoc = occ.ssoc;
		}
	}
	const fidelityOk = maxDiff <= FIDELITY_TOLERANCE;
	console.log(
		`  Fidelity: max |recomputed - stored| = ${maxDiff.toFixed(6)} (${worstSsoc}) — ${
			fidelityOk ? 'OK' : 'FAILED'
		}`
	);
	if (!fidelityOk) {
		console.error('  ERROR: recompute does not reproduce stored net_risk; aborting.');
		process.exit(1);
	}

	const baselineRisks = occs.map(occ => recomputeNetRisk(occ, base));
	const baselineBands = occs.map((occ, i) => getRiskBand(round4(baselineRisks[i])));
	const baselineTop20 = topSet(occs, baselineRisks, 20);
	const baselineTop50 = topSet(occs, baselineRisks, 50);

	// 2. One-at-a-time perturbations
	type Mutator = (params: Params, factor: number) => number | string;
	const constants: Array<{ name: string; baseline: number; mutate: Mutator }> = [
		{
			name: 'task_concentration_lambda',
			baseline: base.task_concentration_lambda,
			mutate: (p, f) => (p.task_concentration_lambda *= f)
		},
		{ name: 'base_weight', baseline: base.base_weight, mutate: (p, f) => (p.base_weight *= f) },
		{
			name: 'demand_persist_lambda',
			baseline: base.demand_persist_lambda,
			mutate: (p, f) => (p.demand_persist_lambda *= f)
		},
		{
			name: 'persistence_weight_market_momentum',
			baseline: base.persistence_weights.market_momentum,
			mutate: (p, f) => (p.persistence_weights.market_momentum *= f)
		},
		{
			name: 'persistence_weight_vacancy_trend',
			baseline: base.persistence_weights.vacancy_trend,
			mutate: (p, f) => (p.persistence_weights.vacancy_trend *= f)
		},
		{
			name: 'persistence_weight_scarcity',
			baseline: base.persistence_weights.scarcity,
			mutate: (p, f) => (p.persistence_weights.scarcity *= f)
		},
		{
			name: 'persistence_weight_demand_signal_bonus',
			baseline: base.persistence_weights.demand_signal_bonus,
			mutate: (p, f) => (p.persistence_weights.demand_signal_bonus *= f)
		},
		{
			name: 'sol_exact_bonus',
			baseline: base.bonuses.sol_exact,
			mutate: (p, f) => (p.bonuses.sol_exact *= f)
		},
		{
			name: 'sol_prefix_bonus',
			baseline: base.bonuses.sol_prefix,
			mutate: (p, f) => (p.bonuses.sol_prefix *= f)
		},
		{
			name: 'jid_exact_bonus',
			baseline: base.bonuses.jid_exact,
			mutate: (p, f) => (p.bonuses.jid_exact *= f)
		},
		{
			name: 'jid_prefix_bonus',
			baseline: base.bonuses.jid_prefix,
			mutate: (p, f) => (p.bonuses.jid_prefix *= f)
		},
		{
			name: 'momentum_weight',
			baseline: base.momentum_weight,
			mutate: (p, f) => (p.momentum_weight *= f)
		},
		...SOURCE_KEYS.map(source => ({
			name: `reliability_${source}`,
			baseline: 1,
			mutate: ((p: Params, f: number) => (p.reliability_factor[source] *= f)) as Mutator
		}))
	];

	console.log(`  OAT: ${constants.length} constants x ${OAT_FACTORS.length} factors...`);
	const perConstant = constants.map(constant => {
		const perturbations: PerturbationMetrics[] = OAT_FACTORS.map(factor => {
			const params = structuredClone(base);
			const value = constant.mutate(params, factor);
			return {
				factor,
				value: typeof value === 'number' ? round4(value) : value,
				...evaluate(occs, baselineRisks, baselineBands, baselineTop20, baselineTop50, params)
			};
		});
		return {
			name: constant.name,
			baseline_value: constant.baseline,
			perturbations,
			worst_spearman: round4(Math.min(...perturbations.map(p => p.spearman))),
			max_band_flips: Math.max(...perturbations.map(p => p.band_flips)),
			min_top20_jaccard: round4(Math.min(...perturbations.map(p => p.top20_jaccard)))
		};
	});

	// 3. Joint Monte-Carlo
	console.log(`  Monte-Carlo: ${MONTE_CARLO_DRAWS} joint +/-25% draws...`);
	const seed = seedFromInputs([
		occs.length,
		constants.length,
		MONTE_CARLO_DRAWS,
		MONTE_CARLO_PERTURBATION
	]);
	const random = mulberry32(seed);
	const mcSpearmans: number[] = [];
	const mcBandFlipRates: number[] = [];
	const mcTop20Jaccards: number[] = [];
	let top20Stable = 0;
	for (let draw = 0; draw < MONTE_CARLO_DRAWS; draw++) {
		const params = structuredClone(base);
		for (const constant of constants) {
			constant.mutate(params, 1 + (random() * 2 - 1) * MONTE_CARLO_PERTURBATION);
		}
		const metrics = evaluate(
			occs,
			baselineRisks,
			baselineBands,
			baselineTop20,
			baselineTop50,
			params
		);
		mcSpearmans.push(metrics.spearman);
		mcBandFlipRates.push(metrics.band_flips / occs.length);
		mcTop20Jaccards.push(metrics.top20_jaccard);
		if (metrics.top20_jaccard === 1) top20Stable++;
	}
	mcSpearmans.sort((a, b) => a - b);
	mcBandFlipRates.sort((a, b) => a - b);
	mcTop20Jaccards.sort((a, b) => a - b);

	const mostSensitive = [...perConstant].sort((a, b) => a.worst_spearman - b.worst_spearman)[0];
	const spearmanP50 = round4(quantile(mcSpearmans, 0.5));
	const top20StableShare = round4(top20Stable / MONTE_CARLO_DRAWS);

	const payload = {
		validation_date: new Date().toISOString().split('T')[0],
		model_version: DATA_VINTAGE.model_version,
		method:
			'Self-fidelity-gated in-memory recompute of net_risk from stored per-occupation inputs; one-at-a-time perturbations (+/-25%, +/-50%) of each ranking constant plus a seeded joint Monte-Carlo (all constants perturbed by independent uniform +/-25% factors). Rank stability measured by tie-corrected Spearman against the baseline ranking, risk-band flips, and top-20/top-50 Jaccard overlap.',
		recompute_fidelity: {
			ok: fidelityOk,
			max_abs_diff: round4(maxDiff),
			tolerance: FIDELITY_TOLERANCE,
			occupations_checked: occs.length
		},
		per_constant: perConstant,
		monte_carlo: {
			draws: MONTE_CARLO_DRAWS,
			perturbation: MONTE_CARLO_PERTURBATION,
			seed,
			spearman_p10: round4(quantile(mcSpearmans, 0.1)),
			spearman_p50: spearmanP50,
			spearman_p90: round4(quantile(mcSpearmans, 0.9)),
			spearman_min: round4(mcSpearmans[0] ?? NaN),
			top20_stable_share: top20StableShare,
			top20_jaccard_p10: round4(quantile(mcTop20Jaccards, 0.1)),
			top20_jaccard_p50: round4(quantile(mcTop20Jaccards, 0.5)),
			top20_jaccard_min: round4(mcTop20Jaccards[0] ?? NaN),
			band_flip_rate_p90: round4(quantile(mcBandFlipRates, 0.9)),
			band_flip_rate_max: round4(mcBandFlipRates[mcBandFlipRates.length - 1] ?? NaN)
		},
		summary: {
			headline: `Under joint +/-25% perturbation of all ${constants.length} hand-set ranking constants, the median rank correlation with the baseline ordering is ${spearmanP50} and the top-20 list is fully stable in ${Math.round(top20StableShare * 100)}% of ${MONTE_CARLO_DRAWS} draws.`,
			most_sensitive_constant: mostSensitive?.name ?? null,
			most_sensitive_worst_spearman: mostSensitive?.worst_spearman ?? null,
			interpretation:
				'High Spearman values mean the occupation ranking is driven by the input data (exposure ensemble, bottlenecks, market signals), not by the specific hand-set constant values. Constants with lower worst-case Spearman deserve recalibration priority.'
		},
		caveats: [
			'Sensitivity is measured on the ranking and band assignment, not on absolute score levels — a uniform rescaling of net_risk would show as perfectly stable.',
			'The four demand-persistence rank inputs are held fixed under perturbation; ranks are invariant to monotone rescaling and the pathway is at most ~1% of demand resilience.',
			'The ensemble perturbation reweights stored per-source percentiles via reliability factors; it cannot capture replacing a source outright.',
			'Robustness to constant perturbation is internal validity only — it says nothing about whether the input data measure true displacement pressure.'
		]
	};

	for (const filePath of [OUTPUT_FILE, SRC_OUTPUT_FILE, STATIC_OUTPUT_FILE]) {
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
	}
	console.log(`  ${payload.summary.headline}`);
	console.log(
		`  Most sensitive constant: ${payload.summary.most_sensitive_constant} (worst Spearman ${payload.summary.most_sensitive_worst_spearman})`
	);
	console.log(`Built sensitivity analysis at ${OUTPUT_FILE}`);
}

main();
