export type ExposureBand = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
export type V9ScoreStatus = 'scored' | 'insufficient_evidence';

export interface V9HierarchyEntry {
	code: string;
	title: string;
}

export interface V9GenAiTaskExposure {
	source: 'ilo_genai_2025';
	raw_median: number;
	raw_min: number;
	raw_max: number;
	percentile: number;
	band: ExposureBand;
	isco08_codes: string[];
	aggregation: 'median_across_official_isco_matches';
}

export interface V9WageEvidence {
	source: 'mom_occupational_wages_2025';
	population: 'full_time_resident_employees_in_establishments_25_plus';
	reference_period: '2025-06';
	basic_monthly_sgd: { p25: number; median: number; p75: number };
	gross_monthly_sgd: { p25: number; median: number; p75: number };
}

export interface V9Occupation {
	schema_version: '9.0';
	taxonomy: {
		system: 'SSOC';
		edition: '2024';
		code: string;
		title: string;
		hierarchy: {
			major_group: V9HierarchyEntry;
			sub_major_group: V9HierarchyEntry | null;
			minor_group: V9HierarchyEntry | null;
			unit_group: V9HierarchyEntry | null;
		};
		detailed_definition: string | null;
		tasks: string[];
		search_synonyms: string[];
	};
	score_status: V9ScoreStatus;
	genai_task_exposure: V9GenAiTaskExposure | null;
	comparison_evidence: {
		eloundou: null;
		aioe: null;
		observed_ai_use: null;
		potential_complementarity: null;
	};
	singapore_market: {
		wages: V9WageEvidence | null;
		demand: null;
		labour_context: null;
		entry_level: null;
	};
	evidence: {
		mapping_quality: 'one_to_one' | 'one_to_many' | 'partial' | 'unmatched';
		support: 'official_crosswalk' | 'unavailable';
		sources: string[];
		limitations: string[];
		data_as_of: '2026-08-19';
	};
}
