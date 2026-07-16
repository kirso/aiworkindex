<script lang="ts">
	import { pageLayout, sectionLabel, title as titleStyle, card } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
</script>

<Seo
	title={`V8 Implementation Appendix — AI Exposure Rank`}
	description="Technical reference for the V8 AI Exposure Rank, bands, pathway rules, confidence and sensitivity checks."
	path="/methodology/appendix"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Methodology', href: '/methodology' },
			{ label: 'Appendix' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>V8 Implementation Appendix</h1>
	<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
		The current public score is a within-Singapore rank. It is not a probability, forecast, task
		share, or estimate of jobs or wages lost. This page documents the public V8 contract generated
		by
		<code class="rounded bg-muted px-1 text-xs">build-v8-release.ts</code>.
	</p>

	<section class="mt-8">
		<p class={sectionLabel()}>Headline rank</p>
		<div class={cn(card({ variant: 'inset', padding: 'md' }), 'mt-3 space-y-2')}>
			<p class="font-mono text-sm">
				AI Exposure Rank = midrank percentile of the frozen multi-source exposure signal
			</p>
			<p class="text-sm text-muted-foreground">
				The reference set contains {DATA_VINTAGE.occupation_count} Singapore SSOC 2020 occupations. Tied
				raw values receive the same midrank. Published points are rounded to a 0–100 scale; 82/100 means
				more exposed than approximately 82% of the reference occupations.
			</p>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Exposure bands</p>
		<div class="mt-3 overflow-x-auto" role="region" aria-label="AI exposure band thresholds">
			<table class="w-full min-w-[640px] text-left text-sm">
				<thead
					><tr class="border-b"
						><th class="p-2">Band</th><th class="p-2">Rank</th><th class="p-2"
							>Plain-language meaning</th
						></tr
					></thead
				>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50"
						><td class="p-2">Very Low</td><td class="p-2">0–19</td><td class="p-2"
							>Lower exposure relative to most occupations</td
						></tr
					>
					<tr class="border-b border-border/50"
						><td class="p-2">Low</td><td class="p-2">20–39</td><td class="p-2"
							>Below-median relative exposure</td
						></tr
					>
					<tr class="border-b border-border/50"
						><td class="p-2">Moderate</td><td class="p-2">40–59</td><td class="p-2"
							>Middle of the reference distribution</td
						></tr
					>
					<tr class="border-b border-border/50"
						><td class="p-2">High</td><td class="p-2">60–79</td><td class="p-2"
							>Above-median relative exposure</td
						></tr
					>
					<tr
						><td class="p-2">Very High</td><td class="p-2">80–100</td><td class="p-2"
							>Higher exposure relative to most occupations</td
						></tr
					>
				</tbody>
			</table>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Separate signals</p>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<div class={card({ padding: 'sm' })}>
				<h2 class="font-semibold">Substitution pressure</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					A separate percentile rank of the structural substitution signal. It is not a job-loss
					probability.
				</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<h2 class="font-semibold">Augmentation potential</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					A separate percentile rank of the augmentation signal. It is not a productivity forecast.
				</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<h2 class="font-semibold">Market context</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Demand, adoption and attrition are reported beside the rank. They do not secretly change
					it.
				</p>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Likely pathway rules</p>
		<div class="mt-3 overflow-x-auto" role="region" aria-label="Likely pathway rules">
			<table class="w-full min-w-[760px] text-left text-sm">
				<thead
					><tr class="border-b"
						><th class="p-2">Pathway</th><th class="p-2">Deterministic rule</th></tr
					></thead
				>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50"
						><td class="p-2">Limited direct change</td><td class="p-2">AI Exposure Rank below 40</td
						></tr
					>
					<tr class="border-b border-border/50"
						><td class="p-2">Hiring or substitution pressure</td><td class="p-2"
							>Substitution at least 60, direct established or leading adoption, and demand not
							strong</td
						></tr
					>
					<tr class="border-b border-border/50"
						><td class="p-2">Augmentation-led growth</td><td class="p-2"
							>Augmentation at least 60 and demand strong</td
						></tr
					>
					<tr class="border-b border-border/50"
						><td class="p-2">Demand-buffered redesign</td><td class="p-2"
							>Substitution at least 60 and demand strong</td
						></tr
					>
					<tr><td class="p-2">Workflow redesign</td><td class="p-2">All other cases</td></tr>
				</tbody>
			</table>
		</div>
		<p class="mt-2 text-xs text-muted-foreground">
			These labels are scenario classifications, not forecasts that the named outcome will occur.
		</p>
	</section>

	<section class="my-8">
		<p class={sectionLabel()}>Confidence and sensitivity</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Evidence confidence reflects source count, mapping quality, task evidence and policy caps.
			Sensitivity reranks occupations after leaving out each source and under equal weights, then
			reports the minimum and maximum points and whether the result crosses a band. Confidence is
			categorical; no numeric confidence probability is published.
		</p>
	</section>
</main>
