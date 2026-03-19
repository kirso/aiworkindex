import { occupations } from '$lib/data';
import { RANKING_THRESHOLDS } from '$lib/data/scoring-constants';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(
			o =>
				o.net_risk >= RANKING_THRESHOLDS.high_risk_floor &&
				o.gross_wage_median >= RANKING_THRESHOLDS.high_income_sgd
		)
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 25);

	return { ranked };
};
