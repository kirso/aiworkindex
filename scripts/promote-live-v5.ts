#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import {
	AUGMENTATION_THRESHOLDS,
	CONFIDENCE_COMPONENT_WEIGHTS,
	CONFIDENCE_PENALTIES,
	CONFIDENCE_THRESHOLDS,
	DATA_VINTAGE,
	RISK_BAND_THRESHOLDS,
	SENSITIVITY_SCORES,
	classifyImpactType,
	getRiskBand
} from '../src/lib/data/scoring-constants';
import { clamp01 } from '../src/lib/data/methodology-core';
import type {
	AugmentationBand,
	ConfidenceScores,
	ImpactType,
	RiskBand,
	StabilityScores,
	UncertaintyScores
} from '../src/lib/data';

const ROOT_DIR = path.join(import.meta.dir, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const BACKTEST_DIR = path.join(DATA_DIR, 'backtests');
const SRC_BACKTEST_DIR = path.join(SRC_DATA_DIR, 'backtests');
const STATIC_BACKTEST_DIR = path.join(STATIC_DATA_DIR, 'backtests');

const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OCCUPATIONS_V43_FILE = path.join(DATA_DIR, 'occupations-v43.json');
const OCCUPATIONS_V5_FILE = path.join(DATA_DIR, 'occupations-v5.json');
const SRC_OCCUPATIONS_FILE = path.join(SRC_DATA_DIR, 'occupations.json');
const STATIC_OCCUPATIONS_V5_FILE = path.join(STATIC_DATA_DIR, 'sg-ai-occupations-v5.json');

const V5_MODEL_FILE = path.join(DATA_DIR, 'v5-experimental-model.json');
const V5_VALIDATION_FILE = path.join(DATA_DIR, 'v5-experimental-validation.json');
const LABOUR_MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');

const SNAPSHOT_BACKTESTS = [
	'current-validation.json',
	'bls-crosswalk-validation.json',
	'multi-period-validation.json',
	'calibration-diagnostics.json',
	'occupation-family-validation.json'
] as const;

type ConfidenceLevel = ConfidenceScores['level'];

interface LabourMonitorRow {
	cluster_key: string;
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	vacancy: { signal: number };
	hiring: { signal: number } | null;
}

interface OccupationRecord {
	ssoc: string;
	title: string;
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	exposure: number;
	bottleneck: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: AugmentationBand;
	impact_type: ImpactType;
	uncertainty?: UncertaintyScores;
	stability: StabilityScores;
	confidence: ConfidenceScores;
	market: {
		market_resilience: number;
	};
	evidence: {
		anthropic_gap: number | null;
		sol_match: 'exact' | 'prefix' | false;
		jobs_in_demand_match: 'exact' | 'prefix' | false;
		exposure_agreement?: string | null;
		signal_conflict?: boolean;
		signal_conflict_reasons?: string[];
	};
	labour_monitor_key?: string | null;
	scores: {
		aioe: number;
		theta: number;
		c_aioe: number;
		category:
			| 'high_exposure_high_complementarity'
			| 'high_exposure_low_complementarity'
			| 'low_exposure';
		match_quality: string;
	};
	scoring_basis?:
		| 'task_aware_exposure_v43'
		| 'ensemble_fallback_v42'
		| 'posterior_task_aware_v5'
		| 'posterior_ensemble_fallback_v5';
	[key: string]: unknown;
}

interface V5Validation {
	status: string;
	summary: {
		realized_pass_count: number;
		realized_scorable_check_count: number;
	};
	structural_validation: {
		bls_spearman_rho: { pass: boolean };
		occupation_family_spearman_rho: { pass: boolean };
	};
}

interface V5Entry {
	ssoc: string;
	structural_basis: 'posterior_task_aware' | 'posterior_ensemble_fallback';
	v5_structural_exposure_p10: number;
	v5_structural_exposure: number;
	v5_structural_exposure_p90: number;
	v5_structural_risk_p10: number;
	v5_structural_risk: number;
	v5_structural_risk_p90: number;
	v5_structural_band: RiskBand;
	v5_effective_augmentation: number;
	v5_augmentation_band: AugmentationBand;
	v5_transition_adjusted_risk: number;
	v5_transition_adjusted_band: RiskBand;
	v5_realized_risk_proxy: number;
	v5_impact_type: ImpactType;
	v5_profile: string;
	v5_adaptation_capacity: number;
	v5_adaptation_buffer: number;
	v5_demand_fragility: number;
	v5_reallocation_capacity: number;
	best_transition: {
		to_ssoc: string;
		to_title: string;
		composite: number;
		observed_transition_rate: number | null;
		destination_quality: number;
		wage_preservation: number;
		training_ease: number;
		empirical_priority: number;
	} | null;
}

function readJson<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, payload: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function round(value: number, digits = 4): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function getAugmentationBand(value: number): AugmentationBand {
	if (value >= AUGMENTATION_THRESHOLDS.very_high) return 'very_high';
	if (value >= AUGMENTATION_THRESHOLDS.high) return 'high';
	if (value >= AUGMENTATION_THRESHOLDS.moderate) return 'moderate';
	if (value >= AUGMENTATION_THRESHOLDS.low) return 'low';
	return 'very_low';
}

function riskBandBounds(band: RiskBand): { lower: number; upper: number } {
	return RISK_BAND_THRESHOLDS[band];
}

function deriveStability(currentRisk: number, uncertainty?: UncertaintyScores): StabilityScores {
	const optimisticRisk = uncertainty?.net_risk_p10 ?? currentRisk;
	const pessimisticRisk = uncertainty?.net_risk_p90 ?? currentRisk;
	const currentBand = getRiskBand(currentRisk);
	const optimisticBand = getRiskBand(optimisticRisk);
	const pessimisticBand = getRiskBand(pessimisticRisk);
	const bounds = riskBandBounds(currentBand);
	const distanceToBandEdge = Math.min(currentRisk - bounds.lower, bounds.upper - currentRisk);

	let label: StabilityScores['label'] = 'stable';
	if (optimisticBand !== currentBand || pessimisticBand !== currentBand) {
		label =
			optimisticBand !== pessimisticBand &&
			optimisticBand !== currentBand &&
			pessimisticBand !== currentBand
				? 'sensitive'
				: 'watch';
	}

	return {
		optimistic_risk: round(optimisticRisk),
		optimistic_band: optimisticBand,
		pessimistic_risk: round(pessimisticRisk),
		pessimistic_band: pessimisticBand,
		distance_to_band_edge: round(Math.max(distanceToBandEdge, 0)),
		label
	};
}

function confidenceLevel(score: number): ConfidenceLevel {
	if (score >= CONFIDENCE_THRESHOLDS.high) return 'high';
	if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium';
	return 'low';
}

function deriveConfidence(
	confidence: ConfidenceScores,
	matchQuality: OccupationRecord['match_quality'],
	stabilityLabel: StabilityScores['label'],
	signalConflict: boolean
): ConfidenceScores {
	const sourceCoverage = confidence.source_coverage ?? 0;
	const signalAgreement = confidence.signal_agreement ?? 0;
	const updatedSensitivity =
		SENSITIVITY_SCORES[stabilityLabel as keyof typeof SENSITIVITY_SCORES] ??
		confidence.sensitivity ??
		0;
	const sparseSourcePenalty =
		(confidence.exposure_source_count ?? 0) === 1
			? confidence.crosswalk_quality >= 0.95
				? CONFIDENCE_PENALTIES.single_source_direct
				: confidence.crosswalk_quality >= 0.45
					? CONFIDENCE_PENALTIES.single_source_submajor_fallback
					: CONFIDENCE_PENALTIES.single_source_major_fallback
			: 0;
	const contestedSignalPenalty = signalConflict ? CONFIDENCE_PENALTIES.contested_signal : 0;

	const score = clamp01(
		confidence.crosswalk_quality * CONFIDENCE_COMPONENT_WEIGHTS.crosswalk_quality +
			confidence.market_data_granularity * CONFIDENCE_COMPONENT_WEIGHTS.market_data_granularity +
			confidence.source_freshness * CONFIDENCE_COMPONENT_WEIGHTS.source_freshness +
			sourceCoverage * CONFIDENCE_COMPONENT_WEIGHTS.source_coverage +
			signalAgreement * CONFIDENCE_COMPONENT_WEIGHTS.signal_agreement +
			updatedSensitivity * CONFIDENCE_COMPONENT_WEIGHTS.sensitivity -
			sparseSourcePenalty -
			contestedSignalPenalty
	);

	let level = confidenceLevel(score);
	const canBeHighConfidence =
		matchQuality === 'direct' && (confidence.exposure_source_count ?? 0) >= 3 && !signalConflict;

	if (!canBeHighConfidence && level === 'high') {
		level = 'medium';
	}
	if (matchQuality === 'major_fallback') {
		level = 'low';
	}

	return {
		...confidence,
		score: round(score),
		level,
		sensitivity: updatedSensitivity
	};
}

function impactTypeToCategory(impact: ImpactType) {
	switch (impact) {
		case 'ai_leveraged':
			return 'high_exposure_high_complementarity';
		case 'at_risk':
			return 'high_exposure_low_complementarity';
		case 'stable':
			return 'low_exposure';
		case 'mixed':
			return 'high_exposure_high_complementarity';
	}
}

function deriveSignalConflict(
	occupation: OccupationRecord,
	netRisk: number,
	labourMonitorByKey: Map<string, LabourMonitorRow>
): { signal_conflict: boolean; signal_conflict_reasons: string[] } {
	const signalConflictReasons: string[] = [];
	const hasExactDemand =
		occupation.evidence.sol_match === 'exact' ||
		occupation.evidence.jobs_in_demand_match === 'exact';
	const labourMonitor =
		occupation.labour_monitor_key != null
			? (labourMonitorByKey.get(occupation.labour_monitor_key) ?? null)
			: null;

	if (netRisk >= 0.25 && hasExactDemand) {
		signalConflictReasons.push('high_risk_but_exact_demand');
	}
	if (
		netRisk >= 0.25 &&
		labourMonitor &&
		(labourMonitor.overall === 'strong' ||
			labourMonitor.vacancy.signal === 1 ||
			labourMonitor.hiring?.signal === 1)
	) {
		signalConflictReasons.push('high_risk_but_positive_labour_market');
	}
	if (occupation.evidence.exposure_agreement === 'divergent') {
		signalConflictReasons.push('divergent_exposure_sources');
	}
	if (
		netRisk <= 0.15 &&
		occupation.evidence.anthropic_gap !== null &&
		occupation.evidence.anthropic_gap >= 0.2
	) {
		signalConflictReasons.push('low_risk_but_high_observed_usage');
	}

	const signalConflict =
		signalConflictReasons.includes('high_risk_but_exact_demand') ||
		signalConflictReasons.includes('low_risk_but_high_observed_usage') ||
		(signalConflictReasons.includes('divergent_exposure_sources') &&
			signalConflictReasons.length >= 2) ||
		signalConflictReasons.filter(reason => reason !== 'divergent_exposure_sources').length >= 2;

	return {
		signal_conflict: signalConflict,
		signal_conflict_reasons: signalConflictReasons
	};
}

function deriveV5Uncertainty(entry: V5Entry): UncertaintyScores {
	return {
		exposure_p10: round(entry.v5_structural_exposure_p10),
		exposure_p50: round(entry.v5_structural_exposure),
		exposure_p90: round(entry.v5_structural_exposure_p90),
		net_risk_p10: round(entry.v5_structural_risk_p10),
		net_risk_p50: round(entry.v5_structural_risk),
		net_risk_p90: round(entry.v5_structural_risk_p90),
		method: 'latent_source_measurement_v1'
	};
}

function assertPromotionReady() {
	const validation = readJson<V5Validation>(V5_VALIDATION_FILE);
	const structuralReady =
		validation.structural_validation.bls_spearman_rho.pass &&
		validation.structural_validation.occupation_family_spearman_rho.pass;
	const realizedReady =
		validation.summary.realized_pass_count >= 3 &&
		validation.summary.realized_scorable_check_count >= 4;

	if (!structuralReady || !realizedReady) {
		throw new Error('V5 promotion gate is not clear. Validation is not yet strong enough.');
	}
}

function snapshotBacktests() {
	for (const file of SNAPSHOT_BACKTESTS) {
		const versionedName = file.replace(/\.json$/i, '-v43.json');
		const copies: Array<[string, string]> = [
			[path.join(BACKTEST_DIR, file), path.join(BACKTEST_DIR, versionedName)],
			[path.join(SRC_BACKTEST_DIR, file), path.join(SRC_BACKTEST_DIR, versionedName)],
			[path.join(STATIC_BACKTEST_DIR, file), path.join(STATIC_BACKTEST_DIR, versionedName)]
		];
		for (const [from, to] of copies) {
			if (!fs.existsSync(from)) continue;
			fs.mkdirSync(path.dirname(to), { recursive: true });
			fs.copyFileSync(from, to);
		}
	}
}

function main() {
	if (DATA_VINTAGE.model_version !== 'V5') {
		console.log(`Skipping V5 promotion because live model is ${DATA_VINTAGE.model_version}.`);
		return;
	}

	assertPromotionReady();

	const occupations = readJson<OccupationRecord[]>(OCCUPATIONS_FILE);
	const v5Model = readJson<{ entries: V5Entry[] }>(V5_MODEL_FILE);
	const labourMonitors = readJson<LabourMonitorRow[]>(LABOUR_MONITOR_FILE);
	const preservedV5 = fs.existsSync(OCCUPATIONS_V5_FILE)
		? readJson<OccupationRecord[]>(OCCUPATIONS_V5_FILE)
		: fs.existsSync(STATIC_OCCUPATIONS_V5_FILE)
			? readJson<OccupationRecord[]>(STATIC_OCCUPATIONS_V5_FILE)
			: [];

	writeJson(OCCUPATIONS_V43_FILE, occupations);
	snapshotBacktests();

	const v5BySsoc = new Map(v5Model.entries.map(row => [row.ssoc, row]));
	const labourMonitorByKey = new Map(labourMonitors.map(row => [row.cluster_key, row]));
	const preservedV5BySsoc = new Map(preservedV5.map(row => [row.ssoc, row]));

	const promoted = occupations.map(occupation => {
		const entry = v5BySsoc.get(occupation.ssoc);
		if (!entry) {
			throw new Error(`Missing V5 entry for ${occupation.ssoc}`);
		}
		const preserved = preservedV5BySsoc.get(occupation.ssoc);

		const uncertainty = deriveV5Uncertainty(entry);
		const stability = deriveStability(entry.v5_structural_risk, uncertainty);
		const updatedSignalConflict = deriveSignalConflict(
			occupation,
			entry.v5_structural_risk,
			labourMonitorByKey
		);
		const confidence = deriveConfidence(
			occupation.confidence,
			occupation.match_quality,
			stability.label,
			updatedSignalConflict.signal_conflict
		);
		const scoringBasis =
			entry.structural_basis === 'posterior_task_aware'
				? 'posterior_task_aware_v5'
				: 'posterior_ensemble_fallback_v5';
		const impactType = classifyImpactType(
			entry.v5_structural_risk,
			entry.v5_effective_augmentation
		);

		return {
			...occupation,
			structural_model_version: 'V5',
			scoring_basis: scoringBasis,
			baseline_v42:
				occupation.baseline_v42 ??
				preserved?.baseline_v42 ??
				(occupation.structural_model_version === 'V4.2' || preserved == null
					? {
							structural_model_version: 'V4.2',
							exposure: occupation.exposure,
							net_risk: occupation.net_risk,
							risk_band: occupation.risk_band,
							augmentation: occupation.augmentation,
							augmentation_band: occupation.augmentation_band,
							impact_type: occupation.impact_type,
							uncertainty: occupation.uncertainty
						}
					: undefined),
			baseline_v43:
				occupation.baseline_v43 ??
				preserved?.baseline_v43 ??
				(occupation.structural_model_version === 'V4.3'
					? {
							structural_model_version: 'V4.3',
							exposure: occupation.exposure,
							net_risk: occupation.net_risk,
							risk_band: occupation.risk_band,
							augmentation: occupation.augmentation,
							augmentation_band: occupation.augmentation_band,
							impact_type: occupation.impact_type,
							uncertainty: occupation.uncertainty,
							scoring_basis: occupation.scoring_basis
						}
					: undefined),
			task_primitives: occupation.task_primitives ?? preserved?.task_primitives ?? null,
			exposure: round(entry.v5_structural_exposure),
			net_risk: round(entry.v5_structural_risk),
			risk_band: entry.v5_structural_band,
			augmentation: round(entry.v5_effective_augmentation),
			augmentation_band: getAugmentationBand(entry.v5_effective_augmentation),
			impact_type: impactType,
			uncertainty,
			stability,
			confidence,
			evidence: {
				...occupation.evidence,
				signal_conflict: updatedSignalConflict.signal_conflict,
				signal_conflict_reasons: updatedSignalConflict.signal_conflict_reasons
			},
			scores: {
				...occupation.scores,
				category: impactTypeToCategory(impactType)
			},
			structural_risk: round(entry.v5_structural_risk),
			structural_risk_band: entry.v5_structural_band,
			transition_adjusted_risk: round(entry.v5_transition_adjusted_risk),
			transition_adjusted_band: entry.v5_transition_adjusted_band,
			transition_adjusted_impact_type: entry.v5_impact_type,
			realized_risk_proxy: round(entry.v5_realized_risk_proxy),
			adaptation_capacity: round(entry.v5_adaptation_capacity),
			adaptation_buffer: round(entry.v5_adaptation_buffer),
			demand_fragility: round(entry.v5_demand_fragility),
			reallocation_capacity: round(entry.v5_reallocation_capacity),
			profile: entry.v5_profile,
			best_transition: entry.best_transition
				? {
						...entry.best_transition,
						composite: round(entry.best_transition.composite),
						observed_transition_rate:
							entry.best_transition.observed_transition_rate === null
								? null
								: round(entry.best_transition.observed_transition_rate),
						destination_quality: round(entry.best_transition.destination_quality),
						wage_preservation: round(entry.best_transition.wage_preservation),
						training_ease: round(entry.best_transition.training_ease),
						empirical_priority: round(entry.best_transition.empirical_priority)
					}
				: null
		};
	});

	writeJson(OCCUPATIONS_FILE, promoted);
	writeJson(OCCUPATIONS_V5_FILE, promoted);
	writeJson(SRC_OCCUPATIONS_FILE, promoted);

	const taskAwareCount = promoted.filter(
		occupation => occupation.scoring_basis === 'posterior_task_aware_v5'
	).length;

	console.log(`Promoted V5 live dataset for ${promoted.length} occupations.`);
	console.log(`Posterior task-aware occupations: ${taskAwareCount}`);
	console.log(`Retained V4.3 snapshot written to ${OCCUPATIONS_V43_FILE}`);
}

main();
