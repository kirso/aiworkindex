import type { Occupation, ImpactType } from './index';
import type { ArchetypeContent } from './role-archetypes';
import type { ScoredRole } from './synthetic-roles';
import { getPersonalizedContent, blendArchetypes, classifyArchetype } from './role-archetypes';
import { findBestTransitions, categorizeTransitions, type TransitionScore } from './transition-capacity';
import { archetypeOverlayDefaults, generateWorkflowNarrative } from './workflow-overlay';

export interface OccupationDetailStructural {
	riskPercentile: number;
	wageVsNational: string;
	summaryText: string;
	personalizedContent: ArchetypeContent;
	workflowNarrative: string | null;
	transitions: ReturnType<typeof categorizeTransitions>;
	topTransitions: TransitionScore[];
}

export interface RolePrimaryMatch {
	ssoc: string;
	title: string;
	risk: number;
	riskDiff: number;
}

export interface RoleDetailStructural {
	riskPercentile: number;
	summaryText: string;
	personalizedContent: ArchetypeContent;
	workflowNarrative: string | null;
	transitions: ReturnType<typeof categorizeTransitions> | null;
	primaryMatch: RolePrimaryMatch | null;
}

function describeExposureLevel(value: number): 'low' | 'moderate' | 'high' {
	return value > 0.66 ? 'high' : value >= 0.33 ? 'moderate' : 'low';
}

function buildImpactSummary(title: string, impactType: ImpactType, exposure: number): string {
	const level = describeExposureLevel(exposure);

	switch (impactType) {
		case 'ai_leveraged':
			return `This model suggests AI is more likely to enhance ${title} than replace it. ${level} exposure, but strong human bottlenecks mean AI augments rather than substitutes.`;
		case 'at_risk':
			return `${title} faces significant structural AI displacement pressure. ${level} exposure with few human bottlenecks to slow adoption.`;
		case 'stable':
			return `This model suggests AI is unlikely to significantly disrupt ${title}. ${level} exposure with limited overlap across core tasks.`;
		case 'mixed':
			return `${title} shows mixed AI signals: high exposure, but also strong human dependencies and organizational friction.`;
	}
}

function getNationalMedianWage(allOccupations: Occupation[]): number {
	const allWages = allOccupations.map((occupation) => occupation.gross_wage_median).sort((a, b) => a - b);
	return allWages[Math.floor(allWages.length / 2)]!;
}

function describeWageVsNational(wage: number, nationalMedian: number): string {
	const diff = wage - nationalMedian;
	const pct = Math.round((Math.abs(diff) / nationalMedian) * 100);
	if (pct < 3) return 'near median';
	return diff > 0 ? `${pct}% above median` : `${pct}% below median`;
}

function getRiskPercentile(targetRisk: number, allOccupations: Occupation[]): number {
	if (allOccupations.length === 0) return 0;
	const lowerOrEqual = allOccupations.filter((occupation) => occupation.net_risk <= targetRisk).length;
	return Math.round((lowerOrEqual / allOccupations.length) * 100);
}

function buildOccupationWorkflowNarrative(occupation: Occupation): string | null {
	if (occupation.workflow_overlay) return generateWorkflowNarrative(occupation.workflow_overlay);
	const archetype = classifyArchetype(occupation.ssoc, occupation.title, occupation.major_group);
	const overlay = archetypeOverlayDefaults[archetype];
	return overlay ? generateWorkflowNarrative(overlay) : null;
}

function buildRoleWorkflowNarrative(scored: ScoredRole): string | null {
	if (scored.workflow_narrative) return scored.workflow_narrative;
	const archetype = classifyArchetype('00000', scored.title, '');
	const overlay = archetypeOverlayDefaults[archetype];
	return overlay ? generateWorkflowNarrative(overlay) : null;
}

export function buildOccupationDetailStructural(
	occupation: Occupation,
	allOccupations: Occupation[]
): OccupationDetailStructural {
	const nationalMedian = getNationalMedianWage(allOccupations);
	const allTransitions = findBestTransitions(occupation, allOccupations, 12);

	return {
		riskPercentile: getRiskPercentile(occupation.net_risk, allOccupations),
		wageVsNational: describeWageVsNational(occupation.gross_wage_median, nationalMedian),
		summaryText: buildImpactSummary(occupation.title, occupation.impact_type, occupation.exposure),
		personalizedContent: getPersonalizedContent(
			occupation.ssoc,
			occupation.title,
			occupation.major_group
		),
		workflowNarrative: buildOccupationWorkflowNarrative(occupation),
		transitions: categorizeTransitions(allTransitions),
		topTransitions: findBestTransitions(occupation, allOccupations, 8)
	};
}

export function buildRoleDetailStructural(
	scored: ScoredRole,
	allOccupations: Occupation[],
	primaryOccupation: Occupation | null
): RoleDetailStructural {
	const transitions = primaryOccupation
		? categorizeTransitions(findBestTransitions(primaryOccupation, allOccupations, 12))
		: null;

	const personalizedContent = blendArchetypes(
		scored.title,
		scored.components
			.filter((component): component is typeof component & { occupation: Occupation } => component.occupation !== null)
			.map((component) => ({
				ssoc: component.ssoc,
				title: component.occupation.title,
				majorGroup: component.occupation.major_group,
				weight: component.weight
			}))
	);

	return {
		riskPercentile: getRiskPercentile(scored.net_risk, allOccupations),
		summaryText: buildImpactSummary(scored.title, scored.impact_type, scored.exposure),
		personalizedContent,
		workflowNarrative: buildRoleWorkflowNarrative(scored),
		transitions,
		primaryMatch: primaryOccupation
			? {
					ssoc: primaryOccupation.ssoc,
					title: primaryOccupation.title,
					risk: primaryOccupation.net_risk,
					riskDiff: Math.abs(scored.net_risk - primaryOccupation.net_risk)
				}
			: null
	};
}
