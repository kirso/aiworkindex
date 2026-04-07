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
		{ key: 'net_risk', label: 'Net Risk', format: (occ: Occupation) => `${(occ.net_risk * 100).toFixed(1)}%`, align: 'right' as const },
		{ key: 'exposure', label: 'Exposure', format: (occ: Occupation) => `${(occ.exposure * 100).toFixed(0)}%`, align: 'right' as const },
		{ key: 'bottleneck', label: 'Bottleneck', format: (occ: Occupation) => `${(occ.bottleneck * 100).toFixed(0)}%`, align: 'right' as const },
		{ key: 'wage', label: 'Median Wage', format: (occ: Occupation) => `${currency} ${occ.gross_wage_median.toLocaleString()}`, align: 'right' as const }
	];

	let itemListJsonLd = $derived(buildItemListJsonLd(
		'AI-Proof Jobs: Careers Safe from AI Displacement',
		`${data.total} occupations with less than 15% AI displacement risk in Singapore`,
		data.ranked
	));

	let faqItems = $derived([
		{ question: 'What jobs are safe from AI?', answer: `${data.total} occupations in Singapore score below 15% displacement risk. These roles typically require physical presence, real-time human coordination, regulatory judgment, or deep relationship-building that AI cannot replicate.` },
		{ question: 'What are AI-proof careers?', answer: 'AI-proof careers combine high human bottleneck protection with strong market demand. Healthcare, skilled trades, senior management, and field-based roles consistently score lowest for AI displacement pressure.' },
		{ question: 'Will AI replace all jobs?', answer: 'No. While AI automates specific tasks, most occupations blend automatable and non-automatable work. Roles with high coordination, physical presence, or regulatory complexity face minimal displacement pressure.' }
	]);

	let faqJsonLd = $derived(buildFaqJsonLd(faqItems));
</script>

<Seo
	title="AI-Proof Jobs: {data.total} Careers Safe from AI in 2026"
	description="Which jobs are safe from AI? {data.total} occupations with less than 15% displacement risk. Data-backed rankings from 562 scored occupations."
	path="/ai-proof-jobs"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI-Proof Jobs' }]} />

	<h1 class={titleStyle({ size: 'page' })}>AI-Proof Jobs</h1>
	<p class="mt-2 max-w-2xl text-sm text-muted-foreground">
		{data.total} occupations in Singapore score below 15% AI displacement risk. These careers
		have strong human bottleneck protection, meaning their core tasks resist automation.
	</p>

	<section class="mt-6">
		<RankingTable occupations={data.ranked} {columns} />
	</section>

	<p class="mt-4 text-xs text-muted-foreground">
		Filtered: net_risk &lt; 0.15. Scores measure structural pressure, not predicted job losses.
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
