/**
 * Transition Capacity — Computes how feasible it is to move from one occupation to another.
 *
 * 6 sub-components:
 * 1. archetype_similarity — same archetype family = easier
 * 2. skill_overlap — shared SSOC prefix + same O*NET job zone tier
 * 3. wage_preservation — target wage relative to source wage
 * 4. demand_strength — target occupation's market resilience
 * 5. risk_improvement — how much net_risk drops
 * 6. credential_gap — proxy from education-level distance
 */

import type { Occupation } from './index';
import { classifyArchetype } from './role-archetypes';

export interface TransitionScore {
	from_ssoc: string;
	to_ssoc: string;
	to_title: string;
	archetype_similarity: number;
	skill_overlap: number;
	wage_preservation: number;
	demand_strength: number;
	risk_improvement: number;
	credential_gap: number;
	composite: number;
	label: 'easy' | 'moderate' | 'stretch' | 'difficult';
	observed_transition_rate?: number | null;
	observed_wage_delta?: number | null;
	observed_training_duration_months?: number | null;
	observed_source?: string | null;
	observed_vintage?: string | null;
}

/**
 * Compare archetypes for similarity. Same = 1.0, related = 0.5, different = 0.
 */
function archetypeSimilarity(fromOcc: Occupation, toOcc: Occupation): number {
	const fromArch = classifyArchetype(fromOcc.ssoc, fromOcc.title, fromOcc.major_group);
	const toArch = classifyArchetype(toOcc.ssoc, toOcc.title, toOcc.major_group);

	if (fromArch === toArch) return 1.0;

	// Related archetype families
	const families: Record<string, string[]> = {
		tech: ['software_engineering', 'data_analytics', 'general_technical'],
		business: ['product_strategy', 'sales_gtm', 'operations_logistics', 'general_professional'],
		people: ['people_recruiting', 'teaching_learning', 'service_hospitality'],
		creative: ['writing_editorial', 'design_creative'],
		regulated: ['finance_investing', 'legal_compliance', 'healthcare_clinical']
	};

	for (const group of Object.values(families)) {
		if (group.includes(fromArch) && group.includes(toArch)) return 0.5;
	}

	return 0.0;
}

/**
 * Skill overlap from SSOC prefix matching.
 * Same 4-digit prefix = 0.8, same 3-digit = 0.5, same 2-digit = 0.3, different = 0.
 */
function skillOverlap(fromSsoc: string, toSsoc: string): number {
	if (fromSsoc.substring(0, 4) === toSsoc.substring(0, 4)) return 0.8;
	if (fromSsoc.substring(0, 3) === toSsoc.substring(0, 3)) return 0.5;
	if (fromSsoc.substring(0, 2) === toSsoc.substring(0, 2)) return 0.3;
	return 0.0;
}

/**
 * Wage preservation: 1.0 if target pays >= source, scales down below.
 */
function wagePreservation(fromWage: number, toWage: number): number {
	if (toWage >= fromWage) return 1.0;
	const ratio = toWage / fromWage;
	return Math.max(0, ratio);
}

/**
 * Demand strength from target's market resilience (already 0-1).
 */
function demandStrength(toOcc: Occupation): number {
	return toOcc.market.market_resilience;
}

/**
 * Risk improvement: how much net_risk drops. Capped at [0, 1].
 */
function riskImprovement(fromRisk: number, toRisk: number): number {
	const delta = fromRisk - toRisk;
	if (delta <= 0) return 0;
	// Normalize: going from 0.5 to 0.0 = 1.0
	return Math.min(1.0, delta / 0.5);
}

/**
 * Credential gap proxy: difference in education levels when available.
 * Same tier = 1.0, adjacent = 0.7, two steps = 0.4, otherwise = 0.2.
 */
function credentialGap(fromEducation?: number, toEducation?: number): number {
	if (fromEducation == null || toEducation == null) return 0.6;
	const diff = Math.abs(fromEducation - toEducation);
	if (diff === 0) return 1.0;
	if (diff <= 1) return 0.7;
	if (diff <= 2) return 0.4;
	return 0.2;
}

function transitionLabel(composite: number): TransitionScore['label'] {
	if (composite >= 0.7) return 'easy';
	if (composite >= 0.5) return 'moderate';
	if (composite >= 0.3) return 'stretch';
	return 'difficult';
}

/**
 * Compute the transition score from one occupation to another.
 */
export function computeTransitionScore(from: Occupation, to: Occupation): TransitionScore {
	const arch = archetypeSimilarity(from, to);
	const skill = skillOverlap(from.ssoc, to.ssoc);
	const wage = wagePreservation(from.gross_wage_median, to.gross_wage_median);
	const demand = demandStrength(to);
	const risk = riskImprovement(from.net_risk, to.net_risk);
	const cred = credentialGap(from.education_level, to.education_level);

	const composite =
		0.20 * arch +
		0.20 * skill +
		0.15 * wage +
		0.20 * demand +
		0.15 * risk +
		0.10 * cred;

	return {
		from_ssoc: from.ssoc,
		to_ssoc: to.ssoc,
		to_title: to.title,
		archetype_similarity: arch,
		skill_overlap: skill,
		wage_preservation: wage,
		demand_strength: demand,
		risk_improvement: risk,
		credential_gap: cred,
		composite,
		label: transitionLabel(composite),
		observed_transition_rate: null,
		observed_wage_delta: null,
		observed_training_duration_months: null,
		observed_source: null,
		observed_vintage: null
	};
}

/**
 * Find the best transition targets for a given occupation.
 * Filters out the source occupation and returns sorted by composite score.
 */
export function findBestTransitions(
	from: Occupation,
	allOccupations: Occupation[],
	limit: number = 5
): TransitionScore[] {
	return allOccupations
		.filter((o) => o.ssoc !== from.ssoc)
		.map((to) => computeTransitionScore(from, to))
		.sort((a, b) => b.composite - a.composite)
		.slice(0, limit);
}

/**
 * Categorize transitions into labeled groups for display.
 */
export function categorizeTransitions(transitions: TransitionScore[]): {
	easierSwitch: TransitionScore[];
	betterPay: TransitionScore[];
	lowerRisk: TransitionScore[];
	strongDemand: TransitionScore[];
} {
	const sorted = [...transitions].sort((a, b) => b.composite - a.composite);
	return {
		easierSwitch: sorted
			.filter((t) => t.archetype_similarity >= 0.5 && t.skill_overlap >= 0.3)
			.slice(0, 3),
		betterPay: sorted
			.filter((t) => t.wage_preservation >= 1.0)
			.sort((a, b) => b.wage_preservation - a.wage_preservation)
			.slice(0, 3),
		lowerRisk: sorted
			.filter((t) => t.risk_improvement > 0)
			.sort((a, b) => b.risk_improvement - a.risk_improvement)
			.slice(0, 3),
		strongDemand: sorted
			.filter((t) => t.demand_strength >= 0.6)
			.sort((a, b) => b.demand_strength - a.demand_strength)
			.slice(0, 3)
	};
}
