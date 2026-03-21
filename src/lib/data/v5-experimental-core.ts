import type {
	AugmentationBand,
	ImpactType,
	OccupationScoringBasis,
	RiskBand
} from './index';
import { clamp01, computeNetRisk } from './methodology-core';
import { AUGMENTATION_THRESHOLDS, classifyImpactType, getRiskBand } from './scoring-constants';

export type V5ExperimentalStructuralBasis =
	| 'posterior_task_aware'
	| 'posterior_ensemble_fallback';

export type V5ExperimentalProfile =
	| 'disrupted'
	| 'retooling'
	| 'leveraged'
	| 'shielded'
	| 'balanced';

export interface V5ExperimentalInputs {
	live_scoring_basis?: OccupationScoringBasis;
	live_net_risk: number;
	bottleneck: number;
	market_resilience: number;
	posterior_exposure_p10: number;
	posterior_exposure_p50: number;
	posterior_exposure_p90: number;
	heterogeneous_augmentation: number;
	empirical_mobility: number;
	realization_scalar: number;
	task_mode_exposure_signal?: number | null;
	task_mode_effective_coverage?: number | null;
	task_mode_automation_pressure?: number | null;
	task_mode_augmentation_upside?: number | null;
	demand_fragility?: number | null;
	reallocation_capacity?: number | null;
	task_mode_blend_weight?: number | null;
}

export interface V5ExperimentalScores {
	structural_basis: V5ExperimentalStructuralBasis;
	posterior_interval_width_80: number;
	structural_exposure_p10: number;
	structural_exposure: number;
	structural_exposure_p90: number;
	task_mode_blend_weight: number;
	task_mode_effective_coverage: number | null;
	task_mode_automation_pressure: number | null;
	task_mode_augmentation_upside: number | null;
	effective_augmentation: number;
	demand_fragility: number;
	reallocation_capacity: number;
	concentration_adjustment: number;
	structural_risk_p10: number;
	structural_risk: number;
	structural_risk_p90: number;
	structural_band: RiskBand;
	heterogeneous_augmentation: number;
	augmentation_band: AugmentationBand;
	empirical_mobility: number;
	adaptation_capacity: number;
	adaptation_buffer: number;
	transition_adjusted_risk: number;
	transition_adjusted_band: RiskBand;
	realized_risk_proxy: number;
	impact_type: ImpactType;
	profile: V5ExperimentalProfile;
	delta_vs_live_structural: number;
	delta_vs_live_transition: number;
}

export const V5_EXPERIMENTAL_CONSTANTS = {
	adaptation_capacity_mobility_weight: 0.5,
	adaptation_capacity_augmentation_weight: 0.35,
	adaptation_capacity_task_mode_weight: 0.15,
	adaptation_buffer_max: 0.2,
	concentration_fragility_weight: 0.18,
	adaptation_concentration_drag: 0.12,
	reallocation_capacity_lift: 0.18,
	effective_augmentation_task_mode_weight: 0.2
} as const;

export function getAugmentationBand(value: number): AugmentationBand {
	if (value >= AUGMENTATION_THRESHOLDS.very_high) return 'very_high';
	if (value >= AUGMENTATION_THRESHOLDS.high) return 'high';
	if (value >= AUGMENTATION_THRESHOLDS.moderate) return 'moderate';
	if (value >= AUGMENTATION_THRESHOLDS.low) return 'low';
	return 'very_low';
}

export function classifyV5Profile(
	transitionAdjustedRisk: number,
	effectiveAugmentation: number,
	empiricalMobility: number,
	realizedRiskProxy: number
): V5ExperimentalProfile {
	if (
		realizedRiskProxy >= 0.12 &&
		effectiveAugmentation < 0.12 &&
		empiricalMobility < 0.45
	) {
		return 'disrupted';
	}

	if (
		transitionAdjustedRisk >= 0.25 &&
		(effectiveAugmentation >= 0.12 || empiricalMobility >= 0.55)
	) {
		return 'retooling';
	}

	if (transitionAdjustedRisk < 0.25 && effectiveAugmentation >= 0.12) {
		return 'leveraged';
	}

	if (transitionAdjustedRisk < 0.15 && realizedRiskProxy < 0.08) {
		return 'shielded';
	}

	return 'balanced';
}

