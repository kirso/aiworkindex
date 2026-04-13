<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle, pageLayout, card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import type { Occupation } from '$lib/data';
	import { countryConfigs } from '$lib/data/country-config';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { buildItemListJsonLd, buildFaqJsonLd } from '$lib/data/ranking-jsonld';

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
			'Jobs Most at Risk from AI',
			`Top 50 occupations with highest AI displacement pressure`,
			data.ranked
		)
	);

	let faqItems = $derived([
		{
			question: 'Which jobs will AI replace first?',
			answer: `Of ${DATA_VINTAGE.occupation_count} scored occupations, ${data.totalVeryHighRisk} have very high displacement risk (above 50%). These are roles with high AI task overlap and low human bottleneck protection, such as data entry, telemarketing, and routine bookkeeping.`
		},
		{
			question: 'How many jobs are at risk from AI?',
			answer: `${data.totalHighRisk} occupations score above 30% displacement risk (high or very high band). This does not mean these jobs will disappear — it measures structural pressure from AI task overlap.`
		},
		{
			question: 'Is AI replacing jobs right now?',
			answer:
				'AI is automating specific tasks within jobs, not eliminating entire occupations overnight. The highest-risk occupations have 50-70% task overlap with current AI capabilities, but actual displacement depends on employer adoption speed, cost-benefit decisions, and regulatory environment.'
		}
	]);

	let faqJsonLd = $derived(buildFaqJsonLd(faqItems));
</script>

<Seo
	title="AI Job Loss: {data.totalHighRisk} Jobs at High Risk from AI"
	description="Which jobs will AI replace? {data.totalHighRisk} occupations face high displacement pressure. Data from {DATA_VINTAGE.occupation_count} scored occupations."
	path="/ai-job-loss"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI Job Loss' }]} />

	<h1 class={titleStyle({ size: 'page' })}>AI Job Loss: Which Jobs Are Most at Risk?</h1>
	<p class="mt-2 max-w-2xl text-sm text-muted-foreground">
		Of {DATA_VINTAGE.occupation_count} scored occupations,
		{data.totalVeryHighRisk} have very high displacement risk (above 50%) and
		{data.totalHighRisk} score above 30%. These scores measure structural pressure from AI task overlap
		— not predictions of immediate job losses.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Ranked by net displacement risk. Scores are structural pressure, not job loss predictions.
		<a href="/methodology" class="text-primary underline">Learn more</a> |
		<a href="/ai-proof-jobs" class="text-primary underline">AI-proof jobs</a> |
		<a href="/will-ai-take-my-job" class="text-primary underline">Check your job</a>
	</p>

	<!-- Visible FAQ -->
	<section class="mt-8">
		<h2 class={sectionLabel()}>Frequently asked questions</h2>
		<div class="mt-3 space-y-1">
			{#each faqItems as item}
				<details class={cn(card({ padding: 'md' }), 'group')}>
					<summary class="cursor-pointer text-sm font-semibold text-foreground select-none">
						{item.question}
					</summary>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
				</details>
			{/each}
		</div>
	</section>
</main>
