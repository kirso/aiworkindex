import occupationsData from './occupations.json';
import majorGroupsData from './major-groups.json';
import labourMonitorData from './labour-monitor.json';
import type { OccupationDataBasis, EmploymentBasis } from './data-contract';

// Current structural-release types
export type RiskBand = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

export interface MarketScores {
	market_momentum: number;
	industry_footprint_momentum?: number | null;
	market_resolution?: 'group_prior' | 'industry_footprint_blend';
	occupation_scarcity: number;
	market_resilience: number;
	market_modifier: number;
}

export interface ConfidenceScores {
	score: number;
	level: 'high' | 'medium' | 'low';
	threshold_level?: 'high' | 'medium' | 'low';
	policy_cap_reason?:
		| 'insufficient_source_count'
		| 'fallback_mapping'
		| 'major_fallback_mapping'
		| 'signal_conflict'
		| null;
	crosswalk_quality: number;
	market_data_granularity: number;
	source_freshness: number;
	source_coverage?: number;
	signal_agreement?: number;
	sensitivity?: number;
	exposure_source_count?: number;
}

export interface EvidenceSignals {
	anthropic_calibrated: boolean;
	anthropic_gap: number | null;
	anthropic_observed_pctile: number | null;
	sol_match: 'exact' | 'prefix' | false;
	jobs_in_demand_match: 'exact' | 'prefix' | false;
	/** GPTs-are-GPTs (Eloundou et al. 2023) exposure percentile, if matched via SOC crosswalk */
	gpt_exposure?: number | null;
	exposure_blend_strategy?: 'reliability_weighted';
	/** Agreement across exposure measures: consensus_high, consensus_low, aligned_mid, divergent, insufficient_data */
	exposure_agreement?: string | null;
	exposure_source_count?: number;
	exposure_source_keys?: string[];
	exposure_source_weights?: Partial<Record<'aioe' | 'anthropic' | 'eloundou' | 'ilo', number>>;
	exposure_source_pctiles?: Partial<Record<'aioe' | 'anthropic' | 'eloundou' | 'ilo', number>>;
	signal_conflict?: boolean;
	signal_conflict_reasons?: string[];
}

export interface StabilityScores {
	optimistic_risk: number;
	optimistic_band: RiskBand;
	pessimistic_risk: number;
	pessimistic_band: RiskBand;
	distance_to_band_edge: number;
	label: 'stable' | 'watch' | 'sensitive';
}

export interface TaskPrimitives {
	matched_task_weight_share: number | null;
	task_effective_coverage: number | null;
	task_exposure_concentration: number | null;
	method: 'anthropic_task_penetration_v1' | null;
}

export interface UncertaintyScores {
	exposure_p10: number;
	exposure_p50: number;
	exposure_p90: number;
	net_risk_p10: number;
	net_risk_p50: number;
	net_risk_p90: number;
	method: 'bootstrap_v1' | 'bootstrap_v1_task_adjusted' | 'latent_source_measurement_v1';
}

export type OccupationScoringBasis =
	| 'task_aware_exposure_v43'
	| 'ensemble_fallback_v42'
	| 'posterior_task_aware_v5'
	| 'posterior_ensemble_fallback_v5';

export interface BaselineV42Scores {
	structural_model_version: 'V4.2';
	exposure: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: AugmentationBand;
	impact_type: ImpactType;
	uncertainty?: UncertaintyScores;
}

export interface BaselineV43Scores {
	structural_model_version: 'V4.3';
	exposure: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: AugmentationBand;
	impact_type: ImpactType;
	uncertainty?: UncertaintyScores;
	scoring_basis?: 'task_aware_exposure_v43' | 'ensemble_fallback_v42';
}

