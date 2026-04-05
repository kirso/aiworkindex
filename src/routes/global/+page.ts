import { countryConfigs } from '$lib/data/country-config';
import { globalMethodology } from '$lib/data/global-methodology';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = () => {
	return {
		country: countryConfigs.global,
		methodology: globalMethodology
	};
};
