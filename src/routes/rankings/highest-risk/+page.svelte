<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import RankingNav from '$lib/components/v9-browser/RankingNav.svelte';
	import { pageLayout, title as titleStyle } from '$lib/design-system';
	import { buildItemListJsonLd } from '$lib/data/ranking-jsonld';

	let { data } = $props();

	const faqItems = [
		{
			question: 'Which Singapore occupations face the most AI work pressure?',
			answer:
				'This list orders SSOC 2024 occupations by their V9 pressure percentile. Data entry and several clerical occupations rank near the top because the mapped ILO task evidence shows substantial overlap with current generative AI capabilities.'
		},
		{
			question: 'Is the pressure percentile a job-loss probability?',
			answer:
				'No. A rank of 90 places an occupation at the 90th midrank percentile for ILO task exposure in this release. It does not mean a 90% probability of job loss.'
		}
	];

	let rankingJsonLd = $derived(
		buildItemListJsonLd(
			'Singapore occupations with the highest AI Work Pressure',
			`The highest V9 midrank percentiles for ILO-based task exposure. The list contains ${data.ranked.length} rows because it preserves the complete tie at the 50-row cutoff.`,
			data.ranked.map(occupation => ({ title: occupation.title, ssoc: occupation.code }))
		)
	);
</script>

<Seo
	title="Singapore Jobs with the Highest AI Work Pressure"
	description="The highest V9 AI work pressure ranks among scored SSOC 2024 occupations, including cutoff ties, official ILO categories and mapping limits."
	path="/rankings/highest-risk"
	jsonLd={[rankingJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'AI work pressure' }
		]}
	/>

	<header class="mb-7 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Highest AI work pressure</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			The highest-pressure occupations among 987 scored SSOC 2024 occupations, ordered by their
			within-Singapore pressure percentile. This list contains {data.ranked.length} rows because it preserves
			the complete tie at the 50-row cutoff. The official ILO category stays visible beside each rank.
			Neither number is a job-loss probability.
		</p>
	</header>

	<OccupationResultList items={data.ranked} detail="category" />

	<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
		Tied ILO inputs receive the same midrank percentile. Fourteen occupations lack enough mapped ILO
		evidence and are not placed at the bottom of the ranking.
	</p>

	<FaqList items={faqItems} />
	<RankingNav current="/rankings/highest-risk" />
</main>
