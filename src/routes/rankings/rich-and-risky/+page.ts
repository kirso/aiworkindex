import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.net_risk >= 0.3 && o.gross_wage_median >= 5000)
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 25);

	return { ranked };
};
