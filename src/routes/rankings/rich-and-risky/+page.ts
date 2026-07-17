import { occupations } from '$lib/data';
import { RANKING_THRESHOLDS } from '$lib/data/scoring-constants';
import type { PageLoad } from './$types';

export const csr = false;

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(
			o =>
				o.v8.ai_exposure_rank.points >= 60 &&
				o.gross_wage_median >= RANKING_THRESHOLDS.high_income_sgd
		)
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 25);

	return { ranked };
};
