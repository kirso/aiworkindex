import { syntheticRoles, computeRoleScores, type ScoredRole } from '$lib/data/synthetic-roles';
import { occupationsBySSoc } from '$lib/data';
import { roleCategories, roleCategoryMap } from '$lib/data/role-taxonomy';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const scoredRoles: ScoredRole[] = syntheticRoles.map(role =>
		computeRoleScores(role, occupationsBySSoc)
	);

	const byCategory = new Map<string, ScoredRole[]>();
	for (const cat of roleCategories) {
		byCategory.set(cat.key, []);
	}
	for (const role of scoredRoles) {
		const entry = roleCategoryMap[role.slug];
		if (entry) {
			byCategory.get(entry.category)?.push(role);
		}
	}

	return {
		scoredRoles,
		roleCategories,
		byCategory: Object.fromEntries(byCategory)
	};
};
