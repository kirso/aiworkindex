import { occupations } from '$lib/data';
import type { PageLoad } from './$types';

export const csr = false;

export const load: PageLoad = () => {
	const ranked = occupations
		.filter(o => o.v8.likely_pathway === 'augmentation_led_growth')
		.sort((a, b) => b.v8.augmentation_potential.points - a.v8.augmentation_potential.points)
		.slice(0, 25);
	return { ranked };
};
