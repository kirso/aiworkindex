import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.exposure > 0.5 && (o.evidence.sol_match || o.evidence.jobs_in_demand_match))
		.sort((a, b) => b.exposure - a.exposure)
		.slice(0, 25);
	return { ranked };
};
