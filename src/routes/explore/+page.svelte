<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import WageBracketChart from '$lib/components/viz/WageBracketChart.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import InsightsPanel from '$lib/components/ui/InsightsPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import { sectionLabel, card, display, riskBadge, caption } from '$lib/design-system';
	import { riskBandLabels, impactTypeLabels } from '$lib/data';
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

	// Demand signal count
	let demandSignalCount = $derived(
		filteredOccupations.filter(o => o.evidence.sol_match || o.evidence.jobs_in_demand_match).length
	);
</script>

<svelte:head>
	<title>Explore — Singapore AI Occupation Index</title>
	<meta
		name="description"
		content="Explore all 562 Singapore occupations by AI risk level, wage, and occupation group. Filter, compare, and analyse."
	/>
</svelte:head>

<div class={pageLayout({ width: 'wide' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Explore' }]} />

	<div class="mb-8">
		<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
			Explore All Occupations
		</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Filter, browse, and analyse {data.occupations.length} Singapore occupations by AI risk, wage, and
			occupation group.
		</p>
	</div>

	<div class="flex gap-6">
		<!-- Sidebar filters (desktop) -->
		<aside class="hidden w-[260px] shrink-0 lg:block">
			<div
				class={cn(
					card({ padding: 'md' }),
					'sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto'
				)}
			>
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
			</div>
		</aside>

		<!-- Main content -->
		<div class="min-w-0 flex-1">
			<!-- Risk band summary cards -->
			<div class="mb-8">
				<h2 class={cn(sectionLabel(), 'mb-3')}>Risk Bands</h2>
				<div class="grid grid-cols-5 gap-2">
					{#each ['very_high', 'high', 'moderate', 'low', 'very_low'] as const as band}
						<div class={cn(card({ padding: 'sm' }), 'text-center')}>
							<p class={display({ size: 'md' })}>{riskBandCounts[band]}</p>
							<p class={cn(riskBadge({ band }), 'text-xs mt-0.5')}>
								{riskBandLabels[band]}
							</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Impact type breakdown -->
			<div class={cn(card({ padding: 'sm' }), 'mb-8')}>
				<p class={caption({ weight: 'medium' })}>Impact classification</p>
				<div class="mt-2 flex h-5 w-full overflow-hidden rounded-md">
					{#each ['ai_leveraged', 'at_risk', 'stable', 'mixed'] as const as type}
						{@const pct =
							filteredOccupations.length > 0
								? ((impactTypeCounts[type] ?? 0) / filteredOccupations.length) * 100
								: 0}
						{#if pct > 0}
							<div
								class="h-full transition-all {type === 'ai_leveraged'
									? 'bg-impact-leveraged'
									: type === 'at_risk'
										? 'bg-impact-at-risk'
										: type === 'stable'
											? 'bg-impact-stable'
											: 'bg-impact-mixed'}"
								style="width: {pct}%;"
								title="{impactTypeLabels[type]}: {impactTypeCounts[type]} ({pct.toFixed(0)}%)"
							></div>
						{/if}
					{/each}
				</div>
				<div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5">
					{#each ['ai_leveraged', 'at_risk', 'stable', 'mixed'] as const as type}
						<span class={cn(caption(), 'flex items-center gap-1')}>
							<span
								class="inline-block h-2 w-2 rounded-sm {type === 'ai_leveraged'
									? 'bg-impact-leveraged'
									: type === 'at_risk'
										? 'bg-impact-at-risk'
										: type === 'stable'
											? 'bg-impact-stable'
											: 'bg-impact-mixed'}"
							></span>
							{impactTypeLabels[type]} ({impactTypeCounts[type]})
						</span>
					{/each}
					{#if demandSignalCount > 0}
						<span class={cn(caption(), 'ml-auto text-risk-very-low')}
							>{demandSignalCount} with demand signals</span
						>
					{/if}
				</div>
			</div>

			{#if innerWidth < 1024}
				<div class="mb-8">
					<Collapsible.Root class={card()}>
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
				<section class={cn(card({ padding: 'md' }), 'mb-8')}>
					<div class="mb-3 flex items-center justify-between">
						<h2 class={sectionLabel()}>Occupation Map</h2>
						<span class={caption()}>{filteredOccupations.length} occupations</span>
					</div>
					<Treemap occupations={filteredOccupations} />
				</section>

				<section class={cn(card({ padding: 'md' }), 'mb-8')}>
					<div class="mb-3">
						<h2 class={sectionLabel()}>Risk Distribution</h2>
					</div>
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<h3 class={cn(caption({ weight: 'medium' }), 'mb-2')}>Score Histogram</h3>
							<Histogram occupations={filteredOccupations} />
						</div>
						<div>
							<h3 class={cn(caption({ weight: 'medium' }), 'mb-2')}>Risk by Wage Bracket</h3>
							<WageBracketChart occupations={filteredOccupations} />
						</div>
					</div>
				</section>

				<section class={cn(card({ padding: 'md' }), 'mb-8')}>
					<div class="mb-3">
						<h2 class={sectionLabel()}>AI Exposure vs Human Skills</h2>
						<p class={cn(caption(), 'mt-1')}>Each dot is one occupation.</p>
					</div>
					<ScatterQuadrant occupations={filteredOccupations} />
				</section>
			{:else}
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>

		<!-- Right sidebar: insights (xl+ only) -->
		{#if innerWidth >= 1280}
			<aside class="hidden w-[280px] shrink-0 xl:block">
				<div
					class={cn(
						card({ padding: 'md' }),
						'sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto'
					)}
				>
					<InsightsPanel occupations={filteredOccupations} />
				</div>
			</aside>
		{/if}
	</div>
</div>
