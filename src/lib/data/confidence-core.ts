import {
	CONFIDENCE_COMPONENT_WEIGHTS,
	CONFIDENCE_PENALTIES,
	CONFIDENCE_THRESHOLDS,
	EXPOSURE_SOURCE_METADATA,
	SENSITIVITY_SCORES,
	SIGNAL_AGREEMENT_SCORES,
	SOURCE_COVERAGE_SCORES,
	type ExposureAgreement
} from './scoring-constants';
import { clamp01 } from './methodology-core';

export type MatchQuality = 'direct' | 'submajor_fallback' | 'major_fallback';
export type StabilityLabel = 'stable' | 'watch' | 'sensitive';

export interface ConfidenceInputs {
	matchQuality: MatchQuality;
	aioeDispersion: number;
	thetaDispersion: number;
	hasExactDemand: boolean;
	hasPrefixDemand: boolean;
	hasIndustryFootprint: boolean;
	exposureSourceKeys: Array<keyof typeof EXPOSURE_SOURCE_METADATA>;
	exposureSourceWeights: Partial<Record<keyof typeof EXPOSURE_SOURCE_METADATA, number>>;
	exposureAgreement: ExposureAgreement;
	stabilityLabel: StabilityLabel;
	signalConflict: boolean;
}

export interface ConfidenceResult {
	score: number;
	level: 'high' | 'medium' | 'low';
	crosswalk_quality: number;
	market_data_granularity: number;
	source_freshness: number;
	source_coverage: number;
	signal_agreement: number;
	sensitivity: number;
	exposure_source_count: number;
}

export function computeCrosswalkQuality(
	matchQuality: MatchQuality,
	aioeDispersion: number,
	thetaDispersion: number
): number {
	let crosswalkQuality =
		matchQuality === 'direct' ? 1.0 : matchQuality === 'submajor_fallback' ? 0.6 : 0.3;

	if (aioeDispersion > 0 || thetaDispersion > 0) {
		const dispersionPenalty = Math.max(0, 1 - (aioeDispersion + thetaDispersion) * 2);
		crosswalkQuality *= dispersionPenalty;
	}

	return crosswalkQuality;
}

export function computeMarketDataGranularity({
	hasExactDemand,
	hasPrefixDemand,
	hasIndustryFootprint
}: Pick<ConfidenceInputs, 'hasExactDemand' | 'hasPrefixDemand' | 'hasIndustryFootprint'>): number {
	if (hasExactDemand) return 0.85;
	if (hasPrefixDemand) return 0.75;
	if (hasIndustryFootprint) return 0.7;
	return 0.65;
}

export function computeSourceFreshness(
	exposureSourceKeys: ConfidenceInputs['exposureSourceKeys'],
	exposureSourceWeights: ConfidenceInputs['exposureSourceWeights']
): number {
	return exposureSourceKeys.reduce(
		(sum, key) => sum + (EXPOSURE_SOURCE_METADATA[key].recency ?? 0) * (exposureSourceWeights[key] ?? 0),
		0
	);
}

export function computeConfidence(inputs: ConfidenceInputs): ConfidenceResult {
	const crosswalkQuality = computeCrosswalkQuality(
		inputs.matchQuality,
		inputs.aioeDispersion,
		inputs.thetaDispersion
	);
	const marketDataGranularity = computeMarketDataGranularity(inputs);
	const sourceFreshness = computeSourceFreshness(
		inputs.exposureSourceKeys,
		inputs.exposureSourceWeights
	);
	const exposureSourceCount = inputs.exposureSourceKeys.length;
	const sourceCoverage =
		SOURCE_COVERAGE_SCORES[exposureSourceCount as keyof typeof SOURCE_COVERAGE_SCORES];
	const signalAgreement =
		SIGNAL_AGREEMENT_SCORES[
			inputs.exposureAgreement as keyof typeof SIGNAL_AGREEMENT_SCORES
		];
	const sensitivity =
		SENSITIVITY_SCORES[inputs.stabilityLabel as keyof typeof SENSITIVITY_SCORES];
	const sparseSourcePenalty =
		exposureSourceCount === 1
			? inputs.matchQuality === 'direct'
				? CONFIDENCE_PENALTIES.single_source_direct
				: inputs.matchQuality === 'submajor_fallback'
					? CONFIDENCE_PENALTIES.single_source_submajor_fallback
					: CONFIDENCE_PENALTIES.single_source_major_fallback
			: 0;
	const contestedSignalPenalty = inputs.signalConflict
		? CONFIDENCE_PENALTIES.contested_signal
		: 0;

	const score = clamp01(
		crosswalkQuality * CONFIDENCE_COMPONENT_WEIGHTS.crosswalk_quality +
			marketDataGranularity * CONFIDENCE_COMPONENT_WEIGHTS.market_data_granularity +
			sourceFreshness * CONFIDENCE_COMPONENT_WEIGHTS.source_freshness +
			sourceCoverage * CONFIDENCE_COMPONENT_WEIGHTS.source_coverage +
			signalAgreement * CONFIDENCE_COMPONENT_WEIGHTS.signal_agreement +
			sensitivity * CONFIDENCE_COMPONENT_WEIGHTS.sensitivity -
			sparseSourcePenalty -
			contestedSignalPenalty
	);

	return {
		score,
		level:
			score >= CONFIDENCE_THRESHOLDS.high
				? 'high'
				: score >= CONFIDENCE_THRESHOLDS.medium
					? 'medium'
					: 'low',
		crosswalk_quality: crosswalkQuality,
		market_data_granularity: marketDataGranularity,
		source_freshness: sourceFreshness,
		source_coverage: sourceCoverage,
		signal_agreement: signalAgreement,
		sensitivity,
		exposure_source_count: exposureSourceCount
	};
}
