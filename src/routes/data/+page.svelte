<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, pageLayout, title, sectionLabel, body, caption, mono } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';

	const v9Counts = siteStatus.structural_release.counts;
	const roleLayer = siteStatus.role_query_layer;

	const datasetJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: 'AI Work Index V9 Singapore occupation dataset',
		description: `${v9Counts.occupations} SSOC 2024 occupations with ILO-based AI Work Pressure evidence, mapping uncertainty and separate Singapore wage context.`,
		identifier: `${SITE.url}/data#v9`,
		url: `${SITE.url}/data`,
		version: '9.0',
		dateModified: '2026-08-19',
		license: `${SITE.url}/data#licensing`,
		spatialCoverage: { '@type': 'Country', name: 'Singapore' },
		distribution: [
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/sg-ai-occupations-v9.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/sg-ai-occupations-v9.csv`,
				encodingFormat: 'text/csv'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/synthetic-roles-v9.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-market-context.json`,
				encodingFormat: 'application/json'
			}
		]
	});

	const fields = [
		['schema_version', 'V9 contract identifier: 9.0.'],
		['method.external_comparison_audit', 'Machine-readable source, mapping rejection, coverage and headline-invariance disposition for four external sidecars.'],
		['taxonomy', 'Official SSOC 2024 code, title, hierarchy, detailed definition and search synonyms. The tasks array is empty at detailed grain because SSOC 2024 publishes tasks at four-digit unit-group grain; V9 does not copy them down.'],
		['score_status', 'scored or insufficient_evidence. Unavailable evidence is never encoded as zero.'],
		['genai_task_exposure.mean_score_2025', 'Median, minimum and maximum ILO mean score across scored official ISCO matches, stored on the source 0–1 scale. The website may show the same value multiplied by 100 and labelled /100.'],
		['genai_task_exposure.task_score_sd_2025', 'Median and range of within-ISCO task-score dispersion on the source 0–1 scale; not a confidence interval. The website may show it multiplied by 100 and labelled /100.'],
		['genai_task_exposure.potential25', 'Official ILO category set and least/most-exposed endpoints.'],
		['genai_task_exposure.pressure_rank', 'Midrank percentile among the 987 scored SSOC 2024 occupations.'],
		['genai_task_exposure.scored_isco08_matches', 'Every scored official ISCO candidate and its source values.'],
		['comparison_evidence', 'Nullable external comparison blocks. All four are withheld in V9; the release method records the failed mapping gates and 0% published coverage.'],
		['singapore_market.wages', 'Direct MOM 2025 wage percentiles where published.'],
		['market_evidence.demand_signals', 'Reviewed official demand-list matches where available; an empty array is not evidence of weak demand.'],
		['market_evidence.labour_context_ref', 'Reference to broad occupation-group labour context in market_context; null when no published group context applies.'],
		['evidence', 'Mapping quality, sources, limitations and data cutoff.']
	] as const;
</script>

