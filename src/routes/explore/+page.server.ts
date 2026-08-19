import { toV9BrowserItem } from '$lib/data/v9-browser';
import { toV9OccupationView } from '$lib/data/v9-display';
import { v9Occupations } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const occupations = v9Occupations.map(occupation =>
		toV9BrowserItem(toV9OccupationView(occupation))
	);
	const groups = Array.from(
		new Map(occupations.map(item => [item.majorGroupCode, item.majorGroupTitle] as const)).entries()
	).sort(([a], [b]) => a.localeCompare(b));
	return { occupations: occupations.slice(0, 40), totalCount: occupations.length, groups };
};
