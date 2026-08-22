import {
	getRoleFamilyPresentation,
	getRoleHref,
	getRoleStatusLabel
} from '$lib/data/role-presentation';
import { roleCategories, roleCategoryMap } from '$lib/data/role-taxonomy';
import { syntheticRolesV9, syntheticRoleV9Counts } from '$lib/data/synthetic-roles-v9';
import { v9Counts } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => {
	const roles = syntheticRolesV9.map(role => {
		const family = getRoleFamilyPresentation(role.slug);
		return {
			...role,
			href: getRoleHref(role),
			statusLabel: getRoleStatusLabel(role),
			presentation: {
				key: family.key,
				label: family.label,
				accent: family.accent,
				surface: family.surface
			}
		};
	});
	const categories = roleCategories
		.map(category => {
			const categoryRoles = roles.filter(
				role => roleCategoryMap[role.slug]?.category === category.key
			);
			const family = getRoleFamilyPresentation(categoryRoles[0]?.slug ?? '');
			return {
				...category,
				presentation: { accent: family.accent, surface: family.surface },
				roles: categoryRoles
			};
		})
		.filter(category => category.roles.length > 0);

	return {
		categories,
		roles,
		counts: syntheticRoleV9Counts,
		officialOccupationCount: v9Counts.occupations
	};
};
