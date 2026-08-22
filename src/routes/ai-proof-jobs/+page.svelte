<script lang="ts">
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { buildFaqJsonLd, buildItemListJsonLd } from '$lib/data/ranking-jsonld';
	import { card, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();

	let faqItems = $derived([
		{
			question: 'What jobs are safe from AI?',
			answer:
				'No job can be guaranteed safe from AI or other forms of change. Lower measured task exposure can be useful context, but employment also depends on demand, technology adoption, regulation, wages and how employers redesign work.'
		},
		{
			question: 'What does ILO “Not Exposed” mean?',
			answer:
				'It is the ILO classification attached to the mapped ISCO occupation in the 2025 task framework. V9 preserves the label verbatim. It does not mean a zero exposure score, zero AI overlap or protection from software, robotics, economic shocks or future AI capabilities.'
		},
		{
			question: 'Should I choose a career only because it has low AI pressure?',
			answer:
				'No. Consider current demand, training time, wages, working conditions, your strengths and how the role is changing. AI Work Pressure is one comparison, not career advice.'
		},
		{
			question: 'Why do many occupations share the same pressure rank?',
			answer:
				'V9 uses a midrank percentile, so occupations with the same ILO task-exposure score receive the same rank. Alphabetical order within the list below is not a scientific distinction.'
		}
	]);

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'Singapore occupations in the ILO Not Exposed category',
			'Examples classified as Not Exposed in the ILO potential category carried into AI Work Index V9. The category is not a zero score or a guarantee of job safety.',
			data.notExposed.map(occupation => ({
				title: occupation.title,
				ssoc: occupation.code
			}))
		)
	);
	let faqJsonLd = $derived(buildFaqJsonLd(faqItems));
</script>

<Seo
	title="AI-Proof Jobs? Lower AI Work Pressure in Singapore"
	description="No job is AI-proof. Review Singapore occupations in the ILO Not Exposed category, what the label means, and the limits that matter for career decisions."
	path="/ai-proof-jobs"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI-proof jobs' }]} />

	<header class="max-w-4xl border-b-2 border-foreground pb-6">
		<p class={sectionLabel()}>Singapore · V9 · evidence cutoff 19 Aug 2026</p>
		<h1 class={title({ size: 'page' })}>Are any jobs AI-proof?</h1>
		<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
			No. “AI-proof” overstates what occupation data can show. The closest evidence-based answer is
			to identify work with lower measured task pressure. In V9,
			{data.notExposedCount.toLocaleString()} SSOC 2024 occupations are in the ILO
			<strong class="text-foreground">Not Exposed</strong> category and
			{data.minimalExposureCount.toLocaleString()} are in
			<strong class="text-foreground">Minimal Exposure</strong>.
		</p>
	</header>

	<section
		class="mt-6 grid gap-3 sm:grid-cols-3"
		aria-label="What lower pressure does and does not mean"
	>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class="text-sm font-bold text-foreground">What it says</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				The mapped ISCO occupation carries the ILO 2025 <em>Not Exposed</em> classification.
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class="text-sm font-bold text-foreground">What it does not say</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				The occupation is protected from robotics, software, restructuring or future capabilities.
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class="text-sm font-bold text-foreground">What to check next</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				Demand, entry routes, wages, working conditions, regulation and the actual tasks employers
				need.
			</p>
		</div>
	</section>

	<aside class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-8')}>
		<p class="text-sm font-bold text-foreground">“Not Exposed” is an official evidence category</p>
		<p class="mt-1 text-sm leading-relaxed text-text-secondary">
			It is not a zero score or a promise of safety. V9 preserves the ILO potential category as
			published while reporting the separate mean task-exposure score and percentile. Occupations
			may still change through tools outside the studied boundary, and future evidence may classify
			tasks differently.
		</p>
	</aside>

	<section class="mt-10">
		<div class="mb-3 border-b border-foreground pb-2">
			<h2 class={title({ size: 'section' })}>Examples in the ILO Not Exposed category</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				The first 50 are shown alphabetically from
				{data.notExposedCount.toLocaleString()} occupations in this category. Their order is not a safety
				ranking. Direct wages remain separate context.
			</p>
		</div>
		<OccupationResultList items={data.notExposed} detail="wage" showRank={false} />
	</section>

	<div class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
		<a class="font-medium text-primary hover:underline" href="/explore"
			>Browse all {data.counts.occupations.toLocaleString()} occupations</a
		>
		<a class="font-medium text-primary hover:underline" href="/reports/job-market-evidence"
			>Review current demand evidence</a
		>
		<a class="font-medium text-primary hover:underline" href="/methodology">Read the V9 method</a>
	</div>

	<FaqList items={faqItems} />
</main>
