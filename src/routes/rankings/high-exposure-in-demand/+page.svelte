<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import RankingNavPills from '$lib/components/ui/RankingNavPills.svelte';
	import DemandPressureMatrix from '$lib/components/viz/DemandPressureMatrix.svelte';
	import { title as titleStyle, pageLayout, card } from '$lib/design-system';
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
			format: (occ: Occupation) => `${currency} ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'High AI Exposure but In-Demand Occupations',
			'Occupations with high AI exposure that remain on shortage or in-demand lists',
			data.ranked
		)
	);

	const faqItems = [
		{
			question: 'Can a job be high AI exposure but still in demand?',
			answer:
				'Yes. Some occupations have significant AI task overlap but remain on the Shortage Occupation List or Jobs in Demand list, suggesting market demand outpaces automation pressure.'
		},
		{
			question: 'Why are some AI-exposed jobs still hiring?',
			answer:
				'Demand signals like shortage lists reflect current labor market needs. An occupation can have high theoretical AI exposure while still experiencing talent shortages.'
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="High AI Exposure but In-Demand Jobs"
	description="Occupations with high AI exposure that remain on shortage or in-demand lists — paradox roles where demand persists despite AI overlap."
	path="/rankings/high-exposure-in-demand"
	jsonLd={[itemListJsonLd, faqJsonLd]}
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
		Significant AI task overlap (&gt;50% exposure) yet still on official shortage or in-demand
		lists.
	</p>

	<section class="mt-6">
		<div class={card({ padding: 'md' })}>
			<DemandPressureMatrix occupations={data.ranked} />
		</div>
	</section>

	<section class="mt-4">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		SOL = Shortage Occupation List 2026. JiD = Jobs in Demand (MOM 2025).
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
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
