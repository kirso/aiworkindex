import { occupations } from '$lib/data';
import majorGroupsData from '$lib/data/major-groups.json';
import type { PageLoad } from './$types';

function toSlug(key: string): string {
	return key.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-');
}

export const load: PageLoad = () => {
	const groups = majorGroupsData.map((g) => {
		const groupOccs = occupations.filter((o) => o.major_group === g.key);
		const risks = groupOccs.map((o) => o.net_risk);
		const avgRisk = risks.length > 0 ? risks.reduce((a, b) => a + b, 0) / risks.length : 0;
		const wages = groupOccs.map((o) => o.gross_wage_median).sort((a, b) => a - b);
		const mid = Math.floor(wages.length / 2);
		const medianWage =
			wages.length % 2 !== 0
				? (wages[mid] ?? 0)
				: ((wages[mid - 1] ?? 0) + (wages[mid] ?? 0)) / 2;

		const bandCounts = { very_high: 0, high: 0, moderate: 0, low: 0, very_low: 0 };
		for (const o of groupOccs) bandCounts[o.risk_band]++;

		return {
			...g,
			slug: toSlug(g.key),
			count: groupOccs.length,
			avgRisk,
			medianWage,
			highRiskCount: bandCounts.high + bandCounts.very_high
		};
	});

	return { groups };
};
