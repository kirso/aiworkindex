<script lang="ts">
	import { riskBandColors, type RiskBand } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();

	let maxCount = $derived(
		Math.max(...data.riskDistribution.map((d: { count: number }) => d.count))
	);

	function trendArrow(trend: number): string {
		if (trend > 0) return '\u2191';
		if (trend < 0) return '\u2193';
		return '\u2192';
	}

	function trendColor(trend: number): string {
		if (trend > 0) return 'text-risk-very-low';
		if (trend < 0) return 'text-risk-very-high';
		return 'text-muted-foreground';
	}

	function overallColor(overall: string): string {
		if (overall === 'strong') return 'text-risk-very-low';
		if (overall === 'moderate') return 'text-impact-leveraged';
		if (overall === 'weak') return 'text-risk-moderate';
		return 'text-risk-very-high';
	}
</script>

<svelte:head>
	<title>Q4 2024 Quarterly Report — AI Work Index</title>
	<meta
		name="description"
		content="AI Work Index quarterly snapshot for Q4 2024. Risk distribution, top movers, and labour market highlights."
	/>
	<meta property="og:title" content="Q4 2024 Quarterly Report — AI Work Index" />
	<meta property="og:description" content="AI Work Index quarterly snapshot for Q4 2024." />
</svelte:head>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Q4 2024' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Q4 2024 Quarterly Report</h1>
	<p class="mt-2 text-sm text-muted-foreground">AI Work Index — Quarterly Snapshot</p>

	<!-- Stat strip — borderless, editorial OWID style -->
	<div class="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
		<div>
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Occupations
			</p>
			<p class="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
				{data.stats.totalOccupations}
			</p>
		</div>
		<div>
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Avg Net Risk
			</p>
			<p class="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
				{(data.stats.avgNetRisk * 100).toFixed(1)}%
			</p>
		</div>
		<div>
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In-Demand</p>
			<p class="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
				{data.stats.inDemandCount}
			</p>
			<p class="text-xs text-muted-foreground/60">SOL + Jobs in Demand</p>
		</div>
		<div>
			<p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				AI-Calibrated
			</p>
			<p class="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
				{data.stats.anthropicCalibratedCount}
			</p>
			<p class="text-xs text-muted-foreground/60">Anthropic observed usage</p>
		</div>
	</div>

	<Separator class="my-8" />

	<!-- Risk Distribution -->
	<section>
		<h2 class="text-sm font-semibold text-foreground">Risk Distribution</h2>
		<p class="mt-1 text-xs text-muted-foreground">
			How {data.stats.totalOccupations} occupations distribute across AI risk levels
		</p>
		<div class="mt-4 space-y-2">
			{#each data.riskDistribution as dist (dist.band)}
				<div class="flex items-center gap-3">
					<span class="w-20 text-xs tabular-nums text-foreground/70">{dist.label}</span>
					<div class="flex-1 h-4 rounded-sm bg-muted overflow-hidden">
						<div
							class="h-full rounded-sm"
							style="width: {(dist.count / maxCount) * 100}%; background-color: {riskBandColors[
								dist.band as RiskBand
							]};"
						></div>
					</div>
					<span class="w-8 text-right text-xs font-semibold tabular-nums text-foreground"
						>{dist.count}</span
					>
				</div>
			{/each}
		</div>
	</section>

	<Separator class="my-8" />

	<!-- Top 5 lists in a 3-col grid -->
	<div class="grid gap-8 sm:grid-cols-3">
		<!-- Highest Risk -->
		<div>
			<h2 class="text-sm font-semibold text-foreground">Highest Risk</h2>
			<div class="mt-3 space-y-1">
				{#each data.highestRisk as occ, i (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-baseline justify-between py-1 text-xs hover:text-primary"
					>
						<span>
							<span class="tabular-nums text-muted-foreground mr-1">{i + 1}.</span>
							<span class="text-foreground/80">{occ.title}</span>
						</span>
						<span class="ml-2 shrink-0 tabular-nums font-semibold text-risk-very-high"
							>{(occ.net_risk * 100).toFixed(0)}%</span
						>
					</a>
				{/each}
			</div>
			<a
				href="/rankings/highest-risk"
				class="mt-2 inline-block text-xs text-primary hover:underline">Full list &rarr;</a
			>
		</div>

		<!-- Augmented -->
		<div>
			<h2 class="text-sm font-semibold text-foreground">Augmented</h2>
			<div class="mt-3 space-y-1">
				{#each data.aiLeveraged as occ, i (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-baseline justify-between py-1 text-xs hover:text-primary"
					>
						<span>
							<span class="tabular-nums text-muted-foreground mr-1">{i + 1}.</span>
							<span class="text-foreground/80">{occ.title}</span>
						</span>
						<span class="ml-2 shrink-0 tabular-nums font-semibold text-impact-leveraged"
							>{(occ.augmentation * 100).toFixed(0)}%</span
						>
					</a>
				{/each}
			</div>
			<a
				href="/rankings/ai-leveraged"
				class="mt-2 inline-block text-xs text-primary hover:underline">Full list &rarr;</a
			>
		</div>

		<!-- Theory vs Practice -->
		<div>
			<h2 class="text-sm font-semibold text-foreground">Theory vs Practice</h2>
			<div class="mt-3 space-y-1">
				{#each data.theoryVsPractice as occ, i (occ.ssoc)}
					{@const gap = occ.evidence.anthropic_gap ?? 0}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-baseline justify-between py-1 text-xs hover:text-primary"
					>
						<span>
							<span class="tabular-nums text-muted-foreground mr-1">{i + 1}.</span>
							<span class="text-foreground/80">{occ.title}</span>
						</span>
						<span
							class="ml-2 shrink-0 tabular-nums font-semibold {gap > 0
								? 'text-risk-moderate'
								: 'text-impact-leveraged'}">{gap > 0 ? '+' : ''}{Math.round(gap * 100)}pp</span
						>
					</a>
				{/each}
			</div>
			<a
				href="/rankings/theory-vs-practice"
				class="mt-2 inline-block text-xs text-primary hover:underline">Full list &rarr;</a
			>
		</div>
	</div>

	<Separator class="my-8" />

	<!-- Labour Market -->
	<section>
		<h2 class="text-sm font-semibold text-foreground">Labour Market Signals</h2>
		<p class="mt-1 text-xs text-muted-foreground">
			Cluster-level vacancy and hiring data from MOM/SingStat
		</p>
		<div class="mt-4 grid gap-4 sm:grid-cols-3">
			{#each data.labourSummary as cluster}
				<div class="rounded-lg border border-border/50 p-4">
					<p class="text-sm font-medium text-foreground">{cluster.cluster_label}</p>
					<div class="mt-2 flex items-baseline justify-between">
						<span class="text-xs text-muted-foreground">{cluster.count} occupations</span>
						<span class="text-sm font-semibold tabular-nums {trendColor(cluster.vacancy_trend)}">
							{trendArrow(cluster.vacancy_trend)}
							{cluster.vacancy_trend > 0 ? '+' : ''}{cluster.vacancy_trend.toFixed(1)}%
						</span>
					</div>
					<div class="mt-1 flex items-baseline justify-between">
						<span class="text-xs text-muted-foreground"
							>Vacancy {cluster.vacancy_rate.toFixed(1)}%</span
						>
						<span
							class="text-xs font-semibold uppercase tracking-wider {overallColor(cluster.overall)}"
							>{cluster.overall}</span
						>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Source line -->
	<div class="source-line mt-8">
		<p>
			<strong>Sources:</strong> MOM Singapore (wages, employment, vacancy, retrenchment), Felten AIOE
			2021, Pizzinelli/IMF 2023, Anthropic Economic Index Jan 2026, SOL 2026, Jobs in Demand 2025.
		</p>
		<p class="mt-1">
			Scoring V3.1. All scores deterministic and reproducible.
			<a href="/methodology" class="text-primary underline">Methodology</a> &middot;
			<a href="/data" class="text-primary underline">Download data</a>
		</p>
	</div>
</main>
