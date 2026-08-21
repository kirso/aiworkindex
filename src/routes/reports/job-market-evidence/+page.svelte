<script lang="ts">
	import { v9DemandByCode, v9NationalContext } from '$lib/data/v9-market';
	import { pageLayout, card, sectionLabel, title as titleStyle, badge } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const vacancies = v9NationalContext.job_vacancies_2025;
	const vacancyUpdate = v9NationalContext.job_vacancies_august_2026_update;
	const adoption = v9NationalContext.ai_adoption_2026;
	const q1 = v9NationalContext.labour_market_q1_2026_detailed;
	const q2 = v9NationalContext.labour_market_q2_2026_advance;
	const earlyCareer = v9NationalContext.early_career_2025;
	const postings = v9NationalContext.postings_monitor;
	const demandSignalCount = [...v9DemandByCode.values()].reduce(
		(sum, signals) => sum + signals.length,
		0
	);
	const demandSourceLabelCount = new Set(
		[...v9DemandByCode.values()]
			.flat()
			.map(signal => `${signal.source_key}\u0000${signal.source_occupation}`)
	).size;
</script>

<Seo
	title="Singapore AI Jobs and Labour Market Evidence — 2026"
	description="Singapore employment, vacancies, early-career work and firm AI adoption evidence reviewed through 19 August 2026, kept separate from AI Work Pressure ranks."
	path="/reports/job-market-evidence"
	type="article"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Job-market evidence' }
		]}
	/>

	<div class="max-w-3xl">
		<div class="flex flex-wrap items-center gap-2">
			<p class={sectionLabel()}>Evidence reviewed through 19 August 2026</p>
			<span class={badge({ variant: 'info' })}>Current context</span>
		</div>
		<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>
			What is happening in Singapore's job market?
		</h1>
		<p class="mt-4 text-base leading-relaxed text-muted-foreground">
			National vacancies fell from 77,700 in December 2025 to 73,300 in March 2026, mainly in
			non-PMET roles. Entry-level PMET openings edged up from 32,500 to 32,800, and the preliminary
			Q2 release still showed employment growth. MOM also reported role redesign more often than
			headcount reduction among firms using AI. None of these comparisons proves that AI caused an
			employment change.
		</p>
	</div>

	<section class="mt-8">
		<h2 class={sectionLabel()}>Latest national vacancy update</h2>
		<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.job_vacancies_thousands['2026-03']}K
				</p>
				<p class="mt-1 text-sm font-medium">vacancies in March 2026</p>
				<p class="mt-1 text-xs text-muted-foreground">
					down from {vacancyUpdate.job_vacancies_thousands['2025-12']}K in December
				</p>
			</div>
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.entry_level_pmet_vacancies_thousands['2026-03']}K
				</p>
				<p class="mt-1 text-sm font-medium">entry-level PMET openings</p>
				<p class="mt-1 text-xs text-muted-foreground">
					up from {vacancyUpdate.entry_level_pmet_vacancies_thousands['2025-12']}K in December
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-sm font-semibold text-foreground">Where vacancies fell</p>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					{vacancyUpdate.vacancy_change_context}
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-sm font-semibold text-foreground">What this cannot tell us</p>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					National totals cannot be assigned to a detailed occupation or attributed to AI.
				</p>
			</div>
		</div>
		<p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
			<a
				href={vacancyUpdate.url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline">MOM parliamentary answer, published 5 August 2026</a
			>. Observations cover {vacancyUpdate.observation_period}; AI Work Index reviewed the source on
			19 August 2026.
		</p>
	</section>

	<section class="mt-10">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class={sectionLabel()}>Q2 2026 advance release</h2>
			<span class={badge({ variant: 'warning' })}>Preliminary</span>
		</div>
		<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">
					+{q2.total_employment_change.toLocaleString()}
				</p>
				<p class="mt-1 text-sm font-medium">total employment</p>
				<p class="mt-1 text-xs text-muted-foreground">quarter-on-quarter change</p>
			</div>
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{q2.unemployment_rate_pct.overall.toFixed(1)}%
				</p>
				<p class="mt-1 text-sm font-medium">overall unemployment</p>
				<p class="mt-1 text-xs text-muted-foreground">
					resident {q2.unemployment_rate_pct.resident.toFixed(1)}%
				</p>
			</div>
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">{q2.retrenchments.toLocaleString()}</p>
				<p class="mt-1 text-sm font-medium">retrenchments</p>
				<p class="mt-1 text-xs text-muted-foreground">advance estimate</p>
			</div>
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{q2.unemployment_rate_pct.citizen.toFixed(1)}%
				</p>
				<p class="mt-1 text-sm font-medium">citizen unemployment</p>
				<p class="mt-1 text-xs text-muted-foreground">June 2026</p>
			</div>
		</div>
		<p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
			<a href={q2.url} target="_blank" rel="noopener noreferrer" class="text-primary underline"
				>MOM Labour Market Advance Release, 31 July 2026</a
			>. Q1 2026 remains the latest detailed quarterly release. The advance figures must not be
			mapped to individual occupations.
		</p>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>What employers reported about 2025 vacancies</h2>
		<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancies.national.newly_created_positions_pct}%
				</p>
				<p class="mt-1 text-sm">of vacancies were newly created positions</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancies.national.qualification_not_main_consideration_pct}%
				</p>
				<p class="mt-1 text-sm">where qualifications were not the main consideration</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancies.national.unfilled_at_least_six_months_pct}%
				</p>
				<p class="mt-1 text-sm">unfilled for at least six months</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">{vacancies.entry_level_pmet.share_pct}%</p>
				<p class="mt-1 text-sm">entry-level share of PMET vacancies in its separate source</p>
			</div>
		</div>
		<p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
			<a
				href={vacancies.source.url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline">MOM Job Vacancies 2025</a
			>. {vacancies.entry_level_pmet.definition} This measure uses a different source and denominator
			from the employer vacancy survey, so it should not be combined with the other percentages.
		</p>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>What AI-adopting firms reported</h2>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			The underlying firm survey found {adoption.metrics.firms_started_ai_adoption_pct}% had started
			adopting AI and {adoption.metrics.firms_integrating_ai_core_processes_pct}% had integrated it
			into core processes. Among the firms that had adopted AI, MOM's 5 August answer reported these
			rounded employment responses:
		</p>
		<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md', accent: 'primary' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.ai_adopting_firms_employment_responses_pct.redesigned_roles}%
				</p>
				<p class="mt-1 text-sm">redesigned roles</p>
			</div>
			<div class={card({ padding: 'md', accent: 'moderate' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.ai_adopting_firms_employment_responses_pct.created_ai_roles}%
				</p>
				<p class="mt-1 text-sm">created AI roles</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.ai_adopting_firms_employment_responses_pct.reduced_hiring}%
				</p>
				<p class="mt-1 text-sm">reduced hiring</p>
			</div>
			<div class={card({ padding: 'md', accent: 'high' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.ai_adopting_firms_employment_responses_pct.reduced_headcount}%
				</p>
				<p class="mt-1 text-sm">reduced headcount</p>
			</div>
		</div>
		<p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
			<a
				href={vacancyUpdate.url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline">MOM parliamentary answer, 5 August 2026</a
			>. {vacancyUpdate.ai_response_population}
			{vacancyUpdate.rounding} These responses are not mutually exclusive, do not measure occupation-level
			adoption and do not identify a causal effect. The underlying survey scope was {adoption.scope}
		</p>
	</section>

	<section class="mt-10 grid gap-4 lg:grid-cols-2">
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Reviewed occupation demand evidence</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				V9 records {demandSignalCount} code–source attachments across {v9DemandByCode.size} SSOC 2024
				codes, covering {demandSourceLabelCount} reviewed labels from MOM Jobs in Demand 2025 and the
				2026 COMPASS Shortage Occupation List. Each match was reviewed against current titles and synonyms.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				These sources are not exhaustive occupation rankings. An occupation that is not named has
				unknown demand in this evidence layer, not weak demand.
			</p>
		</div>
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Early-career evidence remains incomplete</h2>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				MOM's June 2025 table reports {earlyCareer.pmet_unemployment_rate}% for PMETs and {earlyCareer.non_pmet_unemployment_rate}%
				for non-PMETs among residents aged 15–29. These are occupation-based, non-seasonally
				adjusted rates: they classify unemployed people by their previous work and exclude those who
				have never worked. They are not total youth-unemployment rates and cannot identify an AI
				effect.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				See Table 7 and its denominator notes in
				<a
					href={earlyCareer.latest_full_report.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary underline">Labour Force in Singapore 2025</a
				>. These data do not isolate fresh entrants or AI effects, so V9 does not apply age or
				seniority score modifiers.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>The latest detailed quarter remains Q1</h2>
		<div class={cn(card({ padding: 'md', variant: 'inset' }), 'mt-3')}>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<p class="text-lg font-semibold tabular-nums">
						{q1.vacancies.value}K
					</p>
					<p class="text-xs text-muted-foreground">vacancies</p>
				</div>
				<div>
					<p class="text-lg font-semibold tabular-nums">
						{q1.job_vacancy_to_unemployed_ratio.value.toFixed(2)}
					</p>
					<p class="text-xs text-muted-foreground">vacancies per unemployed person</p>
				</div>
				<div>
					<p class="text-lg font-semibold tabular-nums">+{q1.total_employment_change.value}K</p>
					<p class="text-xs text-muted-foreground">employment change</p>
				</div>
				<div>
					<p class="text-lg font-semibold tabular-nums">
						{q1.retrenchments.value.toLocaleString()}
					</p>
					<p class="text-xs text-muted-foreground">retrenchments</p>
				</div>
			</div>
		</div>
		<p class="mt-3 text-xs text-muted-foreground">
			<a href={q1.url} target="_blank" rel="noopener noreferrer" class="text-primary underline"
				>MOM Labour Market Report, Q1 2026</a
			>. V9 attaches broad labour context only at the occupation-group grain published by MOM.
		</p>
	</section>

	<section class="mt-10">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class={sectionLabel()}>Why the postings sample is withheld</h2>
			<span class={badge({ variant: 'outline' })}>Not current demand evidence</span>
		</div>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			The repository contains {postings.sample_postings ?? 'a bounded sample of'} postings from
			{postings.source_count ?? 'several'} sources{postings.observed_through
				? `, with the latest observation dated ${postings.observed_through.slice(0, 10)}`
				: ''}. The sample is not representative of Singapore hiring and has no recent 30- or 90-day
			volume, so V9 does not use it to rank current demand.
		</p>
	</section>

	<section class="my-10">
		<h2 class={sectionLabel()}>What the evidence can support</h2>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground">Measured now</h3>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					<li>National employment, unemployment and retrenchment context</li>
					<li>Vacancy composition and named hard-to-fill work</li>
					<li>Direct detailed-occupation wages where MOM publishes them</li>
					<li>Early-career occupation-class indicators, with their restricted denominator</li>
					<li>Firm and sector AI adoption at the source population</li>
				</ul>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground">Still unknown</h3>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					<li>AI-caused job loss by detailed SSOC occupation</li>
					<li>Representative occupation-level AI use in Singapore</li>
					<li>Occupation-specific entry-level displacement</li>
					<li>AI salary premiums by occupation</li>
					<li>A job-loss probability calibrated to Singapore outcomes</li>
				</ul>
			</div>
		</div>
		<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a href="/reports/v9-release" class="text-primary underline">Read the V9 release report</a>
			<a href="/reports/labour-observatory" class="text-primary underline"
				>Explore labour outcomes and evidence gaps</a
			>
			<a href="/methodology" class="text-primary underline">See how market evidence is separated</a>
			<a href="/data" class="text-primary underline">Download the public data</a>
		</div>
	</section>
</main>
