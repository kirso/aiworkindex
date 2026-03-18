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

	// Featured lists
	const highestRisk = [...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5);
	const safestHighPay = occupations
		.filter(o => o.gross_wage_median > nationalMedian && o.risk_band === 'very_low')
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 5);
	const augmented = occupations
		.filter(o => o.impact_type === 'ai_leveraged')
		.sort((a, b) => b.exposure - a.exposure)
		.slice(0, 5);
	const mostResilient = [...occupations].sort((a, b) => a.net_risk - b.net_risk).slice(0, 5);

	return {
		occupations,
		majorGroups,
		stats: { highRiskCount, avgExposure, demandCount, nationalMedian },
		featured: { highestRisk, safestHighPay, augmented, mostResilient }
	};
};
