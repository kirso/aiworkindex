import { roleCategories, roleCategoryMap } from '$lib/data/role-taxonomy';
import { syntheticRolesV9, syntheticRoleV9Counts } from '$lib/data/synthetic-roles-v9';
import { v9Counts } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => {
	const categories = roleCategories
		.map(category => ({
			...category,
			roles: syntheticRolesV9.filter(role => roleCategoryMap[role.slug]?.category === category.key)
		}))
		.filter(category => category.roles.length > 0);

	return {
		categories,
		roles: syntheticRolesV9,
		counts: syntheticRoleV9Counts,
		officialOccupationCount: v9Counts.occupations
	};
};
