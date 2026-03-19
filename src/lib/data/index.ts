import occupationsData from './occupations.json';
import majorGroupsData from './major-groups.json';
import labourMonitorData from './labour-monitor.json';
import type { OccupationDataBasis, EmploymentBasis } from './data-contract';

// V4.0 types
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

export interface LabourClusterMonitor {
	cluster_key: 'pmet' | 'clerical_sales_service' | 'production_transport';
	cluster_label: string;
	vacancy: {
		latest_rate: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: 1 | 0 | -1;
		recent_quarters: Array<{ quarter: string; rate: number }>;
		/** Annual rates for sparkline: 2022, 2023, 2024, latest */
		annual_rates?: Array<{ year: string; rate: number }>;
		/** Published vacancy counts for the same cluster, where available. */
		latest_count?: number;
		count_trend_4q_pct?: number;
		count_signal?: 1 | 0 | -1;
		recent_counts?: Array<{ quarter: string; count: number }>;
		annual_counts?: Array<{ year: string; count: number }>;
	};
	hiring: {
		recruitment_rate: number;
		resignation_rate: number;
		net_pressure: number;
		signal: 1 | 0 | -1;
	} | null;
	retrenchment: {
		latest_count: number;
		latest_quarter: string;
		trend_4q_pct: number;
		signal: 1 | 0 | -1;
		recent_quarters: Array<{ quarter: string; count: number }>;
		/** Per 1,000 employees */
		incidence_per_1000?: number;
	} | null;
	/** Re-entry rate for retrenched workers */
	re_entry?: {
		rate_6m: number;
		rate_12m: number;
		quarter: string;
	};
	overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
	summary?: string;
	data_as_of: string;
	source?: string;
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
	/** Explicit Singapore estimate derived from published sub-major occupation totals. */
	estimated_sg_employment_thousands?: number;
	/** Legacy compatibility alias for the same estimated Singapore employment field. */
	employment_thousands: number;
	employment_basis?: EmploymentBasis;
	/** BLS-weighted proxy used for illustrative wage-pool analysis; not an official Singapore headcount. */
	bls_proxy_employment?: number;
	group_employment_thousands: number;
	data_basis?: OccupationDataBasis;
	labour_monitor_key?: LabourClusterMonitor['cluster_key'] | null;
	// V4.0 fields
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
	very_low: '#4ade80',
	low: '#86efac',
	moderate: '#fbbf24',
	high: '#f97316',
	very_high: '#ef4444'
};

export const impactTypeLabels: Record<ImpactType, string> = {
	ai_leveraged: 'Augmented',
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
