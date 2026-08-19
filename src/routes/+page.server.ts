import { toV9BrowserItem } from '$lib/data/v9-browser';
import { takePressureWithCutoffTies, toV9OccupationView } from '$lib/data/v9-display';
import { v9Counts, v9Occupations } from '$lib/data/v9';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const occupations = v9Occupations.map(occupation =>
		toV9BrowserItem(toV9OccupationView(occupation))
	);
	const scored = occupations
		.filter(item => item.pressureRank != null)
		.sort(
			(a, b) =>
				(b.pressureRank ?? Number.NEGATIVE_INFINITY) -
					(a.pressureRank ?? Number.NEGATIVE_INFINITY) || a.title.localeCompare(b.title)
		);
	return {
		counts: v9Counts,
		directDemandCount: occupations.filter(item => item.demandSignalCount > 0).length,
		highestPressure: takePressureWithCutoffTies(scored, 6),
		namedDemand: takePressureWithCutoffTies(
			scored.filter(item => item.demandSignalCount > 0),
			6
		),
		wageEvidence: occupations
			.filter(item => item.pressureRank != null && item.wageMedian != null)
			.map(item => ({
				code: item.code,
				title: item.title,
				pressureRank: item.pressureRank,
				wageMedian: item.wageMedian,
				demandSignalCount: item.demandSignalCount
			}))
	};
};