export interface LabourClusterMonitor {
	cluster_key: 'pmet' | 'clerical_sales_service' | 'production_transport';
	cluster_label: string;
	vacancy: {
		latest_rate: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: 1 | 0 | -1;
		recent_quarters: Array<{ quarter: string; rate: number }>;
		qoq_delta_pp?: number;
		/** Annual rates for sparkline: 2022, 2023, 2024, latest */
		annual_rates?: Array<{ year: string; rate: number }>;
		/** Published vacancy counts for the same cluster, where available. */
		latest_count?: number;
		count_trend_4q_pct?: number;
		count_signal?: 1 | 0 | -1;
		count_qoq_delta?: number;
		recent_counts?: Array<{ quarter: string; count: number }>;
		annual_counts?: Array<{ year: string; count: number }>;
	};
	hiring: {
		recruitment_rate: number;
		resignation_rate: number;
		net_pressure: number;
		signal: 1 | 0 | -1;
		quarter?: string;
		frequency?: 'quarterly' | 'annual';
		recruitment_delta_pp?: number;
		resignation_delta_pp?: number;
		net_pressure_delta_pp?: number;
		note?: string;
	} | null;
	retrenchment: {
		latest_count: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: 1 | 0 | -1;
		recent_quarters: Array<{ quarter: string; count: number }>;
		/** Per 1,000 employees */
		incidence_per_1000?: number;
		qoq_delta_count?: number;
		trend_direction?: 'rising' | 'stable' | 'falling';
	} | null;
	/** Re-entry rate for retrenched workers */
	re_entry?: {
		rate_6m: number;
		rate_12m: number;
		quarter: string;
		rate_6m_delta_pp?: number;
		rate_12m_delta_pp?: number;
		note?: string;
	};
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	summary?: string;
	data_as_of: string;
	source?: string;
	provenance?: {
		method: 'raw_only' | 'raw_plus_report_enrichment';
		report?: {
			label: string;
			published_at: string;
			url: string;
		};
		fields: Record<
			string,
			{
				source_key: string;
				source_type: 'official_raw_feed' | 'official_report_table' | 'derived_official';
				vintage: string;
				reference: string;
				transform?: string;
				note?: string;
			}
		>;
	};
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

export interface SgContext {
	pwm_covered: boolean;
	licensed_profession: 'strict' | 'partial' | false;
	foreign_worker_dependency: 'very_high' | 'high' | 'moderate' | false;
	skillsfuture_eligible: boolean;
}

export interface Occupation {
	ssoc: string;
	title: string;
	major_group: string;
	major_group_code: number;
	gross_wage_median: number;
	gross_wage_25th: number;
	gross_wage_75th: number;
	/** Explicit Singapore estimate derived from published 2-digit occupation-family totals. */
	estimated_sg_employment_thousands?: number;
	/** Legacy compatibility alias for the same estimated Singapore employment field. */
	employment_thousands: number;
	employment_basis?: EmploymentBasis;
	employment_family_code?: string | null;
	employment_family_total_thousands?: number | null;
	employment_weight_within_family?: number | null;
	employment_estimate_method?: 'bls_wage_blend' | 'bls_only' | 'wage_only' | 'equal_fallback' | null;
	/** BLS-weighted proxy used for illustrative wage-pool analysis; not an official Singapore headcount. */
	bls_proxy_employment?: number;
	group_employment_thousands: number;
	data_basis?: OccupationDataBasis;
	labour_monitor_key?: LabourClusterMonitor['cluster_key'] | null;
	// Current structural-release fields
	exposure: number;
	bottleneck: number;
	market: MarketScores;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	augmentation_band: AugmentationBand;
	impact_type: ImpactType;
	structural_model_version?: 'V4.2' | 'V4.3' | 'V5';
	scoring_basis?: OccupationScoringBasis;
	baseline_v42?: BaselineV42Scores;
	baseline_v43?: BaselineV43Scores;
	structural_risk?: number;
	structural_risk_band?: RiskBand;
	transition_adjusted_risk?: number;
	transition_adjusted_band?: RiskBand;
	transition_adjusted_impact_type?: ImpactType;
	realized_risk_proxy?: number;
	adaptation_capacity?: number;
	adaptation_buffer?: number;
	demand_fragility?: number;
	reallocation_capacity?: number;
	profile?: string;
	best_transition?: {
		to_ssoc: string;
		to_title: string;
		composite: number;
		observed_transition_rate: number | null;
		destination_quality: number;
		wage_preservation: number;
		training_ease: number;
		empirical_priority: number;
	} | null;
	evidence: EvidenceSignals;
	confidence: ConfidenceScores;
	stability: StabilityScores;
	task_primitives?: TaskPrimitives;
	uncertainty?: UncertaintyScores;
	labour_monitor: LabourClusterMonitor | null;
	raw: RawScores;
	isco_codes_matched: string[];
	match_quality: string;
	// Backward-compat
	scores: OccupationScores;
	// Optional workflow overlay (Phase 1A)
	workflow_overlay?: import('./workflow-overlay').WorkflowOverlay;
	// Singapore context fields
	education_level?: number;
	education_label?: string;
	sg_context?: SgContext;
}

interface RawOccupation extends Omit<Occupation, 'labour_monitor'> {
	labour_monitor?: LabourClusterMonitor | null;
}

export interface MajorGroup {
	code: number;
	key: string;
	label: string;
	color: string;
}

export const labourMonitors: LabourClusterMonitor[] = labourMonitorData as LabourClusterMonitor[];

export const labourMonitorByKey = new Map<string, LabourClusterMonitor>(
	labourMonitors.map((monitor) => [monitor.cluster_key, monitor])
);

const rawOccupations: RawOccupation[] = occupationsData as RawOccupation[];

export const occupations: Occupation[] = rawOccupations.map((occupation) => ({
	...occupation,
	labour_monitor:
		occupation.labour_monitor_key != null
			? (labourMonitorByKey.get(occupation.labour_monitor_key) ?? null)
			: (occupation.labour_monitor ?? null)
}));
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
	very_low: 'var(--color-risk-very-low)',
	low: 'var(--color-risk-low)',
	moderate: 'var(--color-risk-moderate)',
	high: 'var(--color-risk-high)',
	very_high: 'var(--color-risk-very-high)'
};

export const impactTypeLabels: Record<ImpactType, string> = {
	ai_leveraged: 'Augmented',
	at_risk: 'At Risk',
	stable: 'Stable',
	mixed: 'Mixed'
};

export const impactTypeColors: Record<ImpactType, string> = {
	ai_leveraged: 'var(--color-impact-leveraged)',
	at_risk: 'var(--color-risk-very-high)',
	stable: 'var(--color-text-tertiary)',
	mixed: 'var(--color-risk-moderate)'
};

export const augmentationBandLabels: Record<AugmentationBand, string> = {
	very_low: 'Very Low',
	low: 'Low',
	moderate: 'Moderate',
	high: 'High',
	very_high: 'Very High'
};
