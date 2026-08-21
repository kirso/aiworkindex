import { toV9BrowserItem } from '$lib/data/v9-browser';
import { takePressureWithCutoffTies, toV9OccupationView } from '$lib/data/v9-display';
import {
	buildV9CategorySummary,
	buildV9GroupSummaries,
	buildV9PressureBins,
	toV9MapItem
} from '$lib/data/v9-home';
import { v9NationalContext } from '$lib/data/v9-market';
import { v9Counts, v9Occupations } from '$lib/data/v9';
import { v9CapabilityCoverage } from '$lib/data/v9-capability-profiles';
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
		capabilityProfileCount: v9CapabilityCoverage.available_exact_title_identity_profiles,
		directDemandCount: occupations.filter(item => item.demandSignalCount > 0).length,
		groupSummaries: buildV9GroupSummaries(occupations),
		mapItems: occupations.map(toV9MapItem),
		categorySummary: buildV9CategorySummary(occupations),
		pressureBins: buildV9PressureBins(occupations),
		marketFacts: [
			{
				value: `${v9NationalContext.ai_adoption_2026.metrics.firms_started_ai_adoption_pct}%`,
				label: 'of surveyed firms had started adopting AI',
				detail: v9NationalContext.ai_adoption_2026.scope,
				sourceTitle: v9NationalContext.ai_adoption_2026.title,
				sourceUrl: v9NationalContext.ai_adoption_2026.url
			},
			{
				value: `${v9NationalContext.job_vacancies_august_2026_update.ai_adopting_firms_employment_responses_pct.redesigned_roles}%`,
				label: 'of AI-adopting firms reported redesigning roles',
				detail: 'A national firm response, not an occupation-level rate.',
				sourceTitle: v9NationalContext.job_vacancies_august_2026_update.title,
				sourceUrl: v9NationalContext.job_vacancies_august_2026_update.url
			},
			{
				value: `${v9NationalContext.job_vacancies_august_2026_update.entry_level_pmet_vacancies_thousands['2026-03']}k`,
				label: 'entry-level PMET openings in March 2026',
				detail: 'Published national total using MOM’s entry-level PMET definition.',
				sourceTitle: v9NationalContext.job_vacancies_august_2026_update.title,
				sourceUrl: v9NationalContext.job_vacancies_august_2026_update.url
			}
		],
		highestPressure: takePressureWithCutoffTies(scored, 6),
		namedDemand: takePressureWithCutoffTies(
			scored.filter(item => item.demandSignalCount > 0),
			6
		)
	};
};
