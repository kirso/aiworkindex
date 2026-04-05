<script lang="ts">
	import {
		card,
		pageLayout,
		title as titleStyle,
		body,
		caption,
		mono,
		section,
		sectionLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { SITE, DATA_VINTAGE } from '$lib/data/scoring-constants';

	let { data } = $props();
	let groups = $derived(data.groups);

	let collectionJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: 'Occupation Groups — AI Work Index',
			description: `Browse ${DATA_VINTAGE.occupation_count} occupations organised by {groups.length} major occupation groups, each scored for structural AI pressure in the current live reference market.`,
			url: SITE.url + '/groups',
			mainEntity: {
				'@type': 'ItemList',
				numberOfItems: groups.length,
				itemListElement: groups.map((g, i) => ({
					'@type': 'ListItem',
					position: i + 1,
					name: g.label,
					url: SITE.url + '/group/' + g.slug
				}))
			}
		})}<\/script>`
	);
</script>

<Seo
	title="Occupation Groups — Structural AI Risk | {SITE.name}"
	description="Browse {DATA_VINTAGE.occupation_count} occupations across {groups.length} major groups. Compare average AI displacement risk, median wages, and high-risk counts in the current live reference market."
	path="/groups"
	jsonLd={[collectionJsonLd]}
/>

<div class={pageLayout()}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Occupation Groups' }]} />

	<header class="mb-8">
		<h1 class={titleStyle({ size: 'page' })}>Occupation Groups</h1>
		<p class={cn(body({ size: 'lg', tone: 'subtle' }), 'mt-2 max-w-3xl')}>
			{DATA_VINTAGE.occupation_count} occupations organised into {groups.length} major groups. Each group shows
			aggregate AI displacement risk based on the {DATA_VINTAGE.model_version} scoring model, with the current live reference market as the implementation view. Updated {DATA_VINTAGE.last_updated}.
		</p>
	</header>

	<section class={section()}>
		<h2 class={sectionLabel()}>All Groups</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each groups as g}
				<a
					href="/group/{g.slug}"
					class={cn(card({ padding: 'md' }), 'block hover:bg-accent hover:shadow-sm transition-all group')}
				>
					<div class="flex items-start justify-between gap-2">
						<h3 class={cn(body({ size: 'lg' }), 'font-semibold text-foreground')}>
							{g.label}
							<span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
						</h3>
						<span
							class="shrink-0 h-3 w-3 rounded-full mt-1.5"
							style="background-color: {g.color}"
						></span>
					</div>
					<div class="mt-3 grid grid-cols-2 gap-3">
						<div>
							<p class={caption()}>Occupations</p>
							<p class={mono({ size: 'md' })}>{g.count}</p>
						</div>
						<div>
							<p class={caption()}>Avg Risk</p>
							<p class={mono({ size: 'md' })}>{Math.round(g.avgRisk * 100)}%</p>
						</div>
						<div>
							<p class={caption()}>Median Wage</p>
							<p class={mono({ size: 'md' })}>SGD {Math.round(g.medianWage).toLocaleString()}</p>
						</div>
						<div>
							<p class={caption()}>High+ Risk</p>
							<p class={mono({ size: 'md' })}>{g.highRiskCount}</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
</div>
