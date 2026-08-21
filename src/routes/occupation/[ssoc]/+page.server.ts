import majorGroupsData from '$lib/data/major-groups.json';
import { syntheticRolesV9 } from '$lib/data/synthetic-roles-v9';
import { toV9BrowserItem } from '$lib/data/v9-browser';
import { toV9OccupationView } from '$lib/data/v9-display';
import { getV9CapabilityProfile, getV9CapabilityStatus } from '$lib/data/v9-capability-profiles';
import { getV9EconomicOccupationContext } from '$lib/data/v9-economic-observatory';
import { getV9Occupation, v9Occupations } from '$lib/data/v9';
import { getV9ResearchSignalProfile, v9ResearchSignalSources } from '$lib/data/v9-research-signals';
import { getMappedTaskExamples, v9TaskEvidenceMetadata } from '$lib/data/v9-task-evidence.server';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

function toSlug(key: string): string {
	return key.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-');
}

function pressureDistance(a: ReturnType<typeof toV9OccupationView>, rank: number | null): number {
	if (a.pressureRank == null || rank == null) return Number.POSITIVE_INFINITY;
	return Math.abs(a.pressureRank - rank);
}

export const load: PageServerLoad = ({ params }) => {
	const occupation = getV9Occupation(params.ssoc);
	if (!occupation) error(404, 'Occupation not found');

	const view = toV9OccupationView(occupation);
	const unitCode = occupation.taxonomy.hierarchy.unit_group?.code;
	const minorCode = occupation.taxonomy.hierarchy.minor_group?.code;
	const relatedPool = v9Occupations
		.filter(candidate => {
			if (candidate.taxonomy.code === occupation.taxonomy.code) return false;
			if (unitCode && candidate.taxonomy.hierarchy.unit_group?.code === unitCode) return true;
			return Boolean(minorCode && candidate.taxonomy.hierarchy.minor_group?.code === minorCode);
		})
		.map(toV9OccupationView)
		.sort(
			(a, b) =>
				pressureDistance(a, view.pressureRank) - pressureDistance(b, view.pressureRank) ||
				a.title.localeCompare(b.title)
		)
		.slice(0, 8)
		.map(toV9BrowserItem);
	const group = majorGroupsData.find(item => String(item.code) === view.majorGroupCode);
	const modernQueries = syntheticRolesV9
		.filter(
			role =>
				role.official_status === 'official_occupation_match' &&
				role.official_occupation?.ssoc2024 === view.code &&
				role.title.localeCompare(view.title, undefined, { sensitivity: 'base' }) !== 0
		)
		.map(role => ({ slug: role.slug, title: role.title, resolutionBasis: role.resolution_basis }))
		.sort((a, b) => a.title.localeCompare(b.title));

	return {
		view,
		capabilityProfile: getV9CapabilityProfile(occupation.taxonomy.code),
		capabilityStatus: getV9CapabilityStatus(occupation.taxonomy.code),
		researchSignalProfile: getV9ResearchSignalProfile(occupation.taxonomy.code),
		researchSignalSources: v9ResearchSignalSources,
		economicContext: getV9EconomicOccupationContext(occupation.taxonomy.code),
		mappedTaskExamples: getMappedTaskExamples(occupation.evidence.official_isco08_codes),
		taskEvidenceSource: {
			url: v9TaskEvidenceMetadata.source.repository_url,
			licenseUrl: v9TaskEvidenceMetadata.source.license_url
		},
		related: relatedPool,
		modernQueries,
		groupSlug: group ? toSlug(group.key) : null,
		groupLabel: group?.label ?? view.majorGroupTitle
	};
};

export function entries() {
	return v9Occupations.map(occupation => ({ ssoc: occupation.taxonomy.code }));
}
