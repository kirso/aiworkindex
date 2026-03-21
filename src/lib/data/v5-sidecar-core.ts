import type { Occupation } from './index';
import { computeForecastScores, scenarioPresets, type ScenarioPreset } from './forecast-engine';
import { clamp01, computeNetRisk } from './methodology-core';
import { classifyArchetype, type Archetype } from './role-archetypes';
import {
	EXPOSURE_SOURCE_METADATA,
	type ExposureSourceKey,
	getExposureSourceReliability,
	normalizeExposureSourceWeights
} from './scoring-constants';
import { computeAutonomyProxy, SHADOW_V43_CONSTANTS } from './shadow-model-core';
import type { WorkflowOverlay } from './workflow-overlay';

export type V5WorkstreamStatus = 'pilot_sidecar' | 'enriched_sidecar' | 'ready_for_validation';

export interface AugmentationPriorResult {
	archetype: Archetype;
	prior_label: 'stronger' | 'moderate' | 'limited';
	prior_value: number;
	workflow_augmentation_readiness: number;
	autonomy_proxy: number;
	augmentation_share_proxy: number;
	empirical_augmentation_potential: number;
	heterogeneous_augmentation_proxy: number;
	delta_vs_live: number;
	research_keys: string[];
}

export interface PosteriorExposureResult {
	sources_used_count: number;
	prior_mean: number;
	prior_variance: number;
	prior_precision: number;
	baseline_source_mean: number;
	baseline_posterior_mean: number;
	live_posterior_mean: number;
	posterior_variance: number;
	posterior_stdev: number;
	observation_precision: number;
	task_alignment_applied: boolean;
	exposure_p025: number;
	exposure_p10: number;
	exposure_p50: number;
	exposure_p90: number;
	exposure_p975: number;
	net_risk_p025: number;
	net_risk_p10: number;
	net_risk_p50: number;
	net_risk_p90: number;
	net_risk_p975: number;
	shrinkage_vs_live: number;
	method: 'latent_source_measurement_v1';
}

export interface MobilityPriorResult {
	status: 'observed_enriched' | 'heuristic_only';
	observed_transition_coverage: number;
	heuristic_transition_score: number;
	empirical_transition_rate: number | null;
	observed_signal_strength: number | null;
	destination_quality_score: number;
	wage_preservation_score: number;
	training_ease_score: number;
	empirical_mobility_score: number;
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
	method: 'hybrid_transition_mobility_v2';
}

export interface RealizedRiskScenarioSnapshot {
	near_term_risk: number;
	realized_risk_proxy: number;
}

export interface RealizedRiskResult {
	structural_risk: number;
	base_near_term_risk: number;
	base_realized_risk_proxy: number;
	realization_scalar: number;
	archetype: Archetype;
	short_run_cap_score: number;
	employer_pressure_score: number;
	labour_softness_score: number;
	postings_support_score: number | null;
	postings_resistance_score: number;
	transition_friction_score: number;
	offset_buffer_score: number;
	demand_persistence_score: number | null;
	signal_alignment_score: number;
	gap_to_structural: number;
	scenarios: Record<ScenarioPreset, RealizedRiskScenarioSnapshot>;
	method: 'market_calibrated_realized_risk_v3';
}

interface ArchetypePrior {
	value: number;
	label: AugmentationPriorResult['prior_label'];
	research_keys: string[];
}

export interface ExposureSourceCalibration {
	alpha: number;
	beta: number;
	residual_stdev: number;
	reliability: number;
	sample_size: number;
}

