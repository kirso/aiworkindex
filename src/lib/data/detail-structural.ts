import type { Occupation } from './index';
import type { BlendedOnetEnrichment, OnetEnrichmentEntry } from './onet-enrichment';
import type { ArchetypeContent } from './role-archetypes';
import type { ScoredRole } from './synthetic-roles';
import { getPersonalizedContent, blendArchetypes, classifyArchetype } from './role-archetypes';
import { getOnetEnrichmentForOccupation, buildRoleOnetEnrichment } from './onet-enrichment';
import { findBestTransitions, categorizeTransitions, type TransitionScore } from './transition-capacity';
import { archetypeOverlayDefaults, generateWorkflowNarrative } from './workflow-overlay';
import majorGroupsData from './major-groups.json';

const groupLabelMap = new Map<string, string>(
	majorGroupsData.map((g) => [g.key, g.label])
);

export interface DecisionPathway {
	to_ssoc: string;
	to_title: string;
	composite: number;
	observed_transition_rate: number | null;
	destination_quality: number | null;
	wage_preservation: number | null;
	training_ease: number | null;
	empirical_priority: number | null;
	evidence_status: 'observed_enriched' | 'heuristic_only';
}

export interface DecisionSummary {
	structuralRisk: number;
	transitionAdjustedRisk: number;
	realizedRiskProxy: number;
	adaptationCapacity: number;
	adaptationBuffer: number;
	adaptationDelta: number;
	adaptationLabel: 'strong' | 'moderate' | 'limited';
	realizedLabel: 'contained' | 'watch' | 'active';
	bestTransition: DecisionPathway | null;
	summaryText: string;
}

export interface RelatedOccupation {
	ssoc: string;
	title: string;
	net_risk: number;
	risk_band: string;
	gross_wage_median: number;
}

export interface GroupComparison {
	groupName: string;
	groupTotal: number;
	riskRankInGroup: number;
	groupMedianRisk: number;
	groupMedianWage: number;
	wageVsGroup: string;
	riskVsGroup: string;
}

export interface OccupationDetailStructural {
	riskPercentile: number;
	wageVsNational: string;
	summaryText: string;
	decision: DecisionSummary;
	personalizedContent: ArchetypeContent;
	onetEnrichment: OnetEnrichmentEntry | null;
	workflowNarrative: string | null;
	transitions: ReturnType<typeof categorizeTransitions>;
	topTransitions: TransitionScore[];
	groupComparison: GroupComparison;
	relatedOccupations: RelatedOccupation[];
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
	decision: DecisionSummary | null;
	personalizedContent: ArchetypeContent;
	onetEnrichment: BlendedOnetEnrichment | null;
	workflowNarrative: string | null;
	transitions: ReturnType<typeof categorizeTransitions> | null;
	primaryMatch: RolePrimaryMatch | null;
}

function formatOrdinal(n: number): string {
	const suffixes = ['th', 'st', 'nd', 'rd'] as const;
	const v = n % 100;
	return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? 'th');
}

function buildImpactSummary(
	occupation: Occupation,
	allOccupations: Occupation[]
): string {
	const { title, impact_type, exposure, bottleneck, net_risk } = occupation;
	const exposurePct = Math.round(exposure * 100);
	const bottleneckPct = Math.round(bottleneck * 100);
	const percentile = getRiskPercentile(net_risk, allOccupations);

	switch (impact_type) {
		case 'ai_leveraged':
			return `${title} has ${exposurePct}% AI task overlap but ${bottleneckPct}% human bottleneck protection — lower risk than ${100 - percentile}% of Singapore occupations. AI is more likely to enhance this role than replace it.`;
		case 'at_risk':
			return `${title} has ${exposurePct}% AI task overlap with only ${bottleneckPct}% human bottleneck protection — higher risk than ${percentile}% of Singapore occupations. Structural displacement pressure is significant.`;
		case 'stable':
			return `${title} has ${exposurePct}% AI task overlap and ${bottleneckPct}% human bottleneck protection — lower risk than ${100 - percentile}% of Singapore occupations. Current AI capabilities have limited overlap with core tasks.`;
		case 'mixed':
			return `${title} has ${exposurePct}% AI task overlap but ${bottleneckPct}% human bottleneck protection — at the ${formatOrdinal(percentile)} percentile across ${allOccupations.length} occupations. High exposure meets organizational friction, creating offsetting forces.`;
	}
}

