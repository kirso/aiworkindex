<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import type { Occupation } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	const columns = [
		{
			key: 'gross_wage_median',
			label: 'Monthly Wage',
			format: (occ: Occupation) => `SGD ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		},
		{
			key: 'net_risk',
			label: 'AI Risk',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`,
			align: 'right' as const
		}
	];

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Highest-Paid Jobs at Risk of AI Displacement',
			description:
				'Top 25 high-paying occupations facing high AI displacement risk (net risk 30%+, median wage SGD 5,000+) in the current live reference market',
			numberOfItems: data.ranked.length,
			itemListElement: data.ranked.slice(0, 10).map((occ: Occupation, i: number) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: occ.title,
				url: SITE.url + '/sg/occupation/' + occ.ssoc
			}))
		})}<\/script>`
	);

	const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'Which high-paying jobs are most at risk from AI?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Several occupations earning above SGD 5,000/month face high structural AI displacement pressure (30%+). These roles combine high AI task overlap with relatively low human bottlenecks, despite strong wages.'
				}
			},
			{
				'@type': 'Question',
				name: 'Does a high salary protect against AI displacement?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Not necessarily. High wages reflect current market value, but structural AI pressure depends on task composition and human bottlenecks, not salary. Some well-paid roles have high automation potential.'
				}
			}
		]
	})}<\/script>`;
</script>

<Seo
	title="Highest-Paid Jobs at Risk of AI Displacement"
	description="Top 25 high-paying occupations (SGD 5,000+/month) facing high AI displacement risk (30%+) in the current live reference market. These well-paid professionals earn above SGD 5,000/month but face significant structural AI pressure."
	path="/rankings/rich-and-risky"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Highest-Paid at Risk' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Highest-Paid Jobs at Risk</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		High-paying occupations with net risk &ge; 30% and median wage &ge; SGD 5,000/month. Where high
		salaries meet high AI exposure in the current live market.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Net Risk = Exposure &times; (1 &minus; Bottleneck) &times; Market Modifier. Wages are gross
		monthly median from MOM.
		<a href="/methodology" class="text-primary underline">Learn more</a>
	</p>
<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
		<span>More:</span>
		<a href="/rankings/highest-risk" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Highest Risk</a>
		<a href="/rankings/ai-leveraged" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Augmented</a>
		<a href="/rankings/safest-high-paying" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Safest High-Paying</a>
		<a href="/rankings/best-transitions" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Transitions</a>
		<a href="/rankings" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">All Rankings</a>
	</div>
</main>
