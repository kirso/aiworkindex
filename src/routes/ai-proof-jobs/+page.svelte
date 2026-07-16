<script lang="ts">
	import RankingTable from '$lib/components/ui/RankingTable.svelte';
	import { title as titleStyle, pageLayout, card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import type { Occupation } from '$lib/data';
	import { countryConfigs } from '$lib/data/country-config';
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
			'Jobs With Lower Relative AI Exposure',
			`${data.total} occupations in the lower end of the Singapore AI exposure ranking`,
			data.ranked
		)
	);

	let faqItems = $derived([
		{
			question: 'What jobs are safe from AI?',
			answer: `${data.total} occupations fall below the page filter. A lower relative score is not proof that a job is safe: technology, demand, policy and job design can still change it.`
		},
		{
			question: 'What are AI-proof careers?',
			answer:
				'No career is literally AI-proof. Lower-scoring roles currently rank lower for measured AI exposure, often because physical, interpersonal or accountable work remains important.'
		},
		{
			question: 'Will AI replace all jobs?',
			answer:
				'No. While AI automates specific tasks, most occupations blend automatable and non-automatable work. Roles with high coordination, physical presence, or regulatory complexity face minimal displacement pressure.'
		}
	]);

	let faqJsonLd = $derived(buildFaqJsonLd(faqItems));
</script>

<Seo
	title="AI-Proof Jobs? Jobs With Lower AI Exposure (2026)"
	description="Which jobs currently rank lower for AI exposure? A relative Singapore ranking, not a guarantee that any career is AI-proof."
	path="/ai-proof-jobs"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI-Proof Jobs' }]} />

	<h1 class={titleStyle({ size: 'page' })}>AI-Proof Jobs</h1>
	<p class="mt-2 max-w-2xl text-sm text-muted-foreground">
		{data.total} occupations fall below this page's lower-score filter. “AI-proof” is a search term, not
		a scientific claim: lower relative AI exposure does not guarantee job security.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Filtered on the V8 relative score alias. Scores rank occupations; they do not predict job
		losses.
		<a href="/methodology" class="text-primary underline">Learn more</a> |
		<a href="/rankings" class="text-primary underline">All rankings</a> |
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
