/**
 * Scoring Constants — SINGLE SOURCE OF TRUTH
 *
 * All risk band thresholds, impact type rules, confidence levels,
 * and data vintage metadata. Every page and script should import
 * from here rather than hardcoding values.
 *
 * When updating thresholds, change them HERE and they propagate
 * to methodology, appendix, data dictionary, and CLAUDE.md automatically.
 *
 * Validated by: scripts/validate.ts
 * Used by: score.ts, synthetic-roles.ts, validate.ts, methodology page
 */

import type { RiskBand, ImpactType } from './index';

// ============================================
// RISK BAND THRESHOLDS
// ============================================

export const RISK_BAND_THRESHOLDS: Record<RiskBand, { lower: number; upper: number }> = {
	very_low: { lower: 0, upper: 0.05 },
	low: { lower: 0.05, upper: 0.15 },
	moderate: { lower: 0.15, upper: 0.30 },
	high: { lower: 0.30, upper: 0.50 },
	very_high: { lower: 0.50, upper: 1.0 }
};

/** Classify a net_risk value into a risk band. Single source of truth. */
export function getRiskBand(value: number): RiskBand {
	if (value < RISK_BAND_THRESHOLDS.low.lower) return 'very_low';
	if (value < RISK_BAND_THRESHOLDS.moderate.lower) return 'low';
	if (value < RISK_BAND_THRESHOLDS.high.lower) return 'moderate';
	if (value < RISK_BAND_THRESHOLDS.very_high.lower) return 'high';
	return 'very_high';
}

// ============================================
// IMPACT TYPE RULES
// ============================================

export const IMPACT_TYPE_THRESHOLDS = {
	/** net_risk threshold for "high displacement" */
	displacement_threshold: 0.25,
	/** augmentation threshold for "high augmentation" */
	augmentation_threshold: 0.12
} as const;

/**
 * Impact type classification logic:
 * - ai_leveraged: net_risk < 0.25 AND augmentation >= 0.12
 * - at_risk: net_risk >= 0.25 AND augmentation < 0.12
 * - mixed: net_risk >= 0.25 AND augmentation >= 0.12
 * - stable: net_risk < 0.25 AND augmentation < 0.12
 */
export function classifyImpactType(
	displacement: number,
	augmentation: number
): ImpactType {
	const highDisplacement = displacement >= IMPACT_TYPE_THRESHOLDS.displacement_threshold;
	const highAugmentation = augmentation >= IMPACT_TYPE_THRESHOLDS.augmentation_threshold;

	if (highDisplacement && highAugmentation) return 'mixed';
	if (highDisplacement) return 'at_risk';
	if (!highDisplacement && highAugmentation) return 'ai_leveraged';
	return 'stable';
}

// ============================================
// RANKING CRITERIA
// ============================================

/** Named thresholds for ranking page filters */
export const RANKING_CRITERIA = {
	/** Minimum exposure for "high-exposure-in-demand" ranking */
	high_exposure: 0.5
} as const;

// ============================================
// CONFIDENCE LEVELS
// ============================================

export const CONFIDENCE_THRESHOLDS = {
	high: 0.7,
	medium: 0.45
	// below 0.45 = low
} as const;

export const CONFIDENCE_COMPONENT_WEIGHTS = {
	crosswalk_quality: 0.25,
	market_data_granularity: 0.15,
	source_freshness: 0.1,
	source_coverage: 0.2,
	signal_agreement: 0.15,
	sensitivity: 0.15
} as const;

export const SOURCE_COVERAGE_SCORES = {
	1: 0.1,
	2: 0.55,
	3: 0.82,
	4: 1.0
} as const;

export const EXPOSURE_SOURCE_RELIABILITY_COMPONENT_WEIGHTS = {
	recency: 0.3,
	construct_fit: 0.3,
	coverage_quality: 0.2,
	validation_support: 0.2
} as const;

export const EXPOSURE_SOURCE_METADATA = {
	aioe: {
		label: 'Felten AIOE',
		recency: 0.55,
		construct_fit: 0.88,
		coverage_quality: 1.0,
		validation_support: 0.72
	},
	anthropic: {
		label: 'Anthropic observed usage',
		recency: 0.98,
		construct_fit: 0.78,
		coverage_quality: 0.9,
		validation_support: 0.68
	},
	eloundou: {
		label: 'Eloundou GPT exposure',
		recency: 0.86,
		construct_fit: 0.82,
		coverage_quality: 0.84,
		validation_support: 0.66
	},
	ilo: {
		label: 'ILO refined occupational exposure',
		recency: 0.94,
		construct_fit: 0.9,
		coverage_quality: 0.78,
		validation_support: 0.74
	}
} as const;

