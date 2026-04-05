<script lang="ts">
	import aiInSingapore from '$lib/data/ai-in-singapore.json';
	import { experimentalStatusLabel } from '$lib/data/experimental-status-display';
	import { employerPressure } from '$lib/data/employer-pressure';
	import macroContext from '$lib/data/macro-context.json';
	import { postingsMonitor } from '$lib/data/postings-monitor';
	import { quarterlyReport } from '$lib/data/quarterly-report';
	import { releases, siteStatus } from '$lib/data/site-status';
	import {
		title as titleStyle,
		pageLayout,
		card,
		sectionLabel,
		microLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const ai = aiInSingapore.metrics;
	const employer = employerPressure;
	const macro = macroContext.latest_snapshot;
	const postings = postingsMonitor.summary;
	const quarterly = quarterlyReport;
	const isPromoted = siteStatus.experimental_release?.status === 'promoted';
	const isV6Live = siteStatus.structural_release.version === 'V6';
	const experimentalPositiveStates = ['ready_for_shadow_scoring', 'shadow_published', 'promoted'];
	const experimentalStatusBadgeClass = experimentalPositiveStates.includes(
		siteStatus.experimental_release?.status ?? ''
	)
		? 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
		: siteStatus.experimental_release?.status === 'blocked'
			? 'bg-risk-high-subtle text-risk-high border-risk-high-border'
			: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border';
</script>

<Seo
	title="AI Work Index Reports"
	description="Quarterly reports on AI impact across the current live reference market, plus global methodology notes, labour-market trends, scoring updates, and analysis."
	path="/reports"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Reports' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Reports</h1>

	<!-- Narrative lead — compact summary -->
	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm text-foreground">
			<span class="font-semibold">Latest context:</span>
			{macro.resident_unemployment_rate.toFixed(1)}% resident unemployment ·
			{ai.workforce.workers_using_ai_at_work_pct.toFixed(0)}% of workers using AI at work ·
			{siteStatus.live_monitor.labour_monitor_artifact_vintage} labour monitor
		</p>
	</div>

	<p class={cn(sectionLabel(), 'mt-6 mb-3')}>Published Reports</p>
	<div class="space-y-4">
		<a href="/reports/v4-3-shadow" class="block no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex items-start justify-between')}>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-base font-semibold text-foreground">V4.3 Shadow Model Note</span>
						<Badge variant="outline" class={experimentalStatusBadgeClass}
							>{experimentalStatusLabel(siteStatus.experimental_release?.status)}</Badge
						>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						{#if isV6Live}
							How the V4.3 shadow model first became live and why it remains published inside the
							retained V4.3 → V5 → V6 audit trail.
						{:else if isPromoted}
							How the task-weighted shadow model was promoted into the live release, what changed,
							and what remains published for auditability.
						{:else}
							What the task-weighted shadow model would change, what is now promotion-ready, and why
							V4.2 remains the published baseline until a release decision is made.
						{/if}
					</p>
					<p class="mt-2 text-xs text-muted-foreground">
						{siteStatus.experimental_release?.summary}
					</p>
				</div>
				<svg
					class="ml-4 mt-1 h-5 w-5 shrink-0 text-muted-foreground"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<a href="/reports/v5-roadmap" class="block no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex items-start justify-between')}>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-base font-semibold text-foreground">V5 Roadmap</span>
						<Badge variant="outline" class="bg-primary/10 text-primary border-primary/30"
							>{isV6Live ? 'Archive' : 'Next'}</Badge
						>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						{#if isV6Live}
							Archived roadmap for the V5 research program that preceded the current V6 two-axis
							release.
						{:else}
							The next scientific release program after V4.3: augmentation heterogeneity, empirical
							mobility, posterior uncertainty, and realized-risk forecasting.
						{/if}
					</p>
					<p class="mt-2 text-xs text-muted-foreground">
						{#if isV6Live}
							Preserved for auditability alongside the published sidecars and promotion trail.
						{:else}
							Planning surface for the V5 program. Sidecars are published and the first integrated
							experimental model is now available separately.
						{/if}
					</p>
				</div>
				<svg
					class="ml-4 mt-1 h-5 w-5 shrink-0 text-muted-foreground"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		{#if siteStatus.v5_program?.experimental_model_published}
			<a href="/reports/v5-experimental" class="block no-underline">
				<div class={cn(card({ padding: 'lg', hover: true }), 'flex items-start justify-between')}>
					<div>
						<div class="flex items-center gap-2">
							<span class="text-base font-semibold text-foreground"
								>{isV6Live ? 'V5 Model Note' : 'V5 Experimental Model'}</span
							>
							<Badge variant="outline" class="bg-primary/10 text-primary border-primary/30"
								>{isV6Live ? 'Archived live note' : 'Experimental'}</Badge
							>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							{#if isV6Live}
								Archived promotion note for the former live V5 model, preserved so the V6 release
								can still be compared against its immediate predecessor and retained adjunct layers.
							{:else}
								The first integrated V5 candidate now combines posterior uncertainty, augmentation
								heterogeneity, empirical mobility, and realized-risk calibration into one auditable
								model output.
							{/if}
						</p>
						<p class="mt-2 text-xs text-muted-foreground">
							Current validation snapshot: structural
							{siteStatus.v5_program?.structural_validation_result}, realized
							{siteStatus.v5_program?.realized_validation_result}.
							{#if isV6Live}
								The retained V4.3 baseline and promotion-comparison artifacts remain published.
							{:else}
								This remains separate from the live V4.3 score.
							{/if}
						</p>
					</div>
					<svg
						class="ml-4 mt-1 h-5 w-5 shrink-0 text-muted-foreground"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path d="M5 12h14M12 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		{/if}

		<!-- Wage Exposure Analysis -->
		<a href="/reports/wage-exposure" class="block no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex items-start justify-between')}>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-base font-semibold text-foreground">Wage Exposure Analysis</span>
						<Badge
							variant="outline"
							class="bg-risk-high-subtle text-risk-high border-risk-high-border">Report</Badge
						>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						Annual wage-pool analysis for occupations under high structural AI pressure. Breakdown
						by sector, risk-weighted wage exposure, and methodology notes.
					</p>
					<p class="mt-2 text-xs text-muted-foreground">
						Based on {siteStatus.structural_release.version} scoring, March 2026
					</p>
				</div>
				<svg
					class="ml-4 mt-1 h-5 w-5 shrink-0 text-muted-foreground"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<!-- Q4 2024 Report -->
		<a href="/reports/q4-2024" class="block no-underline">
			<div class={cn(card({ padding: 'lg', hover: true }), 'flex items-start justify-between')}>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-base font-semibold text-foreground">Q4 2024 Scoring Report</span>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						Initial V3 scoring results: 562 occupations scored across exposure, bottleneck, and
						market resilience. Key findings on paradox roles, highest-risk occupations, and theory
						vs practice gaps.
					</p>
					<p class="mt-2 text-xs text-muted-foreground">Published March 2026</p>
				</div>
				<svg
					class="ml-4 mt-1 h-5 w-5 shrink-0 text-muted-foreground"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</div>
		</a>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Governance & Release Notes</p>
	<div class="grid gap-4 md:grid-cols-2">
		<a href="/changelog" class="block no-underline">
			<div
				class={cn(card({ padding: 'lg', hover: true }), 'flex h-full items-start justify-between')}
			>
				<div>
					<div class="flex items-center gap-2">
						<span class="text-base font-semibold text-foreground">Changelog</span>
						<Badge
							variant="outline"
							class="bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border"
							>Ledger</Badge
						>
					</div>
					<p class="mt-1 text-sm text-muted-foreground">
						Canonical release ledger for structural releases, shadow-model notes, report refreshes,
						and official labour-monitor updates.
					</p>
					<p class="mt-2 text-xs text-muted-foreground">
						{releases.length} recorded events in the current public history
					</p>
				</div>
				<svg
					class="ml-4 mt-1 h-5 w-5 shrink-0 text-muted-foreground"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M5 12h14M12 5l7 7-7 7" />
				</svg>
			</div>
		</a>

		<div class={card({ padding: 'lg' })}>
			<div class="flex items-center gap-2">
				<span class="text-base font-semibold text-foreground">Latest release activity</span>
				<Badge variant="outline" class="bg-primary/10 text-primary border-primary/30">Current</Badge
				>
			</div>
			<div class="mt-3 space-y-3">
				{#each releases.slice(0, 3) as release (release.id)}
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm font-semibold text-foreground">{release.label}</p>
								<p class="mt-1 text-xs text-muted-foreground">
									Published {release.published_at} · {release.score_version}
								</p>
							</div>
							<a
								href={release.href}
								class="text-xs text-primary hover:underline"
								target={release.href.startsWith('http') ? '_blank' : undefined}
								rel={release.href.startsWith('http') ? 'noopener noreferrer' : undefined}
							>
								Open →
							</a>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Current Snapshot — live monitor metrics -->
	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Current Snapshot</p>
	<p class="mb-3 text-sm text-muted-foreground">
		Live monitor metrics and signals, kept separate from the structural score.
	</p>

	<div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>AI Adoption · 2024</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{ai.enterprises.non_sme_ai_adoption_pct.toFixed(1)}%
			</p>
			<p class="text-xs text-muted-foreground">non-SME AI adoption</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Workers · 2024</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{ai.workforce.workers_using_ai_at_work_pct.toFixed(1)}%
			</p>
			<p class="text-xs text-muted-foreground">using AI at work</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Unemployment · 2025 4Q</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{macro.resident_unemployment_rate.toFixed(1)}%
			</p>
			<p class="text-xs text-muted-foreground">resident unemployment</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>NAIIP · 2026</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{Math.round(ai.national_programmes.naiip_workers_target / 1000)}K
			</p>
			<p class="text-xs text-muted-foreground">AI-bilingual target</p>
		</div>
	</div>

	{#if postings.total_postings > 0}
		<details class="mt-4">
			<summary class="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
				Hiring Now Monitor ({postings.posting_volume_30d} postings, 30D)
			</summary>
			<div class={cn(card({ padding: 'md' }), 'mt-2')}>
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Top Skills</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{postings.top_skills
								.slice(0, 3)
								.map(skill => skill.label)
								.join(' · ')}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>AI / Tools</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{postings.top_tools.length > 0
								? postings.top_tools
										.slice(0, 3)
										.map(tool => tool.label)
										.join(' · ')
								: 'Sparse mention rate'}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>As of</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{new Date(postingsMonitor.generated_at).toLocaleDateString('en-SG', {
								day: 'numeric',
								month: 'short',
								year: 'numeric'
							})}
						</p>
					</div>
				</div>
			</div>
		</details>
	{/if}

	{#if employer.summary.total_signals > 0}
		<details class="mt-4">
			<summary class="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
				Employer Pressure Monitor ({employer.summary.total_signals} signals)
			</summary>
			<div class={cn(card({ padding: 'md' }), 'mt-2')}>
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Highest Pressure</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{employer.summary.highest_pressure_archetypes.slice(0, 2).join(' · ')}
						</p>
						<p class="text-xs text-muted-foreground">
							{employer.summary.highest_pressure_label ?? 'no pressure label'} signal tier
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Latest Signal</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{employer.summary.latest_signal_date
								? new Date(employer.summary.latest_signal_date).toLocaleDateString('en-SG', {
										day: 'numeric',
										month: 'short',
										year: 'numeric'
									})
								: '--'}
						</p>
					</div>
				</div>
			</div>
		</details>
	{/if}

	{#if quarterly.previous_snapshot}
		<details class="mt-4">
			<summary class="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
				Quarterly Movers ({quarterly.band_movers.length} band changes, {quarterly.previous_snapshot} to
				{quarterly.current_snapshot})
			</summary>
			<div class={cn(card({ padding: 'md' }), 'mt-2')}>
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Top Risers</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{quarterly.top_risers
								.slice(0, 2)
								.map(entry => entry.title)
								.join(' · ') || 'No major risers'}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Top Fallers</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{quarterly.top_fallers
								.slice(0, 2)
								.map(entry => entry.title)
								.join(' · ') || 'No major fallers'}
						</p>
					</div>
				</div>
				<div class="mt-3">
					<a href="/rankings/quarterly-movers" class="text-xs text-primary hover:underline"
						>Open full ranking →</a
					>
				</div>
			</div>
		</details>
	{/if}

	{#if quarterly.briefing}
		<details class="mt-4">
			<summary class="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
				Quarterly Briefing
			</summary>
			<div class="mt-2 grid gap-3 md:grid-cols-3">
				<div class={card({ padding: 'sm', variant: 'flat' })}>
					<p class="text-sm font-semibold text-foreground">What changed</p>
					<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
						{#each quarterly.briefing.what_changed as item}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
				<div class={card({ padding: 'sm', variant: 'flat' })}>
					<p class="text-sm font-semibold text-foreground">Why it matters</p>
					<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
						{#each quarterly.briefing.why_it_matters as item}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
				<div class={card({ padding: 'sm', variant: 'flat' })}>
					<p class="text-sm font-semibold text-foreground">What to watch</p>
					<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
						{#each quarterly.briefing.what_to_watch as item}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			</div>
		</details>
	{/if}
</main>
