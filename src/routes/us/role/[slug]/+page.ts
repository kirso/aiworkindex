import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { buildUnitedStatesRoleView } from '$lib/data/countries/us/roles';
import { syntheticRoles } from '$lib/data/synthetic-roles';

export const load: PageLoad = ({ params }) => {
	const view = buildUnitedStatesRoleView(params.slug);
	if (!view) error(404, 'Role not found');

	return view;
};

export function entries() {
	return syntheticRoles.map(role => ({ slug: role.slug }));
}