function buildRoleImpactSummary(scored: ScoredRole, allOccupations: Occupation[]): string {
	const riskPct = Math.round(scored.net_risk * 100);
	const exposurePct = Math.round(scored.exposure * 100);
	const bottleneckPct = Math.round(scored.bottleneck * 100);
	const percentile = getRiskPercentile(scored.net_risk, allOccupations);
	const componentCount = scored.components.filter((c) => c.occupation !== null).length;

	switch (scored.impact_type) {
		case 'ai_leveraged':
			return `${scored.title} scores an estimated ${riskPct}% displacement risk — lower risk than ${100 - percentile}% of occupations. Blended from ${componentCount} official occupations, it combines ${exposurePct}% AI task overlap with ${bottleneckPct}% human bottleneck protection, suggesting AI is more likely to augment than replace this role.`;
		case 'at_risk':
			return `${scored.title} scores an estimated ${riskPct}% displacement risk — higher risk than ${percentile}% of occupations. Blended from ${componentCount} official occupations, ${exposurePct}% AI task overlap and only ${bottleneckPct}% human bottleneck protection create significant structural pressure.`;
		case 'stable':
			return `${scored.title} scores an estimated ${riskPct}% displacement risk — lower risk than ${100 - percentile}% of occupations. Blended from ${componentCount} official occupations, ${exposurePct}% AI task overlap and ${bottleneckPct}% bottleneck protection suggest limited disruption from current AI capabilities.`;
		case 'mixed':
			return `${scored.title} scores an estimated ${riskPct}% displacement risk — at the ${formatOrdinal(percentile)} percentile. Blended from ${componentCount} official occupations, it combines ${exposurePct}% AI task overlap with ${bottleneckPct}% human bottleneck protection, creating offsetting displacement and augmentation forces.`;
	}
}

