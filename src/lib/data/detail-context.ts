import type { Occupation } from './index';
import type { GroupIndustryContext, BlendedIndustryContext } from './industry-context';
import type { SingaporeContextSummary } from './singapore-context';
import type { WorkerProfileSummary } from './worker-profile';
import type { GeographyContextSummary } from './geography-context';
import { getIndustryContextForOccupation, buildRoleIndustryContext } from './industry-context';
import { getWorkerProfileForOccupation, buildRoleWorkerProfile } from './worker-profile';
import { buildOccupationSingaporeContext, buildRoleSingaporeContext } from './singapore-context';
import { getGeographyContextForOccupation, buildRoleGeographyContext } from './geography-context';
import transitionSupportData from './transition-support.json';
import transitionInfrastructureData from './transition-infrastructure.json';

export interface TransitionSupportInfo {
	skillsfuture_eligible: boolean;
	support_tier: string;
	recommended_programmes: string[];
	basis: string;
}

const supportTierOrder = ['general_public_support', 'broad_family_support'] as const;

const transitionSupportBySsoc = new Map<string, TransitionSupportInfo>(
	(transitionSupportData.transitions as Array<{
		from_ssoc: string;
		skillsfuture_eligible: boolean;
		official_programme_support: {
			support_tier: string;
			recommended_programmes: string[];
			basis: string;
		};
	}>).map((t) => [
		t.from_ssoc,
		{
			skillsfuture_eligible: t.skillsfuture_eligible,
			support_tier: t.official_programme_support.support_tier,
			recommended_programmes: t.official_programme_support.recommended_programmes,
			basis: t.official_programme_support.basis
		}
	])
);

const transitionProgrammeUrlByLabel = new Map<string, string>(
	(
		transitionInfrastructureData.programmes as Array<{
			label: string;
			url: string;
		}>
	).map((programme) => [programme.label, programme.url])
);

export function getTransitionSupport(ssoc: string): TransitionSupportInfo | null {
	return transitionSupportBySsoc.get(ssoc) ?? null;
}

export function getTransitionProgrammeUrl(label: string): string | null {
	return transitionProgrammeUrlByLabel.get(label) ?? null;
}

function mergeRoleTransitionSupport(
	components: Array<{ weight: number; occupation: Occupation | null }>
): TransitionSupportInfo | null {
	const resolved = [...components]
		.filter(
			(component): component is { weight: number; occupation: Occupation } =>
				component.occupation !== null
		)
		.sort((a, b) => b.weight - a.weight)
		.map((component) => ({
			weight: component.weight,
			occupation: component.occupation,
			support: getTransitionSupport(component.occupation.ssoc)
		}))
		.filter(
			(
				component
			): component is {
				weight: number;
				occupation: Occupation;
				support: TransitionSupportInfo;
			} => component.support !== null
		);

	if (resolved.length === 0) return null;

	const primary = resolved[0]!;
	const programmeSet = new Set<string>();
	for (const component of resolved) {
		for (const programme of component.support.recommended_programmes) {
			programmeSet.add(programme);
		}
	}

	const support_tier =
		[...resolved]
			.sort(
				(a, b) =>
					supportTierOrder.indexOf(b.support.support_tier as (typeof supportTierOrder)[number]) -
					supportTierOrder.indexOf(a.support.support_tier as (typeof supportTierOrder)[number])
			)[0]?.support.support_tier ?? primary.support.support_tier;

	return {
		skillsfuture_eligible: resolved.some((component) => component.support.skillsfuture_eligible),
		support_tier,
		recommended_programmes: [...programmeSet],
		basis: `Blended from ${resolved.length} component occupations; anchored on ${primary.occupation.title}.`
	};
}

export interface OccupationDetailContext {
	singaporeContext: SingaporeContextSummary;
	industryContext: GroupIndustryContext | null;
	workerProfile: WorkerProfileSummary;
	geographyContext: GeographyContextSummary;
	transitionSupport: TransitionSupportInfo | null;
}

export interface RoleDetailContext {
	primaryOccupation: Occupation | null;
	singaporeContext: SingaporeContextSummary;
	industryContext: BlendedIndustryContext;
	workerProfile: WorkerProfileSummary;
	geographyContext: GeographyContextSummary;
	transitionSupport: TransitionSupportInfo | null;
}

export function buildOccupationDetailContext(occupation: Occupation): OccupationDetailContext {
	return {
		singaporeContext: buildOccupationSingaporeContext(occupation),
		industryContext: getIndustryContextForOccupation(occupation),
		workerProfile: getWorkerProfileForOccupation(occupation),
		geographyContext: getGeographyContextForOccupation(occupation),
		transitionSupport: getTransitionSupport(occupation.ssoc)
	};
}

export function resolvePrimaryRoleOccupation(
	components: Array<{ weight: number; occupation: Occupation | null }>
): Occupation | null {
	const primaryComponent =
		[...components]
			.filter(
				(component): component is { weight: number; occupation: Occupation } =>
					component.occupation !== null
			)
			.sort((a, b) => b.weight - a.weight)[0] ?? null;

	return primaryComponent?.occupation ?? null;
}

export function buildRoleDetailContext(
	components: Array<{ weight: number; occupation: Occupation | null }>
): RoleDetailContext {
	return {
		primaryOccupation: resolvePrimaryRoleOccupation(components),
		singaporeContext: buildRoleSingaporeContext(components),
		industryContext: buildRoleIndustryContext(components),
		workerProfile: buildRoleWorkerProfile(components),
		geographyContext: buildRoleGeographyContext(components),
		transitionSupport: mergeRoleTransitionSupport(components)
	};
}
