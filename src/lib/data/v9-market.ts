import marketData from './v9-market-context.json';

export interface V9DemandSignal {
	source_key: 'mom_jobs_in_demand_2025' | 'mom_sol_2026';
	label: string;
	published_at: string;
	effective_at: string | null;
	url: string;
	source_occupation: string;
	mapping_basis: 'reviewed_against_ssoc_2024_title_and_synonyms';
	rationale: string;
	interpretation: string;
}

export interface V9LabourContext {
	cluster_key: 'pmet' | 'clerical_sales_service' | 'production_transport';
	vacancy: Record<string, unknown>;
	hiring: Record<string, unknown> | null;
	retrenchment: Record<string, unknown> | null;
	re_entry?: Record<string, unknown>;
	summary: string;
	data_as_of: string;
	source: string;
}

const data = marketData as unknown as {
	demand_by_code: Record<string, V9DemandSignal[]>;
	labour_by_major_group: Record<string, V9LabourContext | null>;
	national: typeof marketData.national;
	withheld_demand_mappings: Array<{ source_key: string; source_occupation: string; reason: string }>;
};

export const v9DemandByCode = new Map(Object.entries(data.demand_by_code));
export const v9LabourByMajorGroup = new Map(Object.entries(data.labour_by_major_group));
export const v9NationalContext = data.national;
export const v9WithheldDemandMappings = data.withheld_demand_mappings;
