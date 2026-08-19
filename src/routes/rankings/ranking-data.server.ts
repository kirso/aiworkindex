import type { V9IloExposureCategory } from '$lib/data/v9-contract';
import { toV9BrowserItem, type V9BrowserItem } from '$lib/data/v9-browser';
import { toV9OccupationView } from '$lib/data/v9-display';
import { v9Occupations } from '$lib/data/v9';

const categoryOrder: V9IloExposureCategory[] = [
	'Not Exposed',
	'Minimal Exposure',
	'Exposed: Gradient 1',
	'Exposed: Gradient 2',
	'Exposed: Gradient 3',
	'Exposed: Gradient 4'
];

export const allV9Items = v9Occupations.map(occupation =>
	toV9BrowserItem(toV9OccupationView(occupation))
);

export const pressureRanking = [...allV9Items]
	.filter(item => item.pressureRank != null)
	.sort(
		(a, b) =>
			(b.pressureRank ?? Number.NEGATIVE_INFINITY) - (a.pressureRank ?? Number.NEGATIVE_INFINITY) ||
			a.title.localeCompare(b.title)
	);

export const officialGradient4 = pressureRanking.filter(
	item => item.mostExposedCategory === 'Exposed: Gradient 4'
);

export const namedDemandRanking = allV9Items
	.filter(item => item.demandSignalCount > 0 && item.pressureRank != null)
	.sort(
		(a, b) =>
			(b.pressureRank ?? Number.NEGATIVE_INFINITY) - (a.pressureRank ?? Number.NEGATIVE_INFINITY) ||
			a.title.localeCompare(b.title)
	);

function mostExposedCategoryIndex(item: V9BrowserItem): number {
	const category = item.mostExposedCategory;
	return category ? categoryOrder.indexOf(category) : -1;
}

export const directWageGradient2To4 = allV9Items
	.filter(
		item =>
			item.wageMedian != null && item.pressureRank != null && mostExposedCategoryIndex(item) >= 3
	)
	.sort(
		(a, b) =>
			(b.wageMedian ?? Number.NEGATIVE_INFINITY) - (a.wageMedian ?? Number.NEGATIVE_INFINITY) ||
			(b.pressureRank ?? Number.NEGATIVE_INFINITY) - (a.pressureRank ?? Number.NEGATIVE_INFINITY) ||
			a.title.localeCompare(b.title)
	);

export const directWageNotOrMinimallyExposed = allV9Items
	.filter(
		item =>
			item.wageMedian != null && item.pressureRank != null && mostExposedCategoryIndex(item) <= 1
	)
	.sort(
		(a, b) =>
			(b.wageMedian ?? Number.NEGATIVE_INFINITY) - (a.wageMedian ?? Number.NEGATIVE_INFINITY) ||
			(a.pressureRank ?? Number.POSITIVE_INFINITY) - (b.pressureRank ?? Number.POSITIVE_INFINITY) ||
			a.title.localeCompare(b.title)
	);

function mappedScoreWidth(item: V9BrowserItem): number {
	return item.mappedScoreRangeWidth ?? -1;
}

export const mappingUncertaintyRanking = allV9Items
	.filter(
		item =>
			item.pressureRank != null &&
			(item.mappingQuality === 'partial' ||
				item.mappingQuality === 'one_to_many' ||
				mappedScoreWidth(item) > 0)
	)
	.sort(
		(a, b) =>
			mappedScoreWidth(b) - mappedScoreWidth(a) ||
			b.mappedIscoCount - a.mappedIscoCount ||
			a.title.localeCompare(b.title)
	);

export const taskDispersionRanking = allV9Items
	.filter(item => item.taskDispersion != null)
	.sort(
		(a, b) =>
			(b.taskDispersion ?? Number.NEGATIVE_INFINITY) -
				(a.taskDispersion ?? Number.NEGATIVE_INFINITY) || a.title.localeCompare(b.title)
	);
