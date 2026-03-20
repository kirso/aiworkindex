import type { Occupation } from './index';
import type { GroupIndustryContext, BlendedIndustryContext } from './industry-context';
import type { SingaporeContextSummary } from './singapore-context';
import type { WorkerProfileSummary } from './worker-profile';
import type { GeographyContextSummary } from './geography-context';
import type { PostingAggregate } from './postings-monitor';
import type { EmployerPressureEntry } from './employer-pressure';
import { getIndustryContextForOccupation, buildRoleIndustryContext } from './industry-context';
import { getWorkerProfileForOccupation, buildRoleWorkerProfile } from './worker-profile';
import { buildOccupationSingaporeContext, buildRoleSingaporeContext } from './singapore-context';
import { getGeographyContextForOccupation, buildRoleGeographyContext } from './geography-context';
import { getPostingsForOccupation, buildRolePostingsFromComponents } from './postings-monitor';
import { getEmployerPressureForOccupation, buildRoleEmployerPressure } from './employer-pressure';
import transitionSupportData from './transition-support.json';
import transitionInfrastructureData from './transition-infrastructure.json';

export interface TransitionSupportInfo {
	skillsfuture_eligible: boolean;
	support_tier: string;
	recommended_programmes: string[];
	basis: string;
	jtm_sector_alignment?: string[];
	wsq_training_reference?: {
		latest_year: string | null;
		total_trainees_latest: number | null;
	} | null;
}

const supportTierOrder = [
	'general_public_support',
	'sector_transition_support',
	'broad_family_support',
	'jtm_aligned_family_support'
] as const;

const transitionSupportBySsoc = new Map<string, TransitionSupportInfo>(
	(transitionSupportData.transitions as Array<{
		from_ssoc: string;
		skillsfuture_eligible: boolean;
		official_programme_support: {
			support_tier: string;
			recommended_programmes: string[];
			basis: string;
			jtm_sector_alignment?: string[];
			wsq_training_reference?: {
				latest_year: string | null;
				total_trainees_latest: number | null;
			} | null;
		};
	}>).map((t) => [
		t.from_ssoc,
		{
			skillsfuture_eligible: t.skillsfuture_eligible,
			support_tier: t.official_programme_support.support_tier,
			recommended_programmes: t.official_programme_support.recommended_programmes,
			basis: t.official_programme_support.basis,
			jtm_sector_alignment: t.official_programme_support.jtm_sector_alignment,
			wsq_training_reference: t.official_programme_support.wsq_training_reference
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
		basis: `Blended from ${resolved.length} component occupations; anchored on ${primary.occupation.title}.`,
		jtm_sector_alignment: [
			...new Set(resolved.flatMap((component) => component.support.jtm_sector_alignment ?? []))
		],
		wsq_training_reference: primary.support.wsq_training_reference ?? null
	};
}

export interface OccupationDetailContext {
	singaporeContext: SingaporeContextSummary;
	industryContext: GroupIndustryContext | null;
	workerProfile: WorkerProfileSummary;
	geographyContext: GeographyContextSummary;
	transitionSupport: TransitionSupportInfo | null;
	postings: PostingAggregate | null;
	employerPressure: EmployerPressureEntry | null;
}

export interface RoleDetailContext {
	primaryOccupation: Occupation | null;
	singaporeContext: SingaporeContextSummary;
	industryContext: BlendedIndustryContext;
	workerProfile: WorkerProfileSummary;
	geographyContext: GeographyContextSummary;
	transitionSupport: TransitionSupportInfo | null;
	postings: PostingAggregate | null;
	employerPressure: EmployerPressureEntry | null;
}

export function buildOccupationDetailContext(occupation: Occupation): OccupationDetailContext {
	return {
		singaporeContext: buildOccupationSingaporeContext(occupation),
		industryContext: getIndustryContextForOccupation(occupation),
		workerProfile: getWorkerProfileForOccupation(occupation),
		geographyContext: getGeographyContextForOccupation(occupation),
		transitionSupport: getTransitionSupport(occupation.ssoc),
		postings: getPostingsForOccupation(occupation.ssoc),
		employerPressure: getEmployerPressureForOccupation(occupation)
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
	const primaryOccupation = resolvePrimaryRoleOccupation(components);
	return {
		primaryOccupation,
		singaporeContext: buildRoleSingaporeContext(components),
		industryContext: buildRoleIndustryContext(components),
		workerProfile: buildRoleWorkerProfile(components),
		geographyContext: buildRoleGeographyContext(components),
		transitionSupport: mergeRoleTransitionSupport(components),
		postings: buildRolePostingsFromComponents('', components),
		employerPressure: buildRoleEmployerPressure(components)
	};
}
