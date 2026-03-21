import { clamp01 } from './methodology-core';

export const SHADOW_V43_CONSTANTS = {
	min_task_weight_share: 0.6,
	concentration_buffer_lambda: 0.35,
	autonomy_proxy_weights: {
		base_bottleneck_inverse: 0.6,
		workflow_delegation: 0.4
	}
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
	baseline_net_risk: number;
	baseline_augmentation: number;
	bottleneck: number;
	market_modifier: number;
	task_matched_weight_share: number | null;
	task_effective_coverage: number | null;
	task_exposure_concentration: number | null;
	workflow_overlay?: ShadowWorkflowOverlay;
}

export interface ShadowModelScores {
	eligibility_status: ShadowEligibilityStatus;
	success_proxy: number;
	autonomy_proxy: number | null;
	reallocation_buffer: number | null;
	automation_pressure: number;
	augmentation_upside: number;
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

export function computeAutonomyProxy(
	bottleneck: number,
	workflowOverlay?: ShadowWorkflowOverlay
): number {
	const base = clamp01(1 - bottleneck);
	if (!workflowOverlay) return base;

	const delegationReadiness = average([
		workflowOverlay.tool_velocity,
		1 - workflowOverlay.real_time_coordination,
		1 - workflowOverlay.ambiguity_tolerance,
		1 - workflowOverlay.institutional_knowledge,
		1 - workflowOverlay.relationship_intensity,
		1 - workflowOverlay.regulatory_weight,
		1 - workflowOverlay.physical_presence
	].map(clamp01));

	return clamp01(
		SHADOW_V43_CONSTANTS.autonomy_proxy_weights.base_bottleneck_inverse * base +
			SHADOW_V43_CONSTANTS.autonomy_proxy_weights.workflow_delegation * delegationReadiness
	);
}

export function computeShadowModelScores(inputs: ShadowModelInputs): ShadowModelScores {
	const eligibilityStatus = getShadowEligibilityStatus(
		inputs.match_quality,
		inputs.task_matched_weight_share
	);

	if (eligibilityStatus !== 'task_native' || inputs.task_effective_coverage === null) {
		return {
			eligibility_status: eligibilityStatus,
			success_proxy: 1,
			autonomy_proxy: null,
			reallocation_buffer: null,
			automation_pressure: inputs.baseline_net_risk,
			augmentation_upside: inputs.baseline_augmentation,
			net_risk: inputs.baseline_net_risk
		};
	}

	const effectiveCoverage = clamp01(inputs.task_effective_coverage);
	const concentration = clamp01(inputs.task_exposure_concentration ?? 0);
	const autonomyProxy = computeAutonomyProxy(inputs.bottleneck, inputs.workflow_overlay);
	const reallocationBuffer = clamp01(
		SHADOW_V43_CONSTANTS.concentration_buffer_lambda * concentration
	);
	const successProxy = 1;
	const automationPressure = clamp01(
		effectiveCoverage * successProxy * autonomyProxy * (1 - inputs.bottleneck)
	);
	const augmentationUpside = clamp01(
		effectiveCoverage * successProxy * (1 - autonomyProxy) * inputs.bottleneck
	);
	const netRisk = clamp01(automationPressure * (1 - reallocationBuffer) * inputs.market_modifier);

	return {
		eligibility_status: eligibilityStatus,
		success_proxy: successProxy,
		autonomy_proxy: autonomyProxy,
		reallocation_buffer: reallocationBuffer,
		automation_pressure: automationPressure,
		augmentation_upside: augmentationUpside,
		net_risk: netRisk
	};
}
