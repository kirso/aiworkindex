/**
 * Forecast Engine — Rule-based v1 for occupation/role outlooks.
 *
 * Produces directional signals (not point predictions) across 4 dimensions:
 * displacement_pressure, augmentation_upside, demand_outlook, wage_pressure
 *
 * Three scenario presets: Conservative, Base, Fast Adoption
 */

import type { Occupation } from './index';
import {
	VARIANT_SENSITIVITY_WEIGHTS,
	FORECAST_CONSTANTS,
	LABOUR_MARKET_EFFECTS
} from './scoring-constants';
import { applyPercentileShift, computeNetRisk, clamp01 } from './methodology-core';

export type OutlookStatus = 'resilient' | 'watch' | 'under_pressure' | 'at_risk';
export type Direction = 'improving' | 'stable' | 'worsening';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ScenarioPreset = 'conservative' | 'base' | 'fast_adoption';
export type SeniorityLevel = 'junior' | 'mid' | 'senior';

export interface ScenarioParams {
	/** AI adoption speed multiplier (0.5 = slow, 1.0 = baseline, 2.0 = rapid) */
	ai_adoption_speed: number;
	/** Employer cost-cutting intensity (0.0 = none, 1.0 = aggressive) */
	employer_cost_cutting: number;
	/** Macro backdrop (-1 = recession, 0 = neutral, 1 = growth) */
	macro_backdrop: number;
	/** Sector readiness for AI (0 = lagging, 1 = leading) */
	sector_readiness: number;
	/** Experience level adjustment (optional — defaults to 'mid' = no adjustment) */
	seniority?: SeniorityLevel;
}

/**
 * Seniority adjustment multipliers, grounded in research:
 * - Anthropic Economic Index (2026): 14% drop in job-finding for ages 22-25 in AI-exposed occupations
 * - Stanford "Canaries in the Coal Mine" (2025): entry-level faces disproportionate displacement
 * - Brynjolfsson et al. (2023): biggest AI productivity gains among junior workers (leveling effect)
 * - Noy & Zhang (2023): AI narrows gap between experienced and novice writers
 *
 * The adjustment scales with the occupation's variant_sensitivity from workflow overlay.
 * High variant_sensitivity = seniority matters more (e.g., software engineering).
 * Low variant_sensitivity = seniority matters less (e.g., truck driver).
 */
export const seniorityAdjustments: Record<
	SeniorityLevel,
	{ exposure: number; bottleneck: number; label: string }
> = {
	junior: { exposure: 0.14, bottleneck: -0.12, label: 'Entry-level / Junior' },
	mid: { exposure: 0, bottleneck: 0, label: 'Mid-career' },
	senior: { exposure: -0.10, bottleneck: 0.12, label: 'Senior / Lead' }
};

export interface OutlookResult {
	displacement_pressure: OutlookStatus;
	augmentation_upside: OutlookStatus;
	demand_outlook: OutlookStatus;
	wage_pressure: OutlookStatus;
	direction_12m: Direction;
	confidence: ConfidenceLevel;
	summary: string;
}

export interface ForecastScoreSnapshot {
	structuralRisk: number;
	nearTermRisk: number;
	displacementScore: number;
	augmentationScore: number;
	demandScore: number;
	wageScore: number;
	direction: Direction;
	confidence: ConfidenceLevel;
}

export const scenarioPresets: Record<ScenarioPreset, { label: string; description: string; params: ScenarioParams }> = {
	conservative: {
		label: 'Conservative',
		description: 'Slow AI adoption, strong macro, employer caution',
		params: {
			ai_adoption_speed: 0.6,
			employer_cost_cutting: 0.2,
			macro_backdrop: 0.5,
			sector_readiness: 0.4
		}
	},
	base: {
		label: 'Base Case',
		description: 'Current trajectory continues',
		params: {
			ai_adoption_speed: 1.0,
			employer_cost_cutting: 0.5,
			macro_backdrop: 0.0,
			sector_readiness: 0.6
		}
	},
	fast_adoption: {
		label: 'Fast Adoption',
		description: 'Rapid AI deployment, cost pressure, mixed macro',
		params: {
			ai_adoption_speed: 1.8,
			employer_cost_cutting: 0.8,
			macro_backdrop: -0.3,
			sector_readiness: 0.8
		}
	}
};

function classifyStatus(score: number): OutlookStatus {
	if (score <= 0.2) return 'resilient';
	if (score <= 0.45) return 'watch';
	if (score <= 0.7) return 'under_pressure';
	return 'at_risk';
}

function classifyDirection(delta: number): Direction {
	if (delta < -0.03) return 'improving';
	if (delta > 0.03) return 'worsening';
	return 'stable';
}

