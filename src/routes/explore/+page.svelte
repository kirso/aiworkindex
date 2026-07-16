<script lang="ts">
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCard from '$lib/components/ui/OccupationCard.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { card, pageLayout, title as titleStyle, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';

	let { data } = $props();

	const PAGE_SIZE = 30;

	let filterResult: typeof data.occupations | null = $state(null);
	let visibleCount = $state(PAGE_SIZE);
	let filteredOccupations = $derived(filterResult ?? data.occupations);
	let sortedOccupations = $derived(
		[...filteredOccupations].sort((a, b) => a.title.localeCompare(b.title))
	);
	let visibleOccupations = $derived(sortedOccupations.slice(0, visibleCount));

	function handleFilter(filtered: typeof data.occupations) {
		filterResult = filtered;
		visibleCount = PAGE_SIZE; // reset paging whenever the filter changes
	}

	const itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Occupations',
			description: `${DATA_VINTAGE.occupation_count} occupations ranked by relative AI exposure`,
			numberOfItems: sortedOccupations.length,
			itemListElement: sortedOccupations.slice(0, 10).map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.title,
				url: SITE.url + `/occupation/${item.ssoc}`
			}))
		})}<\/script>`
	);
</script>

<Seo
	title={`AI Job Exposure by Occupation | ${SITE.name}`}
	description={`Browse all ${DATA_VINTAGE.occupation_count} occupations ranked by relative AI exposure. Filter by exposure band, occupation group, and wage range.`}
	path="/explore"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'data' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Browse Occupations' }]} />

	<div class="mb-6">
		<h1 class={titleStyle({ size: 'page' })}>Browse Occupations</h1>
		<p class={cn(caption(), 'mt-1')}>
			All {DATA_VINTAGE.occupation_count} occupations in one place. Filter by exposure band, occupation
			group, and wage range, then open any occupation for the full evidence breakdown.
		</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
		<aside class={cn(card({ padding: 'sm' }), 'h-fit')}>
			<FilterPanel occupations={data.occupations} onfilter={handleFilter} valuePrefix="SGD" />
		</aside>

		<section>
			<div class="mb-4">
				<p class="text-sm text-muted-foreground">
					{#if sortedOccupations.length === 0}
						Showing 0 of {data.occupations.length} occupations
					{:else}
						Showing {Math.min(visibleCount, sortedOccupations.length)} of {sortedOccupations.length}
						{sortedOccupations.length === data.occupations.length
							? 'occupations'
							: `matching occupations (${data.occupations.length} total)`}
					{/if}
				</p>
			</div>

			{#if sortedOccupations.length === 0}
				<div class={cn(card({ padding: 'lg' }), 'border-dashed text-center')}>
					<p class="text-sm font-medium text-foreground">No occupations match your filters.</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Try widening the exposure band, occupation group, or wage range.
					</p>
					<button
						type="button"
						class="mt-3 text-sm font-medium text-primary hover:underline"
						onclick={() => handleFilter(data.occupations)}
					>
						Clear filters
					</button>
				</div>
			{:else}
				<div class="space-y-2">
					{#each visibleOccupations as occupation (occupation.ssoc)}
						<OccupationCard {occupation} />
					{/each}
				</div>

				{#if visibleCount < sortedOccupations.length}
					<div class="mt-4 text-center">
						<button
							type="button"
							class={cn(card({ padding: 'sm' }), 'w-full text-sm font-medium hover:bg-muted/50')}
							onclick={() => (visibleCount += PAGE_SIZE)}
						>
							Show more ({sortedOccupations.length - visibleCount} remaining)
						</button>
					</div>
				{/if}
			{/if}
		</section>
	</div>
</main>
