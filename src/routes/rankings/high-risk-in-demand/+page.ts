import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// High risk (net_risk > 0.25, i.e. "high" or "very_high" band) but still on SOL or Jobs in Demand
	const ranked = occupations
		.filter(o => o.net_risk >= 0.25 && (o.evidence.sol_match || o.evidence.jobs_in_demand_match))
		.sort((a, b) => b.net_risk - a.net_risk);

	return { ranked };
};
