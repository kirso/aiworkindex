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
			name: 'High-Risk but In-Demand Occupations in Singapore',
			description:
				'Singapore occupations with high AI displacement risk that still appear on official demand lists',
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

<Seo
	title="High Risk but In-Demand"
	description="Occupations with high AI displacement risk that still appear on Singapore's official demand lists."
	path="/rankings/high-risk-in-demand"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
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
