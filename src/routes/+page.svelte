<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import WageBracketChart from '$lib/components/viz/WageBracketChart.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import HeroSearch from '$lib/components/ui/HeroSearch.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import { card, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';
	import type { RiskBand, ImpactType } from '$lib/data';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { shortTitle } from '$lib/data/display-names';

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

	// Distributions (reactive to filters)
	let riskBandCounts = $derived.by(() => {
		const c: Record<string, number> = {
			very_low: 0,
			low: 0,
			moderate: 0,
			high: 0,
			very_high: 0
		};
		for (const o of filteredOccupations) c[o.risk_band] = (c[o.risk_band] || 0) + 1;
		return c;
	});
	let impactTypeCounts = $derived.by(() => {
		const c: Record<string, number> = { ai_leveraged: 0, at_risk: 0, stable: 0, mixed: 0 };
		for (const o of filteredOccupations) c[o.impact_type] = (c[o.impact_type] || 0) + 1;
		return c;
	});

	// Top 5 lists (reactive to filters)
	let topHighRisk = $derived(
		[...filteredOccupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5)
	);
	let topSafest = $derived(
		[...filteredOccupations].sort((a, b) => a.net_risk - b.net_risk).slice(0, 5)
	);
	let topAugmented = $derived(
		filteredOccupations
			.filter(o => o.impact_type === 'ai_leveraged')
			.sort((a, b) => b.exposure - a.exposure)
			.slice(0, 5)
	);
	let topInDemand = $derived(
		filteredOccupations
			.filter(o => o.evidence.sol_match || o.evidence.jobs_in_demand_match)
			.sort((a, b) => b.market.market_resilience - a.market.market_resilience)
			.slice(0, 5)
	);

	const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'Will AI replace my job in Singapore?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: `It depends on your occupation. Of ${DATA_VINTAGE.occupation_count} Singapore occupations scored using a 4-input ensemble (AIOE, Anthropic, Eloundou, ILO), risk ranges from very low to very high displacement pressure.`
				}
			},
			{
				'@type': 'Question',
				name: 'How is the Singapore AI job risk score calculated?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Net displacement risk = AI exposure × (1 − human bottleneck) × market modifier. No LLM is used in the scoring pipeline.'
				}
			}
		]
	})}<\/script>`;
</script>

<Seo
	title="AI Work Index — How will AI affect your job?"
	description="Find out if AI will replace, augment, or barely affect your role in Singapore. 562 occupations scored using official data and peer-reviewed research."
	path="/"
	ogImage="/og/default.png"
	jsonLd={[faqJsonLd]}
/>

<!-- ===== NEWS BANNER ===== -->
<div class="border-b border-risk-moderate-border bg-risk-moderate-subtle">
	<div
		class="mx-auto flex max-w-screen-2xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:px-6"
	>
		<span class="font-semibold text-risk-moderate">New</span>
		<span class="text-foreground/70"
			>V4.0: 4-input ensemble (AIOE + Anthropic + Eloundou + ILO) · BLS validated (rho=-0.14,
			p&lt;0.01) ·
			<a href="/reports" class="text-primary hover:underline">Q4 2025 full MOM data expected soon</a
			></span
		>
	</div>
</div>

<!-- ===== HERO: Search + Stats ===== -->
<div class="bg-card border-b border-border">
	<div class="mx-auto max-w-screen-2xl px-4 sm:px-6">
		<div class="mx-auto max-w-2xl py-8 sm:py-10 text-center">
			<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				How will AI affect your job?
			</h1>
			<p class="mt-1.5 text-sm text-muted-foreground">
				Search any Singapore occupation or modern role ·
				<a href="/calculator" class="text-primary hover:underline">Try the salary calculator</a>
			</p>
			<div class="mt-4">
				<HeroSearch occupations={data.occupations} />
			</div>
		</div>
		<!-- Key stats — designed to shock and inform -->
		<div class="grid grid-cols-3 gap-3 pb-5 sm:grid-cols-6">
			<div class="text-center">
				<p class="font-mono text-lg font-bold text-foreground sm:text-xl">
					{data.occupations.length}
				</p>
				<p class="text-[10px] text-muted-foreground">occupations scored</p>
			</div>
			<div class="text-center">
				<p class="font-mono text-lg font-bold text-risk-very-high sm:text-xl">
					{data.stats.highRiskPct}%
				</p>
				<p class="text-[10px] text-muted-foreground">face high+ AI risk</p>
			</div>
			<div class="text-center">
				<p class="font-mono text-lg font-bold text-risk-high sm:text-xl">
					SGD {data.stats.wagesAtRiskBillions.toFixed(0)}B
				</p>
				<p class="text-[10px] text-muted-foreground">annual wages at risk</p>
			</div>
			<div class="text-center">
				<p class="font-mono text-lg font-bold text-foreground sm:text-xl">
					{(data.stats.avgExposure * 100).toFixed(0)}%
				</p>
				<p class="text-[10px] text-muted-foreground">avg AI task overlap</p>
			</div>
			<div class="text-center">
				<p class="font-mono text-lg font-bold text-risk-very-low sm:text-xl">
					{data.stats.demandCount}
				</p>
				<p class="text-[10px] text-muted-foreground">gov't in-demand</p>
			</div>
			<div class="text-center">
				<p class="font-mono text-lg font-bold text-foreground sm:text-xl">
					SGD {(data.stats.nationalMedian / 1000).toFixed(1)}K
				</p>
				<p class="text-[10px] text-muted-foreground">median wage</p>
			</div>
		</div>
	</div>
</div>

<!-- ===== MAIN: Sidebar + Content ===== -->
<div class="mx-auto max-w-screen-2xl px-4 sm:px-6 py-4">
	<div class="flex gap-5">
		<!-- Filter sidebar (desktop) -->
		<aside class="hidden w-[220px] shrink-0 lg:block">
			<div
				class={cn(
					card({ padding: 'sm' }),
					'sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto'
				)}
			>
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />

				<!-- Risk distribution -->
				<div class="mt-3 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Risk Bands</p>
					<div class="mt-1.5 space-y-0.5">
						{#each ['very_low', 'low', 'moderate', 'high', 'very_high'] as const as band}
							{@const count = riskBandCounts[band] ?? 0}
							{@const pct =
								filteredOccupations.length > 0 ? (count / filteredOccupations.length) * 100 : 0}
							<div class="flex items-center gap-1">
								<span class="w-16 shrink-0 text-right text-xs text-muted-foreground"
									>{riskBandLabels[band as RiskBand]}</span
								>
								<div
									class="h-3.5 rounded-sm"
									style="width: {Math.max(pct, 4)}%; background-color: {riskBandColors[
										band as RiskBand
									]};"
								></div>
								<span class="shrink-0 font-mono text-xs text-foreground">{count}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Impact type -->
				<div class="mt-3 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Impact Type</p>
					<div class="mt-1.5 space-y-0.5">
						{#each ['ai_leveraged', 'at_risk', 'stable', 'mixed'] as const as type}
							{@const count = impactTypeCounts[type] ?? 0}
							{@const pct =
								filteredOccupations.length > 0 ? (count / filteredOccupations.length) * 100 : 0}
							<div class="flex items-center gap-1">
								<span class="w-16 shrink-0 text-right text-xs text-muted-foreground"
									>{impactTypeLabels[type as ImpactType]}</span
								>
								<div
									class="h-3.5 rounded-sm"
									style="width: {Math.max(pct, 4)}%; background-color: {impactTypeColors[
										type as ImpactType
									]};"
								></div>
								<span class="shrink-0 font-mono text-xs text-foreground">{count}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</aside>

		<!-- Main content -->
		<div class="min-w-0 flex-1">
			<!-- Mobile filters -->
			{#if innerWidth < 1024}
				<div class="mb-4">
					<details class={cn(card({ padding: 'none' }))}>
						<summary
							class="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-foreground/80 list-none [&::-webkit-details-marker]:hidden"
						>
							Filters & Search
							<svg
								class="h-4 w-4 text-muted-foreground"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
							>
						</summary>
						<div class="border-t border-border/50 p-4">
							<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
						</div>
					</details>
				</div>
			{/if}

			{#if isFiltered}
				<p class="mb-3 text-xs text-muted-foreground">
					Showing {filteredOccupations.length} of {data.occupations.length} occupations ·
					<button class="text-primary hover:underline" onclick={() => (filterResult = null)}
						>Reset</button
					>
				</p>
			{/if}

			{#if innerWidth >= 768}
				<!-- Treemap -->
				<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
					<div class="mb-1.5 flex items-center justify-between px-1">
						<h2 class={sectionLabel()}>Occupation Map</h2>
						<p class={caption()}>Size = employment · Colour = risk</p>
					</div>
					<Treemap occupations={filteredOccupations} />
				</div>

				<!-- Charts: 2-column -->
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

				<!-- Scatter: full width -->
				<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
					<div class="mb-1.5 flex items-center justify-between px-1">
						<h2 class={sectionLabel()}>Exposure vs Human Skills</h2>
						<p class={caption()}>Each dot = one occupation · 4 quadrants</p>
					</div>
					<ScatterQuadrant occupations={filteredOccupations} />
				</div>

				<!-- Featured: 4 cards -->
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
					<!-- Highest Risk -->
					<div class={card({ padding: 'sm' })}>
						<div class="flex items-center justify-between mb-2">
							<h3 class={sectionLabel()}>Highest Risk</h3>
							<a href="/rankings/highest-risk" class="text-xs text-primary hover:underline">All →</a
							>
						</div>
						{#each topHighRisk as occ, i (occ.ssoc)}
							<a
								href="/occupation/{occ.ssoc}"
								class="flex items-center gap-1.5 rounded-sm py-1 hover:bg-accent transition-colors text-xs"
							>
								<span class="font-mono font-bold text-risk-very-high w-3">{i + 1}</span>
								<span class="flex-1 text-foreground truncate">{shortTitle(occ.title)}</span>
								<span class="shrink-0 font-mono text-risk-very-high"
									>{(occ.net_risk * 100).toFixed(0)}%</span
								>
							</a>
						{/each}
					</div>

					<!-- Most Resilient -->
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
								<span class="flex-1 text-foreground truncate">{shortTitle(occ.title)}</span>
								<span class="shrink-0 font-mono text-risk-very-low"
									>{(occ.net_risk * 100).toFixed(0)}%</span
								>
							</a>
						{/each}
					</div>

					<!-- Augmented -->
					<div class={card({ padding: 'sm' })}>
						<div class="flex items-center justify-between mb-2">
							<h3 class={sectionLabel()}>Augmented</h3>
							<a href="/rankings/ai-leveraged" class="text-xs text-primary hover:underline">All →</a
							>
						</div>
						{#each topAugmented as occ, i (occ.ssoc)}
							<a
								href="/occupation/{occ.ssoc}"
								class="flex items-center gap-1.5 rounded-sm py-1 hover:bg-accent transition-colors text-xs"
							>
								<span class="font-mono font-bold text-impact-leveraged w-3">{i + 1}</span>
								<span class="flex-1 text-foreground truncate">{shortTitle(occ.title)}</span>
								<span class="shrink-0 font-mono text-muted-foreground"
									>{riskBandLabels[occ.risk_band]}</span
								>
							</a>
						{/each}
					</div>

					<!-- In Demand -->
					<div class={card({ padding: 'sm' })}>
						<div class="flex items-center justify-between mb-2">
							<h3 class={sectionLabel()}>In Demand</h3>
							<a
								href="/rankings/high-exposure-in-demand"
								class="text-xs text-primary hover:underline">All →</a
							>
						</div>
						{#each topInDemand as occ, i (occ.ssoc)}
							<a
								href="/occupation/{occ.ssoc}"
								class="flex items-center gap-1.5 rounded-sm py-1 hover:bg-accent transition-colors text-xs"
							>
								<span class="font-mono font-bold text-risk-very-low w-3">{i + 1}</span>
								<span class="flex-1 text-foreground truncate">{shortTitle(occ.title)}</span>
								<span class="shrink-0 font-mono text-muted-foreground"
									>SGD {(occ.gross_wage_median / 1000).toFixed(0)}K</span
								>
							</a>
						{/each}
					</div>
				</div>

				<!-- Browse pills -->
				<div class="flex flex-wrap items-center gap-2 text-xs">
					<span class={caption({ weight: 'medium' })}>More:</span>
					{#each [{ href: '/rankings', label: 'All Rankings' }, { href: '/compare', label: 'Compare' }, { href: '/methodology', label: 'Methodology' }] as link}
						<a
							href={link.href}
							class="rounded-md border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:bg-accent transition-colors"
							>{link.label}</a
						>
					{/each}
				</div>
			{:else}
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>
	</div>
</div>
