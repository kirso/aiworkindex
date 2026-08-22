import { syntheticRoleV9Counts } from '$lib/data/synthetic-roles-v9';
import { buildV9CheckerEntries } from '$lib/data/v9-ui.server';
import { v9Counts } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => ({
	entries: [] as ReturnType<typeof buildV9CheckerEntries>,
	counts: {
		...v9Counts,
		roles: syntheticRoleV9Counts.non_official_roles,
		estimatedRoles: syntheticRoleV9Counts.composite_roles,
		withheldRoles: syntheticRoleV9Counts.mapping_withheld
	}
});
