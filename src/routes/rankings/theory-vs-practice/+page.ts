import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.evidence.anthropic_calibrated && o.evidence.anthropic_gap !== null)
		.sort((a, b) => Math.abs(b.evidence.anthropic_gap!) - Math.abs(a.evidence.anthropic_gap!))
		.slice(0, 25);
	return { ranked };
};
