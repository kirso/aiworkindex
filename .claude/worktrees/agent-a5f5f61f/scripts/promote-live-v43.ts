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
	SENSITIVITY_SCORES
} from '../src/lib/data/scoring-constants';
import { classifyImpactType, getRiskBand } from '../src/lib/data/scoring-constants';
import { clamp01, computeNetRisk } from '../src/lib/data/methodology-core';
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

const OCCUPATIONS_FILE = path.join(DATA_DIR, 'occupations.json');
const OCCUPATIONS_V42_FILE = path.join(DATA_DIR, 'occupations-v42.json');
const OCCUPATIONS_V43_FILE = path.join(DATA_DIR, 'occupations-v43.json');
const SRC_OCCUPATIONS_FILE = path.join(SRC_DATA_DIR, 'occupations.json');
const EXPERIMENTAL_FILE = path.join(DATA_DIR, 'experimental-methodology-v43.json');
const SHADOW_SCORES_FILE = path.join(DATA_DIR, 'shadow-scores-v43.json');
const LABOUR_MONITOR_FILE = path.join(DATA_DIR, 'labour-monitor.json');

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
	[key: string]: unknown;
}

interface ShadowScoreRow {
	ssoc: string;
	shadow_eligibility_status: 'task_native' | 'occupation_fallback' | 'insufficient_task_evidence';
	shadow_exposure_used: number;
	shadow_net_risk: number;
	shadow_augmentation_upside: number;
	shadow_risk_band: RiskBand;
	shadow_impact_type: ImpactType;
	shadow_reallocation_buffer: number | null;
	shadow_calibrated_task_exposure: number | null;
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

function deriveTaskAdjustedUncertainty(
	baseline: OccupationRecord,
	shadow: ShadowScoreRow
): UncertaintyScores | undefined {
	if (!baseline.uncertainty) return undefined;
	if (
		shadow.shadow_eligibility_status !== 'task_native' ||
		shadow.shadow_calibrated_task_exposure === null
	) {
		return baseline.uncertainty;
	}

	const buffer = shadow.shadow_reallocation_buffer ?? 0;
	const blendAlpha = 0.35;
	const promoteExposure = (exposureValue: number) =>
		clamp01(
			((1 - blendAlpha) * exposureValue + blendAlpha * shadow.shadow_calibrated_task_exposure!) *
				(1 - buffer)
		);

	const exposureP10 = promoteExposure(baseline.uncertainty.exposure_p10);
	const exposureP50 = promoteExposure(baseline.uncertainty.exposure_p50);
	const exposureP90 = promoteExposure(baseline.uncertainty.exposure_p90);

	return {
		exposure_p10: round(exposureP10),
		exposure_p50: round(exposureP50),
		exposure_p90: round(exposureP90),
		net_risk_p10: round(
			computeNetRisk({
				exposure: exposureP10,
				bottleneck: baseline.bottleneck,
				market_resilience: baseline.market.market_resilience
			})
		),
		net_risk_p50: round(
			computeNetRisk({
				exposure: exposureP50,
				bottleneck: baseline.bottleneck,
				market_resilience: baseline.market.market_resilience
			})
		),
		net_risk_p90: round(
			computeNetRisk({
				exposure: exposureP90,
				bottleneck: baseline.bottleneck,
				market_resilience: baseline.market.market_resilience
			})
		),
		method: 'bootstrap_v1_task_adjusted'
	};
}

function assertPromotionReady() {
	const experimental = readJson<{
		headline_promotion_ready: boolean;
		shadow_score_published: boolean;
	}>(EXPERIMENTAL_FILE);
	if (!experimental.shadow_score_published || !experimental.headline_promotion_ready) {
		throw new Error(
			'V4.3 promotion gate is not clear. Shadow artifact is not ready for live promotion.'
		);
	}
}

function main() {
	const forcePromoteBaseline = process.env.FORCE_PROMOTE_V43_BASELINE === '1';
	if (DATA_VINTAGE.model_version !== 'V4.3' && !forcePromoteBaseline) {
		console.log(`Skipping V4.3 promotion because live model is ${DATA_VINTAGE.model_version}.`);
		return;
	}

	assertPromotionReady();

	const occupations = readJson<OccupationRecord[]>(OCCUPATIONS_FILE);
	const shadowScores = readJson<ShadowScoreRow[]>(SHADOW_SCORES_FILE);
	const labourMonitors = readJson<LabourMonitorRow[]>(LABOUR_MONITOR_FILE);

	const shadowBySsoc = new Map(shadowScores.map(row => [row.ssoc, row]));
	const labourMonitorByKey = new Map(labourMonitors.map(row => [row.cluster_key, row]));

	writeJson(OCCUPATIONS_V42_FILE, occupations);

	const promoted = occupations.map(occupation => {
		const shadow = shadowBySsoc.get(occupation.ssoc);
		if (!shadow) {
			throw new Error(`Missing V4.3 shadow score for ${occupation.ssoc}`);
		}

		const uncertainty = deriveTaskAdjustedUncertainty(occupation, shadow);
		const stability = deriveStability(shadow.shadow_net_risk, uncertainty);
		const updatedSignalConflict = deriveSignalConflict(
			occupation,
			shadow.shadow_net_risk,
			labourMonitorByKey
		);
		const confidence = deriveConfidence(
			occupation.confidence,
			occupation.match_quality,
			stability.label,
			updatedSignalConflict.signal_conflict
		);
		const riskBand = getRiskBand(shadow.shadow_net_risk);
		const augmentationBand = getAugmentationBand(shadow.shadow_augmentation_upside);
		const impactType = classifyImpactType(
			shadow.shadow_net_risk,
			shadow.shadow_augmentation_upside
		);
		const scoringBasis =
			shadow.shadow_eligibility_status === 'task_native'
				? 'task_aware_exposure_v43'
				: 'ensemble_fallback_v42';

		return {
			...occupation,
			structural_model_version: 'V4.3',
			scoring_basis: scoringBasis,
			baseline_v42: {
				structural_model_version: 'V4.2',
				exposure: occupation.exposure,
				net_risk: occupation.net_risk,
				risk_band: occupation.risk_band,
				augmentation: occupation.augmentation,
				augmentation_band: occupation.augmentation_band,
				impact_type: occupation.impact_type,
				uncertainty: occupation.uncertainty
			},
			exposure: round(shadow.shadow_exposure_used),
			net_risk: round(shadow.shadow_net_risk),
			risk_band: riskBand,
			augmentation: round(shadow.shadow_augmentation_upside),
			augmentation_band: augmentationBand,
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
			}
		};
	});

	writeJson(OCCUPATIONS_FILE, promoted);
	writeJson(OCCUPATIONS_V43_FILE, promoted);
	writeJson(SRC_OCCUPATIONS_FILE, promoted);

	const taskAdjustedCount = promoted.filter(
		occupation => occupation.scoring_basis === 'task_aware_exposure_v43'
	).length;

	console.log(
		`${forcePromoteBaseline ? 'Built retained V4.3 baseline' : 'Promoted V4.3 live dataset'} for ${promoted.length} occupations.`
	);
	console.log(`Task-adjusted occupations: ${taskAdjustedCount}`);
	console.log(`Baseline V4.2 snapshot written to ${OCCUPATIONS_V42_FILE}`);
}

main();
