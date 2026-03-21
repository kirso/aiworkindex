#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const RAW_EXTERNAL_DIR = path.join(DATA_DIR, 'raw', 'external');
const RAW_ONET_DIR = path.join(RAW_EXTERNAL_DIR, 'onet');

const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OUT_FILE = path.join(DATA_DIR, 'experimental-methodology-v43.json');
const SRC_OUT_FILE = path.join(SRC_DATA_DIR, 'experimental-methodology-v43.json');
const STATIC_OUT_FILE = path.join(STATIC_DATA_DIR, 'experimental-methodology-v43.json');

const TASK_PENETRATION_FILE = path.join(RAW_EXTERNAL_DIR, 'anthropic_task_penetration.csv');
const TASK_STATEMENTS_FILE = path.join(RAW_ONET_DIR, 'Task_Statements.txt');
const TASK_RATINGS_FILE = path.join(RAW_ONET_DIR, 'Task_Ratings.txt');
const EMPIRICAL_MOBILITY_FILE = path.join(RAW_EXTERNAL_DIR, 'sg_empirical_mobility.json');
const SHADOW_SCORES_FILE = path.join(DATA_DIR, 'shadow-scores-v43.json');
const SHADOW_VALIDATION_FILE = path.join(DATA_DIR, 'shadow-validation-v43.json');
const SHADOW_ANCHOR_FILE = path.join(DATA_DIR, 'shadow-anchor-review-v43.json');

interface OccupationRecord {
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	task_primitives?: {
		matched_task_weight_share: number | null;
		task_effective_coverage: number | null;
		task_exposure_concentration: number | null;
		method: 'anthropic_task_penetration_v1' | null;
	};
	uncertainty?: {
		method: 'bootstrap_v1';
	};
}

