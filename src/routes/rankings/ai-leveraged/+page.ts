import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.impact_type === 'ai_leveraged')
		.sort((a, b) => b.augmentation - a.augmentation)
		.slice(0, 25);
	return { ranked };
};