const AUGMENTATION_ARCHETYPE_PRIORS: Record<Archetype, ArchetypePrior> = {
	writing_editorial: {
		value: 0.72,
		label: 'stronger',
		research_keys: ['brynjolfsson_li_raymond_2023', 'dillon_etal_2025']
	},
	teaching_learning: {
		value: 0.46,
		label: 'moderate',
		research_keys: ['dellacqua_etal_2025']
	},
	software_engineering: {
		value: 0.66,
		label: 'stronger',
		research_keys: ['dellacqua_etal_2025', 'anthropic_economic_index_2026']
	},
	data_analytics: {
		value: 0.62,
		label: 'stronger',
		research_keys: ['dillon_etal_2025', 'anthropic_economic_index_2026']
	},
	product_strategy: {
		value: 0.58,
		label: 'moderate',
		research_keys: ['dellacqua_etal_2025']
	},
	sales_gtm: {
		value: 0.61,
		label: 'stronger',
		research_keys: ['brynjolfsson_li_raymond_2023']
	},
	finance_investing: {
		value: 0.52,
		label: 'moderate',
		research_keys: ['dellacqua_etal_2025']
	},
	people_recruiting: {
		value: 0.57,
		label: 'moderate',
		research_keys: ['brynjolfsson_li_raymond_2023']
	},
	healthcare_clinical: {
		value: 0.34,
		label: 'limited',
		research_keys: ['anthropic_economic_index_2026']
	},
	design_creative: {
		value: 0.6,
		label: 'moderate',
		research_keys: ['dellacqua_etal_2025', 'anthropic_economic_index_2026']
	},
	operations_logistics: {
		value: 0.5,
		label: 'moderate',
		research_keys: ['anthropic_economic_index_2026']
	},
	legal_compliance: {
		value: 0.48,
		label: 'moderate',
		research_keys: ['anthropic_economic_index_2026']
	},
	field_manual: {
		value: 0.24,
		label: 'limited',
		research_keys: ['anthropic_economic_index_2026']
	},
	service_hospitality: {
		value: 0.75,
		label: 'stronger',
		research_keys: ['brynjolfsson_li_raymond_2023']
	},
	general_professional: {
		value: 0.5,
		label: 'moderate',
		research_keys: ['dellacqua_etal_2025']
	},
	general_technical: {
		value: 0.46,
		label: 'moderate',
		research_keys: ['anthropic_economic_index_2026']
	},
	general_clerical: {
		value: 0.56,
		label: 'moderate',
		research_keys: ['brynjolfsson_li_raymond_2023', 'anthropic_economic_index_2026']
	}
};

const REALIZED_SHORT_RUN_ARCHETYPE_CAPS: Record<Archetype, number> = {
	writing_editorial: 0.62,
	teaching_learning: 0.22,
	software_engineering: 0.58,
	data_analytics: 0.55,
	product_strategy: 0.38,
	sales_gtm: 0.28,
	finance_investing: 0.48,
	people_recruiting: 0.3,
	healthcare_clinical: 0.18,
	design_creative: 0.52,
	operations_logistics: 0.26,
	legal_compliance: 0.42,
	field_manual: 0.12,
	service_hospitality: 0.14,
	general_professional: 0.36,
	general_technical: 0.34,
	general_clerical: 0.6
};

function average(values: number[], fallback = 0): number {
	return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : fallback;
}

function quantileFromNormal(mean: number, stdev: number, zScore: number): number {
	return clamp01(mean + zScore * stdev);
}

function weightedMean(values: number[], weights: number[]): number {
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	if (total <= 0 || values.length === 0) return average(values, 0.5);
	return values.reduce((sum, value, index) => sum + value * (weights[index] ?? 0), 0) / total;
}

export function computeExposureSourceCalibrations(
	occupations: Occupation[]
): Partial<Record<ExposureSourceKey, ExposureSourceCalibration>> {
	const calibrations: Partial<Record<ExposureSourceKey, ExposureSourceCalibration>> = {};

	for (const source of Object.keys(EXPOSURE_SOURCE_METADATA) as ExposureSourceKey[]) {
		const rows = occupations
			.map(occupation => ({
				anchor:
					occupation.baseline_v43?.exposure ??
					occupation.baseline_v42?.exposure ??
					occupation.exposure,
				source: occupation.evidence.exposure_source_pctiles?.[source]
			}))
			.filter(
				(row): row is { anchor: number; source: number } =>
					typeof row.source === 'number' &&
					Number.isFinite(row.source) &&
					Number.isFinite(row.anchor)
			);

		if (rows.length < 20) continue;

		const anchorMean = average(rows.map(row => row.anchor), 0.5);
		const sourceMean = average(rows.map(row => row.source), 0.5);
		const anchorVariance = Math.max(
			average(rows.map(row => (row.anchor - anchorMean) ** 2), 0.01),
			0.0004
		);
		const covariance = average(
			rows.map(row => (row.anchor - anchorMean) * (row.source - sourceMean)),
			0
		);
		const beta = Math.min(1.35, Math.max(0.65, covariance / anchorVariance || 1));
		const alpha = sourceMean - beta * anchorMean;
		const residualStdev = Math.max(
			0.08,
			Math.sqrt(
				average(rows.map(row => (row.source - (alpha + beta * row.anchor)) ** 2), 0.015)
			)
		);

		calibrations[source] = {
			alpha,
			beta,
			residual_stdev: residualStdev,
			reliability: getExposureSourceReliability(source),
			sample_size: rows.length
		};
	}

	return calibrations;
}

