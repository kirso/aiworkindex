import capabilityData from './v9-capability-profiles.json';

export type V9CapabilityDomainKey =
	| 'language'
	| 'social_interaction'
	| 'problem_solving'
	| 'creativity'
	| 'metacognition_critical_thinking'
	| 'knowledge_learning_memory'
	| 'vision'
	| 'manipulation'
	| 'robotic_intelligence';

export interface V9CapabilitySummary {
	median: number;
	min: number;
	max: number;
	candidate_count: number;
}

export interface V9CapabilityDomain {
	label: string;
	capability_gap: V9CapabilitySummary;
	gap_scale: { min: 0; max: number; lower_is_closer: true };
	job_demand: V9CapabilitySummary;
	demand_scale: { min: 0; max: 5; higher_is_more_demanded: true };
}

export interface V9CapabilityProfile {
	occupation: { ssoc2024: string; title: string };
	status: 'available_exact_title_identity';
	headline_effect: 'none';
	mapping: {
		method: string;
		ssoc_isco_quality: string;
		official_isco08_codes: string[];
		oecd_candidates: Array<{
			onet_soc_code: string;
			title: string;
			relation: 'exactMatch';
			detailed_title_identity: true;
			matched_ssoc_title_variant: string;
		}>;
		raw_exact_candidates_rejected_by_title_rule: number;
		aggregation: 'median_across_unique_exact_title_identity_candidates';
		version_limitation: string;
	};
	overall: {
		ai_capability_proximity_0_1: V9CapabilitySummary;
		total_capability_gap_0_23: V9CapabilitySummary;
		interpretation: string;
	};
	domains: Record<V9CapabilityDomainKey, V9CapabilityDomain>;
}

export type V9CapabilityStatus =
	| {
			status: 'available_exact_title_identity';
			official_isco08_codes: string[];
			raw_exact_oecd_candidate_count: number;
			accepted_title_identity_count: number;
			close_candidates_not_used: number;
	  }
	| {
			status: 'unavailable_no_exact_crosswalk';
			official_isco08_codes: string[];
			exact_oecd_candidate_count: 0;
			close_candidates_not_used: number;
	  }
	| {
			status: 'unavailable_no_detailed_title_identity';
			official_isco08_codes: string[];
			raw_exact_oecd_candidate_count: number;
			accepted_title_identity_count: 0;
			close_candidates_not_used: number;
	  };

interface V9CapabilityArtifact {
	schema_version: '9.0';
	release: 'V9';
	generated_at: string;
	reviewed_at: string;
	headline_effect: 'none';
	construct: 'mapped_oecd_ai_capability_gap_profile';
	claim_boundary: string;
	source: {
		publisher: string;
		title: string;
		publication_title: string;
		publication_date: string;
		publication_revision: string;
		doi: string;
		publication_url: string;
		download_url: string;
		retrieved_at: string;
		occupation_system: string;
		occupation_rows: number;
		licence: { name: string; identifier: string; url: string };
	};
	publication_rule: Record<string, unknown>;
	domains: Array<{
		key: V9CapabilityDomainKey;
		label: string;
		gap_scale: { min: 0; max: number; lower_is_closer: true };
		demand_scale: { min: 0; max: 5; higher_is_more_demanded: true };
	}>;
	coverage: {
		ssoc_occupations: 1001;
		raw_exact_candidate_coverage: number;
		available_exact_title_identity_profiles: number;
		unavailable_without_published_profile: number;
		coverage_pct: number;
		unique_oecd_rows_used: number;
		profiles_with_several_title_identity_candidates: number;
		profiles_with_nonzero_overall_mapping_range: number;
		raw_exact_candidates_rejected_by_title_rule: number;
		occupations_available_only_if_close_matches_were_allowed: number;
		close_match_profiles_published: 0;
	};
	occupation_status: Record<string, V9CapabilityStatus>;
	profiles: Record<string, V9CapabilityProfile>;
}

export const v9CapabilityProfiles = capabilityData as V9CapabilityArtifact;
export const v9CapabilityCoverage = v9CapabilityProfiles.coverage;

export function getV9CapabilityProfile(ssoc: string): V9CapabilityProfile | null {
	return v9CapabilityProfiles.profiles[ssoc] ?? null;
}

export function getV9CapabilityStatus(ssoc: string): V9CapabilityStatus | null {
	return v9CapabilityProfiles.occupation_status[ssoc] ?? null;
}

export function capabilityProximityFor(ssoc: string): number | null {
	return getV9CapabilityProfile(ssoc)?.overall.ai_capability_proximity_0_1.median ?? null;
}
