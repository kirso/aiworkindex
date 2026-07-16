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
			label: 'AI Exposure Rank',
			format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(0)}/100`,
			align: 'right' as const
		},
		{
			key: 'exposure',
			label: 'Exposure index',
			format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}/100`,
			align: 'right' as const
		},
		{
			key: 'bottleneck',
			label: 'Human advantage',
			format: (occ: Occupation) => `${(occ.bottleneck * 100).toFixed(0)}/100`,
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
			`Singapore occupations with the highest relative AI-driven AI exposure ranks`,
			data.ranked
		)
	);

	let faqItems = $derived([
		{
			question: 'Which jobs will AI replace first?',
			answer: `The highest-scoring occupations rank near the top of ${DATA_VINTAGE.occupation_count} Singapore occupations for exposure to current AI capabilities. That ranking does not say how many jobs will be lost or when.`
		},
		{
			question: 'How many jobs are at risk from AI?',
			answer: `This index cannot estimate a count of jobs that will disappear. It ranks occupations by relative AI exposure and reports demand, adoption and transition context separately.`
		},
		{
			question: 'Is AI replacing jobs right now?',
			answer:
				'AI can change tasks, hiring and job design without eliminating an occupation. Actual outcomes depend on adoption, demand, productivity, wages, institutions and worker transitions.'
		}
	]);

	let faqJsonLd = $derived(buildFaqJsonLd(faqItems));
</script>

<Seo
	title="AI Job Risk: {data.totalHighRisk} Highly Exposed Occupations"
	description="Which jobs are most exposed to AI? Explore {data.totalHighRisk} occupations in the higher exposure bands, without treating exposure as predicted job loss."
	path="/ai-job-loss"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI Job Loss' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Which Jobs Are Most Exposed to AI?</h1>
	<p class="mt-2 max-w-2xl text-sm text-muted-foreground">
		This page ranks {DATA_VINTAGE.occupation_count} Singapore occupations by relative AI exposure. A score
		of 72/100 means an occupation ranks above roughly 72% of the scored market; it is not a 72% chance
		of job loss.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Ranked by the V8 AI exposure rank. Employment outcomes are shown as context, not hidden in the
		score.
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
