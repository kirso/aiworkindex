import { occupations } from '$lib/data';
import { IMPACT_TYPE_THRESHOLDS } from '$lib/data/scoring-constants';
import { findBestTransitions } from '$lib/data/transition-capacity';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	// For high-risk occupations, find the best transition targets
	const highRiskOccs = occupations
		.filter(o => o.net_risk >= IMPACT_TYPE_THRESHOLDS.displacement_threshold)
		.sort((a, b) => b.net_risk - a.net_risk)
		.slice(0, 15);

	const transitions = highRiskOccs.map(from => {
		const best = findBestTransitions(from, occupations, 3);
		return {
			from,
			targets: best
		};
	});

	return { transitions };
};
