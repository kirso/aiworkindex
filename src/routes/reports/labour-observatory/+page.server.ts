import { v9EconomicObservatory } from '$lib/data/v9-economic-observatory';
import { v9NationalContext } from '$lib/data/v9-market';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const adoption = v9NationalContext.ai_adoption_2026;
	const vacancies = v9NationalContext.job_vacancies_august_2026_update;
	const q2 = v9NationalContext.labour_market_q2_2026_advance;

	return {
		reviewCutoff: v9EconomicObservatory.review_cutoff,
		claimBoundary: v9EconomicObservatory.claim_boundary,
		outcomeIdentity: v9EconomicObservatory.causal_model.outcome_identity,
		scenarioPolicy: v9EconomicObservatory.causal_model.scenario_policy,
		mechanisms: v9EconomicObservatory.causal_model.mechanisms,
		coverage: v9EconomicObservatory.coverage,
		groups: Object.values(v9EconomicObservatory.group_profiles).map(group => ({
			code: group.major_group.code,
			title: group.major_group.title,
			status: group.measurement_status,
			employmentLatestThousands: group.employment?.latest.value ?? null,
			employmentYearOverYearPct: group.employment?.derived_change.year_over_year_pct ?? null,
			employmentSince2019Pct: group.employment?.derived_change.since_2019_pct ?? null,
			youngWorkerShare: group.workforce?.age_share.age_15_29 ?? null,
			age50PlusShare: group.workforce
				? group.workforce.age_share.age_50_59 + group.workforce.age_share.age_60_plus
				: null,
			femaleShare: group.workforce?.female_share ?? null,
			partTimeShare: group.workforce?.part_time_share ?? null,
			topIndustries: group.industry_footprint?.top_industries.slice(0, 3) ?? [],
			labourSummary: group.labour_context?.summary ?? null,
			vacancyRate:
				typeof group.labour_context?.vacancy.latest_rate === 'number'
					? group.labour_context.vacancy.latest_rate
					: null,
			vacancyCountThousands:
				typeof group.labour_context?.vacancy.latest_count === 'number'
					? group.labour_context.vacancy.latest_count
					: null,
			vacancyPeriod:
				typeof group.labour_context?.vacancy.latest_quarter === 'string'
					? group.labour_context.vacancy.latest_quarter
					: null
		})),
		national: {
			firmsStartedAdoptionPct: adoption.metrics.firms_started_ai_adoption_pct,
			firmsIntegratedCorePct: adoption.metrics.firms_integrating_ai_core_processes_pct,
			adoptingFirmsProductivityPct: adoption.metrics.ai_adopting_firms_productivity_improvement_pct,
			adoptingFirmsRedesignedRolesPct: adoption.metrics.ai_adopting_firms_redesigning_roles_pct,
			adoptingFirmsCreatedRolesPct: adoption.metrics.ai_adopting_firms_creating_new_ai_jobs_pct,
			adoptingFirmsReducedHeadcountPct: adoption.metrics.ai_adopting_firms_reduced_headcount_pct,
			vacanciesMarchThousands: vacancies.job_vacancies_thousands['2026-03'],
			entryLevelPmetMarchThousands: vacancies.entry_level_pmet_vacancies_thousands['2026-03'],
			q2EmploymentChange: q2.total_employment_change,
			q2Retrenchments: q2.retrenchments
		},
		publicationGates: Object.entries(v9EconomicObservatory.publication_gates).map(
			([key, description]) => ({ key, description })
		),
		sources: v9EconomicObservatory.sources
	};
};
