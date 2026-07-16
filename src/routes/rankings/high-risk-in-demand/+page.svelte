<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import RankingNavPills from '$lib/components/ui/RankingNavPills.svelte';
	import { title as titleStyle, pageLayout } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import { countryConfigs } from '$lib/data/country-config';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import { buildItemListJsonLd, buildFaqJsonLd } from '$lib/data/ranking-jsonld';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';

	let { data } = $props();
	const currency = countryConfigs.sg.currency ?? 'SGD';

	const columns = [
		{
			key: 'net_risk',
			label: 'AI Exposure Rank',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(0)}/100`,
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
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}/100`,
			align: 'right' as const
		},
		{
			key: 'wage',
			label: 'Median Wage',
			format: (occ: Occupation) => `${currency} ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'Highly Exposed but In-Demand Occupations',
			'Occupations with higher AI Exposure Ranks that still appear on official demand lists',
			data.ranked
		)
	);

	const faqItems = [
		{
			question: 'Can high-change occupations still have strong hiring demand?',
			answer:
				'Yes. Some occupations rank higher for AI exposure while still appearing on official demand lists. Exposure and hiring demand measure different things.'
		},
		{
			question: 'Should I worry about AI if my job is in demand?',
			answer:
				'Demand signals provide a buffer but not immunity. These occupations may see role transformation rather than elimination — the work changes even as demand persists.'
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="High AI Risk but In-Demand Jobs"
	description="Singapore occupations with higher AI Exposure Ranks that still appear on official demand lists."
	path="/rankings/high-risk-in-demand"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Highly Exposed, Still In Demand' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Highly Exposed, Still In Demand</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Higher relative V8 score (legacy filter alias &ge; 0.25), yet still on official demand lists.
		Demand can buffer or reshape the pathway.
	</p>

	{#if data.ranked.length === 0}
		<p class="mt-8 text-sm text-muted-foreground">No occupations currently match this criteria.</p>
	{:else}
		<section class="mt-6">
			<RankingTable occupations={data.ranked} {columns} />
		</section>
		<p class="mt-4 text-xs text-muted-foreground">
			{data.ranked.length} occupation{data.ranked.length === 1 ? '' : 's'} with higher AI exposure and
			active demand.
		</p>
	{/if}
	<FaqList items={faqItems} />
	<RankingNavPills />
	<PageFooterNav
		links={[
			{ href: '/rankings', label: 'All rankings' },
			{ href: '/explore', label: 'Browse occupations' },
			{ href: '/methodology', label: 'Methodology' }
		]}
	/>
</main>
