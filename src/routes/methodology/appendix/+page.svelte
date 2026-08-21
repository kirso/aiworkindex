<script lang="ts">
	import { pageLayout, sectionLabel, title as titleStyle, card, mono } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { siteStatus } from '$lib/data/site-status';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const v9Counts = siteStatus.structural_release.counts;

	const evidenceFields = [
		['construct', 'The concept being reported.'],
		['evidence_kind', 'Observed, derived, modelled or context.'],
		[
			'value',
			'A typed value when the evidence block exists. If no defensible value exists, the whole block is null.'
		],
		['geography', 'The population or market represented by the source.'],
		['reference_period', 'When the underlying observation applies.'],
		['source', 'Publisher, title, URL and publication date.'],
		['mapping', 'Method and quality when the evidence is crosswalked.'],
		['limitations', 'Specific reasons the value may be misread.']
	] as const;
	const coverageMetrics = [
		{ value: v9Counts.occupations, label: 'numeric SSOC 2024 occupations' },
		{ value: v9Counts.scored, label: 'in the pressure ranking' },
		{ value: v9Counts.insufficient_evidence, label: 'outside the ranking' },
		{ value: v9Counts.direct_wages, label: 'with direct wage evidence' }
	] as const;
	const mappingStates = [
		['one_to_one', 'One official ISCO candidate', 'Direct mapped evidence'],
		['one_to_many', 'Several official candidates', 'Median point with full range'],
		[
			'partial',
			'Official correspondence marks at least one link as partial',
			'Publish the partial-link flag; list any unscored candidates separately'
		],
		['unmatched', 'No usable official candidate', 'Insufficient evidence; no fallback']
	] as const;
</script>