function computeNearTermRisk(
	structuralRisk: number,
	scenario: ScenarioParams
): number {
	const adoptionScalar =
		scenario.ai_adoption_speed / FORECAST_CONSTANTS.baseline_ai_adoption_speed;
	const capabilityScalar =
		1 +
		(scenario.sector_readiness - FORECAST_CONSTANTS.baseline_sector_readiness) *
			FORECAST_CONSTANTS.capability_scalar_scale;
	const costScalar =
		1 +
		(scenario.employer_cost_cutting - FORECAST_CONSTANTS.baseline_employer_cost_cutting) *
			FORECAST_CONSTANTS.cost_effect_scale;
	const macroScalar =
		1 -
		(scenario.macro_backdrop - FORECAST_CONSTANTS.baseline_macro_backdrop) *
			FORECAST_CONSTANTS.macro_effect_scale;

	return clamp01(
		structuralRisk *
			FORECAST_CONSTANTS.short_run_realization_factor *
			adoptionScalar *
			capabilityScalar *
			costScalar *
			macroScalar
	);
}

/**
 * Compute outlook for an occupation under a given scenario.
 * Incorporates real labour market data (vacancy, hiring, retrenchment, re-entry)
 * when available, so the Now/12M tabs reflect actual conditions — not just
 * a repackaged version of the structural score.
 */
export function computeOutlook(occ: Occupation, scenario: ScenarioParams): OutlookResult {
	const scores = computeForecastScores(occ, scenario);

	// Summary
	const status = classifyStatus(scores.displacementScore);
	const summaries: Record<OutlookStatus, string> = {
		resilient: `${occ.title} appears resilient under this scenario. Strong human bottlenecks and/or market demand provide substantial buffer against AI displacement.`,
		watch: `${occ.title} should be monitored. While not facing immediate pressure, shifts in AI capability or employer strategy could change the picture.`,
		under_pressure: `${occ.title} faces growing pressure under this scenario. AI capabilities overlap significantly with core tasks, and market buffers are limited.`,
		at_risk: `${occ.title} faces significant displacement risk under this scenario. Core tasks are highly automatable with limited offsetting demand or bottlenecks.`
	};

	return {
		displacement_pressure: classifyStatus(scores.displacementScore),
		augmentation_upside: classifyStatus(1 - scores.augmentationScore), // invert: high aug = resilient
		demand_outlook: classifyStatus(scores.demandScore),
		wage_pressure: classifyStatus(scores.wageScore),
		direction_12m: scores.direction,
		confidence: scores.confidence,
		summary: summaries[status]
	};
}

