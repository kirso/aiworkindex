import { occupations, occupationsBySSoc } from '$lib/data';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
	const occupation = occupationsBySSoc.get(params.ssoc);
	if (!occupation) {
		error(404, 'Occupation not found');
	}

	const sameGroup = occupations.filter(
		(o) => o.major_group === occupation.major_group && o.ssoc !== occupation.ssoc
	);

	// Lower risk alternatives — same group, lower net_risk, sorted by closest
	const lowerRisk = sameGroup
		.filter((o) => o.net_risk < occupation.net_risk)
		.sort((a, b) => b.net_risk - a.net_risk)
		.slice(0, 3);

	// Higher pay options — same group, higher median wage
	const higherPay = sameGroup
		.filter((o) => o.gross_wage_median > occupation.gross_wage_median)
		.sort((a, b) => b.gross_wage_median - a.gross_wage_median)
		.slice(0, 3);

	// In-demand roles — occupations with high market momentum and scarcity
	const inDemand = occupations
		.filter((o) => o.ssoc !== occupation.ssoc)
		.filter((o) => o.evidence.sol_match || o.evidence.jobs_in_demand_match)
		.sort((a, b) => b.market.market_resilience - a.market.market_resilience)
		.slice(0, 3);

	// Compute national median wage for comparison
	const allWages = occupations.map((o) => o.gross_wage_median).sort((a, b) => a - b);
	const nationalMedian = allWages[Math.floor(allWages.length / 2)];

	return {
		occupation,
		relatedPaths: {
			lowerRisk,
			higherPay,
			inDemand
		},
		nationalMedian
	};
};

export function entries() {
	return occupations.map((o) => ({ ssoc: o.ssoc }));
}
