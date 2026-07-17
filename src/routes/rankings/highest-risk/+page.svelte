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
			label: 'AI Exposure Rank',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(0)}/100`,
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
			'Occupations with Highest AI Exposure',
			'Top 25 occupations ranked by relative AI Exposure Rank',
			data.ranked
		)
	);

	const faqItems = [
		{
			question: 'Which occupations have the highest AI exposure?',
			answer:
				'The highest-scoring occupations rank near the top of the Singapore market for relative AI exposure. This does not imply a probability or timetable for job loss.'
		},
		{
			question: 'How is the AI exposure ranking calculated?',
			answer: `The V8 score is a within-Singapore percentile rank of the multi-source AI exposure signal. Demand and adoption are reported separately rather than hidden in the score. This page shows the top 25 of ${DATA_VINTAGE.occupation_count} occupations.`
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="25 Highest AI Exposure Occupations"
	description={`Which occupations rank highest for AI exposure? Top 25 relative scores from ${DATA_VINTAGE.occupation_count} Singapore occupations.`}
	path="/rankings/highest-risk"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Most Exposed to AI' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Most Exposed to AI Occupations</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Top 25 occupations by relative V8 AI exposure rank; not job-loss probabilities.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		The rank compares occupations within this dataset. It is not a task share or job-loss
		probability.
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
