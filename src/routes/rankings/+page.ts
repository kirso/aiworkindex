import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const highestRisk = [...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5);
	const aiLeveraged = occupations
		.filter(o => o.impact_type === 'ai_leveraged')
		.sort((a, b) => b.augmentation - a.augmentation)
		.slice(0, 5);
	const safest = [...occupations]
		.sort((a, b) => {
			const scoreA = (1 - a.net_risk) * a.gross_wage_median;
			const scoreB = (1 - b.net_risk) * b.gross_wage_median;
			return scoreB - scoreA;
		})
		.slice(0, 5);

	return { highestRisk, aiLeveraged, safest };
};
