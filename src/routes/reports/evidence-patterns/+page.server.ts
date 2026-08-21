import { v9EvidenceVector, v9SignalChange } from '$lib/data/v9-evidence-vector';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const shared = v9EvidenceVector.records
		.filter(
			record =>
				record.shared_subset_comparison &&
				record.dimensions.capability_proximity &&
				record.dimensions.task_pressure
		)
		.map(record => ({
			code: record.occupation.ssoc2024,
			title: record.occupation.title,
			group: record.occupation.major_group.title,
			pressure: record.shared_subset_comparison!.pressure_midrank_percentile,
			capability: record.shared_subset_comparison!.capability_midrank_percentile,
			difference:
				record.shared_subset_comparison!.pressure_minus_capability_percentile_points,
			theoretical: record.dimensions.theoretical_exposure?.value ?? null,
			observed: record.dimensions.observed_use?.value ?? null,
			demandSources: record.dimensions.named_demand?.value.source_count ?? 0,
			hasSkills: record.dimensions.official_skills !== null,
			patterns: record.patterns
		}))
		.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference) || a.title.localeCompare(b.title));

	return {
		coverage: v9EvidenceVector.coverage,
		claimBoundary: v9EvidenceVector.claim_boundary,
		comparisonRule: v9EvidenceVector.comparison_rule,
		shared,
		mostDivergent: shared.slice(0, 16),
		changeClaimBoundary: v9SignalChange.claim_boundary,
		pressureChange: v9SignalChange.pressure_change,
		nationalChanges: v9SignalChange.observed_changes.filter(change => change.from && change.to),
		broadGroupChanges: v9SignalChange.observed_changes.filter(change => change.year_over_year_pct != null),
		withheldChangeProducts: v9SignalChange.withheld_change_products
	};
};
