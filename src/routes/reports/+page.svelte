<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel, badge } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { siteStatus } from '$lib/data/site-status';
	const v9Counts = siteStatus.structural_release.counts;
	const capabilityCoverage = siteStatus.capability_profiles.coverage;
	const researchCoverage = siteStatus.external_comparisons.separate_signal_coverage;
	const skillsCoverage = siteStatus.official_skills_pilot.coverage;
	const evidenceCoverage = siteStatus.evidence_vector.coverage;

	const archivedReports = [
		{
			href: '/reports/wage-exposure',
			title: 'V8 Wage Exposure Analysis',
			date: '17 July 2026',
			summary:
				'Legacy wage-pool analysis built from inferred employment. Preserved for audit, not a current V9 result.'
		},
		{
			href: '/reports/v7-release',
			title: 'V7 Release Note',
			date: '7 April 2026',
			summary:
				'Task-concentration and demand-persistence methodology used before V8 and the SSOC 2024 break.'
		},
		{
			href: '/reports/v6-release',
			title: 'V6 Release Note',
			date: '1 April 2026',
			summary:
				'Historical two-axis structural model with exposure, bottleneck and demand resilience.'
		},
		{
			href: '/reports/v5-experimental',
			title: 'V5 Experimental Model',
			date: '16 July 2026 archive snapshot',
			summary: 'Preserved experimental integration and validation record from the pre-V9 programme.'
		},
		{
			href: '/reports/v5-roadmap',
			title: 'V5 Roadmap',
			date: '16 July 2026 archive snapshot',
			summary: 'Historical research programme and sidecar roadmap.'
		},
		{
			href: '/reports/v4-3-shadow',
			title: 'V4.3 Shadow Model Note',
			date: '16 July 2026 archive snapshot',
			summary: 'Historical task-weighted shadow model, promotion gates and audit trail.'
		},
		{
			href: '/reports/q4-2024',
			title: 'Q4 2024 Scoring Report',
			date: 'October–December 2024 period',
			summary: 'Early scoring snapshot retained with its legacy terminology and assumptions.'
		}
	] as const;
</script>

