<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import InsightsPanel from '$lib/components/ui/InsightsPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import HeroSearch from '$lib/components/ui/HeroSearch.svelte';

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
			<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				How will AI affect your job?
			</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Search 562 Singapore occupations. See how AI affects your role.
			</p>
			<div class="mt-5">
				<HeroSearch occupations={data.occupations} />
			</div>
		</div>
	</div>
</div>

<!-- Main content: treemap with sidebar filters + insights -->
<div class="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6">
	<div class="flex gap-6">
		<!-- Sidebar filters (desktop) — single instance, responsive -->
		<aside class="hidden w-[260px] shrink-0 lg:block">
			<div class="card sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto p-5">
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
			</div>
		</aside>

		<!-- Main viz area -->
		<div class="min-w-0 flex-1">
			<!-- Mobile filters — separate instance but same callback -->
			{#if innerWidth < 1024}
				<div class="mb-5">
					<details class="card">
						<summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
							Filters & Search
						</summary>
						<div class="border-t border-gray-100 p-4">
							<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
						</div>
					</details>
				</div>
			{/if}

			<!-- Insights panel: collapsible on screens below xl -->
			{#if innerWidth < 1280 && innerWidth >= 768}
				<details class="card mb-5">
					<summary class="cursor-pointer px-5 py-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
						Insights & Rankings
					</summary>
					<div class="border-t border-gray-100 p-5">
						<InsightsPanel occupations={filteredOccupations} />
					</div>
				</details>
			{/if}

			{#if innerWidth >= 768}
				<!-- Treemap — full width, tall -->
				<section class="card p-5">
					<div class="mb-3 flex items-center justify-between">
						<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-400">Occupation Treemap</h2>
						<span class="text-sm text-gray-400">{filteredOccupations.length} occupations</span>
					</div>
					<Treemap occupations={filteredOccupations} />
				</section>

				<!-- Scatter plot -->
				<section class="card mt-8 p-5">
					<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Exposure vs Human Bottleneck</h2>
					<ScatterQuadrant occupations={filteredOccupations} />
				</section>
			{:else}
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>

		<!-- Right sidebar: insights panel (xl+ only) -->
		{#if innerWidth >= 1280}
			<aside class="hidden w-[280px] shrink-0 xl:block">
				<div class="card sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto p-5">
					<InsightsPanel occupations={filteredOccupations} />
				</div>
			</aside>
		{/if}
	</div>
</div>
