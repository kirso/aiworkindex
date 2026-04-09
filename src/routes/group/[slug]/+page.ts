import { occupations } from '$lib/data';
import majorGroupsData from '$lib/data/major-groups.json';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export interface MajorGroupInfo {
	code: number;
	key: string;
	label: string;
	color: string;
	slug: string;
}

function toSlug(key: string): string {
	return key.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-');
}

const groups: MajorGroupInfo[] = majorGroupsData.map(g => ({
	...g,
	slug: toSlug(g.key)
}));

const groupBySlug = new Map(groups.map(g => [g.slug, g]));

export const load: PageLoad = ({ params }) => {
	const group = groupBySlug.get(params.slug);
	if (!group) {
		error(404, 'Occupation group not found');
	}

	const groupOccupations = occupations
		.filter(o => o.major_group === group.key)
		.sort((a, b) => b.net_risk - a.net_risk);

	const sortedRisks = groupOccupations.map(o => o.net_risk).sort((a, b) => a - b);
	const sortedWages = groupOccupations.map(o => o.gross_wage_median).sort((a, b) => a - b);
	const rMid = Math.floor(sortedRisks.length / 2);
	const wMid = Math.floor(sortedWages.length / 2);
	const medianRisk =
		sortedRisks.length % 2 !== 0
			? (sortedRisks[rMid] ?? 0)
			: ((sortedRisks[rMid - 1] ?? 0) + (sortedRisks[rMid] ?? 0)) / 2;
	const medianWage =
		sortedWages.length % 2 !== 0
			? (sortedWages[wMid] ?? 0)
			: ((sortedWages[wMid - 1] ?? 0) + (sortedWages[wMid] ?? 0)) / 2;

	const avgRisk =
		groupOccupations.reduce((sum, o) => sum + o.net_risk, 0) / groupOccupations.length;

	const bandCounts = { very_low: 0, low: 0, moderate: 0, high: 0, very_high: 0 };
	for (const o of groupOccupations) {
		bandCounts[o.risk_band]++;
	}

	return {
		group,
		allGroups: groups,
		occupations: groupOccupations,
		stats: {
			count: groupOccupations.length,
			avgRisk,
			medianRisk,
			medianWage,
			bandCounts
		}
	};
};

export function entries() {
	return groups.map(g => ({ slug: g.slug }));
}
