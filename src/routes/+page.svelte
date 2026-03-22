<script lang="ts">
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import DemandPressureMatrix from '$lib/components/viz/DemandPressureMatrix.svelte';
	import HeroSearch from '$lib/components/ui/HeroSearch.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { card, sectionLabel, caption, pill } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';
	import type { RiskBand, ImpactType } from '$lib/data';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { shortTitle } from '$lib/data/display-names';
	import { innerWidth as windowWidth } from 'svelte/reactivity/window';

	let { data } = $props();

	let viewportWidth = $derived(windowWidth.current ?? 1024);
	let filterResult: typeof data.occupations | null = $state(null);
	let activeChartTab = $state<'treemap' | 'pressure' | 'distribution'>('treemap');
	let filteredOccupations = $derived(filterResult ?? data.occupations);
	let isFiltered = $derived(
		filterResult !== null && filteredOccupations.length !== data.occupations.length
	);

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

	let chartTabs = [
		{ key: 'treemap' as const, label: 'Occupation Map' },
		{ key: 'pressure' as const, label: 'Demand vs Pressure' },
		{ key: 'distribution' as const, label: 'Distribution' }
	];

	const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'Will AI replace my job in Singapore?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: `It depends on your occupation. Of ${DATA_VINTAGE.occupation_count} Singapore occupations scored using a 4-source exposure ensemble (AIOE, Anthropic observed usage, Eloundou GPT exposure, and ILO occupational exposure), risk ranges from very low to very high structural displacement pressure.`
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
	title="AI Work Index — How Will AI Affect Your Job in Singapore?"
	description="Explore structural AI pressure on Singapore jobs. {DATA_VINTAGE.occupation_count} occupations scored using official data and published research, with synthetic modern roles and labour-market context."
	path="/"
	ogImage="/og/default.png"
	jsonLd={[faqJsonLd]}
/>

<!-- ===== NEWS BANNER ===== -->
<div class="border-b border-risk-moderate-border bg-risk-moderate-subtle">
	<div
		class="mx-auto flex max-w-screen-2xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:px-6"
	>
		<span class="text-text-secondary">
			{siteStatus.homepage_banner.summary}
			<a href={siteStatus.homepage_banner.link_href} class="ml-1 text-primary hover:underline"
				>{siteStatus.homepage_banner.link_label}</a
			>
		</span>
	</div>
</div>

<!-- ===== HERO: Search → Stats → Browse ===== -->
<div class="bg-card border-b border-border">
	<div class="mx-auto max-w-screen-2xl px-4 sm:px-6">
		<div class="mx-auto max-w-2xl py-10 sm:py-12 text-center">
			<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				How will AI affect your job?
			</h1>
			<p class="mt-1.5 text-sm text-muted-foreground">
				Search any Singapore occupation or modern role
			</p>
			<div class="mt-4">
				<HeroSearch occupations={data.occupations} />
			</div>

			<!-- Shock stats -->
			<div class="mt-6 grid grid-cols-3 gap-4">
				<div>
					<p class="font-mono text-xl font-bold text-risk-very-high sm:text-2xl">
						{data.stats.highRiskPct}%
					</p>
					<p class="text-xs text-muted-foreground sm:text-xs">
						of jobs face significant AI pressure
					</p>
				</div>
				<div>
					<p class="font-mono text-xl font-bold text-risk-high sm:text-2xl">
						SGD {data.stats.wagePoolUnderPressureBillions.toFixed(0)}B
					</p>
					<p class="text-xs text-muted-foreground sm:text-xs">in annual wages overlap with AI</p>
				</div>
				<div>
					<p class="font-mono text-xl font-bold text-risk-very-low sm:text-2xl">
						{data.stats.demandCount}
					</p>
					<p class="text-xs text-muted-foreground sm:text-xs">jobs on Singapore's shortage list</p>
				</div>
			</div>

			<!-- Browse paths -->
			<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
				<a
					href="/rankings/highest-risk"
					class={pill({ size: 'lg', tone: 'outline', interactive: true })}
				>
					Highest pressure jobs →
				</a>
				<a
					href="/rankings/high-exposure-in-demand"
					class={pill({ size: 'lg', tone: 'outline', interactive: true })}
				>
					In-demand but exposed →
				</a>
				<a href="/roles" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
					Modern roles →
				</a>
					<a href="/calculator" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
						Salary calculator →
					</a>
					<a href="/explore" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
						View all occupations →
					</a>
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
			{#if viewportWidth < 1024}
				<div class="mb-4">
					<details class={cn(card({ padding: 'none' }))}>
						<summary
							class="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary list-none [&::-webkit-details-marker]:hidden"
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

			<!-- Single tabbed chart panel -->
			<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
				<Tabs.Root bind:value={activeChartTab} class="w-full gap-3">
					<div class="flex flex-col gap-3 px-1 md:flex-row md:items-center md:justify-between">
						<div>
							<h2 class={sectionLabel()}>
								{chartTabs.find(t => t.key === activeChartTab)?.label}
							</h2>
							<p class={caption()}>
								{activeChartTab === 'treemap'
									? viewportWidth >= 768
										? 'Size = employment · Colour = risk'
										: 'Mobile fallback: grouped occupation list for quick browsing'
									: activeChartTab === 'pressure'
										? 'Structural risk vs demand signal · coloured by impact type'
										: 'How risk is spread across the filtered set'}
							</p>
						</div>
						<Tabs.List class="w-full md:w-auto">
							{#each chartTabs as tab (tab.key)}
								<Tabs.Trigger
									value={tab.key}
									class="min-w-0 flex-1 text-xs sm:flex-initial sm:text-sm"
								>
									{tab.label}
								</Tabs.Trigger>
							{/each}
						</Tabs.List>
					</div>

					<Tabs.Content value="treemap">
						{#if viewportWidth >= 768}
							<Treemap occupations={filteredOccupations} />
						{:else}
							<OccupationCardList occupations={filteredOccupations.slice(0, 12)} />
						{/if}
					</Tabs.Content>
					<Tabs.Content value="pressure">
						<DemandPressureMatrix occupations={filteredOccupations} />
					</Tabs.Content>
					<Tabs.Content value="distribution">
						<Histogram occupations={filteredOccupations} />
					</Tabs.Content>
				</Tabs.Root>
			</div>

			<!-- Featured: 4 cards -->
			<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-4">
				<!-- Highest Risk -->
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
						<a href="/rankings/ai-leveraged" class="text-xs text-primary hover:underline">All →</a>
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
						<a href="/rankings/high-exposure-in-demand" class="text-xs text-primary hover:underline"
							>All →</a
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
				{#each [{ href: '/roles', label: 'Modern Roles' }, { href: '/rankings', label: 'All Rankings' }, { href: '/compare', label: 'Compare' }, { href: '/methodology', label: 'Methodology' }] as link}
					<a
						href={link.href}
						class="rounded-md border border-border bg-card px-2.5 py-1 font-medium text-foreground hover:bg-accent transition-colors"
						>{link.label}</a
					>
				{/each}
			</div>
		</div>
	</div>
</div>
