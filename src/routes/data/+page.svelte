<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, pageLayout, title, sectionLabel, body, caption, mono } from '$lib/design-system';
	import { SITE, DATA_VINTAGE } from '$lib/data/scoring-constants';

	const datasetJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: 'AI Work Index V8 Singapore occupation dataset',
		description: `${DATA_VINTAGE.occupation_count} Singapore occupations ranked by a relative AI Exposure Rank with separate substitution, augmentation, demand, adoption, confidence and transition context.`,
		identifier: `${SITE.url}/data#v8`,
		url: `${SITE.url}/data`,
		version: '8.0',
		dateModified: '2026-07-15',
		license: 'https://opensource.org/licenses/MIT',
		spatialCoverage: { '@type': 'Country', name: 'Singapore' },
		distribution: [
			{ '@type': 'DataDownload', contentUrl: `${SITE.url}/data/sg-ai-occupations-v8.json`, encodingFormat: 'application/json' },
			{ '@type': 'DataDownload', contentUrl: `${SITE.url}/data/sg-ai-occupations-v8.csv`, encodingFormat: 'text/csv' }
		]
	})}<\/script>`;

	const fields = [
		['ai_exposure_rank.points', '0–100 relative percentile index; not a probability.'],
		['ai_exposure_rank.band', 'Very Low through Very High quintile band.'],
		['substitution_pressure', 'Relative rank of exposure × (1 − human bottleneck).'],
		['augmentation_potential', 'Relative rank of exposure × human bottleneck.'],
		['likely_pathway', 'Explicit rule-based interpretation of structural and local evidence.'],
		['market_context.demand', 'Strong, mixed, weak or unknown official-derived demand context.'],
		['market_context.adoption', 'Observed sector adoption tier where directly supported; otherwise unknown.'],
		['market_context.attrition_absorber', 'Broad workforce-age context; major-group granularity.'],
		['evidence_confidence', 'High, Medium or Low with visible limiting factors.'],
		['sensitivity', 'Equal-weight and leave-one-source-out score range; not a confidence interval.'],
		['transition', 'Top modeled adjacent occupation when available.']
	] as const;
</script>

<svelte:head>{@html datasetJsonLd}</svelte:head>

<Seo
	path="/data"
	title="Download Singapore AI Job Exposure Data"
	description="Download V8 AI Exposure Ranks for 562 Singapore occupations, with automation pressure, augmentation potential, demand, confidence and transition evidence."
/>

<div class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Data' }]} />
	<h1 class={title({ size: 'page' })}>V8 data</h1>
	<p class={caption({ class: 'mt-1 mb-8' })}>
		A clean breaking schema for {DATA_VINTAGE.occupation_count} Singapore SSOC occupations.
	</p>

	<div class="mb-10 grid gap-4 sm:grid-cols-2">
		<a href="/data/sg-ai-occupations-v8.json" download class={card({ padding: 'lg', hover: true })}>
			<p class={sectionLabel()}>JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>sg-ai-occupations-v8.json</p>
			<p class={caption({ class: 'mt-1' })}>Nested V8 contract with evidence and source context.</p>
		</a>
		<a href="/data/sg-ai-occupations-v8.csv" download class={card({ padding: 'lg', hover: true })}>
			<p class={sectionLabel()}>CSV</p>
			<p class={body({ class: 'mt-2 font-medium' })}>sg-ai-occupations-v8.csv</p>
			<p class={caption({ class: 'mt-1' })}>Flattened fields for analysis and spreadsheets.</p>
		</a>
	</div>

	<section class="mb-10">
		<h2 class={sectionLabel({ class: 'mb-3' })}>Interpretation contract</h2>
		<div class={card({ padding: 'lg', class: 'space-y-3' })}>
			<p class={body()}>
				An AI Exposure Rank of <span class={mono()}>72/100</span> means the occupation is more
				exposed to current AI capabilities than approximately 72% of occupations in Singapore.
			</p>
			<p class={body({ class: 'text-muted-foreground' })}>
				It is not a 72% probability of job loss, a claim that 72% of jobs will disappear, or an
				estimate that 72% of tasks can be automated.
			</p>
		</div>
	</section>

	<section class="mb-10">
		<h2 class={sectionLabel({ class: 'mb-3' })}>Field dictionary</h2>
		<div class="hidden overflow-x-auto sm:block">
			<table class="w-full min-w-[720px] text-left text-sm">
				<thead><tr class="border-b"><th class="py-2 pr-4">Field</th><th class="py-2">Meaning</th></tr></thead>
				<tbody>
					{#each fields as field}
						<tr class="border-b border-border/60"><td class="py-2 pr-4 font-mono text-xs">{field[0]}</td><td class="py-2 text-muted-foreground">{field[1]}</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		<dl class="divide-y divide-border sm:hidden">
			{#each fields as field}
				<div class="py-3">
					<dt class="font-mono text-xs font-medium text-foreground">{field[0]}</dt>
					<dd class="mt-1 text-sm leading-relaxed text-muted-foreground">{field[1]}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="mb-10">
		<h2 class={sectionLabel({ class: 'mb-3' })}>Versioning</h2>
		<p class={body()}>
			V8 intentionally removes the current public meanings of <span class={mono()}>net_risk</span>,
			probability-style uncertainty intervals and numeric confidence percentages. Historical V7
			artifacts remain available for reproducibility, but are not the current public contract.
		</p>
		<div class="mt-3 flex gap-4 text-sm">
			<a class="text-primary hover:underline" href="/data/sg-ai-occupations-v7.json">Archived V7 JSON</a>
			<a class="text-primary hover:underline" href="/methodology">Current methodology</a>
		</div>
	</section>
</div>
