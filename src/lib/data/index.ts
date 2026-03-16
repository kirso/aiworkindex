import occupationsData from './occupations.json';
import majorGroupsData from './major-groups.json';

// V3 types
export type RiskBand = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface MarketScores {
	market_momentum: number;
	occupation_scarcity: number;
	market_resilience: number;
	market_modifier: number;
}

export interface ConfidenceScores {
	score: number;
	level: 'high' | 'medium' | 'low';
	crosswalk_quality: number;
	market_data_granularity: number;
	source_freshness: number;
}

export interface EvidenceSignals {
	anthropic_calibrated: boolean;
	anthropic_gap: number | null;
	anthropic_observed_pctile: number | null;
	sol_match: 'exact' | 'prefix' | false;
	jobs_in_demand_match: 'exact' | 'prefix' | false;
}

export interface StabilityScores {
	optimistic_risk: number;
	optimistic_band: RiskBand;
	pessimistic_risk: number;
	pessimistic_band: RiskBand;
	distance_to_band_edge: number;
	label: 'stable' | 'watch' | 'sensitive';
}

export interface VacancyQuarter {
	quarter: string;
	openings: number;
}

export interface VacancyMonitor {
	cluster_key: 'pmet' | 'clerical_sales_service' | 'production_transport';
	cluster_label: string;
	latest_quarter: string | null;
	latest_openings: number | null;
	previous_quarter: string | null;
	previous_openings: number | null;
	change_qoq: number | null;
	four_quarter_average: number | null;
	trend_8q: 'heating_up' | 'cooling_down' | 'stable' | 'unknown';
	trend_score: number | null;
	recent_quarters: VacancyQuarter[];
}

export interface RawScores {
	aioe: number;
	theta: number;
	c_aioe: number;
	log_wage_spread: number | null;
	wage_position: number | null;
}

// Backward-compat scores sub-object (still used by frontend viz)
export interface OccupationScores {
	aioe: number;
	theta: number;
	c_aioe: number;
	category: 'high_exposure_high_complementarity' | 'high_exposure_low_complementarity' | 'low_exposure';
	match_quality: string;
}

export type ImpactType = 'ai_leveraged' | 'at_risk' | 'stable' | 'mixed';
export type AugmentationBand = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface Occupation {
	ssoc: string;
	title: string;
	major_group: string;
	major_group_code: number;
	gross_wage_median: number;
	gross_wage_25th: number;
	gross_wage_75th: number;
	employment_thousands: number;
	group_employment_thousands: number;
	// V3 fields
	exposure: number;
	bottleneck: number;
	market: MarketScores;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: AugmentationBand;
	impact_type: ImpactType;
	evidence: EvidenceSignals;
	confidence: ConfidenceScores;
	stability: StabilityScores;
	vacancy_monitor: VacancyMonitor | null;
	raw: RawScores;
	isco_codes_matched: string[];
	match_quality: string;
	// Backward-compat
	scores: OccupationScores;
}

export interface MajorGroup {
	code: number;
	key: string;
	label: string;
	color: string;
}

export const occupations: Occupation[] = occupationsData as Occupation[];
export const majorGroups: MajorGroup[] = majorGroupsData as MajorGroup[];

export const occupationsBySSoc = new Map<string, Occupation>(
	occupations.map((o) => [o.ssoc, o])
);

export const occupationsByGroup = new Map<string, Occupation[]>();
for (const o of occupations) {
	const list = occupationsByGroup.get(o.major_group) ?? [];
	list.push(o);
	occupationsByGroup.set(o.major_group, list);
}

export const majorGroupByKey = new Map<string, MajorGroup>(
	majorGroups.map((g) => [g.key, g])
);

export const categoryLabels: Record<string, string> = {
	high_exposure_high_complementarity: 'AI Augmented',
	high_exposure_low_complementarity: 'At Risk',
	low_exposure: 'Low Impact'
};

export const categoryColors: Record<string, string> = {
	high_exposure_high_complementarity: '#f28e2b',
	high_exposure_low_complementarity: '#e15759',
	low_exposure: '#59a14f'
};

export const riskBandLabels: Record<RiskBand, string> = {
	very_low: 'Very Low',
	low: 'Low',
	moderate: 'Moderate',
	high: 'High',
	very_high: 'Very High'
};

export const riskBandColors: Record<RiskBand, string> = {
	very_low: '#4ade80',
	low: '#86efac',
	moderate: '#fbbf24',
	high: '#f97316',
	very_high: '#ef4444'
};

export const impactTypeLabels: Record<ImpactType, string> = {
	ai_leveraged: 'AI Leveraged',
	at_risk: 'At Risk',
	stable: 'Stable',
	mixed: 'Mixed'
};

export const impactTypeColors: Record<ImpactType, string> = {
	ai_leveraged: '#2563eb',
	at_risk: '#ef4444',
	stable: '#6b7280',
	mixed: '#f59e0b'
};

export const augmentationBandLabels: Record<AugmentationBand, string> = {
	very_low: 'Very Low',
	low: 'Low',
	moderate: 'Moderate',
	high: 'High',
	very_high: 'Very High'
};
