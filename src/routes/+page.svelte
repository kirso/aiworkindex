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
		content="Four axes of AI impact across 562 Singapore occupations — exposure, task share, market resilience, and displacement risk. Academic indices, not LLM vibes."
	/>
	<meta property="og:title" content="Singapore AI Occupation Impact Index — 562 Occupations Scored" />
	<meta property="og:description" content="Four axes of AI impact across 562 Singapore occupations. Academic indices, not LLM vibes." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app" />
	<meta name="twitter:title" content="Singapore AI Occupation Impact Index — 562 Occupations Scored" />
	<meta name="twitter:description" content="Four axes of AI impact across 562 Singapore occupations. Academic indices, not LLM vibes." />
</svelte:head>

<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
			Singapore AI Occupation Impact Index
		</h1>
		<p class="mt-1 text-sm text-gray-500">
			Four axes of AI impact across 562 occupations — exposure, task share, market resilience,
			and displacement risk. Academic indices, not LLM vibes.
		</p>
		<div class="mt-2 flex gap-3 text-sm">
			<a href="/methodology" class="text-blue-600 hover:text-blue-800">Methodology</a>
			<a href="/about" class="text-blue-600 hover:text-blue-800">About</a>
		</div>
	</div>

	<StatsHeader occupations={filteredOccupations} />

	<div class="mt-6 flex gap-6">
		<!-- Sidebar filters (desktop) -->
		<aside class="hidden w-[280px] shrink-0 md:block">
			<div class="sticky top-4">
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
			</div>
		</aside>

		<!-- Main content -->
		<div class="min-w-0 flex-1">
			<!-- Mobile filters -->
			<div class="md:hidden">
				<FilterPanel occupations={data.occupations} onfilter={handleFilter} />
			</div>

			{#if innerWidth >= 768}
				<!-- Treemap -->
				<section>
					<h2 class="mb-2 text-sm font-medium text-gray-500">Occupation Treemap</h2>
					<Treemap occupations={filteredOccupations} />
				</section>

				<!-- Scatter plot -->
				<section class="mt-8">
					<h2 class="mb-2 text-sm font-medium text-gray-500">Exposure vs Complementarity</h2>
					<ScatterQuadrant occupations={filteredOccupations} />
				</section>
			{:else}
				<OccupationCardList occupations={filteredOccupations} />
			{/if}
		</div>
	</div>
</main>