function getNationalMedianWage(allOccupations: Occupation[]): number {
	const allWages = allOccupations.map((occupation) => occupation.gross_wage_median).sort((a, b) => a - b);
	const mid = Math.floor(allWages.length / 2);
	return allWages.length % 2 !== 0
		? allWages[mid]!
		: ((allWages[mid - 1] ?? 0) + (allWages[mid] ?? 0)) / 2;
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

function normalize01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function describeAdaptationLabel(value: number): DecisionSummary['adaptationLabel'] {
	if (value >= 0.55) return 'strong';
	if (value >= 0.35) return 'moderate';
	return 'limited';
}

function describeRealizedLabel(value: number): DecisionSummary['realizedLabel'] {
	if (value <= 0.04) return 'contained';
	if (value <= 0.09) return 'watch';
	return 'active';
}

function buildPathwayFromOccupation(
	occupation: Occupation,
	fallbackTransitions: TransitionScore[]
): DecisionPathway | null {
	if (occupation.best_transition) {
		return {
			to_ssoc: occupation.best_transition.to_ssoc,
			to_title: occupation.best_transition.to_title,
			composite: occupation.best_transition.composite,
			observed_transition_rate: occupation.best_transition.observed_transition_rate,
			destination_quality: occupation.best_transition.destination_quality,
			wage_preservation: occupation.best_transition.wage_preservation,
			training_ease: occupation.best_transition.training_ease,
			empirical_priority: occupation.best_transition.empirical_priority,
			evidence_status:
				occupation.best_transition.observed_transition_rate != null
					? 'observed_enriched'
					: 'heuristic_only'
		};
	}

	const fallback = fallbackTransitions[0];
	if (!fallback) return null;
	return {
		to_ssoc: fallback.to_ssoc,
		to_title: fallback.to_title,
		composite: fallback.composite,
		observed_transition_rate: fallback.observed_transition_rate ?? null,
		destination_quality: null,
		wage_preservation: fallback.wage_preservation,
		training_ease: 1 - fallback.credential_gap,
		empirical_priority: null,
		evidence_status:
			fallback.observed_transition_rate != null ? 'observed_enriched' : 'heuristic_only'
	};
}

function buildOccupationDecisionSummary(
	occupation: Occupation,
	fallbackTransitions: TransitionScore[]
): DecisionSummary {
	const structuralRisk = occupation.structural_risk ?? occupation.net_risk;
	const transitionAdjustedRisk = occupation.transition_adjusted_risk ?? occupation.net_risk;
	const realizedRiskProxy = occupation.realized_risk_proxy ?? occupation.net_risk;
	const adaptationCapacity = normalize01(occupation.adaptation_capacity ?? 0);
	const adaptationBuffer = normalize01(occupation.adaptation_buffer ?? 0);
	const adaptationDelta = normalize01(structuralRisk - transitionAdjustedRisk);
	const bestTransition = buildPathwayFromOccupation(occupation, fallbackTransitions);
	const adaptationLabel = describeAdaptationLabel(adaptationCapacity);
	const realizedLabel = describeRealizedLabel(realizedRiskProxy);
	const hasObservedPathway = bestTransition?.observed_transition_rate != null;
	const pathwayClause = bestTransition
		? hasObservedPathway
			? `The strongest adjacent pathway is ${bestTransition.to_title}, supported by observed mobility evidence.`
			: `The strongest adjacent pathway is ${bestTransition.to_title}, but it is still model-led rather than observed.`
		: 'No adjacent pathway stands out yet.';

	let summaryText = `${occupation.title} keeps ${Math.round(
		transitionAdjustedRisk * 100
	)}% transition-adjusted pressure after accounting for current adaptation buffers. `;
	if (adaptationLabel === 'strong') {
		summaryText += 'Adaptation room looks relatively strong. ';
	} else if (adaptationLabel === 'moderate') {
		summaryText += 'Adaptation room is present, but not decisive on its own. ';
	} else {
		summaryText += 'Adaptation room looks limited, so structural pressure remains hard to offset. ';
	}
	if (realizedLabel === 'contained') {
		summaryText += 'Near-term realized pressure still looks contained. ';
	} else if (realizedLabel === 'watch') {
		summaryText += 'Near-term realized pressure is worth watching. ';
	} else {
		summaryText += 'Near-term realized pressure is already more active than the structural headline alone suggests. ';
	}
	summaryText += pathwayClause;

	return {
		structuralRisk,
		transitionAdjustedRisk,
		realizedRiskProxy,
		adaptationCapacity,
		adaptationBuffer,
		adaptationDelta,
		adaptationLabel,
		realizedLabel,
		bestTransition,
		summaryText
	};
}

function buildRoleDecisionSummary(scored: ScoredRole): DecisionSummary | null {
	const weightedOccupations = scored.components.filter(
		(component): component is typeof component & { occupation: Occupation } => component.occupation !== null
	);
	if (weightedOccupations.length === 0) return null;

	const weightedAverage = (pick: (occupation: Occupation) => number | null | undefined): number | null => {
		let weightedSum = 0;
		let weightTotal = 0;
		for (const component of weightedOccupations) {
			const value = pick(component.occupation);
			if (value == null) continue;
			weightedSum += component.weight * value;
			weightTotal += component.weight;
		}
		return weightTotal > 0 ? weightedSum / weightTotal : null;
	};

	const candidateTransitions = new Map<
		string,
		{
			to_ssoc: string;
			to_title: string;
			support: number;
			weight: number;
			observedWeight: number;
			observedRateSum: number;
			destinationQualitySum: number;
			wagePreservationSum: number;
			trainingEaseSum: number;
			prioritySum: number;
		}
	>();

	for (const component of weightedOccupations) {
		const bestTransition = component.occupation.best_transition;
		if (!bestTransition) continue;
		const current =
			candidateTransitions.get(bestTransition.to_ssoc) ??
			{
				to_ssoc: bestTransition.to_ssoc,
				to_title: bestTransition.to_title,
				support: 0,
				weight: 0,
				observedWeight: 0,
				observedRateSum: 0,
				destinationQualitySum: 0,
				wagePreservationSum: 0,
				trainingEaseSum: 0,
				prioritySum: 0
			};
		const support =
			component.weight * (bestTransition.empirical_priority ?? bestTransition.composite ?? 0);
		current.support += support;
		current.weight += component.weight;
		current.destinationQualitySum += component.weight * bestTransition.destination_quality;
		current.wagePreservationSum += component.weight * bestTransition.wage_preservation;
		current.trainingEaseSum += component.weight * bestTransition.training_ease;
		current.prioritySum += component.weight * (bestTransition.empirical_priority ?? 0);
		if (bestTransition.observed_transition_rate != null) {
			current.observedWeight += component.weight;
			current.observedRateSum += component.weight * bestTransition.observed_transition_rate;
		}
		candidateTransitions.set(bestTransition.to_ssoc, current);
	}

	const bestTransitionCandidate = [...candidateTransitions.values()].sort(
		(a, b) => b.support - a.support
	)[0];
	const bestTransition: DecisionPathway | null = bestTransitionCandidate
		? {
				to_ssoc: bestTransitionCandidate.to_ssoc,
				to_title: bestTransitionCandidate.to_title,
				composite:
					bestTransitionCandidate.weight > 0
						? bestTransitionCandidate.support / bestTransitionCandidate.weight
						: 0,
				observed_transition_rate:
					bestTransitionCandidate.observedWeight > 0
						? bestTransitionCandidate.observedRateSum / bestTransitionCandidate.observedWeight
						: null,
				destination_quality:
					bestTransitionCandidate.weight > 0
						? bestTransitionCandidate.destinationQualitySum / bestTransitionCandidate.weight
						: null,
				wage_preservation:
					bestTransitionCandidate.weight > 0
						? bestTransitionCandidate.wagePreservationSum / bestTransitionCandidate.weight
						: null,
				training_ease:
					bestTransitionCandidate.weight > 0
						? bestTransitionCandidate.trainingEaseSum / bestTransitionCandidate.weight
						: null,
				empirical_priority:
					bestTransitionCandidate.weight > 0
						? bestTransitionCandidate.prioritySum / bestTransitionCandidate.weight
						: null,
				evidence_status:
					bestTransitionCandidate.observedWeight > 0 ? 'observed_enriched' : 'heuristic_only'
			}
		: null;

	const structuralRisk = scored.net_risk;
	const transitionAdjustedRisk = normalize01(
		weightedAverage((occupation) => occupation.transition_adjusted_risk) ?? scored.net_risk
	);
	const realizedRiskProxy = normalize01(
		weightedAverage((occupation) => occupation.realized_risk_proxy) ?? scored.net_risk
	);
	const adaptationCapacity = normalize01(
		weightedAverage((occupation) => occupation.adaptation_capacity) ?? 0
	);
	const adaptationBuffer = normalize01(
		weightedAverage((occupation) => occupation.adaptation_buffer) ?? 0
	);
	const adaptationDelta = normalize01(structuralRisk - transitionAdjustedRisk);
	const adaptationLabel = describeAdaptationLabel(adaptationCapacity);
	const realizedLabel = describeRealizedLabel(realizedRiskProxy);

	let summaryText = `This blended role keeps ${Math.round(
		transitionAdjustedRisk * 100
	)}% transition-adjusted pressure when you average the underlying occupations' adaptation paths. `;
	if (adaptationLabel === 'strong') {
		summaryText += 'The component mix suggests reasonably strong room to retool or redirect. ';
	} else if (adaptationLabel === 'moderate') {
		summaryText += 'The component mix suggests some adaptation room, but it remains uneven. ';
	} else {
		summaryText += 'The component mix suggests limited adaptation room. ';
	}
	if (bestTransition) {
		summaryText +=
			bestTransition.evidence_status === 'observed_enriched'
				? `The clearest adjacent route across the component occupations is ${bestTransition.to_title}, and at least part of that route has observed mobility support.`
				: `The clearest adjacent route across the component occupations is ${bestTransition.to_title}, but it is still mostly model-led.`;
	} else {
		summaryText +=
			'No single adjacent pathway dominates across the blended occupations yet.';
	}

	return {
		structuralRisk,
		transitionAdjustedRisk,
		realizedRiskProxy,
		adaptationCapacity,
		adaptationBuffer,
		adaptationDelta,
		adaptationLabel,
		realizedLabel,
		bestTransition,
		summaryText
	};
}

function buildGroupComparison(occupation: Occupation, allOccupations: Occupation[]): GroupComparison {
	const groupOccupations = allOccupations.filter((o) => o.major_group === occupation.major_group);
	const groupTotal = groupOccupations.length;
	const riskRankInGroup = groupOccupations.filter((o) => o.net_risk > occupation.net_risk).length + 1;

	const sortedRisks = groupOccupations.map((o) => o.net_risk).sort((a, b) => a - b);
	const mid = Math.floor(sortedRisks.length / 2);
	const groupMedianRisk = sortedRisks.length % 2 !== 0
		? sortedRisks[mid] ?? 0
		: ((sortedRisks[mid - 1] ?? 0) + (sortedRisks[mid] ?? 0)) / 2;

	const sortedWages = groupOccupations.map((o) => o.gross_wage_median).sort((a, b) => a - b);
	const wMid = Math.floor(sortedWages.length / 2);
	const groupMedianWage = sortedWages.length % 2 !== 0
		? sortedWages[wMid] ?? 0
		: ((sortedWages[wMid - 1] ?? 0) + (sortedWages[wMid] ?? 0)) / 2;

	const wageDiff = occupation.gross_wage_median - groupMedianWage;
	const wagePct = groupMedianWage > 0 ? Math.round((Math.abs(wageDiff) / groupMedianWage) * 100) : 0;
	const wageVsGroup = wagePct < 3 ? 'near group median' : wageDiff > 0 ? `${wagePct}% above group median` : `${wagePct}% below group median`;

	const riskDiff = occupation.net_risk - groupMedianRisk;
	const riskPp = Math.round(Math.abs(riskDiff) * 100);
	const riskVsGroup = riskPp < 2 ? 'near group median' : riskDiff > 0 ? `${riskPp}pp above group median` : `${riskPp}pp below group median`;

	const groupLabel = groupLabelMap.get(occupation.major_group) ?? occupation.major_group;
	return { groupName: groupLabel, groupTotal, riskRankInGroup, groupMedianRisk, groupMedianWage, wageVsGroup, riskVsGroup };
}

function findRelatedOccupations(occupation: Occupation, allOccupations: Occupation[]): RelatedOccupation[] {
	const group = allOccupations
		.filter((o) => o.major_group === occupation.major_group && o.ssoc !== occupation.ssoc);
	if (group.length === 0) return [];

	// 2 similar risk (closest net_risk), 1 contrasting (furthest net_risk)
	const byProximity = [...group].sort(
		(a, b) => Math.abs(a.net_risk - occupation.net_risk) - Math.abs(b.net_risk - occupation.net_risk)
	);
	const similar = byProximity.slice(0, 2);

	const byContrast = [...group].sort(
		(a, b) => Math.abs(b.net_risk - occupation.net_risk) - Math.abs(a.net_risk - occupation.net_risk)
	);
	const contrasting = byContrast.find((o) => !similar.some((s) => s.ssoc === o.ssoc));

	const result = [...similar];
	if (contrasting) result.push(contrasting);

	return result.map((o) => ({
		ssoc: o.ssoc,
		title: o.title,
		net_risk: o.net_risk,
		risk_band: o.risk_band,
		gross_wage_median: o.gross_wage_median
	}));
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
		summaryText: buildImpactSummary(occupation, allOccupations),
		decision: buildOccupationDecisionSummary(occupation, allTransitions),
		personalizedContent: getPersonalizedContent(
			occupation.ssoc,
			occupation.title,
			occupation.major_group,
			{
				exposure: occupation.exposure,
				bottleneck: occupation.bottleneck,
				exposureSources: occupation.evidence.exposure_source_keys
			}
		),
		onetEnrichment: getOnetEnrichmentForOccupation(occupation.ssoc),
		workflowNarrative: buildOccupationWorkflowNarrative(occupation),
		transitions: categorizeTransitions(allTransitions),
		topTransitions: findBestTransitions(occupation, allOccupations, 8),
		groupComparison: buildGroupComparison(occupation, allOccupations),
		relatedOccupations: findRelatedOccupations(occupation, allOccupations)
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
		summaryText: buildRoleImpactSummary(scored, allOccupations),
		decision: buildRoleDecisionSummary(scored),
		personalizedContent,
		onetEnrichment: buildRoleOnetEnrichment(scored.components),
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
