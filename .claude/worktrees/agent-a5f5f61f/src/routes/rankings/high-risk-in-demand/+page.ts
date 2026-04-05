import { occupations } from '$lib/data';
import { IMPACT_TYPE_THRESHOLDS } from '$lib/data/scoring-constants';
import type { PageLoad } from './$types';

export const csr = false;

export const load: PageLoad = () => {
	// High risk (net_risk >= displacement_threshold) but still on SOL or Jobs in Demand
	const ranked = occupations
		.filter(
			o =>
				o.net_risk >= IMPACT_TYPE_THRESHOLDS.displacement_threshold &&
				(o.evidence.sol_match || o.evidence.jobs_in_demand_match)
		)
		.sort((a, b) => b.net_risk - a.net_risk);

	return { ranked };
};
