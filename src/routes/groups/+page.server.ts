import majorGroupsData from '$lib/data/major-groups.json';
import { toV9BrowserItem } from '$lib/data/v9-browser';
import { toV9OccupationView } from '$lib/data/v9-display';
import { v9Occupations } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

function toSlug(key: string): string {
	return key.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-');
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 1
		? (sorted[middle] ?? null)
		: ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

export const load: PageServerLoad = () => {
	const occupations = v9Occupations.map(occupation =>
		toV9BrowserItem(toV9OccupationView(occupation))
	);
	const groups = majorGroupsData.map(group => {
		const members = occupations.filter(item => item.majorGroupCode === String(group.code));
		const pressureRanks = members.flatMap(item =>
			item.pressureRank == null ? [] : [item.pressureRank]
		);
		return {
			code: String(group.code),
			label: group.label,
			slug: toSlug(group.key),
			officialTitle: members[0]?.majorGroupTitle ?? group.key,
			count: members.length,
			scoredCount: pressureRanks.length,
			medianPressure: median(pressureRanks),
			directWageCount: members.filter(item => item.wageMedian != null).length,
			namedDemandCount: members.filter(item => item.demandSignalCount > 0).length
		};
	});

	return { groups };
};
