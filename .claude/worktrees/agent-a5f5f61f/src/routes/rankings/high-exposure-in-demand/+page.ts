import { occupations } from '$lib/data';
import { RANKING_CRITERIA } from '$lib/data/scoring-constants';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(
			o =>
				o.exposure > RANKING_CRITERIA.high_exposure &&
				(o.evidence.sol_match || o.evidence.jobs_in_demand_match)
		)
		.sort((a, b) => b.exposure - a.exposure)
		.slice(0, 25);
	return { ranked };
};
