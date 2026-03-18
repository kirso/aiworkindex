<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
</script>

<svelte:head>
	<title>Reports — AI Work Index</title>
	<meta
		name="description"
		content="Quarterly reports on AI impact across Singapore occupations. Labour market trends, scoring updates, and analysis."
	/>
</svelte:head>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Reports' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Reports</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Quarterly analysis of AI impact trends across Singapore occupations.
	</p>

	<p class={cn(sectionLabel(), 'mt-6 mb-3')}>Quarterly Updates</p>
	<div class="space-y-4">
		<!-- Q3 2025 Update -->
		<div class={cn(card({ padding: 'lg' }), 'border-2 border-primary/20')}>
			<div class="flex items-center gap-2">
				<span class="text-base font-semibold text-foreground">Q3 2025 Labour Market Update</span>
				<Badge
					variant="outline"
					class="bg-risk-very-low-subtle text-risk-very-low border-risk-very-low-border"
					>Latest</Badge
				>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				Labour market data updated to Q3 2025 from MOM Labour Market Report (December 2025). PMET
				vacancy rates stabilised at 3.1% (up from 2.9% YoY). Retrenchments low at 1.6 per 1,000
				employees. Recruitment/resignation rates and re-entry data now included for all occupation
				clusters.
			</p>
			<div class="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
				<div class="rounded bg-muted p-2">
					<span class="text-muted-foreground">PMET vacancy</span>
					<span class="ml-1 font-semibold text-risk-very-low">3.1% ↑</span>
				</div>
				<div class="rounded bg-muted p-2">
					<span class="text-muted-foreground">Clerical vacancy</span>
					<span class="ml-1 font-semibold text-risk-very-high">3.3% ↓</span>
				</div>
				<div class="rounded bg-muted p-2">
					<span class="text-muted-foreground">Production vacancy</span>
					<span class="ml-1 font-semibold text-risk-very-low">2.0% ↑</span>
				</div>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Source: <a
					href="https://stats.mom.gov.sg/iMAS_PdfLibrary/mrsd-Labour-Market-Report-3Q-2025.pdf"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">Labour Market Report Q3 2025</a
				>, MRSD, MOM
			</p>
		</div>

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

		<!-- Q4 2025 Advance Release -->
		<div class={card({ padding: 'lg' })}>
			<div class="flex items-center gap-2">
				<span class="text-base font-semibold text-foreground">Q4 2025 Advance Release</span>
				<Badge
					variant="outline"
					class="bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border"
					>Advance Data</Badge
				>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				Employment grew by 19,600 in Q4 2025 (+57,300 full year vs 44,500 in 2024). Unemployment
				steady at 2.0%. Retrenchments fell to 1.5 per 1,000 (3,600 in Q4; 14,400 full year). Vacancy
				rates by occupation group not yet available — pending full Q4 2025 report.
			</p>
			<p class="mt-2 text-xs text-muted-foreground">
				Source: <a
					href="https://www.mom.gov.sg/newsroom/press-releases/2026/0129-labour-market-advance-release-fourth-quarter-2025"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">Labour Market Advance Release Q4 2025</a
				>, MOM (29 Jan 2026)
			</p>
		</div>

		<!-- Future full report -->
		<div class={cn(card({ padding: 'lg' }), 'opacity-50')}>
			<div class="flex items-center gap-2">
				<span class="text-base font-semibold text-foreground">Q4 2025 Full Report</span>
				<Badge variant="secondary">Upcoming</Badge>
			</div>
			<p class="mt-1 text-sm text-muted-foreground">
				Full quarterly report with vacancy rates by occupation group, band movers, demand shifts,
				and scoring comparisons. Expected when Q4 2025 MOM Labour Market Report is published
				(mid-March 2026). Scores will be re-run with new vacancy data.
			</p>
		</div>
	</div>
</main>
