<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import DemandPressureMatrix from '$lib/components/viz/DemandPressureMatrix.svelte';
	import { title as titleStyle, card } from '$lib/design-system';
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
			name: 'High AI Exposure but In-Demand Occupations in Singapore',
			description:
				'Singapore occupations with high AI exposure that remain on shortage or in-demand lists',
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
			key: 'exposure',
			label: 'Exposure',
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}%`,
			align: 'right' as const
		},
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
				const signals: string[] = [];
				if (occ.evidence.sol_match) signals.push('SOL');
				if (occ.evidence.jobs_in_demand_match) signals.push('JiD');
				return signals.join(' + ');
			}
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
	title="High Exposure + In Demand"
	description="Singapore occupations with high AI exposure that remain on shortage or in-demand lists — paradox roles where demand persists despite AI overlap."
	path="/rankings/high-exposure-in-demand"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'High Exposure + In Demand' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>High Exposure + In Demand</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Paradox roles: significant AI task overlap (&gt;50% exposure) yet still listed on Singapore's
		Shortage Occupation List (SOL) or Jobs in Demand (JiD). Demand persists despite automation
		potential.
	</p>

	<!-- Chart -->
	<section class="mt-6">
		<div class={card({ padding: 'md' })}>
			<DemandPressureMatrix occupations={data.ranked} />
		</div>
	</section>

	<!-- Table -->
	<section class="mt-4">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		SOL = Shortage Occupation List 2026. JiD = Jobs in Demand (MOM 2025).
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