function readJson<T>(filePath: string): T | null {
	if (!fs.existsSync(filePath)) return null;
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, payload: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function round(value: number | null, digits = 4): number | null {
	if (value === null || !Number.isFinite(value)) return null;
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const midpoint = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[midpoint] ?? null;
	return ((sorted[midpoint - 1] ?? 0) + (sorted[midpoint] ?? 0)) / 2;
}

function ratio(numerator: number, denominator: number): number | null {
	if (denominator <= 0) return null;
	return round(numerator / denominator);
}

function main() {
	if (!fs.existsSync(OCCUPATIONS_FILE)) {
		throw new Error(`Missing occupations file: ${OCCUPATIONS_FILE}`);
	}

	const occupations = readJson<OccupationRecord[]>(OCCUPATIONS_FILE);
	if (!occupations) {
		throw new Error(`Missing occupations file: ${OCCUPATIONS_FILE}`);
	}
	const directMapped = occupations.filter(occupation => occupation.match_quality === 'direct');
	const taskWeighted = occupations.filter(
		occupation => occupation.task_primitives?.matched_task_weight_share != null
	);
	const directTaskWeighted = directMapped.filter(
		occupation => occupation.task_primitives?.matched_task_weight_share != null
	);

	const matchedShares = taskWeighted
		.map(occupation => occupation.task_primitives?.matched_task_weight_share ?? null)
		.filter((value): value is number => value !== null);
	const directMatchedShares = directTaskWeighted
		.map(occupation => occupation.task_primitives?.matched_task_weight_share ?? null)
		.filter((value): value is number => value !== null);
	const effectiveCoverage = taskWeighted
		.map(occupation => occupation.task_primitives?.task_effective_coverage ?? null)
		.filter((value): value is number => value !== null);
	const concentration = taskWeighted
		.map(occupation => occupation.task_primitives?.task_exposure_concentration ?? null)
		.filter((value): value is number => value !== null);
	const bootstrapCoverageCount = occupations.filter(
		occupation => occupation.uncertainty?.method === 'bootstrap_v1'
	).length;

	const onetTaskRatingsPresent = fs.existsSync(TASK_RATINGS_FILE);
	const empiricalMobilityPresent = fs.existsSync(EMPIRICAL_MOBILITY_FILE);
	const directMedianShare = median(directMatchedShares);
	const shadowScores = readJson<Array<{ shadow_eligibility_status: string }>>(SHADOW_SCORES_FILE);
	const shadowValidation = readJson<{
		cluster_directional_accuracy: { pass: boolean; baseline: number; shadow: number };
		bls_spearman_rho: { pass: boolean; baseline: number; shadow: number };
		occupation_family_spearman_rho: { pass: boolean; baseline: number; shadow: number };
	}>(SHADOW_VALIDATION_FILE);
	const shadowAnchorReview = readJson<{
		found_anchor_count: number;
		required_anchor_count: number;
		review_candidate_count: number;
		screening_complete: boolean;
	}>(SHADOW_ANCHOR_FILE);
	const shadowScorePublished =
		fs.existsSync(SHADOW_SCORES_FILE) &&
		fs.existsSync(SHADOW_VALIDATION_FILE) &&
		fs.existsSync(SHADOW_ANCHOR_FILE) &&
		Array.isArray(shadowScores) &&
		shadowScores.length > 0 &&
		!!shadowValidation &&
		!!shadowAnchorReview;

	let shadowStatus:
		| 'blocked'
		| 'not_ready'
		| 'ready_for_shadow_scoring'
		| 'shadow_published'
		| 'promoted' = 'blocked';
	let statusSummary =
		'Blocked: weighted task portfolios are not active because O*NET task ratings are missing.';

	if (onetTaskRatingsPresent && directTaskWeighted.length === 0) {
		shadowStatus = 'not_ready';
		statusSummary =
			'Not ready: task weights exist locally, but no direct-mapped occupations produced usable weighted task coverage yet.';
	} else if (onetTaskRatingsPresent && (directMedianShare ?? 0) < 0.6) {
		shadowStatus = 'not_ready';
		statusSummary =
			'Not ready: weighted task coverage exists, but direct-mapped occupations do not yet clear the 0.60 promotion threshold.';
	} else if (onetTaskRatingsPresent) {
		shadowStatus = 'ready_for_shadow_scoring';
		statusSummary =
			'Ready for shadow scoring: task-weight coverage clears the minimum promotion gate, but no task-adjusted headline score is published yet.';
	}

	const validationPassCount = shadowValidation
		? [
				shadowValidation.cluster_directional_accuracy.pass,
				shadowValidation.bls_spearman_rho.pass,
				shadowValidation.occupation_family_spearman_rho.pass
			].filter(Boolean).length
		: 0;
	const validationGatePass = shadowValidation ? validationPassCount === 3 : false;
	const anchorGatePass = shadowAnchorReview
		? shadowAnchorReview.screening_complete && shadowAnchorReview.review_candidate_count === 0
		: false;
	const headlinePromotionReady = shadowScorePublished && validationGatePass && anchorGatePass;

	if (shadowScorePublished) {
		shadowStatus = 'shadow_published';
		statusSummary = headlinePromotionReady
			? 'Shadow score is published and has cleared the current promotion gates. Headline promotion is now a release decision rather than a methodology blocker.'
			: 'Shadow score is published. Promotion into the headline model still depends on validation and anchor-review sign-off.';
	}

	const payload = {
		version: 'V4.3-shadow',
		generated_at: new Date().toISOString(),
		published_baseline_version: DATA_VINTAGE.model_version,
		shadow_readiness: {
			status: shadowStatus,
			summary: statusSummary
		},
		shadow_score_published: shadowScorePublished,
		headline_promotion_ready: headlinePromotionReady,
		shadow_artifacts: shadowScorePublished
			? {
					shadow_scores: path.relative(ROOT_DIR, SHADOW_SCORES_FILE),
					shadow_validation: path.relative(ROOT_DIR, SHADOW_VALIDATION_FILE),
					shadow_anchor_review: path.relative(ROOT_DIR, SHADOW_ANCHOR_FILE)
				}
			: null,
		required_inputs: {
			anthropic_task_penetration: {
				file: path.relative(ROOT_DIR, TASK_PENETRATION_FILE),
				present: fs.existsSync(TASK_PENETRATION_FILE)
			},
			onet_task_statements: {
				file: path.relative(ROOT_DIR, TASK_STATEMENTS_FILE),
				present: fs.existsSync(TASK_STATEMENTS_FILE)
			},
			onet_task_ratings: {
				file: path.relative(ROOT_DIR, TASK_RATINGS_FILE),
				present: onetTaskRatingsPresent
			},
			empirical_mobility: {
				file: path.relative(ROOT_DIR, EMPIRICAL_MOBILITY_FILE),
				present: empiricalMobilityPresent
			}
		},
		coverage: {
			occupation_count: occupations.length,
			direct_mapped_occupation_count: directMapped.length,
			task_weighted_occupation_count: taskWeighted.length,
			direct_task_weighted_occupation_count: directTaskWeighted.length,
			task_weighted_share: ratio(taskWeighted.length, occupations.length),
			direct_task_weighted_share: ratio(directTaskWeighted.length, directMapped.length),
			bootstrap_uncertainty_coverage_share: ratio(bootstrapCoverageCount, occupations.length),
			median_matched_task_weight_share: round(median(matchedShares)),
			median_direct_matched_task_weight_share: round(directMedianShare),
			median_task_effective_coverage: round(median(effectiveCoverage)),
			median_task_exposure_concentration: round(median(concentration))
		},
		promotion_gates: [
			{
				key: 'task_weight_coverage_direct',
				label: 'Median matched task weight share across direct-mapped occupations',
				threshold: 0.6,
				comparator: '>=',
				actual: round(directMedianShare),
				state: onetTaskRatingsPresent
					? (directMedianShare ?? 0) >= 0.6
						? 'pass'
						: 'fail'
					: 'blocked',
				note: 'This gate prevents a sparse task layer from directly changing the headline score before task matching is broadly comparable.'
			},
			{
				key: 'shadow_validation',
				label:
					'Experimental task-adjusted score matches or improves current validation diagnostics',
				threshold: 'improve_or_match',
				actual: shadowValidation ? `${validationPassCount}/3` : null,
				state: shadowScorePublished ? (validationGatePass ? 'pass' : 'fail') : 'pending',
				note: shadowValidation
					? `Cluster directional accuracy ${shadowValidation.cluster_directional_accuracy.shadow} vs ${shadowValidation.cluster_directional_accuracy.baseline}; BLS rho ${shadowValidation.bls_spearman_rho.shadow} vs ${shadowValidation.bls_spearman_rho.baseline}; family rho ${shadowValidation.occupation_family_spearman_rho.shadow} vs ${shadowValidation.occupation_family_spearman_rho.baseline}.`
					: 'Requires a published shadow score artifact before BLS, temporal, and occupation-family comparisons can be evaluated.'
			},
			{
				key: 'anchor_review',
				label: 'No implausible anchor label flips without written rationale',
				threshold: 'zero_unexplained_flips',
				actual: shadowAnchorReview ? shadowAnchorReview.review_candidate_count : null,
				state: shadowScorePublished ? (anchorGatePass ? 'pass' : 'pending') : 'pending',
				note: shadowAnchorReview
					? `${shadowAnchorReview.found_anchor_count}/${shadowAnchorReview.required_anchor_count} anchors screened; ${shadowAnchorReview.review_candidate_count} candidates still need editorial sign-off.`
					: 'Requires side-by-side anchor review once a shadow score exists.'
			}
		],
		blockers: [
			...(!onetTaskRatingsPresent
				? [
						{
							key: 'missing_onet_task_ratings',
							severity: 'blocking',
							note: 'Task_Ratings.txt is absent, so weighted task portfolios cannot be computed and task_primitives remain explicit nulls.'
						}
					]
				: []),
			...(!empiricalMobilityPresent
				? [
						{
							key: 'missing_empirical_mobility',
							severity: 'blocking',
							note: 'Observed occupation-to-occupation mobility data is not available locally, so transition upgrades remain schema-only.'
						}
					]
				: [])
		],
		candidate_formulas: {
			effective_coverage: 'Σ_t w_it · exposure_t · success_t',
			automation_pressure: 'Σ_t w_it · exposure_t · success_t · autonomy_t · (1 - bottleneck_t)',
			augmentation_upside: 'Σ_t w_it · exposure_t · success_t · (1 - autonomy_t) · bottleneck_t',
			net_risk: 'automation_pressure_i · (1 - λ · concentration_i) · market_modifier_i'
		},
		notes: [
			'This artifact is governance scaffolding for a future task-weighted shadow model. It does not change the published V4.2 score.',
			'confidence remains the provenance-quality layer; uncertainty intervals remain the statistical layer.',
			'Near-term forecast remains published separately from structural risk.'
		]
	};

	writeJson(OUT_FILE, payload);
	writeJson(SRC_OUT_FILE, payload);
	writeJson(STATIC_OUT_FILE, payload);

	console.log(`Built experimental methodology artifact at ${STATIC_OUT_FILE}`);
}

main();
