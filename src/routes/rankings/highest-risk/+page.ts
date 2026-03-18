import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = [...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 25);
	return { ranked };
};
