import type { V9IloExposureCategory } from './v9-contract';
import { toV9OccupationView, type V9OccupationView } from './v9-display';
import type { V9Occupation } from './v9';

export interface V9BrowserItem {
	code: string;
	title: string;
	majorGroupCode: string;
	majorGroupTitle: string;
	pressureRank: number | null;
	pressurePosition: number | null;
	pressurePopulation: number | null;
	officialCategory: string;
	officialCategories: V9IloExposureCategory[];
	mostExposedCategory: V9IloExposureCategory | null;
	wageMedian: number | null;
	demandSignalCount: number;
	taskDispersion: number | null;
	mappingQuality: V9Occupation['evidence']['mapping_quality'];
	mappedScoreRangeWidth: number | null;
	mappedIscoCount: number;
	searchSynonyms: string[];
}

export function toV9BrowserItem(view: V9OccupationView): V9BrowserItem {
	const exposure = view.occupation.genai_task_exposure;
	return {
		code: view.code,
		title: view.title,
		majorGroupCode: view.majorGroupCode,
		majorGroupTitle: view.majorGroupTitle,
		pressureRank: view.pressureRank,
		pressurePosition: view.pressurePosition,
		pressurePopulation: view.pressurePopulation,
		officialCategory: view.officialCategory,
		officialCategories: exposure?.potential25.categories ?? [],
		mostExposedCategory: exposure?.potential25.most_exposed ?? null,
		wageMedian: view.wageMedian,
		demandSignalCount: view.demandSignals.length,
		taskDispersion: view.taskDispersion,
		mappingQuality: view.occupation.evidence.mapping_quality,
		mappedScoreRangeWidth: view.rawExposureRange
			? view.rawExposureRange.max - view.rawExposureRange.min
			: null,
		mappedIscoCount: exposure?.official_isco08_codes.length ?? 0,
		searchSynonyms: view.occupation.taxonomy.search_synonyms
	};
}

export function occupationToV9BrowserItem(occupation: V9Occupation): V9BrowserItem {
	return toV9BrowserItem(toV9OccupationView(occupation));
}
