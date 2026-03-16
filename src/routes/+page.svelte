<script lang="ts">
	import { browser } from '$app/environment';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import ScatterQuadrant from '$lib/components/viz/ScatterQuadrant.svelte';
	import StatsHeader from '$lib/components/ui/StatsHeader.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';

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

<!-- Hero + Stats -->
<div class="border-b border-gray-200 bg-white">
	<div class="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6">
		<h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
			Singapore AI Occupation Impact Index
		</h1>
		<p class="mt-1 max-w-2xl text-sm text-gray-500">
			Three layers of AI impact across 562 occupations — exposure, human bottleneck, and market resilience.
			Peer-reviewed indices, risk bands, and visible confidence.
		</p>
		<div class="mt-3">
			<StatsHeader occupations={filteredOccupations} />
		</div>
	</div>
</div>

<!-- Main content: full-width treemap with sidebar filters -->
<div class="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6">
	<div class="flex gap-5">
		<!-- Sidebar filters (desktop) — single instance, responsive -->
		<aside class="hidden w-[260px] shrink-0 lg:block">
			<div class="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
			</div>
		</aside>

		<!-- Main viz area -->
		<div class="min-w-0 flex-1">
			<!-- Mobile filters — separate instance but same callback -->
			{#if innerWidth < 1024}
				<div class="mb-4">
					<details class="rounded-lg border border-gray-200 bg-white">
						<summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
							Filters & Search
						</summary>
						<div class="border-t border-gray-100 p-4">
							<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
						</div>
					</details>
				</div>
			{/if}

			{#if innerWidth >= 768}
				<!-- Treemap — full width, tall -->
				<section class="rounded-lg border border-gray-200 bg-white p-3">
					<div class="mb-2 flex items-center justify-between">
						<h2 class="text-xs font-medium uppercase tracking-wide text-gray-400">Occupation Treemap</h2>
						<span class="text-xs text-gray-400">{filteredOccupations.length} occupations</span>
					</div>
					<Treemap occupations={filteredOccupations} />
				</section>

				<!-- Scatter plot -->
				<section class="mt-5 rounded-lg border border-gray-200 bg-white p-3">
					<h2 class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Exposure vs Human Bottleneck</h2>
					<ScatterQuadrant occupations={filteredOccupations} />
				</section>
			{:else}
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>
	</div>
</div>
