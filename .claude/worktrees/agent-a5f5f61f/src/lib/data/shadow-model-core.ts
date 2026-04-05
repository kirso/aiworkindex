import { clamp01, computeAugmentation, computeNetRisk } from './methodology-core';

export const SHADOW_V43_CONSTANTS = {
	min_task_weight_share: 0.6,
	calibrated_exposure_blend_alpha: 0.35,
	concentration_buffer_lambda: 0.05
} as const;

export type ShadowEligibilityStatus =
	| 'task_native'
	| 'occupation_fallback'
	| 'insufficient_task_evidence';

export interface ShadowWorkflowOverlay {
	creative_generation: number;
	real_time_coordination: number;
	ambiguity_tolerance: number;
	institutional_knowledge: number;
	relationship_intensity: number;
	regulatory_weight: number;
	physical_presence: number;
	tool_velocity: number;
}

export interface ShadowModelInputs {
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	baseline_exposure: number;
	baseline_net_risk: number;
	baseline_augmentation: number;
	bottleneck: number;
	market_resilience: number;
	task_matched_weight_share: number | null;
	task_effective_coverage: number | null;
	task_exposure_concentration: number | null;
	calibrated_task_exposure: number | null;
	workflow_overlay?: ShadowWorkflowOverlay;
}

export interface ShadowModelScores {
	eligibility_status: ShadowEligibilityStatus;
	success_proxy: number;
	autonomy_proxy: number | null;
	reallocation_buffer: number | null;
	automation_pressure: number;
	augmentation_upside: number;
	raw_task_signal: number | null;
	calibrated_task_exposure: number | null;
	shadow_exposure: number;
	net_risk: number;
}

function average(values: number[]): number {
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getShadowEligibilityStatus(
	matchQuality: ShadowModelInputs['match_quality'],
	matchedTaskWeightShare: number | null
): ShadowEligibilityStatus {
	if (
		matchedTaskWeightShare !== null &&
		matchedTaskWeightShare >= SHADOW_V43_CONSTANTS.min_task_weight_share
	) {
		return 'task_native';
	}

	if (matchQuality === 'direct') return 'insufficient_task_evidence';

	return 'occupation_fallback';
}

export function computeAutonomyProxy(workflowOverlay?: ShadowWorkflowOverlay): number {
	if (!workflowOverlay) return 0.5;

	return clamp01(
		average([
			workflowOverlay.tool_velocity,
			workflowOverlay.creative_generation,
			1 - workflowOverlay.real_time_coordination,
			1 - workflowOverlay.ambiguity_tolerance,
			1 - workflowOverlay.institutional_knowledge,
			1 - workflowOverlay.relationship_intensity,
			1 - workflowOverlay.regulatory_weight,
			1 - workflowOverlay.physical_presence
		].map(clamp01))
	);
}

export function computeRawTaskSignal(
	taskEffectiveCoverage: number,
	workflowOverlay?: ShadowWorkflowOverlay
): number {
	return clamp01(taskEffectiveCoverage * computeAutonomyProxy(workflowOverlay));
}

export function computeShadowModelScores(inputs: ShadowModelInputs): ShadowModelScores {
	const eligibilityStatus = getShadowEligibilityStatus(
		inputs.match_quality,
		inputs.task_matched_weight_share
	);

	if (
		eligibilityStatus !== 'task_native' ||
		inputs.task_effective_coverage === null ||
		inputs.calibrated_task_exposure === null
	) {
		return {
			eligibility_status: eligibilityStatus,
			success_proxy: 1,
			autonomy_proxy: null,
			reallocation_buffer: null,
			automation_pressure: inputs.baseline_net_risk,
			augmentation_upside: inputs.baseline_augmentation,
			raw_task_signal: null,
			calibrated_task_exposure: null,
			shadow_exposure: inputs.baseline_exposure,
			net_risk: inputs.baseline_net_risk
		};
	}

	const rawTaskSignal = computeRawTaskSignal(
		inputs.task_effective_coverage,
		inputs.workflow_overlay
	);
	const autonomyProxy = computeAutonomyProxy(inputs.workflow_overlay);
	const concentration = clamp01(inputs.task_exposure_concentration ?? 0);
	const reallocationBuffer = clamp01(
		SHADOW_V43_CONSTANTS.concentration_buffer_lambda * concentration
	);
	const blendedExposure = clamp01(
		(1 - SHADOW_V43_CONSTANTS.calibrated_exposure_blend_alpha) * inputs.baseline_exposure +
			SHADOW_V43_CONSTANTS.calibrated_exposure_blend_alpha * inputs.calibrated_task_exposure
	);
	const shadowExposure = clamp01(blendedExposure * (1 - reallocationBuffer));
	const netRisk = computeNetRisk({
		exposure: shadowExposure,
		bottleneck: inputs.bottleneck,
		market_resilience: inputs.market_resilience
	});
	const augmentationUpside = computeAugmentation({
		exposure: shadowExposure,
		bottleneck: inputs.bottleneck,
		market_resilience: inputs.market_resilience
	});
	const automationPressure = clamp01(shadowExposure * autonomyProxy);

	return {
		eligibility_status: eligibilityStatus,
		success_proxy: 1,
		autonomy_proxy: autonomyProxy,
		reallocation_buffer: reallocationBuffer,
		automation_pressure: automationPressure,
		augmentation_upside: augmentationUpside,
		raw_task_signal: rawTaskSignal,
		calibrated_task_exposure: inputs.calibrated_task_exposure,
		shadow_exposure: shadowExposure,
		net_risk: netRisk
	};
}
