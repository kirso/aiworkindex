<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import RankingNavPills from '$lib/components/ui/RankingNavPills.svelte';
	import HighDemandExposurePlot from '$lib/components/viz/HighDemandExposurePlot.svelte';
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
			key: 'net_risk',
			label: 'AI Exposure Rank',
			format: (occ: Occupation) => `${occ.v8.ai_exposure_rank.points}/100`,
			align: 'right' as const
		},
		{
			key: 'substitution',
			label: 'Substitution Pressure',
			format: (occ: Occupation) => `${occ.v8.substitution_pressure.points}/100`,
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
				'Yes. Some occupations have higher AI exposure but remain on the Shortage Occupation List or Jobs in Demand list. Demand can support employment while AI changes workflows.'
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

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'High Exposure + In Demand' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>High Exposure + In Demand</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Occupations in the upper two AI Exposure Rank bands that also have strong current demand in the
		official-derived V8 labour-market context. Demand is separate and does not lower the exposure
		rank.
	</p>

	<section class="mt-6">
		<div class={card({ padding: 'md' })}>
			<HighDemandExposurePlot occupations={data.ranked} />
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
