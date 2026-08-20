export type V9ScoreStatus = 'scored' | 'insufficient_evidence';

export type V9IloExposureCategory =
	| 'Not Exposed'
	| 'Minimal Exposure'
	| 'Exposed: Gradient 1'
	| 'Exposed: Gradient 2'
	| 'Exposed: Gradient 3'
	| 'Exposed: Gradient 4';

export type V9EvidenceKind = 'observed' | 'derived' | 'modelled' | 'context';

export interface V9EvidenceSource {
	id: string;
	publisher: string;
	title: string;
	url: string;
	release_date: string | null;
}

/**
 * Evidence outside the headline ILO exposure model stays in a separate nullable block.
 * Adding, removing, or changing one of these blocks must never change the pressure rank.
 */
export interface V9EvidenceBlock<TValue> {
	construct: string;
	evidence_kind: V9EvidenceKind;
	value: TValue;
	geography: string;
	reference_period: string | null;
	source: V9EvidenceSource;
	mapping: {
		method: string;
		quality: 'direct' | 'official_crosswalk' | 'external_crosswalk' | 'broad_context';
	} | null;
	limitations: string[];
}

export interface V9HierarchyEntry {
	code: string;
	title: string;
}

export interface V9IloIscoEvidence {
	isco08_code: string;
	mean_score_2025: number;
	task_score_sd_2025: number;
	potential25: V9IloExposureCategory;
}

export interface V9GenAiTaskExposure {
	source: 'ilo_genai_2025';
	mean_score_2025: {
		median: number;
		min: number;
		max: number;
	};
	task_score_sd_2025: {
		median: number;
		min: number;
		max: number;
		meaning: 'within_isco_occupation_task_score_dispersion';
	};
	potential25: {
		categories: V9IloExposureCategory[];
		least_exposed: V9IloExposureCategory;
		most_exposed: V9IloExposureCategory;
	};
	pressure_rank: {
		percentile: number;
		midrank_position: number;
		method: 'midrank_percentile';
		comparison_population: 'scored_ssoc_2024_occupations';
		population_size: number;
		direction: 'higher_means_more_genai_task_exposure';
	};
	official_isco08_codes: string[];
	scored_isco08_matches: V9IloIscoEvidence[];
	unscored_official_isco08_codes: string[];
	aggregation: 'median_across_scored_official_isco_matches';
}

export interface V9WageValues {
	basic_monthly_sgd: { p25: number; median: number; p75: number };
	gross_monthly_sgd: { p25: number; median: number; p75: number };
}

export type V9WageEvidence = V9EvidenceBlock<V9WageValues>;

export type V9ExternalComparisonValue = Record<string, number | string | boolean | null>;
export type V9MarketEvidenceValue = Record<string, number | string | boolean | null>;

export type V9ExternalComparisonKey =
	| 'aioe'
	| 'eloundou'
	| 'observed_ai_use'
	| 'potential_complementarity';

export interface V9ExternalComparisonDisposition {
	target_field: `comparison_evidence.${V9ExternalComparisonKey}`;
	construct: string;
	status:
		| 'withheld_pending_source_taxonomy_version_and_many_to_many_transfer_validation'
		| 'withheld_soc2010_to_onet_soc2019_version_bridge_missing'
		| 'withheld_unverified_construct_replication';
	checked_in_source: {
		artifact: string;
		value_field: string;
		occupation_code_system: string;
		observation_vintage: string | null;
		source: V9EvidenceSource;
	};
	mapping: {
		method:
			| 'official_ssoc_2024_to_isco08_then_verified_isco08_to_soc_then_exact_source_soc';
		quality:
			| 'audited_candidate_chain_transfer_not_validated'
			| 'rejected_soc_version_mismatch'
			| 'rejected_construct_replication';
		aggregation: 'not_applied';
	};
	published_coverage: {
		occupations: 0;
		denominator: 1001;
		percent: 0;
	};
	limitations: string[];
}

export interface V9ExternalComparisonAudit {
	headline_effect: 'none';
	mapping_policy:
		| 'official_ssoc_2024_to_isco08_then_verified_isco08_to_soc_then_exact_source_soc';
	reviewed_mapping_artifact: {
		path: 'data/v9-external-crosswalk-audit.json';
		status: 'official_candidate_chain_available_transfer_not_published';
		reasons: string[];
	};
	sidecars: Record<V9ExternalComparisonKey, V9ExternalComparisonDisposition>;
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
		eloundou: V9EvidenceBlock<V9ExternalComparisonValue> | null;
		aioe: V9EvidenceBlock<V9ExternalComparisonValue> | null;
		observed_ai_use: V9EvidenceBlock<V9ExternalComparisonValue> | null;
		potential_complementarity: V9EvidenceBlock<V9ExternalComparisonValue> | null;
	};
	singapore_market: {
		wages: V9WageEvidence | null;
		demand: V9EvidenceBlock<V9MarketEvidenceValue> | null;
		labour_context: V9EvidenceBlock<V9MarketEvidenceValue> | null;
		entry_level: V9EvidenceBlock<V9MarketEvidenceValue> | null;
	};
	evidence: {
		mapping_quality: 'one_to_one' | 'one_to_many' | 'partial' | 'unmatched';
		support: 'official_crosswalk' | 'official_crosswalk_without_ilo_score' | 'unmatched';
		official_isco08_codes: string[];
		sources: string[];
		limitations: string[];
		data_as_of: '2026-08-19';
	};
}
