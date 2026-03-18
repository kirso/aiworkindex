<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'AI-Augmented Occupations in Singapore',
			description:
				'Top 25 Singapore occupations where AI augments rather than replaces workers, ranked by augmentation potential',
			numberOfItems: data.ranked.length,
			itemListElement: data.ranked.slice(0, 10).map((occ: Occupation, i: number) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: occ.title,
				url: SITE.url + '/occupation/' + occ.ssoc
			}))
		})}<\/script>`
	);

	const columns = [
		{
			key: 'augmentation',
			label: 'Augmentation',
			format: (occ: Occupation) => `${(occ.augmentation * 100).toFixed(0)}%`,
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
</script>

<Seo
	title="Augmented Occupations"
	description="Singapore occupations where AI augments rather than replaces — high exposure but strong human bottlenecks create augmentation potential."
	path="/rankings/ai-leveraged"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Augmented' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Augmented Occupations</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		These roles have high AI exposure but strong human bottlenecks — judgment, creativity, and
		interpersonal skills mean AI augments rather than replaces. Ranked by augmentation potential.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Augmented = exposure &gt; 0.6 AND bottleneck &gt; 0.6. Augmentation = exposure &times;
		bottleneck &times; market_resilience.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
</main>