export function computeWorkflowAugmentationReadiness(
	workflowOverlay?: WorkflowOverlay
): number {
	if (!workflowOverlay) return 0.5;

	return clamp01(
		average([
			workflowOverlay.ambiguity_tolerance,
			workflowOverlay.institutional_knowledge,
			workflowOverlay.relationship_intensity,
			workflowOverlay.regulatory_weight,
			workflowOverlay.tool_velocity,
			1 - workflowOverlay.physical_presence
		])
	);
}

export function computeAugmentationPrior(occupation: Occupation): AugmentationPriorResult {
	const archetype = classifyArchetype(
		occupation.ssoc,
		occupation.title,
		occupation.major_group
	);
	const prior = AUGMENTATION_ARCHETYPE_PRIORS[archetype];
	const autonomyProxy = computeAutonomyProxy(occupation.workflow_overlay);
	const augmentationShareProxy = clamp01(1 - autonomyProxy);
	const workflowReadiness = computeWorkflowAugmentationReadiness(occupation.workflow_overlay);
	const empiricalAugmentationPotential = clamp01(
		occupation.exposure *
			augmentationShareProxy *
			workflowReadiness *
			occupation.market.market_resilience *
			prior.value
	);
	const heterogeneousAugmentationProxy = clamp01(
		occupation.augmentation * 0.6 + empiricalAugmentationPotential * 0.4
	);

	return {
		archetype,
		prior_label: prior.label,
		prior_value: prior.value,
		workflow_augmentation_readiness: workflowReadiness,
		autonomy_proxy: autonomyProxy,
		augmentation_share_proxy: augmentationShareProxy,
		empirical_augmentation_potential: empiricalAugmentationPotential,
		heterogeneous_augmentation_proxy: heterogeneousAugmentationProxy,
		delta_vs_live: heterogeneousAugmentationProxy - occupation.augmentation,
		research_keys: prior.research_keys
	};
}

