<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();

	const columns = [
		{
			key: 'net_risk',
			label: 'Net Risk',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`,
			align: 'right' as const
		},
		{
			key: 'demand',
			label: 'Demand Signal',
			format: (occ: Occupation) => {
				const signals = [];
				if (occ.evidence.sol_match) signals.push(`SOL ${occ.evidence.sol_match}`);
				if (occ.evidence.jobs_in_demand_match)
					signals.push(`JiD ${occ.evidence.jobs_in_demand_match}`);
				return signals.join(', ');
			},
			align: 'left' as const
		},
		{
			key: 'exposure',
			label: 'Exposure',
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}%`,
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
	<title>High Risk but In-Demand — Rankings | AI Work Index</title>
	<meta
		name="description"
		content="Occupations with high AI displacement risk that still appear on Singapore's official demand lists."
	/>
</svelte:head>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'High Risk but In-Demand' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>High Risk but In-Demand</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		These occupations score High or Very High on AI displacement risk (net_risk &ge; 25%), yet still
		appear on Singapore's Shortage Occupation List or Jobs in Demand list. This tension suggests
		employers still need these workers today, even as AI capabilities grow.
	</p>

	{#if data.ranked.length === 0}
		<p class="mt-8 text-sm text-muted-foreground">No occupations currently match this criteria.</p>
	{:else}
		<div class="mt-6">
			<RankingTable occupations={data.ranked} {columns} />
		</div>
		<p class="mt-4 text-xs text-muted-foreground">
			{data.ranked.length} occupation{data.ranked.length === 1 ? '' : 's'} with high risk and active demand.
		</p>
	{/if}
</main>