export function computeForecastScores(
	occ: Occupation,
	scenario: ScenarioParams
): ForecastScoreSnapshot {
	// Base structural scores
	const structuralRisk = occ.net_risk;
	const baseAugmentation = occ.augmentation;
	const baseDemand = occ.market.market_resilience;
	const lm = occ.labour_monitor;
	const baselineNearTermRisk = computeNearTermRisk(occ.net_risk, scenarioPresets.base.params);

	// Scenario adjustments
	const macroEffect =
		-(scenario.macro_backdrop - FORECAST_CONSTANTS.baseline_macro_backdrop) *
		FORECAST_CONSTANTS.macro_effect_scale;
	const sectorEffect =
		(scenario.sector_readiness - FORECAST_CONSTANTS.baseline_sector_readiness) *
		FORECAST_CONSTANTS.sector_effect_scale;

	// --- Seniority adjustment (scales with variant_sensitivity) ---
	let seniorityExposureAdj = 0;
	let seniorityBottleneckAdj = 0;
	const seniority = scenario.seniority ?? 'mid';
	if (seniority !== 'mid') {
		// Use variant_sensitivity from workflow overlay if available, else default 0.5
		const varSens = occ.workflow_overlay
			? VARIANT_SENSITIVITY_WEIGHTS.institutional_knowledge * occ.workflow_overlay.institutional_knowledge +
				VARIANT_SENSITIVITY_WEIGHTS.relationship_intensity * occ.workflow_overlay.relationship_intensity +
				VARIANT_SENSITIVITY_WEIGHTS.regulatory_weight * occ.workflow_overlay.regulatory_weight +
				VARIANT_SENSITIVITY_WEIGHTS.real_time_coordination * occ.workflow_overlay.real_time_coordination
			: 0.5;

		const adj = seniorityAdjustments[seniority];
		seniorityExposureAdj = adj.exposure * varSens;
		seniorityBottleneckAdj = adj.bottleneck * varSens;
	}

	// --- Labour market adjustments (only when real data exists) ---
	let labourDemandAdj = 0;
	let labourDisplacementAdj = 0;
	let labourWageAdj = 0;

	if (lm) {
		// Vacancy trend: positive YoY growth improves demand outlook
		if (lm.vacancy.trend_4q_pct > 5) labourDemandAdj += LABOUR_MARKET_EFFECTS.vacancy_strong_bonus;
		else if (lm.vacancy.trend_4q_pct > 0) labourDemandAdj += LABOUR_MARKET_EFFECTS.vacancy_moderate_bonus;
		else if (lm.vacancy.trend_4q_pct < -5) labourDemandAdj += LABOUR_MARKET_EFFECTS.vacancy_decline_penalty;

		// Hiring: positive net pressure (recruitment > resignation) improves demand
		if (lm.hiring && lm.hiring.net_pressure > 0) labourDemandAdj += LABOUR_MARKET_EFFECTS.hiring_positive_bonus;
		else if (lm.hiring && lm.hiring.net_pressure < -0.3) labourDemandAdj += LABOUR_MARKET_EFFECTS.hiring_negative_penalty;

		// Retrenchment: low incidence reduces displacement pressure
		if (lm.retrenchment?.incidence_per_1000 != null) {
			if (lm.retrenchment.incidence_per_1000 < 2) labourDisplacementAdj += LABOUR_MARKET_EFFECTS.retrenchment_low_bonus;
			else if (lm.retrenchment.incidence_per_1000 > 4) labourDisplacementAdj += LABOUR_MARKET_EFFECTS.retrenchment_high_penalty;
		}

		// Re-entry: high 12-month re-entry rate reduces wage pressure
		if (lm.re_entry?.rate_12m != null) {
			if (lm.re_entry.rate_12m > 70) labourWageAdj += LABOUR_MARKET_EFFECTS.reentry_high_bonus;
			else if (lm.re_entry.rate_12m < 50) labourWageAdj += LABOUR_MARKET_EFFECTS.reentry_low_penalty;
		}
	}

	// Displacement pressure: seniority-adjusted exposure × (1 - seniority-adjusted bottleneck)
	const adjExposure = applyPercentileShift(occ.exposure, seniorityExposureAdj);
	const adjBottleneck = applyPercentileShift(occ.bottleneck, seniorityBottleneckAdj);
	const seniorityDisplacement = computeNetRisk({
		exposure: adjExposure,
		bottleneck: adjBottleneck,
		market_resilience: occ.market.market_resilience
	});
	const nearTermRisk = computeNearTermRisk(seniorityDisplacement, scenario);
	const baselineDisplacementScore = clamp01(baselineNearTermRisk + labourDisplacementAdj);
	const displacementScore = clamp01(
		nearTermRisk + labourDisplacementAdj
	);

	// Augmentation upside: higher with faster adoption if bottleneck is high
	const adoptionEffect =
		(scenario.ai_adoption_speed - FORECAST_CONSTANTS.baseline_ai_adoption_speed) *
		FORECAST_CONSTANTS.adoption_effect_scale;
	const augScore = clamp01(
		baseAugmentation + (adjBottleneck > 0.5 ? adoptionEffect * 0.5 : -adoptionEffect * 0.3)
	);

	// Demand outlook: based on market resilience + macro + actual vacancy/hiring signals
	const demandScore = clamp01(1 - baseDemand + macroEffect - sectorEffect + labourDemandAdj);

	// Wage pressure: displacement erodes wages, demand supports them, re-entry rate moderates
	const wageScore = clamp01(displacementScore * 0.6 + (1 - baseDemand) * 0.4 + labourWageAdj);

	// 12-month direction: compare against the baseline near-term path, not the long-run structural score.
	const delta = displacementScore - baselineDisplacementScore;
	const direction = classifyDirection(delta);

	// Confidence: lower if scenario deviates heavily from base
	const scenarioDeviation =
		Math.abs(scenario.ai_adoption_speed - FORECAST_CONSTANTS.baseline_ai_adoption_speed) +
		Math.abs(
			scenario.employer_cost_cutting - FORECAST_CONSTANTS.baseline_employer_cost_cutting
		) +
		Math.abs(scenario.macro_backdrop - FORECAST_CONSTANTS.baseline_macro_backdrop) +
		Math.abs(scenario.sector_readiness - FORECAST_CONSTANTS.baseline_sector_readiness);
	const confidence: ConfidenceLevel =
		scenarioDeviation <= FORECAST_CONSTANTS.scenario_high_confidence_threshold
			? 'high'
			: scenarioDeviation < FORECAST_CONSTANTS.scenario_confidence_threshold
				? 'medium'
				: 'low';

	return {
		structuralRisk,
		nearTermRisk,
		displacementScore,
		augmentationScore: augScore,
		demandScore,
		wageScore,
		direction,
		confidence
	};
}

export const outlookStatusLabels: Record<OutlookStatus, string> = {
	resilient: 'Resilient',
	watch: 'Watch',
	under_pressure: 'Under Pressure',
	at_risk: 'At Risk'
};

export const outlookStatusColors: Record<OutlookStatus, string> = {
	resilient: 'text-risk-very-low',
	watch: 'text-risk-moderate',
	under_pressure: 'text-risk-high',
	at_risk: 'text-risk-very-high'
};

export const directionLabels: Record<Direction, string> = {
	improving: 'Improving',
	stable: 'Stable',
	worsening: 'Worsening'
};

export const directionColors: Record<Direction, string> = {
	improving: 'text-risk-very-low',
	stable: 'text-foreground',
	worsening: 'text-risk-very-high'
};
