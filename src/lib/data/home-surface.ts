import { countryConfigs, type CountryCode } from './country-config';
import { globalOccupations } from './global-occupations';
import { occupations, majorGroups, type RiskBand, type ImpactType } from './index';
import { usOccupations } from './countries/us/occupations';
import type { GlobalOccupationRecord, CountryOccupationRecord } from './country-index';

export type HomeSurfaceCode = 'global' | 'sg' | 'us';

export type HomeSurfaceValueKind = 'wage' | 'count';

export interface HomeSurfaceMetric {
	label: string;
	value: string;
	note: string;
	tooltip?: string;
}

export interface HomeSurfaceChoice {
	code: HomeSurfaceCode;
	label: string;
	description: string;
	status: 'global' | 'live' | 'ready';
}

export interface HomeSurfaceItem {
	surfaceCode: HomeSurfaceCode;
	surfaceLabel: string;
	title: string;
	displayCode: string;
	linkHref: string | null;
	groupKey: string;
	groupLabel: string;
	major_group: string;
	major_group_code: number;
	gross_wage_median: number;
	gross_wage_25th: number | null;
	gross_wage_75th: number | null;
	currency: string | null;
	surfaceFootprint: number;
	employment_thousands: number;
	group_employment_thousands: number;
	exposure: number;
	bottleneck: number;
	structuralPressure: number;
	demandResilience: number | null;
	demandSignalBonus: number | null;
	market: { market_resilience: number };
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
	impact_type: ImpactType;
	likelyPathway?: string;
	demandContext?: string;
	confidence: {
		score: number;
		level: 'high' | 'medium' | 'low';
		policy_cap_reason?: string | null;
	};
	evidence: {
		sol_match: 'exact' | 'prefix' | false;
		jobs_in_demand_match: 'exact' | 'prefix' | false;
	};
	valueKind: HomeSurfaceValueKind;
	canonicalCode?: string;
	localCode?: string;
	ssoc?: string;
}

export interface HomeSurface {
	code: HomeSurfaceCode;
	config: (typeof countryConfigs)[CountryCode];
	title: string;
	description: string;
	summary: string;
	drilldownLabel: string;
	drilldownHref: string;
	valueLabel: string;
	chartNotes: {
		treemap: string;
		matrix: string;
		histogram: string;
	};
	metrics: HomeSurfaceMetric[];
	occupations: HomeSurfaceItem[];
}

const surfaceChoices: HomeSurfaceChoice[] = [
	{
		code: 'sg',
		label: 'Singapore',
		description: 'Singapore wages, demand signals, and policy data.',
		status: 'live'
	}
];

const globalMajorGroups = new Map(
	majorGroups.map(group => [String(group.code), { label: group.label, color: group.color }])
);

const usMajorGroups: Record<string, string> = {
	'11': 'Management Occupations',
	'13': 'Business and Financial Operations Occupations',
	'15': 'Computer and Mathematical Occupations',
	'17': 'Architecture and Engineering Occupations',
	'19': 'Life, Physical, and Social Science Occupations',
	'21': 'Community and Social Service Occupations',
	'23': 'Legal Occupations',
	'25': 'Educational Instruction and Library Occupations',
	'27': 'Arts, Design, Entertainment, Sports, and Media Occupations',
	'29': 'Healthcare Practitioners and Technical Occupations',
	'31': 'Healthcare Support Occupations',
	'33': 'Protective Service Occupations',
	'35': 'Food Preparation and Serving Related Occupations',
	'37': 'Building and Grounds Cleaning and Maintenance Occupations',
	'39': 'Personal Care and Service Occupations',
	'41': 'Sales and Related Occupations',
	'43': 'Office and Administrative Support Occupations',
	'45': 'Farming, Fishing, and Forestry Occupations',
	'47': 'Construction and Extraction Occupations',
	'49': 'Installation, Maintenance, and Repair Occupations',
	'51': 'Production Occupations',
	'53': 'Transportation and Material Moving Occupations'
};

