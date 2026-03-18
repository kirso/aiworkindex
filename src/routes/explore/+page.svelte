<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import WageBracketChart from '$lib/components/viz/WageBracketChart.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import InsightsPanel from '$lib/components/ui/InsightsPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import { sectionLabel, card, caption } from '$lib/design-system';
	import { riskBandLabels, impactTypeLabels } from '$lib/data';
	import type { RiskBand } from '$lib/data';
	import { cn } from '$lib/utils';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();

	let innerWidth = $state(1024);
	let filterResult: typeof data.occupations | null = $state(null);
	let filteredOccupations = $derived(filterResult ?? data.occupations);

	$effect(() => {
		if (!browser) return;
		innerWidth = window.innerWidth;
		function onResize() {
			innerWidth = window.innerWidth;
		}
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	function handleFilter(filtered: typeof data.occupations) {
		filterResult = filtered;
	}

	// Risk band distribution
	let riskBandCounts = $derived.by(() => {
		const counts: Record<string, number> = {
			very_high: 0,
			high: 0,
			moderate: 0,
			low: 0,
			very_low: 0
		};
		for (const o of filteredOccupations) counts[o.risk_band] = (counts[o.risk_band] || 0) + 1;
		return counts;
	});

	// Impact type distribution
	let impactTypeCounts = $derived.by(() => {
		const counts: Record<string, number> = { ai_leveraged: 0, at_risk: 0, stable: 0, mixed: 0 };
		for (const o of filteredOccupations) counts[o.impact_type] = (counts[o.impact_type] || 0) + 1;
		return counts;
	});

	// Key insights computed from filtered data
	let avgRisk = $derived(
		filteredOccupations.length > 0
			? filteredOccupations.reduce((s, o) => s + o.net_risk, 0) / filteredOccupations.length
			: 0
	);
	let avgExposure = $derived(
		filteredOccupations.length > 0
			? filteredOccupations.reduce((s, o) => s + o.exposure, 0) / filteredOccupations.length
			: 0
	);
	let demandSignalCount = $derived(
		filteredOccupations.filter(o => o.evidence.sol_match || o.evidence.jobs_in_demand_match).length
	);
</script>

<svelte:head>
	<title>Explore — AI Work Index</title>
	<meta
		name="description"
		content="Explore all 562 Singapore occupations by AI risk level, wage, and occupation group. Filter, compare, and analyse."
	/>
</svelte:head>

<div class={pageLayout({ width: 'wide' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Explore' }]} />

	<!-- Header: compact, data-dense -->
	<div class="mb-6 flex items-end justify-between">
		<div>
			<h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Explore</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{filteredOccupations.length} of {data.occupations.length} occupations
				{#if filterResult}
					<button class="ml-1 text-primary hover:underline" onclick={() => (filterResult = null)}
						>Clear filters</button
					>
				{/if}
			</p>
		</div>

		<!-- Compact stats strip -->
		<div class="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
			<span
				>Avg risk <strong class="font-mono text-foreground">{(avgRisk * 100).toFixed(0)}%</strong
				></span
			>
			<span
				>Avg exposure <strong class="font-mono text-foreground"
					>{(avgExposure * 100).toFixed(0)}%</strong
				></span
			>
			{#if demandSignalCount > 0}
				<span class="text-risk-very-low">{demandSignalCount} in demand</span>
			{/if}
		</div>
	</div>

	<div class="flex gap-6">
		<!-- Sidebar filters (desktop) -->
		<aside class="hidden w-[240px] shrink-0 lg:block">
			<div
				class={cn(
					card({ padding: 'sm' }),
					'sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto'
				)}
			>
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />

				<!-- Risk distribution inline in sidebar -->
				<div class="mt-4 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Risk Distribution</p>
					<div class="mt-2 space-y-1">
						{#each ['very_high', 'high', 'moderate', 'low', 'very_low'] as const as band}
							{@const count = riskBandCounts[band] ?? 0}
							{@const pct =
								filteredOccupations.length > 0 ? (count / filteredOccupations.length) * 100 : 0}
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 shrink-0 rounded-sm bg-risk-{band.replace('_', '-')}"></span>
								<span class="flex-1 text-xs text-muted-foreground truncate"
									>{riskBandLabels[band as RiskBand]}</span
								>
								<span class="font-mono text-xs text-foreground">{count}</span>
								<div class="w-12 h-1.5 rounded-full bg-inset overflow-hidden">
									<div
										class="h-full rounded-full bg-risk-{band.replace('_', '-')}"
										style="width: {pct}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Impact classification inline in sidebar -->
				<div class="mt-3 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Impact Type</p>
					<div class="mt-2 space-y-1">
						{#each ['ai_leveraged', 'at_risk', 'stable', 'mixed'] as const as type}
							{@const count = impactTypeCounts[type] ?? 0}
							<div class="flex items-center gap-2">
								<span
									class="h-2 w-2 shrink-0 rounded-sm {type === 'ai_leveraged'
										? 'bg-impact-leveraged'
										: type === 'at_risk'
											? 'bg-impact-at-risk'
											: type === 'stable'
												? 'bg-impact-stable'
												: 'bg-impact-mixed'}"
								></span>
								<span class="flex-1 text-xs text-muted-foreground truncate"
									>{impactTypeLabels[type]}</span
								>
								<span class="font-mono text-xs text-foreground">{count}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</aside>

		<!-- Main content -->
		<div class="min-w-0 flex-1">
			{#if innerWidth < 1024}
				<div class="mb-6">
					<Collapsible.Root class={card({ padding: 'none' })}>
						<Collapsible.Trigger
							class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground/80"
						>
							Filters & Search
							<svg
								class="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
							>
						</Collapsible.Trigger>
						<Collapsible.Content class="border-t border-border/50 p-4">
							<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
						</Collapsible.Content>
					</Collapsible.Root>
				</div>
			{/if}

			{#if innerWidth >= 768}
				<!-- TREEMAP: The hero visualization -->
				<section class="mb-6">
					<div class="mb-2 flex items-center justify-between">
						<h2 class={sectionLabel()}>Occupation Map</h2>
						<p class={caption()}>Size = employment · Colour = risk level</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<Treemap occupations={filteredOccupations} />
					</div>
				</section>

				<!-- Charts grid: 2 columns -->
				<div class="grid gap-6 md:grid-cols-2 mb-6">
					<section>
						<h2 class={cn(sectionLabel(), 'mb-2')}>Score Distribution</h2>
						<div class={card({ padding: 'sm' })}>
							<Histogram occupations={filteredOccupations} />
						</div>
					</section>
					<section>
						<h2 class={cn(sectionLabel(), 'mb-2')}>Risk by Wage</h2>
						<div class={card({ padding: 'sm' })}>
							<WageBracketChart occupations={filteredOccupations} />
						</div>
					</section>
				</div>

				<!-- Scatter: full width -->
				<section class="mb-6">
					<div class="mb-2 flex items-center justify-between">
						<h2 class={sectionLabel()}>Exposure vs Human Skills</h2>
						<p class={caption()}>Each dot is one occupation</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<ScatterQuadrant occupations={filteredOccupations} />
					</div>
				</section>
			{:else}
				<!-- Mobile: card list -->
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>

		<!-- Right sidebar: insights (xl+ only) -->
		{#if innerWidth >= 1280}
			<aside class="hidden w-[260px] shrink-0 xl:block">
				<div
					class={cn(
						card({ padding: 'sm' }),
						'sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto'
					)}
				>
					<InsightsPanel occupations={filteredOccupations} />
				</div>
			</aside>
		{/if}
	</div>
</div>
