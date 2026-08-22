import evidenceVectorData from './v9-evidence-vector.json';
import signalChangeData from './v9-signal-change.json';

export interface V9EvidenceVectorRecord {
	occupation: {
		ssoc2024: string;
		title: string;
		major_group: { code: string; title: string };
	};
	dimensions: {
		task_pressure: null | {
			value: { pressure_midrank_percentile: number; mean_score_2025: number; category_range: string[] };
		};
		capability_proximity: null | {
			value: { proximity_0_1: number; within_shared_subset_midrank_percentile: number };
		};
		theoretical_exposure: null | { value: number };
		observed_use: null | { value: number };
		direct_pay: null | { value: { p25: number; median: number; p75: number } };
		named_demand: null | { value: { source_count: number } };
		broad_labour_context: null | {
			value: { employment_thousands: number; year_over_year_pct: number | null };
		};
		official_skills: null | {
			value: {
				sector_profiles: Array<{
					sector: string;
					source_job_role: string;
					technical_skill_count: number;
					core_skill_count: number;
				}>;
			};
		};
	};
	shared_subset_comparison: null | {
		population: number;
		pressure_midrank_percentile: number;
		capability_midrank_percentile: number;
		pressure_minus_capability_percentile_points: number;
		interpretation: string;
	};
	patterns: Array<{ key: string; label: string; basis: string }>;
}

interface EvidenceVectorArtifact {
	schema_version: '9.0';
	release: 'V9';
	generated_at: string;
	snapshot_id: string;
	headline_effect: string;
	construct: 'multi_signal_occupation_evidence_vector';
	claim_boundary: string;
	comparison_rule: Record<string, string>;
	coverage: {
		ssoc_occupations: number;
		shared_pressure_capability_subset: number;
		dimensions: {
			task_pressure: number;
			capability_proximity: number;
			theoretical_exposure: number;
			observed_use: number;
			direct_pay: number;
			named_demand: number;
			broad_labour_context: number;
			official_skills: number;
		};
		pattern_counts: {
			capability_proximity_above_task_pressure: number;
			high_pressure_with_named_demand: number;
			high_pressure_with_official_skill_path: number;
			task_pressure_above_capability_proximity: number;
			technical_scope_ahead_of_observed_use: number;
		};
	};
	records: V9EvidenceVectorRecord[];
}

export interface V9ObservedChange {
	key: string;
	label: string;
	geography: string;
	grain: string;
	from?: { period: string; value: number };
	to?: { period: string; value: number };
	period?: string;
	latest_value?: number;
	unit: string;
	change_pct?: number;
	year_over_year_pct?: number;
	since_2019_pct?: number;
	source: { title: string; url: string } | { artifact: string };
}

interface SignalChangeArtifact {
	schema_version: '9.0';
	release: 'V9';
	generated_at: string;
	headline_effect: 'none';
	construct: 'signal_specific_change_ledger';
	claim_boundary: string;
	baseline_snapshot: { id: string; artifact: string; status: string };
	pressure_change: {
		status: 'baseline_only';
		current_snapshot: string;
		previous_comparable_snapshot: null;
		reason: string;
	};
	observed_changes: V9ObservedChange[];
	withheld_change_products: Record<string, string>;
}

export const v9EvidenceVector = evidenceVectorData as EvidenceVectorArtifact;
export const v9SignalChange = signalChangeData as SignalChangeArtifact;

export function getV9EvidenceVectorRecord(ssoc: string): V9EvidenceVectorRecord | null {
	return v9EvidenceVector.records.find(record => record.occupation.ssoc2024 === ssoc) ?? null;
}
