<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();

	const columns = [
		{
			key: 'wage',
			label: 'Median Wage',
			format: (occ: Occupation) => `SGD ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		},
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
		}
	];
</script>

<svelte:head>
	<title>Safest High-Paying Jobs — SG AI Occupation Index</title>
	<meta
		name="description"
		content="Low AI displacement risk + above-median wages. The 25 safest well-paying occupations in Singapore."
	/>
	<meta property="og:title" content="25 Safest High-Paying Jobs in Singapore" />
	<meta
		property="og:description"
		content="Low AI risk + above-median wages. These occupations sit in the sweet spot — well-compensated and resilient to AI disruption."
	/>
</svelte:head>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Safest High-Paying' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Safest High-Paying Jobs</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		The sweet spot: low displacement risk (&lt;15%) with above-median wages (&ge; SGD {data.medianWage.toLocaleString()}/month).
		Sorted by median wage.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Filtered: net_risk &lt; 0.15 AND gross_wage_median &ge; national median (SGD {data.medianWage.toLocaleString()}).
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
</main>