export function computePosteriorExposure(
	occupation: Occupation,
	groupPriorMean: number,
	groupPriorVariance: number,
	sourcePctiles: Partial<Record<ExposureSourceKey, number>>,
	sourceCalibrations: Partial<Record<ExposureSourceKey, ExposureSourceCalibration>>,
	taskAdjusted:
		| {
				eligibility_status: string;
				calibrated_task_exposure: number | null;
				reallocation_buffer: number | null;
		  }
		| undefined
): PosteriorExposureResult {
	const sourceKeys = Object.entries(sourcePctiles)
		.filter(
			(entry): entry is [string, number] =>
				typeof entry[1] === 'number' && Number.isFinite(entry[1])
		)
		.map(([key]) => key as ExposureSourceKey);
	const sourceWeights = normalizeExposureSourceWeights(sourceKeys);
	const sourceValues = sourceKeys.map(key => sourcePctiles[key] ?? 0);
	const weights = sourceKeys.map(key => sourceWeights[key] ?? getExposureSourceReliability(key));
	const sourceMean = weightedMean(sourceValues, weights);
	const priorVariance = Math.max(groupPriorVariance, 0.0025);
	const priorPrecision = 1 / priorVariance;
	const latentObservations = sourceKeys
		.map(key => {
			const observed = sourcePctiles[key];
			const calibration = sourceCalibrations[key];
			if (typeof observed !== 'number' || !calibration) return null;
			const latentEstimate = clamp01((observed - calibration.alpha) / calibration.beta);
			const observationPrecision =
				(calibration.reliability * Math.max(weights[sourceKeys.indexOf(key)] ?? 0.1, 0.1)) /
				Math.max(calibration.residual_stdev ** 2, 0.0064);
			return {
				latent_estimate: latentEstimate,
				observation_precision: observationPrecision
			};
		})
		.filter(
			(
				observation
			): observation is { latent_estimate: number; observation_precision: number } =>
				observation !== null
		);
	const baselineObservationPrecision = latentObservations.reduce(
		(sum, observation) => sum + observation.observation_precision,
		0
	);
	const posteriorBaselineMean = clamp01(
		(priorPrecision * groupPriorMean +
			latentObservations.reduce(
				(sum, observation) =>
					sum + observation.latent_estimate * observation.observation_precision,
				0
			)) /
			(priorPrecision + baselineObservationPrecision || 1)
	);
	const disagreementInflation =
		occupation.evidence.exposure_agreement === 'divergent'
			? 1.2
			: occupation.evidence.exposure_agreement === 'aligned_mid'
				? 1.05
				: 1;
	const sparseInflation = sourceKeys.length <= 1 ? 1.25 : sourceKeys.length === 2 ? 1.1 : 1;
	let liveObservationPrecision = baselineObservationPrecision;
	let livePosteriorMean = posteriorBaselineMean;
	let taskAlignmentApplied = false;
	if (
		taskAdjusted?.eligibility_status === 'task_native' &&
		taskAdjusted.calibrated_task_exposure !== null
	) {
		const taskObservationPrecision =
			6.5 *
			(1 - 0.45 * clamp01(taskAdjusted.reallocation_buffer ?? 0)) *
			SHADOW_V43_CONSTANTS.calibrated_exposure_blend_alpha;
		livePosteriorMean = clamp01(
			(priorPrecision * groupPriorMean +
				latentObservations.reduce(
					(sum, observation) =>
						sum + observation.latent_estimate * observation.observation_precision,
					0
				) +
				taskAdjusted.calibrated_task_exposure * taskObservationPrecision) /
				(priorPrecision + baselineObservationPrecision + taskObservationPrecision || 1)
		);
		liveObservationPrecision += taskObservationPrecision;
		taskAlignmentApplied = true;
	}
	const posteriorVariance =
		(1 / Math.max(priorPrecision + liveObservationPrecision, 0.0001)) *
		disagreementInflation *
		sparseInflation;
	const posteriorStdev = Math.sqrt(Math.max(posteriorVariance, 0.0004));

	const exposureP025 = quantileFromNormal(livePosteriorMean, posteriorStdev, -1.96);
	const exposureP10 = quantileFromNormal(livePosteriorMean, posteriorStdev, -1.2816);
	const exposureP90 = quantileFromNormal(livePosteriorMean, posteriorStdev, 1.2816);
	const exposureP975 = quantileFromNormal(livePosteriorMean, posteriorStdev, 1.96);
	const netRiskForExposure = (exposure: number) =>
		computeNetRisk({
			exposure,
			bottleneck: occupation.bottleneck,
			market_resilience: occupation.market.market_resilience
		});

	return {
		sources_used_count: sourceKeys.length,
		prior_mean: groupPriorMean,
		prior_variance: priorVariance,
		prior_precision: priorPrecision,
		baseline_source_mean: sourceMean,
		baseline_posterior_mean: posteriorBaselineMean,
		live_posterior_mean: livePosteriorMean,
		posterior_variance: posteriorVariance,
		posterior_stdev: posteriorStdev,
		observation_precision: liveObservationPrecision,
		task_alignment_applied: taskAlignmentApplied,
		exposure_p025: exposureP025,
		exposure_p10: exposureP10,
		exposure_p50: livePosteriorMean,
		exposure_p90: exposureP90,
		exposure_p975: exposureP975,
		net_risk_p025: netRiskForExposure(exposureP025),
		net_risk_p10: netRiskForExposure(exposureP10),
		net_risk_p50: netRiskForExposure(livePosteriorMean),
		net_risk_p90: netRiskForExposure(exposureP90),
		net_risk_p975: netRiskForExposure(exposureP975),
		shrinkage_vs_live: livePosteriorMean - occupation.exposure,
		method: 'latent_source_measurement_v1'
	};
}

