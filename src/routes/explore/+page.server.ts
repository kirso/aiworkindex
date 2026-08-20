import { toV9BrowserItem, type V9BrowserItem } from '$lib/data/v9-browser';
import { toV9OccupationView } from '$lib/data/v9-display';
import { v9Occupations } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const occupations = v9Occupations.map(occupation =>
		toV9BrowserItem(toV9OccupationView(occupation))
	);
	return {
		occupations: [] as V9BrowserItem[],
		featuredOccupations: occupations.slice(0, 10).map(({ code, title }) => ({ code, title })),
		counts: {
			total: occupations.length,
			unranked: occupations.filter(item => item.pressureRank == null).length
		}
	};
};
