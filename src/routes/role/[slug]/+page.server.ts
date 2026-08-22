import { error, redirect } from '@sveltejs/kit';
import {
	EXACT_TITLE_RESOLUTION,
	getRoleFamilyPresentation,
	getRoleHref,
	getRoleJourneyKind,
	getRoleStatusLabel
} from '$lib/data/role-presentation';
import { roleCategoryMap } from '$lib/data/role-taxonomy';
import { syntheticRolesV9, syntheticRolesV9BySlug } from '$lib/data/synthetic-roles-v9';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = ({ params }) => {
	const role = syntheticRolesV9BySlug.get(params.slug);
	if (!role) error(404, 'Role not found');
	if (role.resolution_basis === EXACT_TITLE_RESOLUTION && role.official_occupation) {
		redirect(308, `/occupation/${role.official_occupation.ssoc2024}`);
	}

	const category = roleCategoryMap[role.slug]?.category ?? null;
	const related = syntheticRolesV9
		.filter(
			candidate =>
				candidate.resolution_basis !== EXACT_TITLE_RESOLUTION &&
				candidate.slug !== role.slug &&
				roleCategoryMap[candidate.slug]?.category === category
		)
		.sort((a, b) => {
			const aRank =
				a.official_occupation?.pressure_rank ?? a.estimate?.estimated_comparison_percentile ?? -1;
			const bRank =
				b.official_occupation?.pressure_rank ?? b.estimate?.estimated_comparison_percentile ?? -1;
			return bRank - aRank || a.title.localeCompare(b.title);
		})
		.slice(0, 6)
		.map(candidate => ({
			role: candidate,
			href: getRoleHref(candidate),
			statusLabel: getRoleStatusLabel(candidate),
			presentation: getRoleFamilyPresentation(candidate.slug)
		}));

	return {
		role,
		journeyKind: getRoleJourneyKind(role),
		statusLabel: getRoleStatusLabel(role),
		presentation: getRoleFamilyPresentation(role.slug),
		related
	};
};

export function entries() {
	return syntheticRolesV9.map(role => ({ slug: role.slug }));
}