export function computeV5ExperimentalScores(
	inputs: V5ExperimentalInputs
): V5ExperimentalScores {
	const structuralBasis: V5ExperimentalStructuralBasis =
		inputs.live_scoring_basis === 'task_aware_exposure_v43'
			? 'posterior_task_aware'
			: 'posterior_ensemble_fallback';

	const taskModeBlendWeight = clamp01(inputs.task_mode_blend_weight ?? 0);
	const taskModeExposureSignal =
		inputs.task_mode_exposure_signal !== null && inputs.task_mode_exposure_signal !== undefined
			? clamp01(inputs.task_mode_exposure_signal)
			: null;
	const structuralExposure = clamp01(
		taskModeExposureSignal === null
			? inputs.posterior_exposure_p50
			: (1 - taskModeBlendWeight) * inputs.posterior_exposure_p50 +
					taskModeBlendWeight * taskModeExposureSignal
	);
	const exposureShift = structuralExposure - inputs.posterior_exposure_p50;
	const structuralExposureP10 = clamp01(inputs.posterior_exposure_p10 + exposureShift);
	const structuralExposureP90 = clamp01(inputs.posterior_exposure_p90 + exposureShift);
	const demandFragility = clamp01(inputs.demand_fragility ?? 0);
	const reallocationCapacity = clamp01(inputs.reallocation_capacity ?? 0.5);
	const concentrationAdjustment =
		1 + V5_EXPERIMENTAL_CONSTANTS.concentration_fragility_weight * demandFragility;

	const structuralRiskP10 = clamp01(
		computeNetRisk({
			exposure: structuralExposureP10,
			bottleneck: inputs.bottleneck,
			market_resilience: inputs.market_resilience
		}) * concentrationAdjustment
	);
	const structuralRisk = clamp01(
		computeNetRisk({
			exposure: structuralExposure,
			bottleneck: inputs.bottleneck,
			market_resilience: inputs.market_resilience
		}) * concentrationAdjustment
	);
	const structuralRiskP90 = clamp01(
		computeNetRisk({
			exposure: structuralExposureP90,
			bottleneck: inputs.bottleneck,
			market_resilience: inputs.market_resilience
		}) * concentrationAdjustment
	);
	const effectiveAugmentation = clamp01(
		(1 - V5_EXPERIMENTAL_CONSTANTS.effective_augmentation_task_mode_weight) *
			inputs.heterogeneous_augmentation +
			V5_EXPERIMENTAL_CONSTANTS.effective_augmentation_task_mode_weight *
				(inputs.task_mode_augmentation_upside ?? inputs.heterogeneous_augmentation)
	);
	const adaptationCapacityBase = clamp01(
		V5_EXPERIMENTAL_CONSTANTS.adaptation_capacity_mobility_weight * inputs.empirical_mobility +
			V5_EXPERIMENTAL_CONSTANTS.adaptation_capacity_augmentation_weight *
				inputs.heterogeneous_augmentation +
			V5_EXPERIMENTAL_CONSTANTS.adaptation_capacity_task_mode_weight *
				(inputs.task_mode_augmentation_upside ?? inputs.heterogeneous_augmentation)
	);
	const adaptationCapacity = clamp01(
		adaptationCapacityBase *
			(1 -
				V5_EXPERIMENTAL_CONSTANTS.adaptation_concentration_drag * demandFragility) +
			V5_EXPERIMENTAL_CONSTANTS.reallocation_capacity_lift *
				reallocationCapacity *
				(1 - adaptationCapacityBase)
	);
	const adaptationBuffer = clamp01(
		V5_EXPERIMENTAL_CONSTANTS.adaptation_buffer_max * adaptationCapacity
	);
	const transitionAdjustedRisk = clamp01(structuralRisk * (1 - adaptationBuffer));
	const realizationRate = clamp01(
		inputs.realization_scalar * (0.9 + 0.2 * demandFragility)
	);
	const realizedRiskProxy = clamp01(transitionAdjustedRisk * realizationRate);

	return {
		structural_basis: structuralBasis,
		posterior_interval_width_80: clamp01(inputs.posterior_exposure_p90 - inputs.posterior_exposure_p10),
		structural_exposure_p10: structuralExposureP10,
		structural_exposure: structuralExposure,
		structural_exposure_p90: structuralExposureP90,
		task_mode_blend_weight: taskModeBlendWeight,
		task_mode_effective_coverage: inputs.task_mode_effective_coverage ?? null,
		task_mode_automation_pressure: inputs.task_mode_automation_pressure ?? null,
		task_mode_augmentation_upside: inputs.task_mode_augmentation_upside ?? null,
		effective_augmentation: effectiveAugmentation,
		demand_fragility: demandFragility,
		reallocation_capacity: reallocationCapacity,
		concentration_adjustment: concentrationAdjustment,
		structural_risk_p10: structuralRiskP10,
		structural_risk: structuralRisk,
		structural_risk_p90: structuralRiskP90,
		structural_band: getRiskBand(structuralRisk),
		heterogeneous_augmentation: inputs.heterogeneous_augmentation,
		augmentation_band: getAugmentationBand(effectiveAugmentation),
		empirical_mobility: inputs.empirical_mobility,
		adaptation_capacity: adaptationCapacity,
		adaptation_buffer: adaptationBuffer,
		transition_adjusted_risk: transitionAdjustedRisk,
		transition_adjusted_band: getRiskBand(transitionAdjustedRisk),
		realized_risk_proxy: realizedRiskProxy,
		impact_type: classifyImpactType(transitionAdjustedRisk, effectiveAugmentation),
		profile: classifyV5Profile(
			transitionAdjustedRisk,
			effectiveAugmentation,
			inputs.empirical_mobility,
			realizedRiskProxy
		),
		delta_vs_live_structural: structuralRisk - inputs.live_net_risk,
		delta_vs_live_transition: transitionAdjustedRisk - inputs.live_net_risk
	};
}
