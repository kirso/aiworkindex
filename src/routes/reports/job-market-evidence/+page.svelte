<script lang="ts">
	import detailedDemand from '$lib/data/detailed-demand.json';
	import jobQuality from '$lib/data/job-quality.json';
	import wageMovement from '$lib/data/wage-movement.json';
	import familyValidation from '$lib/data/family-delta-validation-2025.json';
	import { pageLayout, card, sectionLabel, title as titleStyle, badge } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const pmet = jobQuality.youth_and_workforce_history.unemployment_rate_pct.pmet_age_15_29;
	const nonPmet = jobQuality.youth_and_workforce_history.unemployment_rate_pct.non_pmet_age_15_29;
	const latestPmet = pmet[pmet.length - 1];
	const latestNonPmet = nonPmet[nonPmet.length - 1];
	const rho = familyValidation.summary.spearman_delta_pct_vs_avg_v8_ai_exposure_rank;
	const wage5y = wageMovement.series.map(row => row.movement['5y'].real_change_pct);
</script>

<Seo
	title="Singapore Job Market Evidence — AI Work Index"
	description="Free official evidence on Singapore vacancies, entry-level hiring, job quality, wages, and occupation-family employment movement, kept separate from AI exposure ranks."
	path="/reports/job-market-evidence"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Job market evidence' }
		]}
	/>
	<h1 class={titleStyle({ size: 'page' })}>What is happening in the job market?</h1>
	<p class="mt-3 max-w-3xl text-base text-muted-foreground">
		AI exposure is only one part of the story. These free official indicators track hiring
		composition, job quality, wages and employment movement. They add context; they do not turn
		correlation into an AI effect.
	</p>

	<section class="mt-8">
		<h2 class={sectionLabel()}>Current evidence</h2>
		<div class="mt-3 grid gap-3 sm:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold text-foreground">
					{detailedDemand.national.newly_created_positions_pct}%
				</p>
				<p class="mt-1 font-medium">of vacancies were newly created</p>
				<p class="mt-2 text-xs text-muted-foreground">
					MOM Job Vacancies 2025 · national employer survey
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold text-foreground">
					{detailedDemand.entry_level_pmet.share_pct}%
				</p>
				<p class="mt-1 font-medium">of PMET vacancies were entry-level</p>
				<p class="mt-2 text-xs text-muted-foreground">
					December 2025 · separate portal and job-seeker source
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold text-foreground">{latestPmet}% / {latestNonPmet}%</p>
				<p class="mt-1 font-medium">youth unemployment: PMET / non-PMET</p>
				<p class="mt-2 text-xs text-muted-foreground">Age 15–29 · Labour Force in Singapore 2025</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-2xl font-semibold text-foreground">
					{Math.min(...wage5y).toFixed(1)}% to +{Math.max(...wage5y).toFixed(1)}%
				</p>
				<p class="mt-1 font-medium">five-year real wage movement across published series</p>
				<p class="mt-2 text-xs text-muted-foreground">
					2018–2023 · broad occupation groups and sex-specific medians
				</p>
			</div>
		</div>
	</section>

	<section class="mt-10">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class={sectionLabel()}>What the broader local check says</h2>
			<span class={badge({ variant: 'outline' })}>Descriptive, not causal</span>
		</div>
		<div class={cn(card({ padding: 'md', variant: 'inset' }), 'mt-3')}>
			<p class="text-sm text-foreground">
				Across {familyValidation.summary.families_with_v8_exposure_and_delta} two-digit occupation families,
				the Spearman association between V8 AI Exposure Rank and 2024–2025 employment change is
				<span class="font-semibold">{rho == null ? 'not estimable' : rho.toFixed(2)}</span>.
			</p>
			<p class="mt-2 text-sm text-muted-foreground">
				This one-year, overlapping-period comparison does not isolate AI. Employment also responds
				to demand, migration, demographics, wages, policy and survey variation. A weak or strong
				association would not by itself validate displacement claims.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>What we can and cannot measure</h2>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<p class="font-semibold">Measured now</p>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					<li>Quarterly vacancy, hiring, retrenchment and re-entry context</li>
					<li>Annual entry-level requirements and hard-to-fill jobs</li>
					<li>Broad-group underemployment and employment type</li>
					<li>Nominal and CPI-adjusted broad-group wage movement</li>
					<li>Sector AI adoption mapped as partial occupation context</li>
				</ul>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="font-semibold">Not yet identified</p>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					<li>AI-caused job loss at detailed occupation level</li>
					<li>Reliable occupation-level AI use in Singapore</li>
					<li>Current postings trends without repeated, deduplicated snapshots</li>
					<li>Forecast accuracy before enough post-baseline quarters exist</li>
				</ul>
			</div>
		</div>
	</section>

	<p class="mt-8 text-xs text-muted-foreground">
		Sources: <a class="text-primary hover:underline" href={detailedDemand.source.url}
			>MOM Job Vacancies 2025</a
		>,
		<a class="text-primary hover:underline" href={jobQuality.source.url}
			>Labour Force in Singapore 2025</a
		>, and Singapore Department of Statistics All Items CPI. All inputs are free public sources.
	</p>
</main>
