import researchSignalsData from './v9-research-signals.json';

export interface V9ResearchSignalValue {
	value_0_1: number;
	within_published_subset_midrank_percentile: number;
	source_occupation: { code: string; title: string };
	source_grain: string;
	interpretation: string;
}

export interface V9ResearchSignalProfile {
	occupation: { ssoc2024: string; title: string };
	status: 'available_reviewed_identity';
	headline_effect: 'none';
	mapping: {
		method: string;
		ssoc_isco_quality: string;
		official_isco08_codes: string[];
		onet_soc_code: string;
		onet_title: string;
		identity_relation: 'exactMatch' | 'closeMatch';
		identity_basis: 'conservative_title_rule' | 'reviewed_title_and_definition';
		matched_ssoc_title_variant: string;
		reviewed_at: string | null;
		review_rationale: string | null;
	};
	eloundou_theoretical_exposure: V9ResearchSignalValue;
	anthropic_observed_exposure: V9ResearchSignalValue | null;
	derived_theory_use_gap: { value_0_1: number; interpretation: string } | null;
}

interface V9ResearchSignalsArtifact {
	schema_version: '9.0';
	release: 'V9';
	generated_at: string;
	reviewed_at: string;
	headline_effect: 'none';
	construct: string;
	claim_boundary: string;
	publication_rule: Record<string, unknown>;
	coverage: {
		ssoc_occupations: number;
		reviewed_identity_profiles: number;
		eloundou_theoretical_exposure_available: number;
		anthropic_observed_exposure_available: number;
		both_signals_available: number;
		unavailable_without_reviewed_identity: number;
		anthropic_unavailable_source_rows_after_identity: number;
	};
	sources: {
		eloundou: {
			publisher: string;
			publication_title: string;
			publication_url: string;
			publication_date: string;
		};
		anthropic_observed_exposure: {
			publisher: string;
			publication_title: string;
			publication_url: string;
			publication_date: string;
			observation_periods: string[];
		};
	};
	occupation_status: Record<string, Record<string, string>>;
	profiles: Record<string, V9ResearchSignalProfile>;
}

export const v9ResearchSignals = researchSignalsData as V9ResearchSignalsArtifact;
export const v9ResearchSignalCoverage = v9ResearchSignals.coverage;
export const v9ResearchSignalSources = v9ResearchSignals.sources;

export function getV9ResearchSignalProfile(ssoc: string): V9ResearchSignalProfile | null {
	return v9ResearchSignals.profiles[ssoc] ?? null;
}
