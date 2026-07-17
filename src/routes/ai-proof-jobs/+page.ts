import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const prerender = true;
export const csr = false;

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.v8.ai_exposure_rank.points < 40)
		.sort((a, b) => a.net_risk - b.net_risk);

	return { ranked, total: ranked.length };
};
