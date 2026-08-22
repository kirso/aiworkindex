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
			question: 'Which jobs will AI replace first?',
			answer:
				'No defensible occupation ranking can answer that question. This page shows where current generative AI overlaps most with measured occupational tasks. Replacement also depends on adoption, demand, costs, regulation, job redesign and new work.'
		},
		{
			question: 'What does an AI Work Pressure Rank of 90 mean?',
			answer: `It places the occupation at the 90th midrank percentile for ILO-based task exposure among the ${data.counts.scored.toLocaleString()} scored SSOC 2024 occupations. It does not mean a 90% chance of job loss or that 90% of the job can be automated.`
		},
		{
			question: 'Is there evidence that AI is changing jobs now?',
			answer:
				'Yes. Research reports changes in AI use, task mix, productivity and some hiring outcomes, but results vary across settings and time periods. The V9 pressure rank does not fold those outcomes into the score.'
		},
		{
			question: 'How many jobs will be lost to AI?',
			answer:
				'The AI Work Index does not publish a job-loss count. Public evidence does not support converting an occupation exposure rank into a headcount forecast for Singapore.'
		}
	]);

	let itemListJsonLd = $derived(
		buildItemListJsonLd(
			'Singapore occupations with the highest AI Work Pressure',
			`The highest relative ILO-based task-exposure ranks in AI Work Index V9. The list contains ${data.ranked.length} rows because it preserves the complete tie at the 50-row cutoff.`,
			data.ranked.map(occupation => ({ title: occupation.title, ssoc: occupation.code }))
		)
	);
	let faqJsonLd = $derived(buildFaqJsonLd(faqItems));
</script>

<Seo
	title="AI Job Loss: Jobs With the Highest AI Work Pressure"
	description="Which Singapore jobs face the most AI pressure? See the highest V9 task-exposure ranks, the evidence behind them and why they are not job-loss forecasts."
	path="/ai-job-loss"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI job loss' }]} />

	<header class="max-w-4xl border-b-2 border-foreground pb-6">
		<p class={sectionLabel()}>Singapore · V9 · evidence cutoff 19 Aug 2026</p>
		<h1 class={title({ size: 'page' })}>Which jobs face the most AI pressure?</h1>
		<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
			No credible score can tell you which jobs AI will eliminate first. V9 can show which
			occupations have the greatest measured overlap between their tasks and current generative-AI
			capabilities. The list contains {data.ranked.length} rows because it preserves the complete tie
			at the 50-row cutoff, among
			{data.counts.scored.toLocaleString()} scored SSOC 2024 occupations.
		</p>
	</header>

	<section class="mt-6 grid gap-3 sm:grid-cols-3" aria-label="How to interpret this ranking">
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class="text-sm font-bold text-foreground">Measured</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				ILO 2025 task-exposure evidence mapped through the official SSOC 2024 correspondence.
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class="text-sm font-bold text-foreground">Derived</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				A within-Singapore midrank percentile. A rank of 90 places an occupation at percentile 90
				among scored occupations. Ties share the same position.
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class="text-sm font-bold text-foreground">Unknown</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				The number of jobs lost, the timing of change and the outcome for any worker or employer.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<div class="mb-3 border-b border-foreground pb-2">
			<h2 class={title({ size: 'section' })}>Highest relative task pressure</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Monthly wages are direct Singapore context where published. They do not change the pressure
				rank.
			</p>
		</div>
		<OccupationResultList items={data.ranked} detail="wage" />
	</section>

	<aside class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-8')}>
		<p class="text-sm font-bold text-foreground">Pressure is not predicted loss</p>
		<p class="mt-1 text-sm leading-relaxed text-text-secondary">
			High technical exposure can lead to substitution, assistance, new tasks or a mix of all three.
			Current demand, employer adoption and wages are considered separately because none has a
			justified hidden weight in the headline rank. Occupation-level observed-use and
			complementarity mappings are withheld in V9 because their cross-system provenance does not
			pass the publication gate.
		</p>
		<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a class="font-medium text-primary hover:underline" href="/methodology">Read the V9 method</a>
			<a class="font-medium text-primary hover:underline" href="/reports/job-market-evidence"
				>See current job-market evidence</a
			>
			<a class="font-medium text-primary hover:underline" href="/will-ai-take-my-job"
				>Check an occupation or role</a
			>
		</div>
	</aside>

	<FaqList items={faqItems} />
</main>