function formatPercent(value: number): string {
	return `${Math.round(value * 100)}%`;
}

export function formatCompactCount(value: number): string {
	const count = Math.max(0, value);
	if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B`;
	if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
	if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1)}k`;
	return Math.round(count).toLocaleString();
}

function valueKindLabel(kind: HomeSurfaceValueKind): string {
	return kind === 'count' ? 'mapped occupations' : 'median wage';
}

function deriveImpactType(structuralPressure: number, bottleneck: number): ImpactType {
	if (structuralPressure >= 0.3 && bottleneck < 0.45) return 'at_risk';
	if (structuralPressure >= 0.3) return 'mixed';
	if (bottleneck >= 0.7) return 'ai_leveraged';
	if (bottleneck <= 0.3) return 'stable';
	return 'mixed';
}

function mapGlobalItem(record: GlobalOccupationRecord): HomeSurfaceItem {
	const majorGroupCode = Number(record.canonicalCode.slice(0, 1));
	const groupMeta = globalMajorGroups.get(String(majorGroupCode)) ?? {
		label: `Major group ${majorGroupCode}`,
		color: '#6b7280'
	};

	return {
		surfaceCode: 'global',
		surfaceLabel: countryConfigs.global.displayName,
		title: record.canonicalTitle,
		displayCode: record.canonicalCode,
		linkHref: `/global/occupation/${record.canonicalCode}`,
		groupKey: String(majorGroupCode),
		groupLabel: groupMeta.label,
		major_group: groupMeta.label,
		major_group_code: majorGroupCode,
		gross_wage_median: record.structuralFootprint,
		gross_wage_25th: null,
		gross_wage_75th: null,
		currency: null,
		surfaceFootprint: record.structuralFootprint,
		employment_thousands: record.structuralFootprint,
		group_employment_thousands: record.structuralFootprint,
		exposure: record.exposure,
		bottleneck: record.bottleneck,
		structuralPressure: record.structuralPressure,
		demandResilience: null,
		demandSignalBonus: null,
		market: { market_resilience: 1 - record.bottleneck },
		net_risk: record.structuralPressure,
		risk_band: record.structuralBand,
		augmentation: record.exposure * record.bottleneck,
		augmentation_band: record.structuralBand,
		impact_type: deriveImpactType(record.structuralPressure, record.bottleneck),
		confidence: {
			score: record.confidence.score,
			level: record.confidence.level
		},
		evidence: {
			sol_match: false,
			jobs_in_demand_match: false
		},
		valueKind: 'count',
		canonicalCode: record.canonicalCode,
		ssoc: record.canonicalCode
	};
}

function mapSingaporeItem(occupation: (typeof occupations)[number]): HomeSurfaceItem {
	const majorGroupCode = occupation.major_group_code;
	const groupMeta = globalMajorGroups.get(String(majorGroupCode)) ?? {
		label: occupation.major_group,
		color: '#6b7280'
	};

	return {
		surfaceCode: 'sg',
		surfaceLabel: countryConfigs.sg.displayName,
		title: occupation.title,
		displayCode: occupation.ssoc,
		linkHref: `/occupation/${occupation.ssoc}`,
		groupKey: occupation.major_group,
		groupLabel: groupMeta.label,
		major_group: occupation.major_group,
		major_group_code: majorGroupCode,
		gross_wage_median: occupation.gross_wage_median,
		gross_wage_25th: occupation.gross_wage_25th,
		gross_wage_75th: occupation.gross_wage_75th,
		currency: countryConfigs.sg.currency ?? 'SGD',
		surfaceFootprint: occupation.employment_thousands,
		employment_thousands: occupation.employment_thousands,
		group_employment_thousands: occupation.group_employment_thousands,
		exposure: occupation.exposure,
		bottleneck: occupation.bottleneck,
		structuralPressure: occupation.displacement_pressure ?? occupation.exposure * (1 - occupation.bottleneck),
		demandResilience: occupation.demand_resilience ?? null,
		demandSignalBonus: occupation.demand_signal_bonus ?? null,
		market: { market_resilience: occupation.market.market_resilience },
		net_risk: occupation.net_risk,
		risk_band: occupation.risk_band,
		augmentation: occupation.augmentation,
		augmentation_band: occupation.augmentation_band,
		impact_type: occupation.impact_type,
		likelyPathway: occupation.v8?.likely_pathway,
		demandContext: occupation.v8?.market_context.demand,
		confidence: {
			score: occupation.confidence.score,
			level: occupation.confidence.level
		},
		evidence: {
			sol_match: occupation.evidence.sol_match,
			jobs_in_demand_match: occupation.evidence.jobs_in_demand_match
		},
		valueKind: 'wage',
		ssoc: occupation.ssoc
	};
}

