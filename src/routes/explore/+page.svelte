<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import WageBracketChart from '$lib/components/viz/WageBracketChart.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import { sectionLabel, card, caption } from '$lib/design-system';
	import { riskBandLabels, impactTypeLabels, riskBandColors, impactTypeColors } from '$lib/data';
	import type { RiskBand, ImpactType } from '$lib/data';
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

	// Computed stats
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
	let highRiskCount = $derived(
		filteredOccupations.filter(o => o.risk_band === 'high' || o.risk_band === 'very_high').length
	);
	let demandCount = $derived(
		filteredOccupations.filter(o => o.evidence.sol_match || o.evidence.jobs_in_demand_match).length
	);

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

	// Impact type counts
	let impactTypeCounts = $derived.by(() => {
		const counts: Record<string, number> = { ai_leveraged: 0, at_risk: 0, stable: 0, mixed: 0 };
		for (const o of filteredOccupations) counts[o.impact_type] = (counts[o.impact_type] || 0) + 1;
		return counts;
	});

	// Top 5 lists for sidebar
	let topHighRisk = $derived(
		[...filteredOccupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5)
	);
	let topSafest = $derived(
		[...filteredOccupations].sort((a, b) => a.net_risk - b.net_risk).slice(0, 5)
	);

	// Median pay
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

