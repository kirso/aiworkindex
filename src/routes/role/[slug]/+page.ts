import { occupations, occupationsBySSoc } from '$lib/data';
import { syntheticRoles, computeRoleScores } from '$lib/data/synthetic-roles';
import { findBestTransitions, categorizeTransitions } from '$lib/data/transition-capacity';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const role = syntheticRoles.find(r => r.slug === params.slug);
	if (!role) {
		error(404, 'Role not found');
	}

	const scored = computeRoleScores(role, occupationsBySSoc);

	// Compute percentile ranks for the scored role
	const allRisks = [...occupations].sort((a, b) => a.net_risk - b.net_risk);
	const riskPercentile = Math.round(
		(allRisks.filter(o => o.net_risk <= scored.net_risk).length / allRisks.length) * 100
	);

	// National median wage for context
	const allWages = occupations.map(o => o.gross_wage_median).sort((a, b) => a - b);
	const nationalMedian = allWages[Math.floor(allWages.length / 2)];

	// Related paths: find occupations similar to this role's components
	const componentSsocs = new Set(role.components.map(c => c.ssoc));
	const componentGroups = new Set(
		role.components.map(c => occupationsBySSoc.get(c.ssoc)?.major_group).filter(Boolean)
	);

	const lowerRisk = occupations
		.filter(
			o =>
				!componentSsocs.has(o.ssoc) &&
				componentGroups.has(o.major_group) &&
				o.net_risk < scored.net_risk
		)
		.sort((a, b) => b.net_risk - a.net_risk)
		.slice(0, 3);

	const inDemand = occupations
		.filter(
			o => !componentSsocs.has(o.ssoc) && (o.evidence.sol_match || o.evidence.jobs_in_demand_match)
		)
		.sort((a, b) => b.market.market_resilience - a.market.market_resilience)
		.slice(0, 3);

	// Compute transition scores from the highest-weight component occupation
	const sortedComponents = [...role.components].sort((a, b) => b.weight - a.weight);
	const primarySsoc = sortedComponents[0]?.ssoc;
	const primaryOcc = primarySsoc ? occupationsBySSoc.get(primarySsoc) : undefined;
	let transitions = null;
	if (primaryOcc) {
		const allTransitions = findBestTransitions(primaryOcc, occupations, 12);
		transitions = categorizeTransitions(allTransitions);
	}

	// Primary occupation match — for low-dispersion roles, this is the closest official occupation
	const primaryMatch = primaryOcc
		? {
				ssoc: primaryOcc.ssoc,
				title: primaryOcc.title,
				risk: primaryOcc.net_risk,
				riskDiff: Math.abs(scored.net_risk - primaryOcc.net_risk)
			}
		: null;

	return {
		role,
		scored,
		riskPercentile,
		nationalMedian,
		relatedPaths: { lowerRisk, inDemand },
		transitions,
		primaryMatch
	};
};

export function entries() {
	return syntheticRoles.map(r => ({ slug: r.slug }));
}
