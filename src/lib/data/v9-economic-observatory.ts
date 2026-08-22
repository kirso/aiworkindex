import economicObservatoryData from './v9-economic-observatory.json';

export type V9EconomicMechanismStatus =
	| 'partial'
	| 'context_only'
	| 'research_only'
	| 'broad_context';

export interface V9EconomicMechanism {
	id: string;
	question: string;
	v9_evidence: string;
	status: V9EconomicMechanismStatus;
	missing_for_outcome: string[];
}

export interface V9EconomicOccupationCoverage {
	ssoc: string;
	major_group_code: string;
	pressure: 'ranked' | 'unranked';
	direct_wage: boolean;
	named_demand_sources: number;
	broad_employment_context: boolean;
	broad_labour_context: boolean;
	detailed_ai_adoption: false;
	detailed_output_or_price_elasticity: false;
	detailed_new_task_creation: false;
	detailed_job_quality_change: false;
	causal_ai_labour_outcome: false;
	economic_scenario: 'withheld_insufficient_compatible_evidence';
}

export interface V9EconomicIndustryItem {
	key: string;
	label: string;
	employment_2025: number;
	share_2025: number;
	cagr_5y: number | null;
	change_2y: number | null;
	vacancy_latest: number | null;
	vacancy_quarter: string | null;
	vacancy_trend_4q_pct: number | null;
	vacancy_signal: 'rising' | 'stable' | 'cooling' | null;
}

export interface V9EconomicGroupProfile {
	major_group: { code: string; title: string };
	measurement_status:
		| 'observed_broad_occupation_group'
		| 'unavailable_separate_broad_group_row';
	employment: {
		grain: 'broad_occupation_group';
		geography: 'Singapore residents';
		unit: 'thousand_employed_residents';
		series: Record<string, number | null>;
		latest: { period: '2025'; value: number | null };
		derived_change: { year_over_year_pct: number | null; since_2019_pct: number | null };
	} | null;
	workforce: {
		grain: 'broad_occupation_group';
		geography: 'Singapore residents';
		period: string;
		age_share: {
			age_15_29: number;
			age_30_49: number;
			age_50_59: number;
			age_60_plus: number;
		};
		female_share: number;
		self_employed_share: number;
		part_time_share: number;
	} | null;
	industry_footprint: {
		grain: 'broad_occupation_group_by_industry';
		geography: 'Singapore residents';
		period: '2025';
		top_industries: V9EconomicIndustryItem[];
		fastest_growing_industries: V9EconomicIndustryItem[];
		vacancy_overlay_period: string | null;
	} | null;
	labour_context: {
		cluster_key: 'pmet' | 'clerical_sales_service' | 'production_transport';
		vacancy: Record<string, unknown>;
		hiring: Record<string, unknown> | null;
		retrenchment: Record<string, unknown> | null;
		re_entry?: Record<string, unknown>;
		summary: string;
		data_as_of: string;
		source: string;
	} | null;
	limitations: string[];
}

interface V9EconomicObservatoryData {
	schema_version: '9.0';
	release: string;
	generated_at: string;
	review_cutoff: string;
	headline_effect: 'none';
	claim_boundary: string;
	causal_model: {
		outcome_identity: string;
		mechanisms: V9EconomicMechanism[];
		scenario_policy: string;
	};
	sources: Record<string, unknown>;
	national_context: {
		ai_adoption: Record<string, unknown>;
		vacancy_update: Record<string, unknown>;
		labour_market_q2_advance: Record<string, unknown>;
		early_career: Record<string, unknown>;
		limitations: string[];
	};
	coverage: {
		detailed_occupations: number;
		pressure_ranked: number;
		direct_wage: number;
		named_demand: number;
		broad_employment_context: number;
		broad_labour_context: number;
		detailed_ai_adoption: 0;
		detailed_output_or_price_elasticity: 0;
		detailed_new_task_creation: 0;
		detailed_job_quality_change: 0;
		causal_ai_labour_outcomes: 0;
		classified_economic_scenarios: 0;
	};
	group_profiles: Record<string, V9EconomicGroupProfile>;
	occupation_coverage: V9EconomicOccupationCoverage[];
	publication_gates: Record<string, string>;
}

export const v9EconomicObservatory = economicObservatoryData as V9EconomicObservatoryData;
export const v9EconomicMechanisms = v9EconomicObservatory.causal_model.mechanisms;
export const v9EconomicGroupProfiles = v9EconomicObservatory.group_profiles;
export const v9EconomicCoverageByCode = new Map(
	v9EconomicObservatory.occupation_coverage.map(row => [row.ssoc, row])
);

export interface V9EconomicOccupationView {
	coverage: V9EconomicOccupationCoverage;
	group: {
		code: string;
		title: string;
		measurementStatus: V9EconomicGroupProfile['measurement_status'];
		employmentLatestThousands: number | null;
		employmentYearOverYearPct: number | null;
		employmentSince2019Pct: number | null;
		youngWorkerShare: number | null;
		age50PlusShare: number | null;
		femaleShare: number | null;
		selfEmployedShare: number | null;
		partTimeShare: number | null;
		topIndustries: V9EconomicIndustryItem[];
		labourSummary: string | null;
		vacancyRate: number | null;
		vacancyCountThousands: number | null;
		vacancyPeriod: string | null;
	} | null;
}

function numericField(record: Record<string, unknown> | undefined, key: string): number | null {
	const value = record?.[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function getV9EconomicOccupationContext(ssoc: string) {
	const coverage = v9EconomicCoverageByCode.get(ssoc) ?? null;
	const group = coverage ? (v9EconomicGroupProfiles[coverage.major_group_code] ?? null) : null;
	if (!coverage) return null;
	if (!group) return { coverage, group: null } satisfies V9EconomicOccupationView;

	const vacancy = group.labour_context?.vacancy;
	return {
		coverage,
		group: {
			code: group.major_group.code,
			title: group.major_group.title,
			measurementStatus: group.measurement_status,
			employmentLatestThousands: group.employment?.latest.value ?? null,
			employmentYearOverYearPct: group.employment?.derived_change.year_over_year_pct ?? null,
			employmentSince2019Pct: group.employment?.derived_change.since_2019_pct ?? null,
			youngWorkerShare: group.workforce?.age_share.age_15_29 ?? null,
			age50PlusShare: group.workforce
				? group.workforce.age_share.age_50_59 + group.workforce.age_share.age_60_plus
				: null,
			femaleShare: group.workforce?.female_share ?? null,
			selfEmployedShare: group.workforce?.self_employed_share ?? null,
			partTimeShare: group.workforce?.part_time_share ?? null,
			topIndustries: group.industry_footprint?.top_industries ?? [],
			labourSummary: group.labour_context?.summary ?? null,
			vacancyRate: numericField(vacancy, 'latest_rate'),
			vacancyCountThousands: numericField(vacancy, 'latest_count'),
			vacancyPeriod:
				typeof vacancy?.latest_quarter === 'string' ? vacancy.latest_quarter : null
		}
	} satisfies V9EconomicOccupationView;
}
