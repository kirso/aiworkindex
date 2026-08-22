import { v9Counts, v9Occupations } from '$lib/data/v9';
import { v9DemandByCode, v9NationalContext } from '$lib/data/v9-market';
import type { PageServerLoad } from './$types';

export const prerender = true;

const categoryOrder = [
	'Not Exposed',
	'Minimal Exposure',
	'Exposed: Gradient 1',
	'Exposed: Gradient 2',
	'Exposed: Gradient 3',
	'Exposed: Gradient 4'
] as const;

export const load: PageServerLoad = () => {
	const categoryCounts = categoryOrder.map(category => ({
		category,
		count: v9Occupations.filter(
			occupation =>
				occupation.genai_task_exposure?.potential25.categories.length === 1 &&
				occupation.genai_task_exposure.potential25.categories[0] === category
		).length
	}));
	const mixedCategoryCount = v9Occupations.filter(
		occupation => (occupation.genai_task_exposure?.potential25.categories.length ?? 0) > 1
	).length;
	const rangeCount = v9Occupations.filter(occupation => {
		const score = occupation.genai_task_exposure?.mean_score_2025;
		return score ? score.min !== score.max : false;
	}).length;
	const categoryRangeSummary = v9Occupations.reduce(
		(summary, occupation) => {
			const categories = occupation.genai_task_exposure?.potential25.categories;
			if (!categories) return summary;
			if (categories.every(category => category === 'Not Exposed')) summary.notExposedOnly += 1;
			else if (
				categories.every(category =>
					(['Not Exposed', 'Minimal Exposure'] as const).includes(
						category as 'Not Exposed' | 'Minimal Exposure'
					)
				)
			)
				summary.noHigherThanMinimal += 1;
			else summary.reachesGradient += 1;
			return summary;
		},
		{ notExposedOnly: 0, noHigherThanMinimal: 0, reachesGradient: 0 }
	);
	const demandEvidence = [...v9DemandByCode.values()].flat();
	const demandSourceLabelCount = new Set(
		demandEvidence.map(signal => `${signal.source_key}\u0000${signal.source_occupation}`)
	).size;

	return {
		v9Counts,
		q2: v9NationalContext.labour_market_q2_2026_advance,
		adoption: v9NationalContext.ai_adoption_2026,
		vacancyUpdate: v9NationalContext.job_vacancies_august_2026_update,
		categoryCounts,
		mixedCategoryCount,
		rangeCount,
		categoryRangeSummary,
		demandSignalCount: [...v9DemandByCode.values()].reduce(
			(sum, signals) => sum + signals.length,
			0
		),
		demandSourceLabelCount,
		demandOccupationCount: v9DemandByCode.size,
		scoredPct: (v9Counts.scored / v9Counts.occupations) * 100,
		wageCoveragePct: (v9Counts.direct_wages / v9Counts.occupations) * 100
	};
};
