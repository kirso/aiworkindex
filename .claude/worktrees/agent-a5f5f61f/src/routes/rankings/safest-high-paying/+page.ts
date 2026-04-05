import { occupations } from '$lib/data';
import { RANKING_THRESHOLDS } from '$lib/data/scoring-constants';
import type { PageLoad } from './$types';

export const csr = false;

export const load: PageLoad = () => {
	const allWages = occupations.map(o => o.gross_wage_median).sort((a, b) => a - b);
	const medianWage = allWages[Math.floor(allWages.length / 2)]!;

	const ranked = occupations
		.filter(
			o => o.net_risk < RANKING_THRESHOLDS.low_risk_ceiling && o.gross_wage_median >= medianWage
		)
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 25);

	return { ranked, medianWage };
};
