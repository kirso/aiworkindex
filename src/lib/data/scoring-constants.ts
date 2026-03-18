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
 * Validated by: scripts/validate.ts (48 checks)
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
 * - at_risk: net_risk >= 0.25 AND augmentation < 0.12 AND no demand signal
 * - mixed: net_risk >= 0.25 AND (augmentation >= 0.12 OR demand signal)
 * - stable: net_risk < 0.25 AND augmentation < 0.12
 */
export function classifyImpactType(
	displacement: number,
	augmentation: number,
	hasDemandSignal: boolean = false
): ImpactType {
	const highDisplacement = displacement >= IMPACT_TYPE_THRESHOLDS.displacement_threshold;
	const highAugmentation = augmentation >= IMPACT_TYPE_THRESHOLDS.augmentation_threshold;

	if (highDisplacement && hasDemandSignal && !highAugmentation) return 'mixed';
	if (highDisplacement && !highAugmentation) return 'at_risk';
	if (highDisplacement && highAugmentation) return 'mixed';
	if (!highDisplacement && highAugmentation) return 'ai_leveraged';
	return 'stable';
}

// ============================================
// CONFIDENCE LEVELS
// ============================================

export const CONFIDENCE_THRESHOLDS = {
	high: 0.7,
	medium: 0.4
	// below 0.4 = low
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

export const SENIORITY_MODIFIERS = {
	junior: { exposure_adj: 0.12, bottleneck_adj: -0.1 },
	mid: { exposure_adj: 0, bottleneck_adj: 0 },
	senior: { exposure_adj: -0.1, bottleneck_adj: 0.12 }
} as const;

// ============================================
// SITE CONFIG — project identity and URLs
// ============================================

export const SITE = {
	name: 'AI Work Index',
	shortName: 'AIWorkIndex',
	description: 'Singapore AI Occupation Index — How will AI affect your job?',
	url: 'https://aiworkindex.pages.dev',
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
	labour_monitor: 'Q3 2025 full + Q4 2025 advance',
	/** AIOE index year */
	aioe: '2021',
	/** Anthropic Economic Index date */
	anthropic: 'January 2026',
	/** Model version */
	model_version: 'V3.1',
	/** Last scoring run date */
	last_updated: '2026-03-18',
	/** Occupation count */
	occupation_count: 562,
	/** Synthetic role count */
	role_count: 80,
	/** Validation check count */
	validation_checks: 48,
	/** Page count */
	page_count: 661
} as const;

// ============================================
// MARKET MODIFIER CONSTANTS
// ============================================

export const MARKET_CONSTANTS = {
	/** Weight of market momentum vs occupation scarcity */
	momentum_weight: 0.6,
	scarcity_weight: 0.4,
	/** Maximum market modifier reduction */
	max_modifier_effect: 0.35,
	/** SOL demand signal bonuses */
	sol_exact_bonus: 0.15,
	sol_prefix_bonus: 0.08,
	/** Jobs in Demand bonuses */
	jid_exact_bonus: 0.10,
	jid_prefix_bonus: 0.05
} as const;
