<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle } from '$lib/design-system';
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
			name: 'AI-Augmented Occupations',
			description:
				'Top 25 occupations where AI augments rather than replaces workers, ranked by augmentation potential in the current live reference market',
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
				name: 'What are AI-augmented jobs?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'AI-augmented occupations have high AI exposure but also strong human bottlenecks — coordination, physical presence, or judgment — that make full automation unlikely. AI enhances these roles rather than replacing them.'
				}
			},
			{
				'@type': 'Question',
				name: 'Which jobs benefit most from AI?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Roles in engineering, medicine, and legal services often top this list, where AI handles routine analysis while humans handle judgment, relationships, and novel problems.'
				}
			}
		]
	})}<\/script>`;

	const columns = [
		{
			key: 'augmentation',
			label: 'Augmentation',
			format: (occ: Occupation) => `${(occ.augmentation * 100).toFixed(0)}%`,
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
			format: (occ: Occupation) => `SGD ${occ.gross_wage_median.toLocaleString()}`,
			align: 'right' as const
		}
	];
</script>

<Seo
	title="25 AI-Augmented Jobs — High Exposure, Strong Moats"
	description="Occupations where AI augments rather than replaces — high exposure but strong human bottlenecks create augmentation potential in the current live reference market."
	path="/rankings/ai-leveraged"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Augmented' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Augmented Occupations</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		These roles have high AI exposure but strong human bottlenecks — judgment, creativity, and
		interpersonal skills mean AI augments rather than replaces. Ranked by augmentation potential.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Augmented = exposure &gt; 0.6 AND bottleneck &gt; 0.6. Augmentation = exposure &times;
		bottleneck &times; market_resilience.
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
