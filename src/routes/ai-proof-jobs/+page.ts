import { occupations } from '$lib/data';
import { RANKING_THRESHOLDS } from '$lib/data/scoring-constants';
import type { PageLoad } from './$types';

export const prerender = true;
export const csr = false;

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.net_risk < RANKING_THRESHOLDS.low_risk_ceiling)
		.sort((a, b) => a.net_risk - b.net_risk);

	return { ranked, total: ranked.length };
};