<Seo
	path="/data"
	title="Download Singapore AI Job Pressure Data (V9)"
	description="Download V9 AI Work Pressure data for 1,001 SSOC 2024 occupations, with ILO categories, mapping uncertainty, wage evidence and source metadata."
	jsonLd={[datasetJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Data' }]} />

	<div class="max-w-3xl">
		<p class={sectionLabel()}>V9 · published 19 August 2026</p>
		<h1 class="mt-2 {title({ size: 'page' })}">Download the Singapore occupation data</h1>
		<p class={body({ class: 'mt-3 text-muted-foreground' })}>
			The V9 release contains {v9Counts.occupations.toLocaleString()} numeric SSOC 2024 occupations.
			{v9Counts.scored.toLocaleString()} have a relative AI Work Pressure Rank,
			{v9Counts.insufficient_evidence} remain explicitly unscored, and {v9Counts.direct_wages}
			have a direct MOM 2025 wage observation.
		</p>
	</div>

	<section class="mt-8 grid gap-4 sm:grid-cols-2">
		<a
			href="/data/sg-ai-occupations-v9.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Full JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>sg-ai-occupations-v9.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Nested evidence, mappings, categories, uncertainty, sources and limitations.
			</p>
		</a>
		<a
			href="/data/sg-ai-occupations-v9.csv"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Analysis CSV</p>
			<p class={body({ class: 'mt-2 font-medium' })}>sg-ai-occupations-v9.csv</p>
			<p class={caption({ class: 'mt-1' })}>
				Flattened headline, category, wage, mapping-quality and provenance fields.
			</p>
		</a>
		<a
			href="/data/synthetic-roles-v9.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Modern-title query JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>synthetic-roles-v9.json</p>
			<p class={caption({ class: 'mt-1' })}>
				{roleLayer.count} query labels: {roleLayer.official_match_count} resolve to official occupations;
				{roleLayer.estimated_count} use disclosed composites and {roleLayer.withheld_count} publish no fixed
				mapping or score.
			</p>
		</a>
		<a
			href="/data/v9-market-context.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Market context JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-market-context.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Reviewed demand mappings, broad labour context and explicitly withheld stale signals.
			</p>
		</a>
	</section>
	<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
		<a class="text-primary underline" href="/data/research-library.json">Research library JSON</a>
		<a class="text-primary underline" href="/data/release-manifest-v9.json">Release manifest and checksums</a>
	</div>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Read the rank correctly</h2>
		<div class={card({ padding: 'lg', class: 'mt-3 space-y-3' })}>
			<p class={body()}>
				An AI Work Pressure Rank of <span class={mono()}>72</span> places the occupation at the 72nd
				midrank percentile for ILO-based task exposure among scored SSOC 2024 occupations.
			</p>
			<p class={body({ class: 'text-muted-foreground' })}>
				It does not mean a 72% chance of job loss, that 72% of the occupation's tasks can be
				automated, or that 72% of its workers or wages are at risk.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Field dictionary</h2>
		<div class={card({ padding: 'none', class: 'mt-3 overflow-hidden' })}>
			<div class="hidden sm:block">
				<table class="w-full table-fixed text-left text-sm">
					<thead class="border-b bg-muted/40">
						<tr><th class="p-3">Field</th><th class="p-3">Meaning</th></tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each fields as field}
							<tr class="align-top">
								<td class="break-words p-3 font-mono text-xs text-foreground">{field[0]}</td>
								<td class="break-words p-3 text-muted-foreground">{field[1]}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<dl class="divide-y divide-border sm:hidden">
				{#each fields as field}
					<div class="p-4">
						<dt class="font-mono text-xs font-semibold text-foreground">{field[0]}</dt>
						<dd class="mt-1 text-sm leading-relaxed text-muted-foreground">{field[1]}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>

	<section class="mt-10 grid gap-4 lg:grid-cols-2">
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Primary source chain</h2>
			<ul class="mt-3 space-y-3 text-sm text-muted-foreground">
				<li>
					<a
						href="https://www.singstat.gov.sg/standard-classifications/national-classifications/singapore-standard-occupational-classification-ssoc"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline">Singapore Department of Statistics</a
					>: SSOC 2024 definitions, index and ISCO-08 correspondence.
				</li>
				<li>
					<a
						href="https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline">International Labour Organization</a
					>: refined 2025 GenAI occupational exposure index.
				</li>
				<li>
					<a
						href="https://stats.mom.gov.sg/Pages/Occupational-Wages-Tables2025.aspx"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline">Singapore Ministry of Manpower</a
					>: Occupational Wages 2025, Table 4.
				</li>
			</ul>
		</div>
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Record-level evidence boundary</h2>
			<ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
				<li>Source titles, official candidates and crosswalk quality</li>
				<li>Explicit nulls where occupation-level evidence is unavailable</li>
				<li>Record-specific mapping support, limitations and evidence cutoff</li>
				<li>Release-level source URLs, vintages and rejected mapping audits</li>
			</ul>
		</div>
	</section>

	<section id="licensing" class="mt-10">
		<h2 class={sectionLabel()}>Licensing and attribution</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			Project code and original editorial material use the licence stated in the repository.
			Official and third-party source data retain their own terms, attribution requirements and
			copyright. A download does not relicense those inputs. Review the linked source terms before
			redistributing source-derived fields.
		</p>
	</section>

	<section class="my-10">
		<h2 class={sectionLabel()}>Version history</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			V9 is a clean break from the SSOC 2020 releases. The occupation universe, crosswalk and
			headline method changed, so V8 and V9 ranks should not be compared as a time series.
		</p>
		<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a class="text-primary underline" href="/reports/v9-release">Read the V9 release report</a>
			<a class="text-primary underline" href="/methodology">Current methodology</a>
			<a class="text-primary underline" href="/data/sg-ai-occupations-v8.json"
				>Archived V8 JSON · superseded SSOC 2020 method</a
			>
			<a class="text-primary underline" href="/data/sg-ai-occupations-v7.json"
				>Archived V7 JSON · superseded SSOC 2020 method</a
			>
		</div>
	</section>
</main>