function mapUnitedStatesItem(occupation: CountryOccupationRecord): HomeSurfaceItem {
	const groupKey = occupation.localCode.slice(0, 2);
	const groupLabel = usMajorGroups[groupKey] ?? `SOC ${groupKey}`;

	return {
		surfaceCode: 'us',
		surfaceLabel: countryConfigs.us.displayName,
		title: occupation.localTitle,
		displayCode: occupation.localCode,
		linkHref: `/us/occupation/${occupation.localCode}`,
		groupKey,
		groupLabel,
		major_group: groupLabel,
		major_group_code: Number(groupKey),
		gross_wage_median: occupation.wage.median ?? 0,
		gross_wage_25th: occupation.wage.p25 ?? null,
		gross_wage_75th: occupation.wage.p75 ?? null,
		currency: occupation.wage.currency,
		surfaceFootprint: occupation.employment.current ?? 0,
		employment_thousands: occupation.employment.current ?? 0,
		group_employment_thousands: occupation.employment.current ?? 0,
		exposure: occupation.structuralPressure,
		bottleneck: 1 - occupation.demandResilience,
		structuralPressure: occupation.structuralPressure,
		demandResilience: occupation.demandResilience,
		demandSignalBonus: null,
		market: { market_resilience: occupation.demandResilience },
		net_risk: occupation.headlineRisk,
		risk_band: occupation.headlineBand,
		augmentation: occupation.structuralPressure * occupation.demandResilience,
		augmentation_band: occupation.headlineBand,
		impact_type: deriveImpactType(occupation.structuralPressure, 1 - occupation.demandResilience),
		confidence: {
			score: occupation.confidence.score,
			level: occupation.confidence.level
		},
		evidence: {
			sol_match: false,
			jobs_in_demand_match: false
		},
		valueKind: 'wage',
		canonicalCode: occupation.canonicalCode,
		localCode: occupation.localCode,
		ssoc: occupation.localCode
	};
}

function aggregateGroupFootprint(items: HomeSurfaceItem[]): HomeSurfaceItem[] {
	const totals = new Map<string, number>();
	for (const item of items) {
		totals.set(item.groupKey, (totals.get(item.groupKey) ?? 0) + item.surfaceFootprint);
	}
	return items.map(item => ({
		...item,
		group_employment_thousands: totals.get(item.groupKey) ?? item.group_employment_thousands
	}));
}

function buildGlobalMetrics(items: HomeSurfaceItem[]): HomeSurfaceMetric[] {
	const total = items.length;
	const highPressure = items.filter(
		item => item.risk_band === 'high' || item.risk_band === 'very_high'
	).length;
	const mappedOccupations = items.reduce((sum, item) => sum + item.surfaceFootprint, 0);
	return [
		{
			label: 'Upper score bands',
			value: formatPercent(total > 0 ? highPressure / total : 0),
			note: '',
			tooltip: 'Share of occupations in the upper two bands of the relative V8 AI exposure ranking.'
		},
		{
			label: 'Upper-band occupations',
			value: highPressure.toLocaleString(),
			note: '',
			tooltip: 'Occupations in the upper two bands of the relative V8 AI exposure ranking.'
		},
		{
			label: 'Occupations scored',
			value: formatCompactCount(mappedOccupations),
			note: '',
			tooltip: 'Total underlying occupations scored across the shared structural baseline (4-source AI exposure ensemble). On the map these are consolidated into comparable occupation groups, so the map shows fewer nodes than this count.'
		}
	];
}