interface TransitionCandidateLike {
	to_ssoc: string;
	to_title: string;
	composite: number;
	observed_transition_rate: number | null;
	skill_overlap?: number;
	wage_preservation?: number;
	demand_strength?: number;
	risk_improvement?: number;
	credential_gap?: number;
	observed_wage_delta?: number | null;
	observed_training_duration_months?: number | null;
}

function destinationQualityScore(transition: TransitionCandidateLike): number {
	const skillOverlap = clamp01(transition.skill_overlap ?? 0.4);
	const wagePreservation = clamp01(transition.wage_preservation ?? 0.6);
	const demandStrength = clamp01(transition.demand_strength ?? transition.composite);
	const riskImprovement = clamp01(transition.risk_improvement ?? 0.2);
	const trainingEase = clamp01(
		transition.observed_training_duration_months !== null &&
			transition.observed_training_duration_months !== undefined
			? 1 - clamp01(transition.observed_training_duration_months / 18)
			: 1 - clamp01(transition.credential_gap ?? 0.5)
	);

	return clamp01(
		0.24 * clamp01(transition.composite) +
			0.16 * skillOverlap +
			0.14 * wagePreservation +
			0.16 * demandStrength +
			0.14 * riskImprovement +
			0.16 * trainingEase
	);
}

export function computeMobilityPrior(
	topTransitions: TransitionCandidateLike[]
): MobilityPriorResult {
	const observedTransitions = topTransitions.filter(
		transition => transition.observed_transition_rate !== null
	);
	const leadingTransitions = topTransitions.slice(0, 3);
	const heuristicTransitionScore = clamp01(
		average(leadingTransitions.map(transition => transition.composite), 0.35)
	);
	const destinationQualityScoreValue = clamp01(
		average(leadingTransitions.map(transition => destinationQualityScore(transition)), 0.4)
	);
	const wagePreservationScore = clamp01(
		average(
			leadingTransitions.map(transition => clamp01(transition.wage_preservation ?? 0.6)),
			0.6
		)
	);
	const trainingEaseScore = clamp01(
		average(
			leadingTransitions.map(transition =>
				transition.observed_training_duration_months !== null &&
				transition.observed_training_duration_months !== undefined
					? 1 - clamp01(transition.observed_training_duration_months / 18)
					: 1 - clamp01(transition.credential_gap ?? 0.5)
			),
			0.55
		)
	);
	const empiricalTransitionRate =
		observedTransitions.length > 0
			? average(
					observedTransitions
						.slice(0, 3)
						.map(transition => transition.observed_transition_rate ?? 0),
					0
				)
			: null;
	const observedSignalStrength =
		observedTransitions.length > 0
			? clamp01(
					average(
						observedTransitions
							.slice(0, 3)
							.map(transition => transition.observed_transition_rate ?? 0),
						0
					)
				)
			: null;

	const bestTransition = [...topTransitions]
		.map(transition => ({
			...transition,
			destination_quality: destinationQualityScore(transition),
			wage_preservation_score: clamp01(transition.wage_preservation ?? 0.6),
			training_ease: clamp01(
				transition.observed_training_duration_months !== null &&
					transition.observed_training_duration_months !== undefined
					? 1 - clamp01(transition.observed_training_duration_months / 18)
					: 1 - clamp01(transition.credential_gap ?? 0.5)
			),
			empirical_priority: clamp01(
				0.24 * clamp01(transition.composite) +
					0.24 * destinationQualityScore(transition) +
					0.2 * clamp01(transition.observed_transition_rate ?? destinationQualityScoreValue) +
					0.16 * clamp01(transition.wage_preservation ?? 0.6) +
					0.16 *
						(transition.observed_training_duration_months !== null &&
						transition.observed_training_duration_months !== undefined
							? 1 - clamp01(transition.observed_training_duration_months / 18)
							: 1 - clamp01(transition.credential_gap ?? 0.5))
			)
		}))
		.sort((a, b) => b.empirical_priority - a.empirical_priority)[0];

	return {
		status: observedTransitions.length > 0 ? 'observed_enriched' : 'heuristic_only',
		observed_transition_coverage: clamp01(
			topTransitions.length > 0 ? observedTransitions.length / topTransitions.length : 0
		),
		heuristic_transition_score: heuristicTransitionScore,
		empirical_transition_rate: empiricalTransitionRate,
		observed_signal_strength: observedSignalStrength,
		destination_quality_score: destinationQualityScoreValue,
		wage_preservation_score: wagePreservationScore,
		training_ease_score: trainingEaseScore,
		empirical_mobility_score: clamp01(
			0.24 * heuristicTransitionScore +
				0.26 * destinationQualityScoreValue +
				0.2 * (observedSignalStrength ?? destinationQualityScoreValue) +
				0.16 * wagePreservationScore +
				0.14 * trainingEaseScore
		),
		best_transition: bestTransition
			? {
					to_ssoc: bestTransition.to_ssoc,
					to_title: bestTransition.to_title,
					composite: bestTransition.composite,
					observed_transition_rate: bestTransition.observed_transition_rate,
					destination_quality: bestTransition.destination_quality,
					wage_preservation: bestTransition.wage_preservation_score,
					training_ease: bestTransition.training_ease,
					empirical_priority: bestTransition.empirical_priority
				}
			: null,
		method: 'hybrid_transition_mobility_v2'
	};
}

