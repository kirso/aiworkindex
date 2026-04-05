import { error } from '@sveltejs/kit';
import { countryConfigs, type CountryCode } from '$lib/data/country-config';
import { globalMethodology } from '$lib/data/global-methodology';
import {
	getCountryOccupationEntries,
	getCountryOccupationRow,
	type SupportedCountryPageCode
} from '$lib/data/country-pages';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const country = params.country as CountryCode;
	const supportedCountry = country === 'sg' || country === 'us' ? country : null;

	if (!supportedCountry) {
		throw error(404, 'Country occupation pages are only available for Singapore and the United States');
	}

	const config = countryConfigs[supportedCountry];
	const occupation = getCountryOccupationRow(supportedCountry as SupportedCountryPageCode, params.code);

	if (!occupation) {
		throw error(404, 'Occupation not found');
	}

	return {
		country: config,
		occupation,
		methodology: globalMethodology
	};
};

export function entries() {
	return getCountryOccupationEntries();
}
