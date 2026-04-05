import { error } from '@sveltejs/kit';
import { countryConfigs, type CountryCode } from '$lib/data/country-config';
import { globalMethodology } from '$lib/data/global-methodology';
import { occupations } from '$lib/data';
import { usOccupations } from '$lib/data/countries/us/occupations';

type CountryHubRow = {
	code: string;
	title: string;
	risk: number;
	wage: number | null;
	confidence: number;
	mappingMethod?: string;
};

function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)]!;
}

function asCountryHubRows(country: CountryCode): CountryHubRow[] {
	if (country === 'sg') {
		return occupations.map(occ => ({
			code: occ.ssoc,
			title: occ.title,
			risk: occ.net_risk,
			wage: occ.gross_wage_median ?? null,
			confidence: occ.confidence.score
		}));
	}
	if (country === 'us') {
		return usOccupations.map(occ => ({
			code: occ.localCode,
			title: occ.localTitle,
			risk: occ.headlineRisk,
			wage: occ.wage.median,
			confidence: occ.confidence.score,
			mappingMethod: occ.mappingMethod
		}));
	}
	return [];
}

export function load({ params }) {
	const country = params.country as CountryCode;
	const config = countryConfigs[country];

	if (!config || country === 'global') {
		throw error(404, 'Country not found');
	}

	const rows = asCountryHubRows(country);
	const highRisk = rows.filter(row => row.risk >= 0.3).length;
	const medianRisk = median(rows.map(row => row.risk));
	const wageValues = rows.map(row => row.wage).filter((value): value is number => value != null);
	const medianWage = wageValues.length ? median(wageValues) : null;
	const crosswalkExact = rows.filter(row => row.mappingMethod === 'crosswalk_exact').length;
	const titleMatch = rows.filter(row => row.mappingMethod === 'title_match').length;
	const fallback = rows.filter(row => row.mappingMethod === 'major_group_fallback').length;

	return {
		country: config,
		rows: rows.sort((a, b) => b.risk - a.risk).slice(0, 12),
		stats: {
			count: rows.length,
			highRisk,
			medianRisk,
			medianWage,
			crosswalkExact,
			titleMatch,
			fallback
		},
		methodology: globalMethodology
	};
}