export type ExposureSourceKey = keyof typeof EXPOSURE_SOURCE_METADATA;

export function getExposureSourceReliability(source: ExposureSourceKey): number {
	const metadata = EXPOSURE_SOURCE_METADATA[source];
	return (
		metadata.recency * EXPOSURE_SOURCE_RELIABILITY_COMPONENT_WEIGHTS.recency +
		metadata.construct_fit * EXPOSURE_SOURCE_RELIABILITY_COMPONENT_WEIGHTS.construct_fit +
		metadata.coverage_quality * EXPOSURE_SOURCE_RELIABILITY_COMPONENT_WEIGHTS.coverage_quality +
		metadata.validation_support * EXPOSURE_SOURCE_RELIABILITY_COMPONENT_WEIGHTS.validation_support
	);
}

export function normalizeExposureSourceWeights(
	sources: ExposureSourceKey[]
): Partial<Record<ExposureSourceKey, number>> {
	if (sources.length === 0) return {};
	const reliabilities = sources.map(source => [source, getExposureSourceReliability(source)] as const);
	const totalReliability = reliabilities.reduce((sum, [, reliability]) => sum + reliability, 0);
	if (totalReliability <= 0) {
		const fallbackWeight = 1 / sources.length;
		return Object.fromEntries(sources.map(source => [source, fallbackWeight])) as Partial<
			Record<ExposureSourceKey, number>
		>;
	}
	return Object.fromEntries(
		reliabilities.map(([source, reliability]) => [source, reliability / totalReliability])
	) as Partial<Record<ExposureSourceKey, number>>;
}

export const SIGNAL_AGREEMENT_SCORES = {
	consensus_high: 0.95,
	consensus_low: 0.95,
	aligned_mid: 0.85,
	divergent: 0.45,
	insufficient_data: 0.25
} as const;

export const SENSITIVITY_SCORES = {
	stable: 0.85,
	watch: 0.65,
	sensitive: 0.4
} as const;

export const CONFIDENCE_PENALTIES = {
	single_source_direct: 0.05,
	single_source_submajor_fallback: 0.08,
	single_source_major_fallback: 0.12,
	contested_signal: 0.04
} as const;

export const EXPOSURE_AGREEMENT_THRESHOLDS = {
	consensus_high_floor: 0.67,
	consensus_low_ceiling: 0.33,
	aligned_spread_max: 0.18,
	divergent_spread_min: 0.28
} as const;

export type ExposureAgreement =
	| 'consensus_high'
	| 'consensus_low'
	| 'aligned_mid'
	| 'divergent'
	| 'insufficient_data';

export function classifyExposureAgreement(values: number[]): ExposureAgreement {
	if (values.length < 2) return 'insufficient_data';
	const max = Math.max(...values);
	const min = Math.min(...values);
	const spread = max - min;
	const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

	if (spread >= EXPOSURE_AGREEMENT_THRESHOLDS.divergent_spread_min) return 'divergent';
	if (
		spread <= EXPOSURE_AGREEMENT_THRESHOLDS.aligned_spread_max &&
		mean >= EXPOSURE_AGREEMENT_THRESHOLDS.consensus_high_floor
	) {
		return 'consensus_high';
	}
	if (
		spread <= EXPOSURE_AGREEMENT_THRESHOLDS.aligned_spread_max &&
		mean <= EXPOSURE_AGREEMENT_THRESHOLDS.consensus_low_ceiling
	) {
		return 'consensus_low';
	}
	return 'aligned_mid';
}

export const SIGNAL_CONFLICT_THRESHOLDS = {
	high_risk_floor: 0.25,
	low_risk_ceiling: 0.15,
	large_positive_anthropic_gap: 0.2
} as const;

// ============================================
// AUGMENTATION BANDS
// ============================================

export const AUGMENTATION_THRESHOLDS = {
	very_high: 0.8,
	high: 0.6,
	moderate: 0.4,
	low: 0.2
	// below 0.2 = very_low
} as const;

// ============================================
// SENIORITY MODIFIERS
// ============================================

/**
 * Seniority modifiers — calibrated based on Stanford DEL (2025):
 * - Ages 22-25 in AI-exposed occupations: 16% relative employment decline
 * - Ages 30+ in same occupations: 6-12% growth
 * - Effects concentrated in automation-prone occupations
 * Asymmetric: junior penalty (0.14) > senior bonus (0.10) per empirical data
 */
export const SENIORITY_MODIFIERS = {
	junior: { exposure_adj: 0.14, bottleneck_adj: -0.12 },
	mid: { exposure_adj: 0, bottleneck_adj: 0 },
	senior: { exposure_adj: -0.10, bottleneck_adj: 0.12 }
} as const;

