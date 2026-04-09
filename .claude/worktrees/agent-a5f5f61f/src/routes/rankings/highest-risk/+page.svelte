<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	const columns = [
		{
			key: 'net_risk',
			label: 'Net Risk',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`,
			align: 'right' as const
		},
		{
			key: 'exposure',
			label: 'Exposure',
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}%`,
			align: 'right' as const
		},
		{
			key: 'bottleneck',
			label: 'Bottleneck',
			format: (occ: Occupation) => `${(occ.bottleneck * 100).toFixed(0)}%`,
			align: 'right' as const
		},
		{
			key: 'wage',
			label: 'Median Wage',
			format: (occ: Occupation) => `SGD ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Singapore Occupations with Highest AI Displacement Risk',
			description: 'Top 25 Singapore occupations ranked by AI net displacement risk score',
			numberOfItems: data.ranked.length,
			itemListElement: data.ranked.slice(0, 10).map((occ: Occupation, i: number) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: occ.title,
				url: SITE.url + '/occupation/' + occ.ssoc
			}))
		})}<\/script>`
	);
</script>

<Seo
	title="25 Highest Risk Jobs in Singapore for AI Displacement (2026)"
	description="Which Singapore jobs face the most AI displacement pressure? Top 25 occupations ranked by net risk score. Data entry clerks, telemarketers, and bookkeepers top the list."
	path="/rankings/highest-risk"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Highest Risk' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Highest Risk Occupations</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Top 25 occupations by net displacement risk. These roles have high AI exposure, weak human
		bottlenecks, and limited market buffers.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Net Risk = Exposure &times; (1 &minus; Bottleneck) &times; Market Modifier.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
	<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
		<span>More:</span>
		<a
			href="/rankings/highest-risk"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Highest Risk</a
		>
		<a
			href="/rankings/ai-leveraged"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Augmented</a
		>
		<a
			href="/rankings/safest-high-paying"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Safest High-Paying</a
		>
		<a
			href="/rankings/best-transitions"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Transitions</a
		>
		<a href="/rankings" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent"
			>All Rankings</a
		>
	</div>
</main>
