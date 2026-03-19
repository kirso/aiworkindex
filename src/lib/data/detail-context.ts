import type { Occupation } from './index';
import type { GroupIndustryContext, BlendedIndustryContext } from './industry-context';
import type { SingaporeContextSummary } from './singapore-context';
import type { WorkerProfileSummary } from './worker-profile';
import { getIndustryContextForOccupation, buildRoleIndustryContext } from './industry-context';
import { getWorkerProfileForOccupation, buildRoleWorkerProfile } from './worker-profile';
import { buildOccupationSingaporeContext, buildRoleSingaporeContext } from './singapore-context';

export interface OccupationDetailContext {
	singaporeContext: SingaporeContextSummary;
	industryContext: GroupIndustryContext | null;
	workerProfile: WorkerProfileSummary;
}

export interface RoleDetailContext {
	primaryOccupation: Occupation | null;
	singaporeContext: SingaporeContextSummary;
	industryContext: BlendedIndustryContext;
	workerProfile: WorkerProfileSummary;
}

export function buildOccupationDetailContext(occupation: Occupation): OccupationDetailContext {
	return {
		singaporeContext: buildOccupationSingaporeContext(occupation),
		industryContext: getIndustryContextForOccupation(occupation),
		workerProfile: getWorkerProfileForOccupation(occupation)
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
		workerProfile: buildRoleWorkerProfile(components)
	};
}
