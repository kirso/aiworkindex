import type { V9GenAiTaskExposure, V9IloExposureCategory, V9Occupation } from './v9-contract';
import { v9DemandByCode, v9LabourByMajorGroup, type V9DemandSignal, type V9LabourContext } from './v9-market';

export type PressureTone = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

const categoryOrder: V9IloExposureCategory[] = [
	'Not Exposed',
	'Minimal Exposure',
	'Exposed: Gradient 1',
	'Exposed: Gradient 2',
	'Exposed: Gradient 3',
	'Exposed: Gradient 4'
];

const categoryLabels: Record<V9IloExposureCategory, string> = {
	'Not Exposed': 'Not exposed',
	'Minimal Exposure': 'Minimal overlap',
	'Exposed: Gradient 1': 'Lower overlap',
	'Exposed: Gradient 2': 'Moderate overlap',
	'Exposed: Gradient 3': 'Higher overlap',
	'Exposed: Gradient 4': 'Highest overlap'
};

/** Official ILO codebook strings. Use only in methodology, appendix and data dictionaries. */
export const ILO_CATEGORY_CODEBOOK: Record<V9IloExposureCategory, string> = {
	'Not Exposed': 'Not Exposed',
	'Minimal Exposure': 'Minimal Exposure',
	'Exposed: Gradient 1': 'Exposed: Gradient 1',
	'Exposed: Gradient 2': 'Exposed: Gradient 2',
	'Exposed: Gradient 3': 'Exposed: Gradient 3',
	'Exposed: Gradient 4': 'Exposed: Gradient 4'
};

const categoryTones: Record<V9IloExposureCategory, PressureTone> = {
	'Not Exposed': 'very_low',
	'Minimal Exposure': 'low',
	'Exposed: Gradient 1': 'low',
	'Exposed: Gradient 2': 'moderate',
	'Exposed: Gradient 3': 'high',
	'Exposed: Gradient 4': 'very_high'
};

export interface V9OccupationView {
	occupation: V9Occupation;
	code: string;
	title: string;
	majorGroupCode: string;
	majorGroupTitle: string;
	pressureRank: number | null;
	pressurePosition: number | null;
	pressurePopulation: number | null;
	pressureLabel: string;
	pressureTone: PressureTone;
	officialCategory: string;
	rawExposure: number | null;
	rawExposureRange: { min: number; max: number } | null;
	taskDispersion: number | null;
	wageMedian: number | null;
	demandSignals: V9DemandSignal[];
	labourContext: V9LabourContext | null;
}

export function categoryLabel(category: V9IloExposureCategory): string {
	return categoryLabels[category];
}

export function categoryTone(category: V9IloExposureCategory): PressureTone {
	return categoryTones[category];
}

export function formatOfficialCategory(exposure: V9GenAiTaskExposure | null): string {
	if (!exposure) return 'Not ranked';
	const least = exposure.potential25.least_exposed;
	const most = exposure.potential25.most_exposed;
	if (least === most) return categoryLabels[most];
	const leastIndex = categoryOrder.indexOf(least);
	const mostIndex = categoryOrder.indexOf(most);
	if (leastIndex < 0 || mostIndex < 0) {
		return `${categoryLabels[least] ?? least} to ${categoryLabels[most] ?? most}`;
	}
	return `${categoryLabels[least]} to ${categoryLabels[most].toLowerCase()}`;
}

export function formatIloCodebookCategory(exposure: V9GenAiTaskExposure | null): string {
	if (!exposure) return 'Not ranked';
	const least = exposure.potential25.least_exposed;
	const most = exposure.potential25.most_exposed;
	if (least === most) return least;
	return `${least} to ${most}`;
}

function sentenceCaseIfShouting(value: string): string {
	const letters = value.replace(/[^A-Za-z]/g, '');
	if (letters.length > 3 && letters === letters.toUpperCase()) {
		return value.charAt(0) + value.slice(1).toLowerCase();
	}
	return value;
}

