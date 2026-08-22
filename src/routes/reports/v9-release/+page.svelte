<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import {
		pageLayout,
		card,
		sectionLabel,
		title as titleStyle,
		badge,
		mono
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';

	let { data } = $props();
	let v9Counts = $derived(data.v9Counts);
	let q2 = $derived(data.q2);
	let adoption = $derived(data.adoption);
	let vacancyUpdate = $derived(data.vacancyUpdate);
	let categoryCounts = $derived(data.categoryCounts);
	let mixedCategoryCount = $derived(data.mixedCategoryCount);
	let rangeCount = $derived(data.rangeCount);
	let categoryRangeSummary = $derived(data.categoryRangeSummary);
	let demandSignalCount = $derived(data.demandSignalCount);
	let demandSourceLabelCount = $derived(data.demandSourceLabelCount);
	let demandOccupationCount = $derived(data.demandOccupationCount);
	let scoredPct = $derived(data.scoredPct);
	let wageCoveragePct = $derived(data.wageCoveragePct);
	const researchCoverage = siteStatus.external_comparisons.separate_signal_coverage;

	const releaseDate = '2026-08-19';
	const modifiedDate = '2026-08-21';

	const articleJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'AI Work Index V9: Singapore AI Work Pressure across SSOC 2024 occupations',
		description:
			'V9 migrates the AI Work Index to SSOC 2024, ranks 987 occupations with an ILO-based AI Work Pressure Rank, and keeps labour-market evidence separate.',
		url: `${SITE.url}/reports/v9-release`,
		datePublished: releaseDate,
		dateModified: modifiedDate,
		author: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl },
		publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
		mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE.url}/reports/v9-release` }
	});
</script>

<Seo
	title="V9 Report: Singapore Jobs Under AI Pressure"
	description="AI Work Index V9 covers all 1,001 SSOC 2024 occupations: 987 have ILO-based AI Work Pressure ranks and 14 remain explicitly unscored."
	path="/reports/v9-release"
	type="article"
	jsonLd={[articleJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'V9 release' }
		]}
	/>

	<div class="max-w-4xl">
		<div class="flex flex-wrap items-center gap-2">
			<p class={sectionLabel()}>Published 19 August · supporting evidence updated 22 August 2026</p>
			<span class={badge({ variant: 'info' })}>Current release</span>
		</div>
		<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>V9: Singapore AI Work Pressure</h1>
		<p class="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
			V9 rebuilds the index on Singapore's SSOC 2024 occupation system. It ranks generative-AI task
			exposure using the ILO's 2025 refined index, publishes mapping uncertainty, and keeps observed
			use, complementarity, wages, demand and labour outcomes outside the headline calculation.
		</p>
	</div>

	<section class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="text-3xl font-semibold tabular-nums">{v9Counts.occupations.toLocaleString()}</p>
			<p class="mt-1 text-sm">SSOC 2024 occupations</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="text-3xl font-semibold tabular-nums">{scoredPct.toFixed(1)}%</p>
			<p class="mt-1 text-sm">with a pressure rank</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="text-3xl font-semibold tabular-nums">{v9Counts.insufficient_evidence}</p>
			<p class="mt-1 text-sm">explicitly unscored</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="text-3xl font-semibold tabular-nums">{wageCoveragePct.toFixed(1)}%</p>
			<p class="mt-1 text-sm">with direct 2025 wages</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>The V9 result in one sentence</h2>
		<div class={cn(card({ padding: 'lg', variant: 'notice', accent: 'primary' }), 'mt-3')}>
			<p class="text-lg font-semibold leading-relaxed text-foreground">
				Generative-AI exposure appears across many scored occupation records, but occupation counts
				do not show how many Singapore workers are exposed or how many jobs will change.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Of {v9Counts.scored.toLocaleString()} scored occupation records,
				{categoryRangeSummary.reachesGradient.toLocaleString()} reach at least Gradient 1 somewhere in
				their official mapping range, {categoryRangeSummary.noHigherThanMinimal.toLocaleString()} top
				out at Minimal Exposure, and {categoryRangeSummary.notExposedOnly.toLocaleString()} are entirely
				Not Exposed. These are unweighted occupation records, not employment shares. Current use, adoption,
				demand and labour outcomes remain separate evidence.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>What changed from V8</h2>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each [['SSOC 2024 replaces SSOC 2020', 'Definitions, occupation codes, hierarchy and the official ISCO correspondence now come from the current Singapore classification.'], ['One headline construct', 'ILO 2025 mean task exposure determines AI Work Pressure. Observed use and labour economics no longer receive hidden weights.'], ['Official categories replace custom bands', 'V9 preserves Not Exposed, Minimal Exposure and ILO Gradients 1–4 rather than creating five arbitrary percentile labels.'], ['Uncertainty appears in the record', 'Multiple official ISCO matches publish their median, minimum, maximum, categories and task dispersion.'], ['No broad fallback', 'An occupation without usable evidence stays unscored. Named demand does not spread to occupations sharing a code prefix.'], ['Risk becomes a profile', 'Pressure, complementarity, observed use, demand, adoption and wages remain distinct, traceable and null when the evidence gate fails.']] as change}
				<article class={card({ padding: 'md' })}>
					<h3 class="font-semibold text-foreground">{change[0]}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{change[1]}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>How external research is shown</h2>
		<details class="mt-3 border border-border bg-card">
			<summary class="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground">
				A conservative subset is published separately
			</summary>
			<div class="border-t border-border p-5">
				<p class="max-w-4xl text-sm leading-relaxed text-muted-foreground">
					V9 publishes Eloundou theoretical exposure for {researchCoverage.eloundou_theoretical_exposure_available}
					reviewed identities and Anthropic observed use for {researchCoverage.anthropic_observed_exposure_available}
					of them in a separate artifact. Each profile requires one reviewed detailed occupation identity.
					Broader and many-to-many transfers remain unavailable. AIOE still needs a verified SOC-edition
					bridge, while the complementarity proxy lacks a frozen source table and reproducible construct
					replication.
				</p>
				<p class="mt-2 text-sm font-medium text-foreground">
					Publishing or withholding these separate signals does not change any AI Work Pressure
					Rank.
				</p>
				<a
					href="/reports/research-signals"
					class="mt-3 inline-block font-medium text-primary underline"
					>Compare theoretical scope and observed use</a
				>
			</div>
		</details>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>How the pressure rank is calculated</h2>
		<div class={cn(card({ padding: 'lg', variant: 'inset' }), 'mt-3 space-y-3')}>
			<p class={mono({ size: 'sm' })}>
				SSOC exposure = median ILO mean score across scored official ISCO-08 matches
			</p>
			<p class={mono({ size: 'sm' })}>
				Pressure rank = midrank percentile among {v9Counts.scored} scored SSOC occupations
			</p>
			<p class="text-sm leading-relaxed text-muted-foreground">
				{rangeCount} occupations have more than one distinct scored mapping value and therefore show a
				non-zero mapping range. A wider range signals classification uncertainty, not uncertainty about
				every task performed by every worker.
			</p>
		</div>
		<a href="/methodology" class="mt-3 inline-block text-sm text-primary underline"
			>Read the methodology</a
		>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Mapped ILO category coverage</h2>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			These counts group occupations whose official ISCO matches all share one ILO category.
			Occupations spanning several categories are shown separately rather than forced into one.
		</p>
		<div class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
			{#each categoryCounts as row}
				<div class={card({ padding: 'sm' })}>
					<p class="text-xl font-semibold tabular-nums">{row.count}</p>
					<p class="mt-1 text-xs text-muted-foreground">{row.category}</p>
				</div>
			{/each}
			<div class={card({ padding: 'sm' })}>
				<p class="text-xl font-semibold tabular-nums">{mixedCategoryCount}</p>
				<p class="mt-1 text-xs text-muted-foreground">multiple mapped categories</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<p class="text-xl font-semibold tabular-nums">{v9Counts.insufficient_evidence}</p>
				<p class="mt-1 text-xs text-muted-foreground">insufficient evidence</p>
			</div>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>What current Singapore evidence adds</h2>
		<div class="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					+{q2.total_employment_change.toLocaleString()}
				</p>
				<h3 class="mt-1 font-semibold text-foreground">Q2 employment</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Preliminary total employment change. Overall unemployment was
					{q2.unemployment_rate_pct.overall.toFixed(1)}% and retrenchments were
					{q2.retrenchments.toLocaleString()}.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.job_vacancies_thousands['2026-03']}K
				</p>
				<h3 class="mt-1 font-semibold text-foreground">March vacancies</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Down from {vacancyUpdate.job_vacancies_thousands['2025-12']}K in December 2025, mainly in
					non-PMET roles. Entry-level PMET openings moved from
					{vacancyUpdate.entry_level_pmet_vacancies_thousands['2025-12']}K to
					{vacancyUpdate.entry_level_pmet_vacancies_thousands['2026-03']}K.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{adoption.metrics.firms_started_ai_adoption_pct}%
				</p>
				<h3 class="mt-1 font-semibold text-foreground">Firms starting AI adoption</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					MOM's 2026 survey of private establishments with at least 10 employees.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">
					{vacancyUpdate.ai_adopting_firms_employment_responses_pct.redesigned_roles}%
				</p>
				<h3 class="mt-1 font-semibold text-foreground">Reported role redesign</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Rounded share among AI-adopting firms, compared with
					{vacancyUpdate.ai_adopting_firms_employment_responses_pct.reduced_headcount}% reporting
					reduced headcount and
					{vacancyUpdate.ai_adopting_firms_employment_responses_pct.reduced_hiring}% reduced hiring.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">{demandOccupationCount}</p>
				<h3 class="mt-1 font-semibold text-foreground">Codes with named demand</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					{demandSignalCount} code–source attachments from {demandSourceLabelCount} reviewed source labels.
					The lists are not exhaustive.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold tabular-nums">{v9Counts.direct_wages}</p>
				<h3 class="mt-1 font-semibold text-foreground">Direct wage rows</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					MOM Occupational Wages 2025. Missing occupation wages are not estimated.
				</p>
			</div>
		</div>
		<p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
			The vacancy update was published on 5 August 2026 and describes observations through March. Q2
			is an advance national release; Q1 remains the latest detailed quarter. Market evidence is
			reported at its published grain and never changes the pressure rank.
		</p>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>How V9 treats modern roles</h2>
		<div class={cn(card({ padding: 'lg', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
			<p class="font-semibold text-foreground">
				Direct reviewed matches use official records; composites stay non-official.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				The query layer first checks for an exact normalized title, then an explicit reviewed title,
				synonym or definition match to one SSOC 2024 occupation. Genuinely cross-occupation roles
				publish reviewed components, weights, rationale and sensitivity. Cross-sector or unstable
				labels are withheld. A composite can show an estimated comparison percentile, but not an
				official rank, inferred employment, role-level wage, demand score or job-loss probability.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Research interpretation</h2>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			The evidence review includes structural task exposure, observed platform use, changing task
			boundaries, capability horizons, complementarity, productivity, early-career hiring, aggregate
			employment and general-equilibrium mechanisms. The findings do not collapse into one
			direction. The registered sources report substantial task change alongside limited or uneven
			measured employment effects.
		</p>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			The 2026 OECD capability and skills reports support a separate, multidimensional view of human
			work rather than another hidden score weight. Singapore's 2022–2023 OECD adult-skills survey
			adds local population context, but not a reliable value for every detailed occupation. New
			NBER work on firms and career dynamics strengthens the case for tracking adoption, realised
			outcomes and career ladders separately.
		</p>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			The public OECD occupation workbook is integrated as a separate nine-domain layer for a
			reviewed detailed-identity subset. Raw crosswalk candidates are not published automatically,
			and the capability layer cannot change the ILO headline.
			<a href="/reports/ai-capabilities" class="text-primary underline"
				>Read the capability report</a
			>.
		</p>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			V9 uses these findings to frame interpretation and limitations. It does not transfer US,
			Danish, OECD or platform coefficients into Singapore occupation ranks.
		</p>
		<a href="/research" class="mt-3 inline-block text-sm text-primary underline"
			>Inspect the source-by-source register</a
		>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>What V9 stops publishing as current fact</h2>
		<ul
			class="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground"
		>
			<li>Detailed occupation employment inferred from broader groups or foreign distributions</li>
			<li>Counts of jobs “affected” by multiplying exposure by employment</li>
			<li>Wage pools presented as money under threat</li>
			<li>Composite job-loss, augmentation or pathway conclusions</li>
			<li>Broad-group exposure and demand fallbacks</li>
			<li>Stale convenience-sample postings presented as current demand</li>
		</ul>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			Earlier reports remain available with dated archive notices. Their figures are historical
			method outputs and are not V9 results.
		</p>
	</section>

	<section class="my-10 grid gap-4 md:grid-cols-2">
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Use the current product</h2>
			<div class="mt-3 flex flex-col items-start gap-2 text-sm">
				<a href="/rankings" class="text-primary underline">Explore V9 rankings</a>
				<a href="/will-ai-take-my-job" class="text-primary underline">Check a job's AI pressure</a>
				<a href="/compare" class="text-primary underline">Compare occupations and roles</a>
			</div>
		</div>
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Inspect the evidence</h2>
			<div class="mt-3 flex flex-col items-start gap-2 text-sm">
				<a href="/data" class="text-primary underline">Download V9 JSON and CSV</a>
				<a href="/methodology/appendix" class="text-primary underline"
					>Read the technical appendix</a
				>
				<a href="/reports/job-market-evidence" class="text-primary underline"
					>Review current market evidence</a
				>
				<a href="/reports/labour-observatory" class="text-primary underline"
					>Explore labour outcomes and evidence gaps</a
				>
			</div>
		</div>
	</section>
</main>
