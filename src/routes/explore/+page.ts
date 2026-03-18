import { occupations, majorGroups } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return { occupations, majorGroups };
};
