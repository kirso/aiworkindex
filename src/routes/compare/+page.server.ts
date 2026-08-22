import { buildV9CompareEntities } from '$lib/data/v9-ui.server';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => ({
	entities: [] as ReturnType<typeof buildV9CompareEntities>
});