<Seo
	title="V9 Technical Appendix: AI Work Pressure Rank"
	description="Formula, mappings, uncertainty, null rules, synthetic-role estimates and validation requirements for the Singapore AI Work Index V9 release."
	path="/methodology/appendix"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Methodology', href: '/methodology' },
			{ label: 'Technical appendix' }
		]}
	/>

	<div class="max-w-3xl">
		<p class={sectionLabel()}>V9 · schema 9.0</p>
		<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>AI Work Pressure technical appendix</h1>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			This page specifies the current calculation and data contract. AI Work Pressure is a relative
			GenAI task-exposure rank. It is not a probability, employment forecast, automated-task share,
			or estimate of jobs or wages lost.
		</p>
	</div>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Reference population</h2>
		<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each coverageMetrics as metric}
				<div class={card({ padding: 'sm', variant: 'metric' })}>
					<p class="text-2xl font-semibold tabular-nums">{metric.value.toLocaleString()}</p>
					<p class="text-xs text-muted-foreground">{metric.label}</p>
				</div>
			{/each}
		</div>
		<p class="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
			The source registry contains 1,006 detailed SSOC entries: 1,001 numeric occupations and five
			residual entries. Residual entries are retained for taxonomy integrity but are not scored or
			published as occupation pages.
		</p>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Headline algorithm</h2>
		<div class={cn(card({ padding: 'lg', variant: 'inset' }), 'mt-3 space-y-5')}>
			<div>
				<h3 class="font-semibold text-foreground">1. Select official matches</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					For each SSOC 2024 code, read every ISCO-08 candidate in the official Singapore
					correspondence. Remove no candidate because its score appears inconvenient.
				</p>
			</div>
			<div>
				<h3 class="font-semibold text-foreground">2. Join ILO evidence</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					For each candidate, retain <code>mean_score_2025</code>, <code>SD_2025</code> and
					<code>potential25</code>. Record official candidates without an ILO value as unscored.
				</p>
			</div>
			<div>
				<h3 class="font-semibold text-foreground">3. Aggregate without invented weights</h3>
				<p class={cn(mono({ size: 'sm' }), 'mt-2')}>
					point estimate = median(mean_score_2025 of scored official matches)
				</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Also retain the minimum, maximum, every scored match, every unscored match,
					task-dispersion range and official category set.
				</p>
			</div>
			<div>
				<h3 class="font-semibold text-foreground">4. Rank with ties</h3>
				<p class={cn(mono({ size: 'sm' }), 'mt-2')}>
					percentile = 100 × (midrank position − 1) / (N − 1)
				</p>
				<p class="mt-1 text-sm text-muted-foreground">
					N = {v9Counts.scored}. Equal point estimates share the average of their occupied rank
					positions. Percentiles are rounded to one decimal only after ranking.
				</p>
			</div>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Mapping states</h2>
		<div class={cn(card({ padding: 'none' }), 'mt-3 overflow-hidden')}>
			<div class="hidden sm:block">
				<table class="w-full table-fixed text-left text-sm">
					<thead class="border-b bg-muted/40">
						<tr
							><th class="p-3">State</th><th class="p-3">Meaning</th><th class="p-3"
								>Published treatment</th
							></tr
						>
					</thead>
					<tbody class="divide-y divide-border text-muted-foreground">
						{#each mappingStates as state}
							<tr>
								<td class="break-words p-3 font-mono text-xs text-foreground">{state[0]}</td>
								<td class="break-words p-3">{state[1]}</td>
								<td class="break-words p-3">{state[2]}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<dl class="divide-y divide-border sm:hidden">
				{#each mappingStates as state}
					<div class="space-y-1 p-4">
						<dt class="font-mono text-xs font-semibold text-foreground">{state[0]}</dt>
						<dd class="text-sm text-muted-foreground">{state[1]}</dd>
						<dd class="text-sm text-foreground">{state[2]}</dd>
					</div>
				{/each}
			</dl>
		</div>
		<p class="mt-3 max-w-3xl text-sm text-muted-foreground">
			V9 never assigns a unit-group, minor-group or major-group exposure average to an unscored
			occupation. It also never treats absence from a named demand list as evidence of weak demand.
		</p>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>ILO category and dispersion fields</h2>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground"><code>potential25</code></h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Preserves the official category for every scored ISCO match. With several categories, V9
					publishes the complete set plus least- and most-exposed endpoints. It does not manufacture
					a new SSOC category from the percentile.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground"><code>task_score_sd_2025</code></h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Describes the unweighted variation across the listed ILO task scores inside an ISCO
					occupation. V9 publishes its median and range across official matches. It is not a
					confidence interval, a measure of variation across workers, or a time-weighted task
					concentration measure.
				</p>
			</div>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Mapped ILO task-evidence artifact</h2>
		<div class={cn(card({ padding: 'lg', variant: 'inset' }), 'mt-3 space-y-3')}>
			<p class="text-sm text-muted-foreground">
				<code>ilo-isco-task-evidence-v9.json</code> retains all 3,265 source task rows across 427
				four-digit ISCO-08 groups. Each row keeps the ILO task ID, exact task text,
				<code>score_2025</code> and source-status field.
			</p>
			<p class="text-sm text-muted-foreground">
				Occupation pages join this artifact only through the official SSOC 2024 to ISCO-08 candidate
				codes already published in the headline record. They show up to three highest and three
				lowest task scores per mapped group. The selection is an interface summary, not a new score.
			</p>
			<p class={mono({ size: 'sm' })}>
				headline effect = none · published grain = ISCO-08 four-digit group
			</p>
			<p class="text-sm text-muted-foreground">
				Task rows may explain why an ISCO mean is high or low. They must not be described as exact
				five-digit SSOC duties, worker-level observations, adoption, time shares or job-loss
				probabilities.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Date fields</h2>
		<dl class="mt-3 grid gap-3 sm:grid-cols-2">
			{#each [['published_at', 'When the source was released to the public.'], ['observation_period', 'When the source data or measurement applies.'], ['reviewed_at', 'When AI Work Index last checked the source for V9.'], ['generated_at', 'When the deterministic V9 artifact was produced; not when the underlying event happened.']] as dateField}
				<div class={card({ padding: 'sm' })}>
					<dt class="font-mono text-xs font-semibold text-foreground">{dateField[0]}</dt>
					<dd class="mt-1 text-sm text-muted-foreground">{dateField[1]}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Independent evidence block</h2>
		<p class="mt-3 max-w-3xl text-sm text-muted-foreground">
			Observed use, complementarity, wages, demand and labour context share a provenance envelope.
			No value inside this envelope is read by the headline-rank function.
		</p>
		<p class="mt-2 max-w-3xl text-sm text-muted-foreground">
			In V9, AIOE, Eloundou, observed-use and potential-complementarity blocks are null for all
			1,001 occupations. A checksum-pinned official ESCO–O*NET bridge now provides candidate matches
			for 362 of 432 relevant ISCO groups. Those candidates are not published values: source-code
			editions, many-to-many transfer rules and mapping sensitivity still require validation; the
			complementarity proxy also lacks a source-level construct replication. The release audit
			records 0% published coverage and no headline effect.
		</p>
		<div class={cn(card({ padding: 'none' }), 'mt-3 overflow-hidden')}>
			<div class="hidden sm:block">
				<table class="w-full table-fixed text-left text-sm">
					<thead class="border-b bg-muted/40"
						><tr><th class="p-3">Field</th><th class="p-3">Contract</th></tr></thead
					>
					<tbody class="divide-y divide-border">
						{#each evidenceFields as field}
							<tr
								><td class="break-words p-3 font-mono text-xs text-foreground">{field[0]}</td><td
									class="break-words p-3 text-muted-foreground">{field[1]}</td
								></tr
							>
						{/each}
					</tbody>
				</table>
			</div>
			<dl class="divide-y divide-border sm:hidden">
				{#each evidenceFields as field}
					<div class="p-4">
						<dt class="font-mono text-xs font-semibold">{field[0]}</dt>
						<dd class="mt-1 text-sm text-muted-foreground">{field[1]}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>OECD capability-profile contract</h2>
		<div class={cn(card({ padding: 'lg', variant: 'inset' }), 'mt-3 space-y-3')}>
			<p class={mono({ size: 'sm' })}>
				candidate = official SSOC→ISCO candidate + exact ESCO→O*NET relation + identical O*NET code
			</p>
			<p class={mono({ size: 'sm' })}>
				published profile = candidate + conservative official-title identity
			</p>
			<p class="text-sm text-muted-foreground">
				The official SSOC title retains parenthetical qualifiers and is split only into explicit
				slash variants. Singularised tokens must appear as a contiguous phrase in the O*NET title
				and at least one token must be occupation-specific. A one-word SSOC title must equal the
				whole singularised O*NET title. Search synonyms and examples are not used.
			</p>
			<p class="text-sm text-muted-foreground">
				Of 1,001 occupations, 698 have at least one raw exact candidate and 68 pass detailed-title
				identity. All 1,001 retain a status. The output keeps all nine OECD domain values, source
				scales, O*NET codes, titles and the O*NET 2019-to-30.3 transfer limitation.
			</p>
			<p class={mono({ size: 'sm' })}>
				headline effect = none · close matches published = 0 · broader fallback = none
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Null and source-grain rules</h2>
		<ul
			class="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground"
		>
			<li><code>null</code> means not available or not defensibly mapped; it never means zero.</li>
			<li>Direct occupation wages remain null when MOM publishes no detailed SSOC 2024 row.</li>
			<li>
				Named official demand evidence attaches only after a reviewed occupation match. Prefix
				matches are not used.
			</li>
			<li>National, sector and firm-size adoption statistics remain context at that grain.</li>
			<li>US or platform evidence must disclose its geography, population and mapping method.</li>
			<li>Stale job-posting samples cannot be labelled current or determine a public ranking.</li>
		</ul>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Economic-observatory contract</h2>
		<div class={cn(card({ padding: 'lg', variant: 'inset' }), 'mt-3 space-y-3')}>
			<p class="text-sm text-muted-foreground">
				<code>v9-economic-observatory.json</code> joins only evidence that can retain its published geography,
				population, period and grain. Detailed occupation records carry availability flags; broad observations
				remain in separate major-group profiles.
			</p>
			<p class={mono({ size: 'sm' })}>
				labour outcome = displacement + productivity and scale + new tasks + composition +
				adjustment
			</p>
			<p class="text-sm text-muted-foreground">
				The identity is a causal checklist, not an additive numeric model. V9 assigns no
				coefficients and publishes no contraction, expansion, complementarity, slow-diffusion or
				polarisation scenario. A scenario requires compatible adoption, market-response and
				labour-outcome evidence.
			</p>
			<p class={mono({ size: 'sm' })}>
				headline effect = none · detailed occupations = 1,001 · classified outcomes = 0
			</p>
		</div>
		<ul class="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm text-muted-foreground">
			<li>Annual employment and workforce composition are broad occupation-group observations.</li>
			<li>Industry footprints are broad occupation group by industry.</li>
			<li>
				Quarterly vacancy, hiring and retrenchment evidence uses MOM's published broad clusters.
			</li>
			<li>Major group 6 remains unavailable where the retained source has no separate row.</li>
			<li>
				Every derived change is descriptive; none is attributed to AI without a causal design.
			</li>
		</ul>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Modern-role query resolution and calculation</h2>
		<div class={cn(card({ padding: 'lg', variant: 'inset' }), 'mt-3 space-y-3')}>
			<p class="text-sm text-muted-foreground">
				Normalized exact titles resolve first. An explicit reviewed title, synonym or definition
				match may then resolve a query to one official SSOC 2024 occupation. The build does not
				globally auto-resolve synonyms. Labels that genuinely span occupations may use a reviewed
				composite; cross-sector or unstable labels are withheld.
			</p>
			<p class={mono({ size: 'sm' })}>
				role exposure = Σ(component weight × component point estimate)
			</p>
			<p class="text-sm text-muted-foreground">
				Composite components are unique, scored official occupations; editorial weights sum to one.
				The result is labelled non-official wherever it appears.
			</p>
			<p class="text-sm text-muted-foreground">
				Mapping sensitivity uses weighted component minima and maxima. Weight sensitivity compares
				the editorial result with equal weights and leave-one-component-out variants. These ranges
				describe model dependence, not sampling error.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Release invariants</h2>
		<ul class="mt-3 grid gap-2 md:grid-cols-2">
			{#each ['1,001 numeric SSOC occupations; five residual records excluded from scoring', '987 scored and 14 explicitly insufficient-evidence occupations', '523 direct MOM 2025 detailed wage matches', '3,265 mapped task rows retain their four-digit ISCO grain and have no headline effect', 'Every scored occupation traces to an official SSOC–ISCO candidate', 'All ties use midranks and all ranks use the scored V9 population', 'Changing a sidecar cannot change any headline pressure rank', 'Missing evidence never renders as zero or a negative market signal', 'Every published record carries source, limitation and 19 August 2026 cutoff metadata'] as invariant}
				<li class={card({ padding: 'sm' })}>
					<span class="text-sm text-muted-foreground">{invariant}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section class="my-10">
		<h2 class={sectionLabel()}>Reproduction commands</h2>
		<div class={cn(card({ padding: 'md', variant: 'inset' }), 'mt-3 overflow-x-auto')}>
			<pre class="min-w-max text-xs leading-6 text-foreground"><code
					>bun run download:ssoc-2024
	bun run download:mom-wages-2025
	bun run build:taxonomy
	bun run build:economics:v9
	bun run build:capabilities:v9
	bun run release:generate
	bun run verify
	bun run build</code
				></pre>
		</div>
		<p class="mt-3 text-sm text-muted-foreground">
			Inspect the <a href="/data" class="text-primary underline">data dictionary and downloads</a>
			or return to the
			<a href="/methodology" class="text-primary underline">plain-language method</a>.
		</p>
	</section>
</main>
