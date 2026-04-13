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

	let { data } = $props();

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Theory vs Practice: AI Exposure Gaps',
			description:
				'Top 25 occupations ranked by the gap between theoretical AI exposure and observed real-world AI usage',
			numberOfItems: data.ranked.length,
			itemListElement: data.ranked.slice(0, 10).map((occ: Occupation, i: number) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: occ.title,
				url: SITE.url + '/occupation/' + occ.ssoc
			}))
		})}<\/script>`
	);

	const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'Where does AI theory diverge from actual usage?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: "Academic AI exposure indices measure theoretical task automation potential, while Anthropic's observed usage data shows what people actually use AI for. The biggest gaps reveal where adoption lags or leads predictions."
				}
			},
			{
				'@type': 'Question',
				name: 'Why do some jobs have high theoretical AI exposure but low real usage?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Regulatory barriers, trust requirements, or workflow integration costs can slow adoption even when tasks are technically automatable. Conversely, some low-exposure roles adopt AI tools faster than predicted.'
				}
			}
		]
	})}<\/script>`;

	const columns = [
		{
			key: 'gap',
			label: 'Gap (pts)',
			format: (occ: Occupation) => {
				const gap = occ.evidence.anthropic_gap ?? 0;
				const pts = Math.round(gap * 100);
				return `${pts > 0 ? '+' : ''}${pts}`;
			},
			align: 'right' as const
		},
		{
			key: 'direction',
			label: 'Direction',
			format: (occ: Occupation) => {
				const gap = occ.evidence.anthropic_gap ?? 0;
				return gap > 0 ? 'Above theory' : 'Below theory';
			}
		},
		{
			key: 'exposure',
			label: 'AIOE Theory',
			format: (occ: Occupation) => `${(occ.raw.aioe * 100).toFixed(0)}%`,
			align: 'right' as const
		},
		{
			key: 'net_risk',
			label: 'Net Risk',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`,
			align: 'right' as const
		}
	];

	function highlightRow(occ: Occupation): string | null {
		const gap = occ.evidence.anthropic_gap ?? 0;
		return gap > 0 ? 'bg-risk-very-high-subtle/30' : 'bg-impact-leveraged-subtle/30';
	}
</script>

<Seo
	title="AI Theory vs Practice — Where Real Usage Diverges"
	description="Where does observed AI usage diverge most from theoretical exposure? The biggest gaps between Anthropic's real-world data and academic AI exposure indices."
	path="/rankings/theory-vs-practice"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Theory vs Practice' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Theory vs Practice</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Where does real-world AI usage diverge most from theoretical exposure? Ranked by the absolute
		gap between Anthropic's observed AI usage percentile and the theoretical AIOE percentile. <span
			class="bg-risk-very-high-subtle px-1 rounded text-risk-very-high">Red rows</span
		>
		= usage exceeds theory.
		<span class="bg-impact-leveraged-subtle px-1 rounded text-impact-leveraged">Blue rows</span> = theory
		exceeds usage.
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
		Gap = Anthropic observed usage percentile minus theoretical AIOE percentile. Positive means more
		AI adoption than theory predicts.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
	<RankingNavPills />
	<PageFooterNav
		links={[
			{ href: '/rankings', label: 'All rankings' },
			{ href: '/explore', label: 'Browse occupations' },
			{ href: '/methodology', label: 'Methodology' }
		]}
	/>
</main>
