<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, pageLayout, title, sectionLabel, body, caption, mono } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';

	const v9Counts = siteStatus.structural_release.counts;
	const roleLayer = siteStatus.role_query_layer;
	const capabilityCoverage = siteStatus.capability_profiles.coverage;
	const researchCoverage = siteStatus.external_comparisons.separate_signal_coverage;
	const skillsCoverage = siteStatus.official_skills_pilot.coverage;
	const evidenceCoverage = siteStatus.evidence_vector.coverage;

	const datasetJsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		name: 'AI Work Index V9 Singapore occupation dataset',
		description: `${v9Counts.occupations} SSOC 2024 occupations with ILO-based AI Work Pressure evidence, mapping uncertainty and separate Singapore wage context.`,
		identifier: `${SITE.url}/data#v9`,
		url: `${SITE.url}/data`,
		version: '9.0',
		dateModified: '2026-08-22',
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
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-economic-observatory.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-capability-profiles.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-research-signals.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-skills-pilot.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-evidence-vector.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-signal-change.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/ilo-isco-task-evidence-v9.json`,
				encodingFormat: 'application/json'
			},
			{
				'@type': 'DataDownload',
				contentUrl: `${SITE.url}/data/v9-external-crosswalk-audit.json`,
				encodingFormat: 'application/json'
			}
		]
	});

	const fields = [
		['schema_version', 'V9 contract identifier: 9.0.'],
		['method.external_comparison_audit', 'Machine-readable publication disposition for four external sidecars. The companion crosswalk-audit download records the official ESCO–O*NET candidate chain, checksums, candidate coverage and remaining gates.'],
		['taxonomy', 'Official SSOC 2024 code, title, hierarchy, detailed definition and search synonyms. The tasks array is empty at detailed grain because SSOC 2024 publishes tasks at four-digit unit-group grain; V9 does not copy them down. Mapped ILO task evidence is a separate four-digit ISCO artifact.'],
		['score_status', 'scored or insufficient_evidence. Unavailable evidence is never encoded as zero.'],
		['genai_task_exposure.mean_score_2025', 'Median, minimum and maximum ILO mean score across scored official ISCO matches, stored on the source 0–1 scale. The website may show the same value multiplied by 100 and labelled /100.'],
		['genai_task_exposure.task_score_sd_2025', 'Median and range of within-ISCO task-score dispersion on the source 0–1 scale; not a confidence interval. The website may show it multiplied by 100 and labelled /100.'],
		['genai_task_exposure.potential25', 'Official ILO category set and least/most-exposed endpoints.'],
		['genai_task_exposure.pressure_rank', 'Midrank percentile among the 987 scored SSOC 2024 occupations.'],
		['genai_task_exposure.scored_isco08_matches', 'Every scored official ISCO candidate and its source values.'],
		['comparison_evidence', 'Nullable fields inside the headline occupation artifact. All four remain null so external research cannot silently enter the pressure score.'],
		['research_signals', `Separate identity-gated Eloundou theoretical exposure for ${researchCoverage.eloundou_theoretical_exposure_available} occupations and Anthropic observed-use evidence for ${researchCoverage.anthropic_observed_exposure_available}. Includes all 1,001 availability states; no value changes the pressure rank.`],
		['singapore_market.wages', 'Direct MOM 2025 wage percentiles where published.'],
		['market_evidence.demand_signals', 'Reviewed official demand-list matches where available; an empty array is not evidence of weak demand.'],
		['market_evidence.labour_context_ref', 'Reference to broad occupation-group labour context in market_context; null when no published group context applies.'],
		['economic_observatory', 'Separate V9 artifact covering six labour-economics mechanisms, broad occupation-group observations, detailed evidence availability and explicit publication gates. It has no headline effect.'],
		['capability_profiles', `Separate OECD 2026 capability profiles for ${capabilityCoverage.available_reviewed_identity_profiles} occupations that pass an automated or explicit reviewed detailed-identity decision. Nine domains, source ranges and all 1,001 availability states are published; no value changes the pressure rank.`],
		['official_skills_pilot', `Selected official Skills Framework labels for ${skillsCoverage.unique_occupations} occupations across ${skillsCoverage.sectors} sectors and ${skillsCoverage.sector_role_profiles} sector-role profiles. No value changes the pressure rank or infers a worker's skill level.`],
		['evidence_vector.dimensions', `Eight separately sourced dimensions aligned by SSOC 2024 code. Coverage varies from ${evidenceCoverage.dimensions.official_skills} official-skills records to ${evidenceCoverage.dimensions.task_pressure} pressure records. They are never averaged into a combined score.`],
		['evidence_vector.shared_subset_comparison', `Pressure and capability positions recomputed only across the ${evidenceCoverage.shared_pressure_capability_subset} occupations with both measures. The difference describes cross-construct disagreement, not risk.`],
		['signal_change', 'Same-construct, same-source-family and same-grain changes only. The first V9 pressure snapshot is a baseline, so pressure movers remain unavailable until a second compatible snapshot exists.'],
		['evidence', 'Mapping quality, sources, limitations and data cutoff.']
	] as const;

	const dateFields = [
		['published_at', 'The date an official or research source was released.'],
		['observation_period', 'The period covered by the underlying data, when the source states it.'],
		['reviewed_at', 'The date AI Work Index last checked the source for V9.'],
		['generated_at', 'The deterministic artifact date; not the date of the underlying observation.']
	] as const;
</script>

