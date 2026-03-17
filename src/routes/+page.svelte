<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import WageBracketChart from '$lib/components/viz/WageBracketChart.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import InsightsPanel from '$lib/components/ui/InsightsPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import HeroSearch from '$lib/components/ui/HeroSearch.svelte';
	import { title as titleStyle, sectionLabel, card } from '$lib/design-system';
	import { cn } from '$lib/utils';

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
</script>

<svelte:head>
	<title>Singapore AI Occupation Impact Index — 562 Occupations Scored</title>
	<meta
		name="description"
		content="Three layers of AI impact across 562 Singapore occupations — exposure, human bottleneck, and market resilience. Risk bands with visible confidence. Academic indices, not LLM vibes."
	/>
	<meta property="og:title" content="Singapore AI Occupation Impact Index — 562 Occupations Scored" />
	<meta property="og:description" content="Three layers of AI impact across 562 Singapore occupations — exposure, human bottleneck, and market resilience. Academic indices, not LLM vibes." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app" />
	<meta name="twitter:title" content="Singapore AI Occupation Impact Index — 562 Occupations Scored" />
	<meta name="twitter:description" content="Three layers of AI impact across 562 Singapore occupations — exposure, human bottleneck, and market resilience. Academic indices, not LLM vibes." />
</svelte:head>

<!-- Hero + Search -->
<div class="border-b border-border bg-card">
	<div class="mx-auto max-w-screen-2xl px-5 py-8 sm:px-6">
		<div class="mx-auto max-w-2xl text-center">
			<h1 class={titleStyle({ size: 'page' })}>
				How will AI affect your job?
			</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				See whether AI is likely to replace, augment, or barely affect your role in Singapore.
			</p>
			<div class="mt-5">
				<HeroSearch occupations={data.occupations} />
			</div>
			<div class="grid grid-cols-3 gap-3 max-w-2xl mx-auto mt-4">
				<div class="text-center text-xs text-muted-foreground">
					<span class="inline-block w-3 h-3 rounded-full bg-risk-very-low mr-1"></span>
					Green = lower risk
				</div>
				<div class="text-center text-xs text-muted-foreground">
					<span class="inline-block w-3 h-3 rounded-full bg-risk-moderate mr-1"></span>
					Amber = mixed signals
				</div>
				<div class="text-center text-xs text-muted-foreground">
					<span class="inline-block w-3 h-3 rounded-full bg-risk-very-high mr-1"></span>
					Red = higher risk
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Main content: treemap with sidebar filters + insights -->
<div class="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6">
	<div class="flex gap-6">
		<!-- Sidebar filters (desktop) — single instance, responsive -->
		<aside class="hidden w-[260px] shrink-0 lg:block">
			<div class={cn(card({ padding: 'md' }), 'sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto')}>
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
			</div>
		</aside>

		<!-- Main viz area -->
		<div class="min-w-0 flex-1">
			<!-- Mobile filters — separate instance but same callback -->
			{#if innerWidth < 1024}
				<div class="mb-5">
					<details class={card()}>
						<summary class="cursor-pointer px-4 py-3 text-sm font-medium text-foreground/80">
							Filters & Search
						</summary>
						<div class="border-t border-border/50 p-4">
							<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
						</div>
					</details>
				</div>
			{/if}

			<!-- Insights panel: collapsible on screens below xl -->
			{#if innerWidth < 1280 && innerWidth >= 768}
				<details class={cn(card(), 'mb-5')}>
					<summary class={cn('cursor-pointer px-5 py-3', sectionLabel())}>
						Insights & Rankings
					</summary>
					<div class="border-t border-border/50 p-5">
						<InsightsPanel occupations={filteredOccupations} />
					</div>
				</details>
			{/if}

			{#if innerWidth >= 768}
				<!-- Treemap — full width, tall -->
				<section class={card({ padding: 'md' })}>
					<div class="mb-3 flex items-center justify-between">
						<h2 class={sectionLabel()}>Explore all occupations</h2>
						<span class="text-sm text-muted-foreground">{filteredOccupations.length} occupations</span>
					</div>
					<Treemap occupations={filteredOccupations} />
				</section>

				<!-- Risk Distribution -->
				<section class={cn(card({ padding: 'md' }), 'mt-8')}>
					<div class="mb-3">
						<h2 class={sectionLabel()}>How risk breaks down</h2>
						<p class="mt-1 text-xs text-muted-foreground">
							How {filteredOccupations.length} occupations distribute across AI risk levels.
						</p>
					</div>
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<h3 class="mb-2 text-xs font-medium text-muted-foreground">Score Histogram</h3>
							<Histogram occupations={filteredOccupations} />
						</div>
						<div>
							<h3 class="mb-2 text-xs font-medium text-muted-foreground">Risk by Wage Bracket</h3>
							<WageBracketChart occupations={filteredOccupations} />
						</div>
					</div>
				</section>

				<!-- Scatter plot -->
					<section class={cn(card({ padding: 'md' }), 'mt-8')}>
						<div class="mb-3">
							<h2 class={sectionLabel()}>AI Exposure vs Human Skills</h2>
							<p class="mt-1 text-xs text-muted-foreground">
								Each dot is one occupation. Dot size is fixed to avoid implying occupation-level workforce counts we do not have.
							</p>
						</div>
						<ScatterQuadrant occupations={filteredOccupations} />
					</section>
			{:else}
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>

		<!-- Right sidebar: insights panel (xl+ only) -->
		{#if innerWidth >= 1280}
			<aside class="hidden w-[280px] shrink-0 xl:block">
				<div class={cn(card({ padding: 'md' }), 'sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto')}>
					<InsightsPanel occupations={filteredOccupations} />
				</div>
			</aside>
		{/if}
	</div>
</div>