/** Spoken H1. Official slash titles and n.e.c. residuals stay in the subtitle. */
export function spokenOccupationTitle(
	officialTitle: string,
	spokenCandidates: readonly string[] = []
): string {
	const spoken = spokenCandidates.find(
		candidate =>
			candidate.trim().length > 0 &&
			!candidate.includes('/') &&
			!/n\.e\.c/i.test(candidate)
	);
	if (spoken) return sentenceCaseIfShouting(spoken.trim());
	const firstSegment = officialTitle.split('/')[0]?.replace(/\s*n\.e\.c\.?\s*$/i, '').trim();
	return sentenceCaseIfShouting(firstSegment || officialTitle);
}

export function pressureLabel(exposure: V9GenAiTaskExposure | null): string {
	if (!exposure) return 'Pressure not ranked';
	const least = exposure.potential25.least_exposed;
	const most = exposure.potential25.most_exposed;
	if (least === most) return categoryLabels[most];
	return `${categoryLabels[least]} to ${categoryLabels[most].toLowerCase()}`;
}

export function pressureTone(exposure: V9GenAiTaskExposure | null): PressureTone {
	return exposure ? categoryTones[exposure.potential25.most_exposed] : 'moderate';
}

export function pressureComparison(rank: number | null): string {
	if (rank == null) return 'AI work pressure is not ranked because the official mapping lacks usable evidence.';
	return `AI task pressure has a midrank percentile of ${rank.toFixed(rank % 1 === 0 ? 0 : 1)} among scored Singapore occupations.`;
}

export function toV9OccupationView(occupation: V9Occupation): V9OccupationView {
	const exposure = occupation.genai_task_exposure;
	const majorGroupCode = occupation.taxonomy.hierarchy.major_group.code;
	return {
		occupation,
		code: occupation.taxonomy.code,
		title: occupation.taxonomy.title,
		majorGroupCode,
		majorGroupTitle: occupation.taxonomy.hierarchy.major_group.title,
		pressureRank: exposure?.pressure_rank.percentile ?? null,
		pressurePosition: exposure?.pressure_rank.midrank_position ?? null,
		pressurePopulation: exposure?.pressure_rank.population_size ?? null,
		pressureLabel: pressureLabel(exposure),
		pressureTone: pressureTone(exposure),
		officialCategory: formatOfficialCategory(exposure),
		rawExposure: exposure?.mean_score_2025.median ?? null,
		rawExposureRange: exposure
			? { min: exposure.mean_score_2025.min, max: exposure.mean_score_2025.max }
			: null,
		taskDispersion: exposure?.task_score_sd_2025.median ?? null,
		wageMedian: occupation.singapore_market.wages?.value.gross_monthly_sgd.median ?? null,
		demandSignals: v9DemandByCode.get(occupation.taxonomy.code) ?? [],
		labourContext: v9LabourByMajorGroup.get(majorGroupCode) ?? null
	};
}

export function comparePressureDescending(a: V9OccupationView, b: V9OccupationView): number {
	if (a.pressureRank == null && b.pressureRank == null) return a.title.localeCompare(b.title);
	if (a.pressureRank == null) return 1;
	if (b.pressureRank == null) return -1;
	return b.pressureRank - a.pressureRank || a.title.localeCompare(b.title);
}

export function comparePressureAscending(a: V9OccupationView, b: V9OccupationView): number {
	if (a.pressureRank == null && b.pressureRank == null) return a.title.localeCompare(b.title);
	if (a.pressureRank == null) return 1;
	if (b.pressureRank == null) return -1;
	return a.pressureRank - b.pressureRank || a.title.localeCompare(b.title);
}

/**
 * Take at least `limit` rows from a descending pressure ranking without cutting through a tie.
 * Callers must sort the input by pressure percentile first.
 */
export function takePressureWithCutoffTies<T extends { pressureRank: number | null }>(
	items: T[],
	limit: number
): T[] {
	if (limit <= 0 || items.length === 0) return [];
	if (items.length <= limit) return [...items];
	const cutoff = items[limit - 1]?.pressureRank;
	if (cutoff == null) return items.slice(0, limit);
	return items.filter((item, index) => index < limit || item.pressureRank === cutoff);
}
