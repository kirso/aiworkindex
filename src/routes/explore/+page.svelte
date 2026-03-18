<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import WageBracketChart from '$lib/components/viz/WageBracketChart.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import { sectionLabel, card, caption } from '$lib/design-system';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';
	import type { RiskBand, ImpactType } from '$lib/data';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';

	let { data } = $props();

	let innerWidth = $state(1024);
	let filterResult: typeof data.occupations | null = $state(null);
	let filteredOccupations = $derived(filterResult ?? data.occupations);
	let isFiltered = $derived(
		filterResult !== null && filteredOccupations.length !== data.occupations.length
	);
	let filtersOpen = $state(false);

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

	// Computed stats
	let avgExposure = $derived(
		filteredOccupations.length > 0
			? filteredOccupations.reduce((s, o) => s + o.exposure, 0) / filteredOccupations.length
			: 0
	);
	let highRiskCount = $derived(
		filteredOccupations.filter(o => o.risk_band === 'high' || o.risk_band === 'very_high').length
	);
	let demandCount = $derived(
		filteredOccupations.filter(o => o.evidence.sol_match || o.evidence.jobs_in_demand_match).length
	);

	// Distributions
	let riskBandCounts = $derived.by(() => {
		const counts: Record<string, number> = {
			very_low: 0,
			low: 0,
			moderate: 0,
			high: 0,
			very_high: 0
		};
		for (const o of filteredOccupations) counts[o.risk_band] = (counts[o.risk_band] || 0) + 1;
		return counts;
	});

	let impactTypeCounts = $derived.by(() => {
		const counts: Record<string, number> = { ai_leveraged: 0, at_risk: 0, stable: 0, mixed: 0 };
		for (const o of filteredOccupations) counts[o.impact_type] = (counts[o.impact_type] || 0) + 1;
		return counts;
	});

	// Top 5
	let topHighRisk = $derived(
		[...filteredOccupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5)
	);
	let topSafest = $derived(
		[...filteredOccupations].sort((a, b) => a.net_risk - b.net_risk).slice(0, 5)
	);

	let medianPay = $derived.by(() => {
		if (filteredOccupations.length === 0) return 0;
		const sorted = filteredOccupations.map(o => o.gross_wage_median).sort((a, b) => a - b);
		return sorted[Math.floor(sorted.length / 2)]!;
	});
</script>

<svelte:head>
	<title>Explore — AI Work Index</title>
	<meta
		name="description"
		content="Explore all 562 Singapore occupations by AI risk level, wage, and occupation group. Filter, compare, and analyse."
	/>
</svelte:head>