function labourPressureAdjustment(
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating' | undefined
): number {
	switch (overall) {
		case 'deteriorating':
			return 0.08;
		case 'weak':
			return 0.04;
		case 'moderate':
			return 0;
		case 'strong':
			return -0.04;
		default:
			return 0.02;
	}
}

function overallSoftness(
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating' | undefined
): number {
	switch (overall) {
		case 'deteriorating':
			return 0.92;
		case 'weak':
			return 0.72;
		case 'moderate':
			return 0.46;
		case 'strong':
			return 0.2;
		default:
			return 0.52;
	}
}

function computeLabourSoftnessScore(occupation: Occupation): number {
	const overall = overallSoftness(occupation.labour_monitor?.overall);
	const vacancyTrend =
		occupation.labour_monitor?.vacancy?.trend_4q_pct !== undefined
			? clamp01((-occupation.labour_monitor.vacancy.trend_4q_pct + 12) / 28)
			: 0.5;
	const hiringPressure =
		occupation.labour_monitor?.hiring?.net_pressure !== undefined
			? clamp01(1 - occupation.labour_monitor.hiring.net_pressure / 1.2)
			: 0.5;
	const retrenchmentIncidence =
		occupation.labour_monitor?.retrenchment?.incidence_per_1000 !== undefined
			? clamp01(occupation.labour_monitor.retrenchment.incidence_per_1000 / 3)
			: 0.5;

	return clamp01(
		0.4 * overall + 0.25 * vacancyTrend + 0.2 * hiringPressure + 0.15 * retrenchmentIncidence
	);
}

function computePostingsSupportScore(postingsSignal?: {
	posting_volume_30d?: number;
	trend_90d?: string;
	hiring_state?: string;
	freshness_days?: number;
} | null): number | null {
	if (!postingsSignal) return null;

	const volume = clamp01(Math.log1p(postingsSignal.posting_volume_30d ?? 0) / Math.log(21));
	const trend =
		postingsSignal.trend_90d === 'rising'
			? 1
			: postingsSignal.trend_90d === 'steady'
				? 0.68
				: postingsSignal.trend_90d === 'falling'
					? 0.3
					: 0.5;
	const hiring =
		postingsSignal.hiring_state === 'active'
			? 1
			: postingsSignal.hiring_state === 'moderate'
				? 0.74
				: postingsSignal.hiring_state === 'thin'
					? 0.38
					: 0.18;
	const freshness =
		postingsSignal.freshness_days !== undefined
			? postingsSignal.freshness_days <= 3
				? 1
				: postingsSignal.freshness_days <= 7
					? 0.82
					: postingsSignal.freshness_days <= 14
						? 0.6
						: 0.36
			: 0.5;

	return clamp01(0.35 * volume + 0.25 * trend + 0.25 * hiring + 0.15 * freshness);
}

