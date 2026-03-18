<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();

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

<svelte:head>
	<title>AI Leveraged Occupations — SG AI Occupation Index</title>
	<meta
		name="description"
		content="Singapore occupations where AI augments rather than replaces — high exposure but strong human bottlenecks create augmentation potential."
	/>
	<meta property="og:title" content="Top 25 AI Leveraged Occupations in Singapore" />
	<meta
		property="og:description"
		content="These roles have high AI exposure but strong human bottlenecks — AI makes them more productive, not redundant."
	/>
</svelte:head>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'AI Leveraged' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>AI Leveraged Occupations</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		These roles have high AI exposure but strong human bottlenecks — judgment, creativity, and
		interpersonal skills mean AI augments rather than replaces. Ranked by augmentation potential.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		AI Leveraged = exposure &gt; 0.6 AND bottleneck &gt; 0.6. Augmentation = exposure &times;
		bottleneck &times; market_resilience.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
</main>
