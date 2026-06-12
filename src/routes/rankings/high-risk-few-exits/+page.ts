import { getExitQuadrant } from '$lib/data/exit-quadrant';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const { threshold, highRiskCount, entries } = getExitQuadrant();

	const quadrant = [...entries.values()]
		.filter(entry => entry.in_quadrant)
		.sort((a, b) => b.from.net_risk - a.from.net_risk)
		.map(({ from, targets }) => ({ from, targets }));

	return { quadrant, highRiskCount, threshold };
};
