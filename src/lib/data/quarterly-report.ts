import quarterlyReportData from './quarterly-report.json';

export interface BandMover {
	ssoc: string;
	title: string;
	from_band: string;
	to_band: string;
	risk_delta: number;
}

export interface DriftEntry {
	ssoc: string;
	title: string;
	old_risk: number;
	new_risk: number;
	delta: number;
}

export interface QuarterlyReport {
	generated_at: string;
	public_contract_version: string;
	structural_snapshot_version: string;
	current_snapshot: string;
	previous_snapshot: string | null;
	total_occupations: number;
	band_distribution: Record<string, number>;
	band_movers: BandMover[];
	top_risers: DriftEntry[];
	top_fallers: DriftEntry[];
	demand_changes: {
		new_sol: string[];
		removed_sol: string[];
		new_jid: string[];
		removed_jid: string[];
	};
	labour_monitor?: {
		data_as_of: string;
		source: string | null;
		strongest_vacancy_pickup: string | null;
		sharpest_vacancy_cooling: string | null;
		clusters: Array<{
			cluster_key: string;
			cluster_label: string;
			overall: string;
			summary: string | null;
			vacancy_rate: number;
			vacancy_qoq_delta_pp: number | null;
			vacancy_count: number | null;
			vacancy_count_qoq_delta: number | null;
			recruitment_rate: number | null;
			recruitment_delta_pp: number | null;
			resignation_rate: number | null;
			resignation_delta_pp: number | null;
			retrenchment_count: number | null;
			retrenchment_qoq_delta_count: number | null;
			reentry_6m: number | null;
			reentry_6m_delta_pp: number | null;
			reentry_12m: number | null;
			reentry_12m_delta_pp: number | null;
		}>;
	};
	summary?: {
		band_mover_count: number;
		positive_drift_count: number;
		negative_drift_count: number;
	};
	briefing?: {
		what_changed: string[];
		why_it_matters: string[];
		what_to_watch: string[];
	};
}

export const quarterlyReport = quarterlyReportData as QuarterlyReport;
