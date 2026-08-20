import type { V9BrowserItem } from './v9-browser';
import type { V9IloExposureCategory } from './v9-contract';

export const V9_CATEGORY_ORDER: readonly V9IloExposureCategory[] = [
	'Not Exposed',
	'Minimal Exposure',
	'Exposed: Gradient 1',
	'Exposed: Gradient 2',
	'Exposed: Gradient 3',
	'Exposed: Gradient 4'
];

export interface V9CategorySummary {
	category: V9IloExposureCategory;
	count: number;
}

export interface V9GroupSummary {
	code: string;
	title: string;
	total: number;
	ranked: number;
	unranked: number;
	directWages: number;
	namedDemand: number;
	medianPressure: number | null;
	categories: V9CategorySummary[];
}

export interface V9PressureBin {
	start: number;
	end: number;
	label: string;
	count: number;
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = values.slice().sort((a, b) => a - b);
	const midpoint = Math.floor(sorted.length / 2);
	const value =
		sorted.length % 2 === 0
			? ((sorted[midpoint - 1] ?? 0) + (sorted[midpoint] ?? 0)) / 2
			: (sorted[midpoint] ?? 0);
	return Math.round(value * 10) / 10;
}

function summarizeCategories(items: V9BrowserItem[]): V9CategorySummary[] {
	return V9_CATEGORY_ORDER.map(category => ({
		category,
		count: items.filter(item => item.mostExposedCategory === category).length
	}));
}

export function buildV9CategorySummary(items: V9BrowserItem[]): V9CategorySummary[] {
	return summarizeCategories(items);
}

export function buildV9GroupSummaries(items: V9BrowserItem[]): V9GroupSummary[] {
	const byGroup = new Map<string, V9BrowserItem[]>();
	for (const item of items) {
		const group = byGroup.get(item.majorGroupCode) ?? [];
		group.push(item);
		byGroup.set(item.majorGroupCode, group);
	}

	return Array.from(byGroup.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([code, groupItems]) => {
			const ranked = groupItems.filter(item => item.pressureRank != null);
			return {
				code,
				title: groupItems[0]?.majorGroupTitle ?? `SSOC major group ${code}`,
				total: groupItems.length,
				ranked: ranked.length,
				unranked: groupItems.length - ranked.length,
				directWages: groupItems.filter(item => item.wageMedian != null).length,
				namedDemand: groupItems.filter(item => item.demandSignalCount > 0).length,
				medianPressure: median(
					ranked.flatMap(item => (item.pressureRank == null ? [] : [item.pressureRank]))
				),
				categories: summarizeCategories(groupItems)
			};
		});
}

export function buildV9PressureBins(items: V9BrowserItem[]): V9PressureBin[] {
	const bins = Array.from({ length: 10 }, (_, index) => ({
		start: index * 10,
		end: index === 9 ? 100 : index * 10 + 10,
		label: index === 9 ? '90–100' : `${index * 10}–${index * 10 + 9.9}`,
		count: 0
	}));

	for (const item of items) {
		if (item.pressureRank == null) continue;
		const index = Math.min(9, Math.max(0, Math.floor(item.pressureRank / 10)));
		const bin = bins[index];
		if (bin) bin.count += 1;
	}

	return bins;
}