<div class={pageLayout({ width: 'wide' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Explore' }]} />

	<!-- Header -->
	<div class="mb-4 flex items-end justify-between">
		<div>
			<h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Explore</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{filteredOccupations.length} of {data.occupations.length} occupations
				{#if isFiltered}
					· <button class="text-primary hover:underline" onclick={() => (filterResult = null)}
						>Reset</button
					>
				{/if}
			</p>
		</div>
	</div>

	<!-- 2-column layout: sidebar + main -->
	<div class="flex gap-5">
		<!-- LEFT SIDEBAR: Filters + Context -->
		<aside class="hidden w-[260px] shrink-0 lg:block">
			<div
				class={cn(
					card({ padding: 'sm' }),
					'sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto'
				)}
			>
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />

				<!-- Risk distribution -->
				<div class="mt-4 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Risk Distribution</p>
					<div class="mt-2 space-y-1">
						{#each ['very_high', 'high', 'moderate', 'low', 'very_low'] as const as band}
							{@const count = riskBandCounts[band] ?? 0}
							{@const maxCount = Math.max(...Object.values(riskBandCounts), 1)}
							<div class="flex items-center gap-1.5">
								<span class="w-9 shrink-0 text-right text-xs text-muted-foreground"
									>{riskBandLabels[band as RiskBand].replace('Very ', 'V.')}</span
								>
								<div class="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-inset">
									<div
										class="h-full rounded-sm"
										style="width: {(count / maxCount) * 100}%; background-color: {riskBandColors[
											band as RiskBand
										]};"
									></div>
								</div>
								<span class="w-6 shrink-0 text-right font-mono text-xs text-foreground"
									>{count}</span
								>
							</div>
						{/each}
					</div>
				</div>

				<!-- Impact type -->
				<div class="mt-3 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Impact Type</p>
					<div class="mt-2 space-y-1">
						{#each ['at_risk', 'ai_leveraged', 'stable', 'mixed'] as const as type}
							{@const count = impactTypeCounts[type] ?? 0}
							{@const maxCount = Math.max(...Object.values(impactTypeCounts), 1)}
							<div class="flex items-center gap-1.5">
								<span class="w-14 shrink-0 text-right text-xs text-muted-foreground"
									>{impactTypeLabels[type as ImpactType]}</span
								>
								<div class="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-inset">
									<div
										class="h-full rounded-sm"
										style="width: {(count / maxCount) * 100}%; background-color: {impactTypeColors[
											type as ImpactType
										]};"
									></div>
								</div>
								<span class="w-6 shrink-0 text-right font-mono text-xs text-foreground"
									>{count}</span
								>
							</div>
						{/each}
					</div>
				</div>

				<!-- Top 5 highest risk -->
				<div class="mt-3 border-t border-border pt-3">
					<div class="flex items-center justify-between">
						<p class={caption({ weight: 'semibold' })}>Highest Risk</p>
						<a href="/rankings/highest-risk" class="text-xs text-primary hover:underline">All →</a>
					</div>
					<ol class="mt-2 space-y-1">
						{#each topHighRisk as occ, i (occ.ssoc)}
							<li>
								<a
									href="/occupation/{occ.ssoc}"
									class="flex items-start gap-1.5 rounded-sm px-1 py-0.5 -mx-1 hover:bg-accent transition-colors"
								>
									<span
										class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-risk-very-high-subtle text-xs font-bold text-risk-very-high"
										>{i + 1}</span
									>
									<span class="text-xs text-foreground leading-tight truncate">{occ.title}</span>
									<span class="ml-auto shrink-0 font-mono text-xs text-muted-foreground"
										>{(occ.net_risk * 100).toFixed(0)}%</span
									>
								</a>
							</li>
						{/each}
					</ol>
				</div>

				<!-- Top 5 safest -->
				<div class="mt-3 border-t border-border pt-3">
					<div class="flex items-center justify-between">
						<p class={caption({ weight: 'semibold' })}>Most Resilient</p>
						<a href="/rankings/safest-high-paying" class="text-xs text-primary hover:underline"
							>All →</a
						>
					</div>
					<ol class="mt-2 space-y-1">
						{#each topSafest as occ, i (occ.ssoc)}
							<li>
								<a
									href="/occupation/{occ.ssoc}"
									class="flex items-start gap-1.5 rounded-sm px-1 py-0.5 -mx-1 hover:bg-accent transition-colors"
								>
									<span
										class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-risk-very-low-subtle text-xs font-bold text-risk-very-low"
										>{i + 1}</span
									>
									<span class="text-xs text-foreground leading-tight truncate">{occ.title}</span>
									<span class="ml-auto shrink-0 font-mono text-xs text-muted-foreground"
										>{(occ.net_risk * 100).toFixed(0)}%</span
									>
								</a>
							</li>
						{/each}
					</ol>
				</div>
			</div>
		</aside>

		<!-- MAIN CONTENT -->
		<div class="min-w-0 flex-1">
			<!-- Mobile filters -->
			{#if innerWidth < 1024}
				<div class="mb-4">
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
				<!-- Key metrics row -->
				<div class="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
					<div class="rounded-md bg-inset px-3 py-2">
						<p class="text-xs text-muted-foreground">Occupations</p>
						<p class="font-mono text-lg font-bold text-foreground">
							{filteredOccupations.length}
						</p>
					</div>
					<div class="rounded-md bg-inset px-3 py-2">
						<p class="text-xs text-muted-foreground">Avg Risk</p>
						<p class="font-mono text-lg font-bold text-foreground">
							{(avgRisk * 100).toFixed(0)}%
						</p>
					</div>
					<div class="rounded-md bg-inset px-3 py-2">
						<p class="text-xs text-muted-foreground">Avg Exposure</p>
						<p class="font-mono text-lg font-bold text-foreground">
							{(avgExposure * 100).toFixed(0)}%
						</p>
					</div>
					<div class="rounded-md bg-inset px-3 py-2">
						<p class="text-xs text-muted-foreground">High+ Risk</p>
						<p class="font-mono text-lg font-bold text-risk-very-high">{highRiskCount}</p>
					</div>
					<div class="rounded-md bg-inset px-3 py-2">
						<p class="text-xs text-muted-foreground">In Demand</p>
						<p class="font-mono text-lg font-bold text-risk-very-low">{demandCount}</p>
					</div>
					<div class="rounded-md bg-inset px-3 py-2">
						<p class="text-xs text-muted-foreground">Median Pay</p>
						<p class="font-mono text-lg font-bold text-foreground">
							{(medianPay / 1000).toFixed(1)}K
						</p>
					</div>
				</div>

				<!-- TREEMAP -->
				<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
					<div class="mb-2 flex items-center justify-between px-1">
						<h2 class={sectionLabel()}>Occupation Map</h2>
						<p class={caption()}>Size = employment · Colour = risk</p>
					</div>
					<Treemap occupations={filteredOccupations} />
				</div>

				<!-- Data insight -->
				<p class="mb-4 text-xs text-muted-foreground px-1">
					Higher-paying occupations face higher AI exposure — from
					<strong class="font-mono text-foreground">17%</strong> avg exposure below SGD 2K to
					<strong class="font-mono text-foreground">71%</strong> above SGD 10K.
					<a href="/rankings" class="text-primary hover:underline">View rankings →</a>
				</p>

				<!-- Charts -->
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

				<!-- Scatter -->
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
	</div>
</div>
