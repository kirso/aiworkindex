import { error } from '@sveltejs/kit';
import { countryConfigs, type CountryCode } from '$lib/data/country-config';
import { usOccupations } from '$lib/data/countries/us/occupations';
import usSupport from '$lib/data/countries/us/support.json';
import {
	comparePressureDescending,
	takePressureWithCutoffTies,
	toV9OccupationView
} from '$lib/data/v9-display';
import { v9Counts, v9Occupations } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = ({ params }) => {
	const code = params.country as CountryCode;
	const country = countryConfigs[code];
	if (!country || code === 'global') error(404, 'Country not found');

	if (code === 'sg') {
		const views = v9Occupations.map(toV9OccupationView);
		return {
			mode: 'singapore' as const,
			country,
			stats: {
				occupations: v9Counts.occupations,
				scored: v9Counts.scored,
				insufficient: v9Counts.insufficient_evidence,
				directWages: v9Counts.direct_wages,
				namedDemand: views.filter(view => view.demandSignals.length > 0).length
			},
			topPressure: takePressureWithCutoffTies([...views].sort(comparePressureDescending), 12)
		};
	}

	if (code === 'us') {
		const wageRows = usOccupations.filter(occupation => occupation.wage.median != null);
		const employmentRows = usOccupations.filter(
			occupation => occupation.employment.current != null
		);
		return {
			mode: 'us_preview' as const,
			country,
			stats: {
				occupations: usOccupations.length,
				wageRows: wageRows.length,
				employmentRows: employmentRows.length,
				sourceVintage: usSupport.source_vintage,
				generatedAt: usSupport.generated_at
			},
			sample: usOccupations
				.filter(
					occupation => occupation.wage.median != null && occupation.employment.current != null
				)
				.sort((a, b) => (b.employment.current ?? 0) - (a.employment.current ?? 0))
				.slice(0, 8)
				.map(occupation => ({
					code: occupation.localCode,
					title: occupation.localTitle,
					wage: occupation.wage.median,
					employmentThousands: occupation.employment.current,
					projectedChange: occupation.employment.projectedChangePct
				}))
		};
	}

	return { mode: 'research' as const, country };
};

export function entries() {
	return ['sg', 'us', 'uk', 'ca'].map(country => ({ country }));
}