<Seo
	path="/data"
	title="Download Singapore AI Work and Job Evidence Data (V9)"
	description="Download V9 data for 1,001 SSOC 2024 occupations, including AI task pressure, mapped OECD capability profiles, wage evidence and source metadata."
	jsonLd={[datasetJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Data' }]} />

	<div class="max-w-3xl">
		<p class={sectionLabel()}>V9 · published 19 August · evidence baseline added 22 August 2026</p>
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
		<a
			href="/data/v9-economic-observatory.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Labour observatory JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-economic-observatory.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Broad employment, workforce and industry observations; mechanism coverage; and the evidence
				still needed for occupation-level outcomes. No values change the pressure rank.
			</p>
		</a>
		<a
			href="/data/v9-capability-profiles.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>AI capability profile JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-capability-profiles.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Nine OECD capability domains for {capabilityCoverage.available_reviewed_identity_profiles}
				 reviewed detailed-identity matches, plus an explicit
				availability status for all 1,001 occupations. No values change the pressure rank.
			</p>
		</a>
		<a
			href="/data/ilo-isco-task-evidence-v9.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Mapped task evidence JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>ilo-isco-task-evidence-v9.json</p>
			<p class={caption({ class: 'mt-1' })}>
				3,265 attributed ILO task rows across 427 four-digit ISCO groups. These are not exact
				five-digit SSOC duties and never change the headline rank.
			</p>
		</a>
		<a
			href="/data/v9-research-signals.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Research comparison JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-research-signals.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Eloundou theoretical LLM scope for {researchCoverage.eloundou_theoretical_exposure_available}
				 reviewed identities and Anthropic observed Claude use for {researchCoverage.anthropic_observed_exposure_available}.
				 Includes source checksums, mapping rules and explicit missingness.
			</p>
		</a>
		<a
			href="/data/v9-skills-pilot.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Official skills pilot JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-skills-pilot.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Selected official Skills Framework labels for {skillsCoverage.unique_occupations} occupations
				 across ICT, financial services and healthcare, with mapping and source provenance.
			</p>
		</a>
		<a
			href="/data/v9-evidence-vector.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Multi-signal evidence JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-evidence-vector.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Eight evidence dimensions aligned across 1,001 occupations, with shared-subset comparisons,
				descriptive pattern flags and explicit nulls. No composite score.
			</p>
		</a>
		<a
			href="/data/v9-signal-change.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>Comparable change JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-signal-change.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Public labour changes compared at their source grain, plus the first frozen V9 evidence
				baseline and explicit gates for unavailable movers.
			</p>
		</a>
		<a
			href="/data/v9-external-crosswalk-audit.json"
			download
			class={card({ padding: 'lg', hover: true })}
		>
			<p class={sectionLabel()}>External evidence audit JSON</p>
			<p class={body({ class: 'mt-2 font-medium' })}>v9-external-crosswalk-audit.json</p>
			<p class={caption({ class: 'mt-1' })}>
				Official ESCO–O*NET candidate mappings, source checksums and the remaining publication
				gates. Candidate coverage is not published occupation coverage.
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

	<section class="mt-10">
		<h2 class={sectionLabel()}>Dates are not interchangeable</h2>
		<dl class="mt-3 grid gap-3 sm:grid-cols-2">
			{#each dateFields as field}
				<div class={card({ padding: 'sm' })}>
					<dt class="font-mono text-xs font-semibold text-foreground">{field[0]}</dt>
					<dd class={caption({ class: 'mt-1' })}>{field[1]}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="mt-10 grid gap-4 lg:grid-cols-2">
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Primary source chain</h2>
			<ul class="mt-3 space-y-3 text-sm text-muted-foreground">
				<li>
					<a
						href="https://www.oecd.org/en/publications/the-oecd-ai-exposure-measure_f3da0f0a-en.html"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline">OECD AI Capability Gap Index</a
					>: public 2026 O*NET workbook used only for the separate conservative capability-profile
					layer.
				</li>
				<li>
					<a
						href="https://www.singstat.gov.sg/standards/standards-and-classifications/ssoc"
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
				<li>
					<a
						href="https://esco.ec.europa.eu/en/use-esco/other-crosswalks"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline">European Commission ESCO Secretariat</a
					>: official ESCO–O*NET crosswalk used only for the external-evidence candidate audit.
				</li>
				<li>
					<a
						href="https://www.mom.gov.sg/newsroom/parliament-questions-and-replies/2026/0805-written-answer-to-pq-on-trends-in-job-vacancies"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline">Singapore Ministry of Manpower</a
					>: 5 August 2026 update on national vacancies and reported responses among AI-adopting
					firms.
				</li>
			</ul>
		</div>
		<div class={card({ padding: 'lg' })}>
			<h2 class="font-semibold text-foreground">Record-level evidence boundary</h2>
			<ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
				<li>Source titles, official candidates and crosswalk quality</li>
				<li>Explicit nulls where occupation-level evidence is unavailable</li>
				<li>Record-specific mapping support, limitations and evidence cutoff</li>
					<li>Release-level source URLs, vintages and publication-gate audits</li>
			</ul>
		</div>
	</section>

	<section id="licensing" class="mt-10">
		<h2 class={sectionLabel()}>Licensing and attribution</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			Project code and original editorial material use the licence stated in the repository.
			Official and third-party source data retain their own terms, attribution requirements and
			copyright. The mapped ILO task artifact identifies its source, CC BY 4.0 licence and AI Work
			Index adaptations inside the download. Other downloads do not relicense their source inputs;
			review the linked source terms before redistributing source-derived fields.
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
			<a class="text-primary underline" href="/data/archive/v8/public-field-source-map.json"
				>Archived V8 field source map · not a V9 artifact</a
			>
			<a class="text-primary underline" href="/data/sg-ai-occupations-v7.json"
				>Archived V7 JSON · superseded SSOC 2020 method</a
			>
		</div>
	</section>
</main>
