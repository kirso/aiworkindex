import { occupations } from '$lib/data';
import { syntheticRoles, computeRoleScores } from '$lib/data/synthetic-roles';
import { occupationsBySSoc } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Pre-compute all scored roles for quick lookup
	const scoredRolesMap = new Map(
		syntheticRoles.map(r => [r.slug, computeRoleScores(r, occupationsBySSoc)])
	);

	return {
		allOccupations: occupations,
		syntheticRoles,
		scoredRolesMap
	};
};
