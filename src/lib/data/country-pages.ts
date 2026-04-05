import { occupations } from './index';
import { countryConfigs, type CountryCode } from './country-config';
import { usOccupations } from './countries/us/occupations';
import type { RiskBand } from './index';

export type SupportedCountryPageCode = Exclude<CountryCode, 'global' | 'uk' | 'ca'>;

export interface CountryOccupationPageRow {
	countryCode: SupportedCountryPageCode;
	localCode: string;
	localTitle: string;
	canonicalCode: string | null;
	canonicalTitle: string | null;
	structuralPressure: number;
	headlineRisk: number;
	demandResilience: number | null;
	riskBand: RiskBand;
	confidenceScore: number;
	confidenceLevel: 'high' | 'medium' | 'low';
	wage: number | null;
	currency: string;
	mappingMethod?: string;
	employment?: {
		current: number | null;
		projected: number | null;
		openings: number | null;
		projectedChangePct: number | null;
	};
	sourceOccupations?: string[];
}

function buildSingaporeRows(): CountryOccupationPageRow[] {
	const currency = countryConfigs.sg.currency ?? 'SGD';
	return occupations.map(occupation => ({
		countryCode: 'sg',
		localCode: occupation.ssoc,
		localTitle: occupation.title,
		canonicalCode: occupation.isco_codes_matched?.[0] ?? null,
		canonicalTitle: occupation.title,
		structuralPressure: occupation.displacement_pressure ?? occupation.exposure * (1 - occupation.bottleneck),
		headlineRisk: occupation.net_risk,
		demandResilience: occupation.demand_resilience ?? null,
		riskBand: occupation.risk_band,
		confidenceScore: occupation.confidence.score,
		confidenceLevel: occupation.confidence.level,
		wage: occupation.gross_wage_median ?? null,
		currency,
		mappingMethod: occupation.match_quality,
		employment: {
			current: occupation.employment_thousands ?? null,
			projected: null,
			openings: null,
			projectedChangePct: null
		},
		sourceOccupations: occupation.isco_codes_matched ?? [occupation.ssoc]
	}));
}

function buildUnitedStatesRows(): CountryOccupationPageRow[] {
	return usOccupations.map(occupation => ({
		countryCode: 'us',
		localCode: occupation.localCode,
		localTitle: occupation.localTitle,
		canonicalCode: occupation.canonicalCode,
		canonicalTitle: occupation.canonicalTitle,
		structuralPressure: occupation.structuralPressure,
		headlineRisk: occupation.headlineRisk,
		demandResilience: occupation.demandResilience,
		riskBand: occupation.headlineBand,
		confidenceScore: occupation.confidence.score,
		confidenceLevel: occupation.confidence.level,
		wage: occupation.wage.median,
		currency: occupation.wage.currency,
		mappingMethod: occupation.mappingMethod,
		employment: occupation.employment,
		sourceOccupations: occupation.sourceOccupations
	}));
}

const countryRowBuilders: Record<SupportedCountryPageCode, () => CountryOccupationPageRow[]> = {
	sg: buildSingaporeRows,
	us: buildUnitedStatesRows
};

export function getCountryOccupationRows(country: SupportedCountryPageCode): CountryOccupationPageRow[] {
	return countryRowBuilders[country]();
}

export function getCountryOccupationRow(
	country: SupportedCountryPageCode,
	code: string
): CountryOccupationPageRow | null {
	return getCountryOccupationRows(country).find(row => row.localCode === code) ?? null;
}

export function getCountryOccupationEntries(): Array<{ country: SupportedCountryPageCode; code: string }> {
	return (Object.keys(countryRowBuilders) as SupportedCountryPageCode[]).flatMap(country =>
		getCountryOccupationRows(country).map(row => ({ country, code: row.localCode }))
	);
}
