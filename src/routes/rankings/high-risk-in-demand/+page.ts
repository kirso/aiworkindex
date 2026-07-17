import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const csr = false;

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.v8.ai_exposure_rank.points >= 60 && o.v8.market_context.demand === 'strong')
		.sort((a, b) => b.net_risk - a.net_risk);

	return { ranked };
};
