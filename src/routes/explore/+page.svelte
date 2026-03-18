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
	import { cn } from '$lib/utils';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();

	let innerWidth = $state(1024);
	let filterResult: typeof data.occupations | null = $state(null);
	let filteredOccupations = $derived(filterResult ?? data.occupations);
	let isFiltered = $derived(
		filterResult !== null && filteredOccupations.length !== data.occupations.length
	);

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

	// Computed insights
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

	<!-- Header row -->
	<div class="mb-5 flex items-end justify-between">
		<div>
			<h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Explore</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{filteredOccupations.length} of {data.occupations.length} occupations
				{#if isFiltered}
					<button class="ml-1 text-primary hover:underline" onclick={() => (filterResult = null)}
						>Reset</button
					>
				{/if}
			</p>
		</div>
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
				<span class="text-risk-very-low font-medium">{demandSignalCount} in demand</span>
			{/if}
		</div>
	</div>

	<div class="flex gap-5">
		<!-- Left sidebar: filters only (desktop) -->
		<aside class="hidden w-[240px] shrink-0 lg:block">
			<div
				class={cn(
					card({ padding: 'sm' }),
					'sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto'
				)}
			>
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
			</div>
		</aside>

		<!-- Main content -->
		<div class="min-w-0 flex-1">
			<!-- Mobile filters -->
			{#if innerWidth < 1024}
				<div class="mb-5">
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
				<!-- Key insight bar -->
				<div
					class="mb-5 flex items-center gap-3 rounded-md bg-inset px-4 py-2.5 text-xs text-muted-foreground"
				>
					<svg
						class="h-3.5 w-3.5 shrink-0 text-primary"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path d="M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" /></svg
					>
					<span>
						Higher-paying occupations face higher AI exposure — average exposure rises from <strong
							class="font-mono text-foreground">17%</strong
						>
						(below SGD 2K) to
						<strong class="font-mono text-foreground">71%</strong> (above SGD 10K). AI targets knowledge
						work.
					</span>
				</div>

				<!-- TREEMAP -->
				<div class={cn(card({ padding: 'sm' }), 'mb-5')}>
					<div class="mb-2 flex items-center justify-between px-1">
						<h2 class={sectionLabel()}>Occupation Map</h2>
						<p class={caption()}>Size = employment · Colour = risk</p>
					</div>
					<Treemap occupations={filteredOccupations} />
				</div>

				<!-- Charts: 2 columns -->
				<div class="grid gap-5 md:grid-cols-2 mb-5">
					<div class={card({ padding: 'sm' })}>
						<h3 class={cn(sectionLabel(), 'mb-2 px-1')}>Score Distribution</h3>
						<Histogram occupations={filteredOccupations} />
					</div>
					<div class={card({ padding: 'sm' })}>
						<h3 class={cn(sectionLabel(), 'mb-2 px-1')}>Risk by Wage</h3>
						<WageBracketChart occupations={filteredOccupations} />
					</div>
				</div>

				<!-- Scatter: full width -->
				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between px-1">
						<h2 class={sectionLabel()}>Exposure vs Human Skills</h2>
						<p class={caption()}>Each dot = one occupation</p>
					</div>
					<ScatterQuadrant occupations={filteredOccupations} />
				</div>
			{:else}
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>

		<!-- Right sidebar: insights (xl+) -->
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
