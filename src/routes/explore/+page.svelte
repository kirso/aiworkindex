<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationExplorer from '$lib/components/v9-browser/OccupationExplorer.svelte';
	import { badge, pageLayout, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';

	let { data } = $props();

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Singapore SSOC 2024 occupations with AI task-pressure evidence',
			numberOfItems: data.counts.total,
			itemListElement: data.featuredOccupations.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.title,
				url: `${SITE.url}/occupation/${item.code}`
			}))
		})}<\/script>`
	);
</script>

<Seo
	title="Explore Singapore Jobs by AI Task Pressure"
	description="Map and search all 1,001 SSOC 2024 occupations. Use the same filters across AI task pressure, direct Singapore wages, named demand evidence and exact occupation records."
	path="/explore"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'data' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Explore occupations' }]} />

	<header
		class="mb-7 grid gap-5 border-b border-border pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
	>
		<div class="max-w-4xl">
			<div class="flex flex-wrap items-center gap-2">
				<p class={sectionLabel()}>Singapore occupation explorer</p>
				<span class={badge({ variant: 'outline' })}>V9 · 19 Aug 2026</span>
			</div>
			<h1 class="mt-2 {titleStyle({ size: 'page' })}">Compare AI task pressure, pay and demand</h1>
			<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary sm:text-lg">
				Move between the occupation map, pressure-and-pay chart and exact list. Your filters carry
				across all three views, so you can spot patterns, compare occupations and open the evidence
				behind each result.
			</p>
		</div>
		<dl
			class="grid grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-border bg-card p-4 shadow-xs"
		>
			<div>
				<dt class="text-xs text-muted-foreground">Official occupations</dt>
				<dd class="mt-1 font-mono text-xl font-semibold tabular-nums">
					{data.counts.total.toLocaleString()}
				</dd>
			</div>
			<div>
				<dt class="text-xs text-muted-foreground">Pressure unranked</dt>
				<dd class="mt-1 font-mono text-xl font-semibold tabular-nums">
					{data.counts.unranked}
				</dd>
			</div>
		</dl>
	</header>

	<OccupationExplorer
		items={data.occupations}
		sourceUrl="/data/v9-search-index.json?v=2026-08-19-v9-role-guides"
		expectedTotal={data.counts.total}
	/>

	<aside class="mt-10 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
		<p>
			<strong class="text-foreground">How to read this:</strong> pressure is a relative percentile among
			the 987 scored occupations in this V9 release. Use the map for the full occupation landscape, Pressure
			& pay for wage relationships, and List for exact records. Open any occupation to see its Official
			ILO category, Singapore evidence and source notes.
		</p>
	</aside>
</main>
