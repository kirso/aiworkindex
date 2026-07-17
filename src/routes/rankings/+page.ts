import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const highestRisk = [...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5);
	const aiLeveraged = occupations
		.filter(o => o.v8.likely_pathway === 'augmentation_led_growth')
		.sort((a, b) => b.v8.augmentation_potential.points - a.v8.augmentation_potential.points)
		.slice(0, 5);
	const wages = occupations.map(o => o.gross_wage_median).sort((a, b) => a - b);
	const medianWage = wages[Math.floor(wages.length / 2)] ?? 0;
	const safest = occupations
		.filter(o => o.v8.ai_exposure_rank.points < 40 && o.gross_wage_median >= medianWage)
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 5);

	return { highestRisk, aiLeveraged, safest };
};
