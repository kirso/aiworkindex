import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.v8.ai_exposure_rank.points >= 60 && o.v8.market_context.demand === 'strong')
		.sort((a, b) => b.v8.ai_exposure_rank.points - a.v8.ai_exposure_rank.points)
		.slice(0, 25);
	return { ranked };
};