// ============================================
// SITE CONFIG — project identity and URLs
// ============================================

export const SITE = {
	name: 'AI Work Index',
	shortName: 'AIWorkIndex',
	description: 'AI Work Index — How will AI affect your job in Singapore?',
	url: 'https://aiworkindex.com',
	github: 'https://github.com/kirso/aiworkindex',
	author: 'Kirill So',
	authorUrl: 'https://www.linkedin.com/in/kirso/'
} as const;

// ============================================
// DATA VINTAGE — update when data sources change
// ============================================

export const DATA_VINTAGE = {
	/** MOM wage data year */
	wages: '2024',
	/** Demand signal sources */
	demand_signals: 'SOL 2026 + Jobs in Demand 2025',
	/** Labour market report period */
	labour_monitor: 'Q4 2025 full',
	/** AIOE index year */
	aioe: '2021',
	/** Anthropic Economic Index date */
	anthropic: 'January 2026',
	/** Model version */
	model_version: 'V5',
	/** Last scoring run date */
	last_updated: '2026-03-30',
	/** Occupation count */
	occupation_count: 562,
	/** Synthetic role count */
	role_count: 88,
	/** Validation check count */
	validation_checks: 167,
	/** Page count */
	page_count: 672
} as const;

// ============================================
// MARKET MODIFIER CONSTANTS
// ============================================

export const MARKET_CONSTANTS = {
	/** Weight of market momentum vs occupation scarcity */
	momentum_weight: 0.6,
	scarcity_weight: 0.4,
	/** When occupation-level industry footprint data exists, weight it above the group employment prior. */
	industry_footprint_employment_weight: 0.65,
	/** Logistic calibration used for latent percentile shifts in the forecast layer. */
	percentile_shift_calibration: 4.1097,
	/** Maximum market modifier reduction */
	max_modifier_effect: 0.35,
	/** SOL demand signal bonuses */
	sol_exact_bonus: 0.15,
	sol_prefix_bonus: 0.08,
	/** Jobs in Demand bonuses */
	jid_exact_bonus: 0.10,
	jid_prefix_bonus: 0.05,
	/** Additional bonus when BOTH SOL exact AND JiD exact match — strong double demand signal */
	double_exact_bonus: 0.10,
	/** Increased max modifier effect for double-signal occupations (from 0.35 to 0.45) */
	double_exact_max_modifier: 0.45
} as const;

export const DEMAND_RESILIENCE_CONSTANTS = {
	base_weight: 0.45,
	sol_exact: 0.15,
	sol_prefix: 0.08,
	jid_exact: 0.12,
	jid_prefix: 0.06
} as const;

// ============================================
// RANKING PAGE THRESHOLDS
// ============================================

/** Thresholds used by ranking page filters — derived from model thresholds */
export const RANKING_THRESHOLDS = {
	/** High risk floor for ranking pages (matches risk_band 'high' lower bound) */
	high_risk_floor: 0.30,
	/** Low risk ceiling for "safest" rankings */
	low_risk_ceiling: 0.15,
	/** High income floor (SGD/month) for "high-paying" rankings */
	high_income_sgd: 5000
} as const;

// ============================================
// FORECAST ENGINE CONSTANTS
// ============================================

/** Variant sensitivity weights for seniority scaling */
export const VARIANT_SENSITIVITY_WEIGHTS = {
	institutional_knowledge: 0.3,
	relationship_intensity: 0.25,
	regulatory_weight: 0.25,
	real_time_coordination: 0.2
} as const;

/** Scenario effect scales for outlook computation */
export const FORECAST_CONSTANTS = {
	baseline_ai_adoption_speed: 1.0,
	baseline_employer_cost_cutting: 0.5,
	baseline_macro_backdrop: 0.0,
	baseline_sector_readiness: 0.6,
	short_run_realization_factor: 0.35,
	capability_scalar_scale: 0.25,
	scenario_high_confidence_threshold: 0.2,
	scenario_confidence_threshold: 0.8,
	adoption_effect_scale: 0.15,
	cost_effect_scale: 0.1,
	macro_effect_scale: 0.08,
	sector_effect_scale: 0.05
} as const;

/** Labour market effect sizes for outlook adjustments */
export const LABOUR_MARKET_EFFECTS = {
	vacancy_strong_bonus: -0.08,
	vacancy_moderate_bonus: -0.04,
	vacancy_decline_penalty: 0.06,
	hiring_positive_bonus: -0.05,
	hiring_negative_penalty: 0.04,
	retrenchment_low_bonus: -0.05,
	retrenchment_high_penalty: 0.05,
	reentry_high_bonus: -0.06,
	reentry_low_penalty: 0.04
} as const;