function buildCountryMetrics(items: HomeSurfaceItem[]): HomeSurfaceMetric[] {
	const total = items.length;
	const highPressure = items.filter(
		item => item.risk_band === 'high' || item.risk_band === 'very_high'
	).length;
	const strongDemand = items.filter(item => item.demandContext === 'strong').length;
	return [
		{
			label: 'Occupations analysed',
			value: total.toLocaleString(),
			note: '',
			tooltip: 'Singapore SSOC occupations included in the current public release.'
		},
		{
			label: 'Higher AI exposure',
			value: highPressure.toLocaleString(),
			note: '',
			tooltip: 'Occupations in the High or Very High fifths of the Singapore AI Exposure Rank.'
		},
		{
			label: 'Strong current demand',
			value: strongDemand.toLocaleString(),
			note: '',
			tooltip: 'Occupations with strong current demand in the official-derived labour-market context.'
		}
	];
}

export const homeSurfaceChoices = surfaceChoices;

export function resolveHomeSurfaceCode(value: string | null | undefined): HomeSurfaceCode {
	void value;
	return 'sg';
}

export function getHomeSurface(code: HomeSurfaceCode): HomeSurface {
	if (code === 'sg') {
		const items = aggregateGroupFootprint(occupations.map(mapSingaporeItem));
		return {
			code,
			config: countryConfigs.sg,
			title: 'Singapore',
			description:
				'Local wages, demand signals, and policy context for Singapore occupations.',
			summary: 'Singapore occupations with local wages and demand data.',
			drilldownLabel: 'Open Singapore hub',
			drilldownHref: countryConfigs.sg.routePrefix,
			valueLabel: 'median wage',
			chartNotes: {
				treemap: 'Size = median wage · Colour = AI Exposure Rank',
				matrix: 'AI Exposure Rank vs current demand',
				histogram: 'AI Exposure Rank distribution'
			},
			metrics: buildCountryMetrics(items),
			occupations: items
		};
	}

	if (code === 'us') {
		const items = aggregateGroupFootprint(usOccupations.map(mapUnitedStatesItem));
		return {
			code,
			config: countryConfigs.us,
			title: 'United States',
			description:
				'BLS wages and employment projections for US occupations.',
			summary: 'US occupations with BLS wages and employment projections.',
			drilldownLabel: 'Open United States hub',
			drilldownHref: countryConfigs.us.routePrefix,
			valueLabel: 'median wage',
			chartNotes: {
				treemap: 'Withdrawn score surface',
				matrix: 'Withdrawn score surface',
				histogram: 'Withdrawn score surface'
			},
			metrics: buildCountryMetrics(items),
			occupations: items
		};
	}

	const items = aggregateGroupFootprint(globalOccupations.map(mapGlobalItem));
	return {
		code: 'global',
		config: countryConfigs.global,
		title: 'Global structural index',
		description:
			'Comparable AI exposure rankings across all occupations, before country-specific data.',
		summary: 'Comparable global scores without country-specific data.',
		drilldownLabel: 'Open global methodology',
		drilldownHref: countryConfigs.global.routePrefix,
		valueLabel: valueKindLabel('count'),
		chartNotes: {
			treemap: 'Withdrawn score surface',
			matrix: 'Withdrawn score surface',
			histogram: 'Withdrawn score surface'
		},
		metrics: buildGlobalMetrics(items),
		occupations: items
	};
}
