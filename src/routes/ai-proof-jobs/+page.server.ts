import { v9Counts, v9Occupations } from '$lib/data/v9';
import { occupationToV9BrowserItem } from '$lib/data/v9-browser';
import type { PageServerLoad } from './$types';

export const prerender = true;
export const csr = false;

export const load: PageServerLoad = () => {
	const notExposed = v9Occupations
		.filter(occupation => {
			const category = occupation.genai_task_exposure?.potential25;
			return category?.least_exposed === 'Not Exposed' && category.most_exposed === 'Not Exposed';
		})
		.map(occupationToV9BrowserItem)
		.sort((a, b) => a.title.localeCompare(b.title));
	const minimalExposureCount = v9Occupations.filter(occupation => {
		const category = occupation.genai_task_exposure?.potential25;
		return (
			category?.least_exposed === 'Minimal Exposure' && category.most_exposed === 'Minimal Exposure'
		);
	}).length;

	return {
		notExposed: notExposed.slice(0, 50),
		notExposedCount: notExposed.length,
		minimalExposureCount,
		counts: v9Counts
	};
};
