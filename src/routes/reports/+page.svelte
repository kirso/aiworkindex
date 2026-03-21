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
	const experimentalStatusBadgeClass =
		siteStatus.experimental_release?.status === 'ready_for_shadow_scoring'
			? 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
			: siteStatus.experimental_release?.status === 'blocked'
				? 'bg-risk-high-subtle text-risk-high border-risk-high-border'
				: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border';
</script>

<Seo
	title="Singapore AI Labour Market Reports"
	description="Quarterly reports on AI impact across Singapore occupations. Labour market trends, scoring updates, and analysis."
	path="/reports"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Reports' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Reports</h1>

	<!-- Narrative lead -->
	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm text-foreground leading-relaxed">
			<span class="font-semibold"
				>Latest published context as of {siteStatus.live_monitor.latest_official_labour_report
					.published_at}:</span
			>
			the latest official labour release is {siteStatus.live_monitor.latest_official_labour_report
				.label}, and the current site monitor now uses {siteStatus.live_monitor
				.labour_monitor_artifact_vintage}. The latest macro snapshot is {siteStatus.live_monitor
				.macro_vintage}
			unemployment, and the latest official national AI-adoption survey is IMDA's {siteStatus
				.live_monitor.ai_context_vintage}. Taken together, they show a labour market that remains
			fairly tight ({macro.resident_unemployment_rate.toFixed(1)}% resident unemployment) while AI
			usage is already mainstream ({ai.workforce.workers_using_ai_at_work_pct.toFixed(0)}% of
			workers reported using AI at work).
		</p>
		<p class="mt-2 text-xs text-muted-foreground">{siteStatus.live_monitor.refresh_note}</p>
	</div>

	<div class="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>AI Adoption · 2024 Data</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{ai.enterprises.non_sme_ai_adoption_pct.toFixed(1)}%
			</p>
			<p class="text-xs text-muted-foreground">latest observed non-SME AI adoption</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Workers · 2024 Data</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{ai.workforce.workers_using_ai_at_work_pct.toFixed(1)}%
			</p>
			<p class="text-xs text-muted-foreground">reported using AI at work</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Labour Backdrop · 2025 4Q</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{macro.resident_unemployment_rate.toFixed(1)}%
			</p>
			<p class="text-xs text-muted-foreground">resident unemployment rate</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>NAIIP · 2026</p>
			<p class="mt-1 font-mono text-lg font-bold text-foreground">
				{Math.round(ai.national_programmes.naiip_workers_target / 1000)}K
			</p>
			<p class="text-xs text-muted-foreground">workers targeted to become AI-bilingual</p>
		</div>
	</div>

	{#if postings.total_postings > 0}
		<div class={cn(card({ padding: 'md' }), 'mt-6')}>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-sm font-semibold text-foreground">Hiring Now Monitor</p>
					<p class="text-xs text-muted-foreground">
						Multi-source Singapore postings signal, kept separate from the structural score.
					</p>
				</div>
				<Badge variant="outline">Monitor</Badge>
			</div>
			<div class="mt-4 grid gap-3 sm:grid-cols-3">
				<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
					<p class={microLabel()}>Postings · 30D</p>
					<p class="mt-1 font-mono text-lg font-bold text-foreground">
						{postings.posting_volume_30d}
					</p>
					<p class="text-xs text-muted-foreground">live hiring volume</p>
				</div>
				<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
					<p class={microLabel()}>Top Skills</p>
					<p class="mt-1 text-sm font-medium text-foreground">
						{postings.top_skills
							.slice(0, 3)
							.map(skill => skill.label)
							.join(' · ')}
					</p>
					<p class="text-xs text-muted-foreground">most common visible requirements</p>
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
					<p class="text-xs text-muted-foreground">
						monitor artifact as of {new Date(postingsMonitor.generated_at).toLocaleDateString(
							'en-SG',
							{ day: 'numeric', month: 'short', year: 'numeric' }
						)}
					</p>
				</div>
			</div>
		</div>
	{/if}

	{#if employer.summary.total_signals > 0}
		<div class={cn(card({ padding: 'md' }), 'mt-6')}>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-sm font-semibold text-foreground">Employer Pressure Monitor</p>
					<p class="text-xs text-muted-foreground">
						Curated restructuring / cost-discipline signals from official filings and credible
						reporting, mapped to broad work archetypes.
					</p>
				</div>
				<Badge variant="outline">Pressure</Badge>
			</div>
			<div class="mt-4 grid gap-3 sm:grid-cols-3">
				<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
					<p class={microLabel()}>Curated Signals</p>
					<p class="mt-1 font-mono text-lg font-bold text-foreground">
						{employer.summary.total_signals}
					</p>
					<p class="text-xs text-muted-foreground">tracked signal entries in monitor</p>
				</div>
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
							: '—'}
					</p>
					<p class="text-xs text-muted-foreground">most recent tracked employer-pressure signal</p>
				</div>
			</div>
		</div>
	{/if}

	{#if quarterly.previous_snapshot}
		<div class={cn(card({ padding: 'md' }), 'mt-6')}>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-sm font-semibold text-foreground">Quarterly Movers</p>
					<p class="text-xs text-muted-foreground">
						Frozen snapshot deltas between {quarterly.previous_snapshot} and {quarterly.current_snapshot}.
					</p>
				</div>
				<a href="/rankings/quarterly-movers" class="text-xs text-primary hover:underline"
					>Open ranking →</a
				>
			</div>
			<div class="mt-4 grid gap-3 sm:grid-cols-3">
				<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
					<p class={microLabel()}>Band Movers</p>
					<p class="mt-1 font-mono text-lg font-bold text-foreground">
						{quarterly.band_movers.length}
					</p>
					<p class="text-xs text-muted-foreground">occupations changed risk band</p>
				</div>
				<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
					<p class={microLabel()}>Top Risers</p>
					<p class="mt-1 text-sm font-medium text-foreground">
						{quarterly.top_risers
							.slice(0, 2)
							.map(entry => entry.title)
							.join(' · ') || 'No major risers'}
					</p>
					<p class="text-xs text-muted-foreground">largest increases in structural pressure</p>
				</div>
				<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
					<p class={microLabel()}>Top Fallers</p>
					<p class="mt-1 text-sm font-medium text-foreground">
						{quarterly.top_fallers
							.slice(0, 2)
							.map(entry => entry.title)
							.join(' · ') || 'No major fallers'}
					</p>
					<p class="text-xs text-muted-foreground">largest decreases in structural pressure</p>
				</div>
			</div>
		</div>
	{/if}

	{#if quarterly.briefing}
		<div class="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
	{/if}

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Latest Briefing</p>
	<div class="space-y-4">
		<div class={cn(card({ padding: 'lg' }), 'border-2 border-primary/20')}>
			<div class="flex items-center gap-2">
				<span class="text-base font-semibold text-foreground">
					{siteStatus.live_monitor.latest_official_labour_report.label}
				</span>
				<Badge
					variant="outline"
					class="bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border"
					>New official release</Badge
				>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				MOM has now published the full Q4 2025 labour-market report, and the live monitor already
				runs on that full vintage for vacancy, recruitment/resignation, retrenchment, re-entry, and
				hiring-expectation context across the site.
			</p>
			<div class="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
				<div class="rounded bg-muted p-2">
					<span class="text-muted-foreground">Structural score</span>
					<span class="ml-1 font-semibold text-foreground"
						>{siteStatus.structural_release.version}</span
					>
				</div>
				<div class="rounded bg-muted p-2">
					<span class="text-muted-foreground">Live monitor</span>
					<span class="ml-1 font-semibold text-foreground">
						{siteStatus.live_monitor.labour_monitor_artifact_vintage}
					</span>
				</div>
				<div class="rounded bg-muted p-2">
					<span class="text-muted-foreground">Latest official labour release</span>
					<span class="ml-1 font-semibold text-foreground">Q4 2025 full report</span>
				</div>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Source: <a
					href={siteStatus.live_monitor.latest_official_labour_report.url}
					target="_blank"
					rel="noopener noreferrer"
					class="underline">{siteStatus.live_monitor.latest_official_labour_report.label}</a
				>, MOM
			</p>
		</div>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Reports & Analysis</p>
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
						What the task-weighted shadow model would change, what is ready now, and what still
						gates promotion beyond the published V4.2 release.
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
					<p class="mt-2 text-xs text-muted-foreground">Based on V4.2 scoring, March 2026</p>
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
</main>
