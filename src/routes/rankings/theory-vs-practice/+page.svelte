<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import RankingNavPills from '$lib/components/ui/RankingNavPills.svelte';
	import TheoryPracticeDumbbell from '$lib/components/viz/TheoryPracticeDumbbell.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import { card } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';

	let { data } = $props();

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Theory vs Practice: AI Exposure Gaps',
			description:
				'Top 25 occupations ranked by the gap between the AIOE exposure percentile and Anthropic Claude usage percentile',
			numberOfItems: data.ranked.length,
			itemListElement: data.ranked.slice(0, 10).map((occ: Occupation, i: number) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: occ.title,
				url: SITE.url + '/occupation/' + occ.ssoc
			}))
		})}<\/script>`
	);

	const faqItems = [
		{
			question: 'Where do the AIOE and Anthropic measures differ?',
			answer:
				"AIOE and Anthropic's source-specific Claude usage measure different constructs, populations and periods. This page compares their within-source percentiles; it does not treat either measure as complete real-world AI adoption."
		},
		{
			question: 'What causes a large gap between the measures?',
			answer:
				'A gap may reflect construct differences, crosswalks, platform users, sampling, timing or actual usage differences. The comparison is descriptive and does not identify which explanation caused a gap.'
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);

	const columns = [
		{
			key: 'gap',
			label: 'Gap (pts)',
			format: (occ: Occupation) => {
				const gap =
					(occ.evidence.exposure_source_pctiles?.anthropic ?? 0) -
					(occ.evidence.exposure_source_pctiles?.aioe ?? 0);
				const pts = Math.round(gap * 100);
				return `${pts > 0 ? '+' : ''}${pts}`;
			},
			align: 'right' as const
		},
		{
			key: 'direction',
			label: 'Direction',
			format: (occ: Occupation) => {
				const gap =
					(occ.evidence.exposure_source_pctiles?.anthropic ?? 0) -
					(occ.evidence.exposure_source_pctiles?.aioe ?? 0);
				return gap > 0 ? 'Above theory' : 'Below theory';
			}
		},
		{
			key: 'exposure',
			label: 'AIOE Percentile',
			format: (occ: Occupation) =>
				`${Math.round((occ.evidence.exposure_source_pctiles?.aioe ?? 0) * 100)}/100`,
			align: 'right' as const
		},
		{
			key: 'anthropic',
			label: 'Anthropic Percentile',
			format: (occ: Occupation) =>
				`${Math.round((occ.evidence.exposure_source_pctiles?.anthropic ?? 0) * 100)}/100`,
			align: 'right' as const
		},
		{
			key: 'net_risk',
			label: 'AI Exposure Rank',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(0)}/100`,
			align: 'right' as const
		}
	];

	function highlightRow(occ: Occupation): string | null {
		const gap =
			(occ.evidence.exposure_source_pctiles?.anthropic ?? 0) -
			(occ.evidence.exposure_source_pctiles?.aioe ?? 0);
		return gap > 0 ? 'bg-risk-very-high-subtle/30' : 'bg-impact-leveraged-subtle/30';
	}
</script>

<Seo
	title="AIOE vs Anthropic Claude Usage by Occupation"
	description="Compare occupation percentiles from AIOE exposure and the frozen January 2026 Anthropic Claude usage input."
	path="/rankings/theory-vs-practice"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Theory vs Practice' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>AIOE Exposure vs Anthropic Claude Usage</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		A descriptive comparison of two source percentiles, not theory against ground truth. Ranked by
		the absolute gap between the frozen January 2026 Anthropic Claude usage percentile and the AIOE
		exposure percentile. <span class="bg-risk-very-high-subtle px-1 rounded text-risk-very-high"
			>Red rows</span
		>
		= Anthropic percentile is higher.
		<span class="bg-impact-leveraged-subtle px-1 rounded text-impact-leveraged">Blue rows</span> = theory
		percentile is higher. The gap does not establish why the sources differ.
	</p>

	<!-- Dumbbell chart -->
	<section class="mt-6">
		<div class={card({ padding: 'md' })}>
			<TheoryPracticeDumbbell occupations={data.ranked} />
		</div>
	</section>

	<!-- Table (detail) -->
	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} highlight={highlightRow} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Gap = Anthropic observed-usage percentile minus AIOE exposure percentile. Positive means
		observed usage ranks higher than the AIOE measure for the same occupation; it does not establish
		why.
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