<div class="mx-auto max-w-screen-2xl px-4 sm:px-6 py-4">
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Explore' }]} />

	<!-- ===== HEADER: Title + Filter toggle + Key stats ===== -->
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-bold tracking-tight text-foreground">Explore</h1>
			<span class="font-mono text-sm text-muted-foreground">
				{filteredOccupations.length}<span class="text-border">/{data.occupations.length}</span>
			</span>
			<button
				class="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors {filtersOpen
					? 'bg-accent'
					: ''}"
				onclick={() => (filtersOpen = !filtersOpen)}
			>
				<svg
					class="inline h-3.5 w-3.5 mr-1 -mt-0.5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg
				>
				Filters
			</button>
			{#if isFiltered}
				<button class="text-xs text-primary hover:underline" onclick={() => (filterResult = null)}
					>Reset</button
				>
			{/if}
		</div>

		<!-- Compact stats -->
		<div class="hidden items-center gap-3 sm:flex">
			<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<span
					class="inline-block h-2 w-2 rounded-full"
					style="background-color: {riskBandColors.very_high}"
				></span>
				<strong class="font-mono text-foreground">{highRiskCount}</strong> high risk
			</div>
			<div class="text-xs text-muted-foreground">
				<strong class="font-mono text-foreground">{(avgExposure * 100).toFixed(0)}%</strong>
				avg exposure
			</div>
			<div class="text-xs text-muted-foreground">
				<strong class="font-mono text-foreground">{demandCount}</strong> in demand
			</div>
			<div class="text-xs text-muted-foreground">
				<strong class="font-mono text-foreground">SGD {(medianPay / 1000).toFixed(1)}K</strong> median
			</div>
		</div>
	</div>

	<!-- ===== FILTERS: Collapsible panel ===== -->
	{#if filtersOpen}
		<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
			<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
		</div>
	{/if}

	{#if innerWidth >= 768}
		<!-- ===== TREEMAP: Full width hero ===== -->
		<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
			<div class="mb-1.5 flex items-center justify-between px-1">
				<h2 class={sectionLabel()}>Occupation Map</h2>
				<p class={caption()}>Size = employment · Colour = risk</p>
			</div>
			<Treemap occupations={filteredOccupations} />
		</div>

		<!-- ===== CHARTS: 2-column (histogram + wage) ===== -->
		<div class="grid gap-4 md:grid-cols-2 mb-4">
			<div class={card({ padding: 'sm' })}>
				<h3 class={cn(sectionLabel(), 'mb-2 px-1')}>Score Distribution</h3>
				<Histogram occupations={filteredOccupations} />
			</div>
			<div class={card({ padding: 'sm' })}>
				<h3 class={cn(sectionLabel(), 'mb-2 px-1')}>Risk by Wage</h3>
				<WageBracketChart occupations={filteredOccupations} />
			</div>
		</div>

		<!-- ===== SCATTER: Full width (needs space for 562 dots) ===== -->
		<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
			<div class="mb-1.5 flex items-center justify-between px-1">
				<h2 class={sectionLabel()}>Exposure vs Human Skills</h2>
				<p class={caption()}>Each dot = one occupation · 4 quadrants</p>
			</div>
			<ScatterQuadrant occupations={filteredOccupations} />
		</div>

		<!-- ===== BOTTOM: 4-column grid (distributions + top 5 lists) ===== -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
			<!-- Risk distribution -->
			<div class={card({ padding: 'sm' })}>
				<h3 class={cn(sectionLabel(), 'mb-2')}>Risk Bands</h3>
				<div class="space-y-1">
					{#each ['very_low', 'low', 'moderate', 'high', 'very_high'] as const as band}
						{@const count = riskBandCounts[band] ?? 0}
						{@const pct =
							filteredOccupations.length > 0 ? (count / filteredOccupations.length) * 100 : 0}
						<div class="flex items-center gap-1.5">
							<span class="w-8 shrink-0 text-right text-xs text-muted-foreground"
								>{riskBandLabels[band as RiskBand].replace('Very ', 'V.')}</span
							>
							<div class="h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-inset">
								<div
									class="h-full rounded-sm"
									style="width: {pct}%; background-color: {riskBandColors[band as RiskBand]};"
								></div>
							</div>
							<span class="w-6 shrink-0 text-right font-mono text-xs text-foreground">{count}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Impact classification -->
			<div class={card({ padding: 'sm' })}>
				<h3 class={cn(sectionLabel(), 'mb-2')}>Impact Type</h3>
				<div class="space-y-1">
					{#each ['ai_leveraged', 'at_risk', 'stable', 'mixed'] as const as type}
						{@const count = impactTypeCounts[type] ?? 0}
						{@const pct =
							filteredOccupations.length > 0 ? (count / filteredOccupations.length) * 100 : 0}
						<div class="flex items-center gap-1.5">
							<span class="w-14 shrink-0 text-right text-xs text-muted-foreground"
								>{impactTypeLabels[type as ImpactType]}</span
							>
							<div class="h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-inset">
								<div
									class="h-full rounded-sm"
									style="width: {pct}%; background-color: {impactTypeColors[type as ImpactType]};"
								></div>
							</div>
							<span class="w-6 shrink-0 text-right font-mono text-xs text-foreground">{count}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Top 5 highest risk -->
			<div class={card({ padding: 'sm' })}>
				<div class="flex items-center justify-between mb-2">
					<h3 class={sectionLabel()}>Highest Risk</h3>
					<a href="/rankings/highest-risk" class="text-xs text-primary hover:underline">All →</a>
				</div>
				{#each topHighRisk as occ, i (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-center gap-1.5 rounded-sm py-1 hover:bg-accent transition-colors text-xs"
					>
						<span class="font-mono font-bold text-risk-very-high w-3">{i + 1}</span>
						<span class="flex-1 text-foreground truncate">{occ.title}</span>
						<span class="shrink-0 font-mono text-risk-very-high"
							>{(occ.net_risk * 100).toFixed(0)}%</span
						>
					</a>
				{/each}
			</div>

			<!-- Top 5 safest -->
			<div class={card({ padding: 'sm' })}>
				<div class="flex items-center justify-between mb-2">
					<h3 class={sectionLabel()}>Most Resilient</h3>
					<a href="/rankings/safest-high-paying" class="text-xs text-primary hover:underline"
						>All →</a
					>
				</div>
				{#each topSafest as occ, i (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-center gap-1.5 rounded-sm py-1 hover:bg-accent transition-colors text-xs"
					>
						<span class="font-mono font-bold text-risk-very-low w-3">{i + 1}</span>
						<span class="flex-1 text-foreground truncate">{occ.title}</span>
						<span class="shrink-0 font-mono text-risk-very-low"
							>{(occ.net_risk * 100).toFixed(0)}%</span
						>
					</a>
				{/each}
			</div>
		</div>

		<!-- ===== INSIGHT ===== -->
		<p class="text-xs text-muted-foreground px-1">
			Higher-paying occupations face higher AI exposure — from
			<strong class="font-mono text-foreground">17%</strong> (below SGD 2K) to
			<strong class="font-mono text-foreground">71%</strong> (above SGD 10K).
			<a href="/methodology" class="text-primary hover:underline">How we score →</a>
		</p>
	{:else}
		<!-- Mobile: card list with filter collapsible -->
		<OccupationCardList occupations={filteredOccupations} />
	{/if}
</div>