<Seo
	title="Singapore AI Jobs Reports — V9 and Labour Evidence"
	description="Current V9 AI Work Pressure and Singapore labour-market reports, plus dated archives of earlier AI Work Index methods and findings."
	path="/reports"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Reports' }]} />

	<p class={sectionLabel()}>Current and archived analysis</p>
	<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>Reports</h1>
	<p class="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
		The V9 release report documents the structural score. The job-market report tracks current
		Singapore evidence that can change more frequently. Older reports remain accessible as dated
		archives and are not mixed into current findings.
	</p>

	<section class="mt-8">
		<h2 class={sectionLabel()}>Current reports</h2>
		<div class="mt-3 space-y-4">
			<a href="/reports/evidence-patterns" class="block no-underline">
				<article
					class={cn(card({ padding: 'lg', hover: true }), 'sm:flex sm:items-start sm:justify-between')}
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-lg font-semibold text-foreground">Where the evidence disagrees</h3>
							<span class={badge({ variant: 'info' })}>Eight separate signals</span>
						</div>
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Compare task pressure, capability, observed use, pay, demand, labour context and
							official skills without folding them into one score. Includes {evidenceCoverage.shared_pressure_capability_subset}
							reviewed pressure–capability comparisons and the first V9 change baseline.
						</p>
					</div>
					<span aria-hidden="true" class="mt-3 block text-primary sm:ml-6 sm:mt-1">→</span>
				</article>
			</a>

			<a href="/reports/skills-pilot" class="block no-underline">
				<article
					class={cn(
						card({ padding: 'lg', hover: true }),
						'sm:flex sm:items-start sm:justify-between'
					)}
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-lg font-semibold text-foreground">Skills to check and strengthen</h3>
							<span class={badge({ variant: 'info' })}>Official Skills Framework pilot</span>
						</div>
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Selected official skill names for {skillsCoverage.unique_occupations} occupations across
							ICT, financial services and healthcare, with direct training discovery.
						</p>
					</div>
					<span aria-hidden="true" class="mt-3 block text-primary sm:ml-6 sm:mt-1">→</span>
				</article>
			</a>

			<a href="/reports/research-signals" class="block no-underline">
				<article
					class={cn(
						card({ padding: 'lg', hover: true }),
						'sm:flex sm:items-start sm:justify-between'
					)}
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-lg font-semibold text-foreground">
								Possible AI scope versus observed use
							</h3>
							<span class={badge({ variant: 'info' })}>OpenAI + Anthropic</span>
						</div>
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Eloundou theoretical exposure for {researchCoverage.eloundou_theoretical_exposure_available}
							reviewed occupation identities and Anthropic observed Claude use for {researchCoverage.anthropic_observed_exposure_available},
							kept separate from the Singapore pressure rank.
						</p>
					</div>
					<span aria-hidden="true" class="mt-3 block text-primary sm:ml-6 sm:mt-1">→</span>
				</article>
			</a>

			<a href="/reports/ai-capabilities" class="block no-underline">
				<article
					class={cn(
						card({ padding: 'lg', hover: true }),
						'sm:flex sm:items-start sm:justify-between'
					)}
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-lg font-semibold text-foreground">What current AI can do</h3>
							<span class={badge({ variant: 'info' })}>OECD capability evidence</span>
						</div>
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Nine capability domains for {capabilityCoverage.available_reviewed_identity_profiles}
							Singapore occupations that pass an automated or explicit reviewed identity decision. Kept
							separate from pressure and labour outcomes.
						</p>
					</div>
					<span aria-hidden="true" class="mt-3 block text-primary sm:ml-6 sm:mt-1">→</span>
				</article>
			</a>

			<a href="/reports/v9-release" class="block no-underline">
				<article
					class={cn(
						card({ padding: 'lg', hover: true }),
						'sm:flex sm:items-start sm:justify-between'
					)}
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-lg font-semibold text-foreground">V9: Singapore AI Work Pressure</h3>
							<span class={badge({ variant: 'info' })}>Current</span>
						</div>
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							SSOC 2024 migration, ILO-based pressure ranks, mapping uncertainty, synthetic roles,
							Singapore market evidence and the 19 August 2026 research review.
						</p>
						<p class="mt-2 text-xs text-muted-foreground">
							{v9Counts.occupations.toLocaleString()} occupations · {v9Counts.scored.toLocaleString()}
							scored ·
							{v9Counts.direct_wages} direct wage rows
						</p>
					</div>
					<span aria-hidden="true" class="mt-3 block text-primary sm:ml-6 sm:mt-1">→</span>
				</article>
			</a>

			<a href="/reports/job-market-evidence" class="block no-underline">
				<article
					class={cn(
						card({ padding: 'lg', hover: true }),
						'sm:flex sm:items-start sm:justify-between'
					)}
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-lg font-semibold text-foreground">Singapore job-market evidence</h3>
							<span class={badge({ variant: 'info' })}>Current context</span>
						</div>
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Q2 2026 preliminary conditions, Q1 detailed labour evidence, 2025 vacancies, wages and
							firm AI adoption. These measures do not change the pressure rank.
						</p>
					</div>
					<span aria-hidden="true" class="mt-3 block text-primary sm:ml-6 sm:mt-1">→</span>
				</article>
			</a>

			<a href="/reports/labour-observatory" class="block no-underline">
				<article
					class={cn(
						card({ padding: 'lg', hover: true }),
						'sm:flex sm:items-start sm:justify-between'
					)}
				>
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="text-lg font-semibold text-foreground">Singapore AI labour observatory</h3>
							<span class={badge({ variant: 'info' })}>Current evidence</span>
						</div>
						<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Tracks the channels between task pressure and jobs: substitution, productivity and
							demand, new work, human responsibility, adoption and worker adjustment. Broad evidence
							stays broad; unsupported outcomes stay unknown.
						</p>
					</div>
					<span aria-hidden="true" class="mt-3 block text-primary sm:ml-6 sm:mt-1">→</span>
				</article>
			</a>
		</div>
	</section>

	<section class="mt-10 grid gap-4 sm:grid-cols-2">
		<a href="/methodology" class={card({ padding: 'md', hover: true })}>
			<h2 class="font-semibold text-foreground">How V9 is calculated</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				The plain-language method, evidence boundaries, synthetic-role rules and limitations.
			</p>
		</a>
		<a href="/research" class={card({ padding: 'md', hover: true })}>
			<h2 class="font-semibold text-foreground">Research register</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Primary research and public datasets reviewed through 19 August 2026.
			</p>
		</a>
	</section>

	<section class="my-10">
		<h2 class={sectionLabel()}>Methodology archives</h2>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			These pages preserve what earlier releases published. Their scores and labels are not
			comparable with V9 because the occupation taxonomy and methodology changed.
		</p>
		<div class="mt-4 divide-y divide-border border-y border-border">
			{#each archivedReports as report}
				<a href={report.href} class="group block py-4 no-underline">
					<div class="flex items-start justify-between gap-4">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="font-semibold text-foreground group-hover:text-primary">
									{report.title}
								</h3>
								<span class={badge({ variant: 'outline' })}>Archive</span>
							</div>
							<p class="mt-1 text-xs text-muted-foreground">{report.date}</p>
							<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
						</div>
						<span aria-hidden="true" class="shrink-0 text-muted-foreground group-hover:text-primary"
							>→</span
						>
					</div>
				</a>
			{/each}
		</div>
	</section>
</main>
