import { v9ResearchSignals } from '$lib/data/v9-research-signals';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const profiles = Object.values(v9ResearchSignals.profiles)
		.map(profile => ({
			ssoc: profile.occupation.ssoc2024,
			title: profile.occupation.title,
			onetTitle: profile.mapping.onet_title,
			theoretical: profile.eloundou_theoretical_exposure.value_0_1,
			observed: profile.anthropic_observed_exposure?.value_0_1 ?? null,
			gap: profile.derived_theory_use_gap?.value_0_1 ?? null
		}))
		.sort((a, b) => (b.gap ?? Number.NEGATIVE_INFINITY) - (a.gap ?? Number.NEGATIVE_INFINITY));

	return {
		coverage: v9ResearchSignals.coverage,
		sources: v9ResearchSignals.sources,
		profiles
	};
};
