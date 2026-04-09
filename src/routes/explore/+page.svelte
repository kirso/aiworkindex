<script lang="ts">
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCard from '$lib/components/ui/OccupationCard.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { card, pageLayout, title as titleStyle, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';

	let { data } = $props();

	let filterResult: typeof data.occupations | null = $state(null);
	let filteredOccupations = $derived(filterResult ?? data.occupations);
	let sortedOccupations = $derived(
		[...filteredOccupations].sort((a, b) => a.title.localeCompare(b.title))
	);

	function handleFilter(filtered: typeof data.occupations) {
		filterResult = filtered;
	}

	const itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Occupations',
			description: `${DATA_VINTAGE.occupation_count} occupations scored for structural AI pressure in Singapore`,
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
	title={`Browse Occupations — Structural AI Risk | ${SITE.name}`}
	description={`Browse all ${DATA_VINTAGE.occupation_count} occupations scored for structural AI pressure in Singapore. Filter by risk band, occupation group, and wage range.`}
	path="/explore"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Browse Occupations' }]} />

	<div class="mb-6">
		<h1 class={titleStyle({ size: 'page' })}>Browse Occupations</h1>
		<p class={cn(caption(), 'mt-1')}>
			All {DATA_VINTAGE.occupation_count} occupations in one place. Filter by risk band, occupation group,
			and wage range, then open any occupation for the full evidence breakdown.
		</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
		<aside class={cn(card({ padding: 'sm' }), 'h-fit')}>
			<FilterPanel occupations={data.occupations} onfilter={handleFilter} valuePrefix="SGD" />
		</aside>

		<section>
			<div class="mb-4">
				<p class="text-sm text-muted-foreground">
					Showing {sortedOccupations.length} of {data.occupations.length} occupations
				</p>
			</div>

			<div class="space-y-2">
				{#each sortedOccupations as occupation (occupation.ssoc)}
					<OccupationCard {occupation} />
				{/each}
			</div>
		</section>
	</div>
</main>
