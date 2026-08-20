<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { card, pageLayout, title as titleStyle } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';

	let { data } = $props();

	function formatPercentile(value: number | null): string {
		if (value == null) return 'Unknown';
		return `Percentile ${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
	}

	let collectionJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: 'Singapore SSOC 2024 occupation groups',
			description:
				'Nine SSOC 2024 major groups with AI work pressure and direct evidence coverage.',
			url: `${SITE.url}/groups`,
			mainEntity: {
				'@type': 'ItemList',
				numberOfItems: data.groups.length,
				itemListElement: data.groups.map((group, index) => ({
					'@type': 'ListItem',
					position: index + 1,
					name: group.label,
					url: `${SITE.url}/group/${group.slug}`
				}))
			}
		})}<\/script>`
	);
</script>

<Seo
	title="Singapore Jobs by SSOC 2024 Occupation Group"
	description="Browse all nine Singapore SSOC 2024 major groups. Compare pressure-rank coverage, direct MOM wage rows and named demand evidence without filling missing data."
	path="/groups"
	jsonLd={[collectionJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Occupation groups' }]} />

	<header class="mb-8 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Occupation groups</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			The 1,001 SSOC 2024 occupations sit within nine official major groups. Group cards summarize
			coverage and the median of occupation-level pressure ranks; they are not employment-weighted
			job loss estimates.
		</p>
	</header>

	<div class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.groups as group (group.code)}
			<a
				href="/group/{group.slug}"
				class="block min-w-0 no-underline {card({ padding: 'md', hover: true })}"
			>
				<p class="font-mono text-xs text-muted-foreground">SSOC major group {group.code}</p>
				<h2 class="mt-2 break-words text-lg font-semibold leading-snug text-foreground">
					{group.label}
				</h2>

				<dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
					<div class="min-w-0">
						<dt class="text-xs text-muted-foreground">Occupations</dt>
						<dd class="mt-1 font-mono text-base font-semibold tabular-nums">{group.count}</dd>
					</div>
					<div class="min-w-0">
						<dt class="text-xs text-muted-foreground">Median pressure rank</dt>
						<dd class="mt-1 font-mono text-base font-semibold tabular-nums">
							{formatPercentile(group.medianPressure)}
						</dd>
					</div>
					<div class="min-w-0">
						<dt class="text-xs text-muted-foreground">Pressure ranked</dt>
						<dd class="mt-1 font-mono text-base font-semibold tabular-nums">
							{group.scoredCount}/{group.count}
						</dd>
					</div>
					<div class="min-w-0">
						<dt class="text-xs text-muted-foreground">Direct wage rows</dt>
						<dd class="mt-1 font-mono text-base font-semibold tabular-nums">
							{group.directWageCount}
						</dd>
					</div>
				</dl>

				{#if group.namedDemandCount > 0}
					<p class="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
						{group.namedDemandCount} occupation{group.namedDemandCount === 1 ? '' : 's'} with a reviewed
						named MOM demand signal
					</p>
				{/if}
			</a>
		{/each}
	</div>

	<p class="mt-8 text-sm leading-relaxed text-muted-foreground">
		Each scored detailed occupation contributes one observation to the group median. <a
			href="/methodology"
			class="text-primary underline">Read the V9 method</a
		> for weighting and coverage details.
	</p>
</main>
