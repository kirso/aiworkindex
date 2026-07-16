import { occupations, occupationsBySSoc } from '$lib/data';
import { syntheticRoles, computeRoleScores } from '$lib/data/synthetic-roles';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = () => {
	const scoredRoles = syntheticRoles.map(role => {
		const scored = computeRoleScores(role, occupationsBySSoc);
		return {
			id: `role:${scored.slug}`,
			slug: scored.slug,
			ssoc: '',
			title: scored.title,
			risk_band: scored.risk_band,
			score_points: Math.round(scored.net_risk * 100),
			pathway:
				scored.impact_type === 'ai_leveraged'
					? 'augmentation_led_growth'
					: scored.impact_type === 'at_risk'
						? 'hiring_or_substitution_pressure'
						: scored.impact_type === 'stable'
							? 'limited_direct_change'
							: 'workflow_redesign',
			demand_context: 'unknown',
			evidence_confidence: scored.confidence,
			isEstimated: true,
			isRole: true
		};
	});

	const occupationEntries = occupations.map(occupation => ({
		id: `occ:${occupation.ssoc}`,
		slug: '',
		ssoc: occupation.ssoc,
		title: occupation.title,
		risk_band: occupation.v8.ai_exposure_rank.band,
		score_points: occupation.v8.ai_exposure_rank.points,
		pathway: occupation.v8.likely_pathway,
		demand_context: occupation.v8.market_context.demand,
		evidence_confidence: occupation.v8.evidence_confidence.level,
		isEstimated: false,
		isRole: false
	}));

	return { entries: [...occupationEntries, ...scoredRoles] };
};
