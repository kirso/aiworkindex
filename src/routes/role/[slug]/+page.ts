import { occupationsBySSoc } from '$lib/data';
import { syntheticRoles, computeRoleScores } from '$lib/data/synthetic-roles';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const role = syntheticRoles.find((r) => r.slug === params.slug);
	if (!role) {
		error(404, 'Role not found');
	}

	const scored = computeRoleScores(role, occupationsBySSoc);

	return { role, scored };
};

export function entries() {
	return syntheticRoles.map((r) => ({ slug: r.slug }));
}
