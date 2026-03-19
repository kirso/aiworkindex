import { occupations, occupationsBySSoc } from '$lib/data';
import { syntheticRoles, computeRoleScores } from '$lib/data/synthetic-roles';
import { buildRoleDetailStructural } from '$lib/data/detail-structural';
import { buildRoleDetailContext } from '$lib/data/detail-context';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const role = syntheticRoles.find(r => r.slug === params.slug);
	if (!role) {
		error(404, 'Role not found');
	}

	const scored = computeRoleScores(role, occupationsBySSoc);
	const context = buildRoleDetailContext(scored.components);
	const structural = buildRoleDetailStructural(scored, occupations, context.primaryOccupation);

	return {
		role,
		scored,
		structural,
		context
	};
};

export function entries() {
	return syntheticRoles.map(r => ({ slug: r.slug }));
}