export function computeRealizedRiskSidecar(
	occupation: Occupation,
	offsetPotential:
		| {
				score: number;
				components?: {
					demand_persistence?: number;
					transition_support?: number;
					reallocation_room?: number;
					mobility_friction?: number;
				};
		  }
		| null,
	postingsSignal?:
		| {
				posting_volume_30d?: number;
				trend_90d?: string;
				hiring_state?: string;
				freshness_days?: number;
		  }
		| null,
	employerPressureScore?: number | null
): RealizedRiskResult {
	const offsetScore = offsetPotential?.score ?? 0.5;
	const offsetBufferScore = clamp01(
		0.6 * offsetScore + 0.4 * (offsetPotential?.components?.reallocation_room ?? offsetScore)
	);
	const demandPersistenceScore = offsetPotential?.components?.demand_persistence ?? null;
	const transitionFrictionScore = clamp01(
		0.55 * (offsetPotential?.components?.mobility_friction ?? 0.35) +
			0.45 * (1 - (offsetPotential?.components?.transition_support ?? 0.55))
	);
	const labourSoftnessScore = computeLabourSoftnessScore(occupation);
	const postingsSupportScore = computePostingsSupportScore(postingsSignal);
	const archetype = classifyArchetype(occupation.ssoc, occupation.title, occupation.major_group);
	const shortRunCapScore = REALIZED_SHORT_RUN_ARCHETYPE_CAPS[archetype];
	const employerPressure = clamp01(
		employerPressureScore ??
			(archetype === 'general_clerical' || archetype === 'operations_logistics' ? 0.24 : 0.16)
	);
	const demandFragility = clamp01(1 - (demandPersistenceScore ?? 0.55));
	const signalAlignmentScore = clamp01(
		0.45 * employerPressure +
			0.3 * labourSoftnessScore +
			0.25 * transitionFrictionScore
	);
	const postingsResistanceScore =
		postingsSupportScore === null
			? 1
			: Math.max(0.3, 1 - 0.8 * postingsSupportScore);
	const baseEvidenceScalar = clamp01(
		0.13 +
			0.17 * employerPressure +
			0.17 * labourSoftnessScore +
			0.11 * transitionFrictionScore +
			0.08 * (1 - (postingsSupportScore ?? 0.5)) +
			0.07 * demandFragility -
			0.12 * offsetBufferScore +
			labourPressureAdjustment(occupation.labour_monitor?.overall)
	);
	const realizationScalar = clamp01(
		baseEvidenceScalar *
			(0.55 + 0.9 * shortRunCapScore) *
			(0.9 + 0.3 * signalAlignmentScore) *
			postingsResistanceScore
	);

	const scenarios = Object.fromEntries(
		(Object.entries(scenarioPresets) as Array<[ScenarioPreset, (typeof scenarioPresets)[ScenarioPreset]]>).map(
			([key, preset]) => {
				const forecast = computeForecastScores(occupation, preset.params);
				return [
					key,
					{
						near_term_risk: forecast.nearTermRisk,
						realized_risk_proxy: clamp01(forecast.nearTermRisk * realizationScalar)
					}
				];
			}
		)
	) as Record<ScenarioPreset, RealizedRiskScenarioSnapshot>;

	return {
		structural_risk: occupation.net_risk,
		base_near_term_risk: scenarios.base.near_term_risk,
		base_realized_risk_proxy: scenarios.base.realized_risk_proxy,
		realization_scalar: realizationScalar,
		archetype,
		short_run_cap_score: shortRunCapScore,
		employer_pressure_score: employerPressure,
		labour_softness_score: labourSoftnessScore,
		postings_support_score: postingsSupportScore,
		postings_resistance_score: postingsResistanceScore,
		transition_friction_score: transitionFrictionScore,
		offset_buffer_score: offsetBufferScore,
		demand_persistence_score: demandPersistenceScore,
		signal_alignment_score: signalAlignmentScore,
		gap_to_structural: occupation.net_risk - scenarios.base.realized_risk_proxy,
		scenarios,
		method: 'market_calibrated_realized_risk_v3'
	};
}
