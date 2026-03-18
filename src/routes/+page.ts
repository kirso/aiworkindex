import { occupations, majorGroups } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const sortedWages = occupations
		.map(o => o.gross_wage_median)
		.filter(w => w > 0)
		.sort((a, b) => a - b);
	const nationalMedian =
		sortedWages.length > 0 ? sortedWages[Math.floor(sortedWages.length / 2)]! : 0;

	// Key stats
	const highRiskCount = occupations.filter(
		o => o.risk_band === 'high' || o.risk_band === 'very_high'
	).length;
	const avgExposure = occupations.reduce((s, o) => s + o.exposure, 0) / occupations.length;
	const demandCount = occupations.filter(
		o => o.evidence.sol_match || o.evidence.jobs_in_demand_match
	).length;

	return {
		occupations,
		majorGroups,
		stats: { highRiskCount, avgExposure, demandCount, nationalMedian }
	};
};
