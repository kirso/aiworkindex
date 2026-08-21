import { v9CapabilityProfiles } from '$lib/data/v9-capability-profiles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const profiles = Object.values(v9CapabilityProfiles.profiles)
		.map(profile => ({
			code: profile.occupation.ssoc2024,
			title: profile.occupation.title,
			proximity: profile.overall.ai_capability_proximity_0_1.median,
			closestDomains: Object.values(profile.domains)
				.slice()
				.sort(
					(a, b) =>
						a.capability_gap.median / a.gap_scale.max - b.capability_gap.median / b.gap_scale.max
				)
				.slice(0, 3)
				.map(domain => domain.label)
		}))
		.sort((a, b) => b.proximity - a.proximity || a.title.localeCompare(b.title));

	return {
		coverage: v9CapabilityProfiles.coverage,
		claimBoundary: v9CapabilityProfiles.claim_boundary,
		source: v9CapabilityProfiles.source,
		publicationRule: v9CapabilityProfiles.publication_rule,
		domains: v9CapabilityProfiles.domains,
		examples: profiles.slice(0, 18)
	};
};
