import { MARKET_CONSTANTS } from './scoring-constants';

export interface StructuralScoreInputs {
	exposure: number;
	bottleneck: number;
	market_resilience: number;
	/** Override the default max_modifier_effect (e.g. for double-signal demand occupations) */
	max_modifier_effect?: number;
}

export interface MarketResilienceInputs {
	market_momentum: number;
	occupation_scarcity: number;
}

export function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

export function computeMarketModifier(
	marketResilience: number,
	maxModifierEffect?: number
): number {
	return 1 - (maxModifierEffect ?? MARKET_CONSTANTS.max_modifier_effect) * marketResilience;
}

export function computeMarketResilience({
	market_momentum,
	occupation_scarcity
}: MarketResilienceInputs): number {
	return (
		MARKET_CONSTANTS.momentum_weight * market_momentum +
		MARKET_CONSTANTS.scarcity_weight * occupation_scarcity
	);
}

export function blendEmploymentMomentum(
	groupEmploymentMomentum: number,
	industryEmploymentMomentum: number | null
): number {
	if (industryEmploymentMomentum === null) return groupEmploymentMomentum;
	return (
		(1 - MARKET_CONSTANTS.industry_footprint_employment_weight) * groupEmploymentMomentum +
		MARKET_CONSTANTS.industry_footprint_employment_weight * industryEmploymentMomentum
	);
}

function sigmoid(value: number): number {
	return 1 / (1 + Math.exp(-value));
}

function logit(probability: number): number {
	return Math.log(probability / (1 - probability));
}

export function applyPercentileShift(percentile: number, delta: number): number {
	const epsilon = 1e-6;
	const bounded = Math.max(epsilon, Math.min(1 - epsilon, percentile));
	return sigmoid(logit(bounded) + delta * MARKET_CONSTANTS.percentile_shift_calibration);
}

export function computeNetRisk({
	exposure,
	bottleneck,
	market_resilience,
	max_modifier_effect
}: StructuralScoreInputs): number {
	return exposure * (1 - bottleneck) * computeMarketModifier(market_resilience, max_modifier_effect);
}

export function computeAugmentation({
	exposure,
	bottleneck,
	market_resilience
}: StructuralScoreInputs): number {
	return exposure * bottleneck * market_resilience;
}

export function computeStructuralScores(inputs: StructuralScoreInputs): {
	market_modifier: number;
	net_risk: number;
	augmentation: number;
} {
	return {
		market_modifier: computeMarketModifier(inputs.market_resilience, inputs.max_modifier_effect),
		net_risk: computeNetRisk(inputs),
		augmentation: computeAugmentation(inputs)
	};
}
