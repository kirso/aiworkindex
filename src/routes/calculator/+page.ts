import { occupations } from '$lib/data';
import { syntheticRoles, computeRoleScores } from '$lib/data/synthetic-roles';
import { occupationsBySSoc } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// Combine occupations and scored roles for search
	const scoredRoles = syntheticRoles.map(r => {
		const scored = computeRoleScores(r, occupationsBySSoc);
		return {
			id: 'role:' + scored.slug,
			slug: scored.slug,
			ssoc: '',
			title: scored.title,
			net_risk: scored.net_risk,
			risk_band: scored.risk_band,
			impact_type: scored.impact_type,
			exposure: scored.exposure,
			bottleneck: scored.bottleneck,
			isRole: true
		};
	});

	const occEntries = occupations.map(o => ({
		id: 'occ:' + o.ssoc,
		slug: '',
		ssoc: o.ssoc,
		title: o.title,
		net_risk: o.net_risk,
		risk_band: o.risk_band,
		impact_type: o.impact_type,
		exposure: o.exposure,
		bottleneck: o.bottleneck,
		gross_wage_median: o.gross_wage_median,
		isRole: false
	}));

	return { entries: [...occEntries, ...scoredRoles] };
};
