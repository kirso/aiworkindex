import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const prerender = true;
export const csr = false;

export const load: PageLoad = () => {
	const ranked = [...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 50);
	const totalHighRisk = occupations.filter(o => o.net_risk >= 0.30).length;
	const totalVeryHighRisk = occupations.filter(o => o.net_risk >= 0.50).length;
	return { ranked, totalHighRisk, totalVeryHighRisk };
};
