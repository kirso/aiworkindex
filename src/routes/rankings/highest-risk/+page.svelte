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
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';

	let { data } = $props();
	const currency = countryConfigs.sg.currency ?? 'SGD';

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
			format: (occ: Occupation) => `${currency} ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'Occupations with Highest AI Displacement Risk',
			'Top 25 occupations ranked by AI net displacement risk score',
			data.ranked
		)
	);

	const faqItems = [
		{
			question: 'Which occupations face the highest AI displacement pressure?',
			answer:
				'Data entry clerks, telemarketers, and bookkeepers face the highest structural pressure, with net displacement risk above 50%. These roles have high AI task overlap and low human bottlenecks.'
		},
		{
			question: 'How is the AI displacement risk ranking calculated?',
			answer: `Each occupation is scored using headline risk = displacement pressure × (1 − demand resilience). This ranking sorts all ${DATA_VINTAGE.occupation_count} occupations by net risk, showing the top 25.`
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="25 Highest AI Displacement Risk Occupations"
	description={`Which occupations face the most AI structural pressure? Top 25 ranked by displacement risk from ${DATA_VINTAGE.occupation_count} scored.`}
	path="/rankings/highest-risk"
	jsonLd={[itemListJsonLd, faqJsonLd]}
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
	<p class="mt-2 text-sm text-muted-foreground">Top 25 occupations by net displacement risk.</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		headline_risk = displacement_pressure &times; (1 &minus; demand_resilience).
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
