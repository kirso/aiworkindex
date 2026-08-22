import majorGroupsData from '$lib/data/major-groups.json';
import { toV9BrowserItem } from '$lib/data/v9-browser';
import {
	comparePressureAscending,
	comparePressureDescending,
	takePressureWithCutoffTies,
	toV9OccupationView
} from '$lib/data/v9-display';
import { v9Occupations } from '$lib/data/v9';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

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

const groups = majorGroupsData.map(group => ({
	code: String(group.code),
	label: group.label,
	slug: toSlug(group.key)
}));
const groupBySlug = new Map(groups.map(group => [group.slug, group]));

export const load: PageServerLoad = ({ params }) => {
	const group = groupBySlug.get(params.slug);
	if (!group) error(404, 'Occupation group not found');

	const views = v9Occupations
		.map(toV9OccupationView)
		.filter(item => item.majorGroupCode === group.code);
	const pressureRanks = views.flatMap(item =>
		item.pressureRank == null ? [] : [item.pressureRank]
	);
	const occupations = [...views].sort(comparePressureDescending).map(toV9BrowserItem);

	return {
		group,
		allGroups: groups,
		occupations,
		highestPressure: takePressureWithCutoffTies([...views].sort(comparePressureDescending), 8).map(
			toV9BrowserItem
		),
		lowestPressure: takePressureWithCutoffTies(
			[...views].filter(item => item.pressureRank != null).sort(comparePressureAscending),
			8
		).map(toV9BrowserItem),
		stats: {
			count: occupations.length,
			scoredCount: pressureRanks.length,
			medianPressure: median(pressureRanks),
			directWageCount: views.filter(item => item.wageMedian != null).length,
			namedDemandCount: views.filter(item => item.demandSignals.length > 0).length
		}
	};
};

export function entries() {
	return groups.map(group => ({ slug: group.slug }));
}
