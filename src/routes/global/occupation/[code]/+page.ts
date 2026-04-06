import { error } from '@sveltejs/kit';
import { countryConfigs } from '$lib/data/country-config';
import { globalMethodology } from '$lib/data/global-methodology';
import { getGlobalOccupationEntries, getGlobalOccupationRow } from '$lib/data/global-occupations';
import type { PageLoad } from './$types';

export const prerender = true;

export const load: PageLoad = ({ params }) => {
	const occupation = getGlobalOccupationRow(params.code);

	if (!occupation) {
		throw error(404, 'Global occupation not found');
	}

	return {
		country: countryConfigs.global,
		occupation,
		methodology: globalMethodology
	};
};

export function entries() {
	return getGlobalOccupationEntries();
}
