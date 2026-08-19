<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import { badge, card, pageLayout, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';

	let { data } = $props();
	let view = $derived(data.view);
	let modernQueries = $derived(data.modernQueries);
	let occupation = $derived(view.occupation);
	let exposure = $derived(occupation.genai_task_exposure);
	let wage = $derived(occupation.singapore_market.wages);
	let comparisonEvidence = $derived([
		{ label: 'AIOE ability exposure', evidence: occupation.comparison_evidence.aioe },
		{ label: 'Eloundou GPT exposure', evidence: occupation.comparison_evidence.eloundou },
		{ label: 'Observed Claude use', evidence: occupation.comparison_evidence.observed_ai_use },
		{
			label: 'Potential human–AI complementarity',
			evidence: occupation.comparison_evidence.potential_complementarity
		}
	]);

	function formatPercentile(value: number | null): string {
		if (value == null) return 'Not ranked';
		return `Percentile ${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
	}

	function mappingLabel(value: typeof occupation.evidence.mapping_quality): string {
		if (value === 'one_to_one') return 'One-to-one official mapping';
		if (value === 'one_to_many') return 'One-to-many official mapping';
		if (value === 'partial') return 'Partial official mapping';
		return 'No usable official mapping';
	}

	function formatScore(value: number | null): string {
		return value == null ? 'Unknown' : `${(value * 100).toFixed(1)}/100`;
	}

	function formatWage(value: number | null): string {
		return value == null ? 'Unknown' : `SGD ${value.toLocaleString()}`;
	}

	const faqItems = $derived([
		{
			question: `How much AI work pressure does ${view.title} face?`,
			answer:
				view.pressureRank == null
					? `V9 does not rank ${view.title} because the official SSOC-to-ISCO mapping does not provide enough usable ILO evidence. This is unknown, not zero pressure.`
					: `${view.title} has an AI Work Pressure Rank at ${formatPercentile(view.pressureRank)} among 987 scored SSOC 2024 occupations. Its official ILO category is ${view.officialCategory}. The rank measures task overlap, not a probability of job loss.`
		},
		{
			question: `What is the salary for ${view.title} in Singapore?`,
			answer:
				view.wageMedian == null
					? `MOM's June 2025 detailed wage table does not publish a direct row for SSOC ${view.code}. The index leaves the wage unknown.`
					: `MOM's June 2025 table reports a gross monthly median of SGD ${view.wageMedian.toLocaleString()} for this occupation. Coverage is limited to full-time resident employees in establishments with at least 25 employees.`
		}
	]);

	let seoDescription = $derived(
		modernQueries.length
			? `${modernQueries[0]?.title} resolves to ${view.title} (SSOC ${view.code}): ${formatPercentile(view.pressureRank)} AI work pressure, ${view.officialCategory}.`
			: `${view.title} (SSOC ${view.code}): ${formatPercentile(view.pressureRank)} AI work pressure, ${view.officialCategory}, ${view.wageMedian == null ? 'wage unknown' : `SGD ${view.wageMedian.toLocaleString()} gross monthly median`}.`
	);

	let occupationJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Occupation',
			name: view.title,
			alternateName: modernQueries
				.filter(query => query.resolutionBasis !== 'reviewed_definition_equivalent')
				.map(query => query.title),
			description:
				occupation.taxonomy.detailed_definition ??
				`Official SSOC 2024 occupation ${view.code} with V9 AI work-pressure evidence.`,
			url: `${SITE.url}/occupation/${view.code}`,
			mainEntityOfPage: `${SITE.url}/occupation/${view.code}`,
			identifier: {
				'@type': 'PropertyValue',
				propertyID: 'SSOC 2024',
				value: view.code
			},
			occupationLocation: { '@type': 'Country', name: 'Singapore' },
			additionalProperty: [
				{
					'@type': 'PropertyValue',
					name: 'AI Work Pressure Rank',
					value: view.pressureRank,
					unitText: 'midrank percentile among scored SSOC 2024 occupations'
				},
				...(exposure
					? [
							{
								'@type': 'PropertyValue',
								name:
									exposure.potential25.categories.length === 1
										? 'ILO 2025 exposure category'
										: 'ILO 2025 mapped exposure category range',
								value: view.officialCategory
							}
						]
					: [
							{
								'@type': 'PropertyValue',
								name: 'V9 score status',
								value: 'Insufficient evidence; not ranked'
							}
						]),
				{
					'@type': 'PropertyValue',
					name: 'Evidence cutoff',
					value: occupation.evidence.data_as_of
				}
			].filter(property => property.value !== null)
		})
	);
</script>

<Seo
	title={`${view.title} (SSOC ${view.code}): AI Work Pressure`}
	description={seoDescription}
	path={`/occupation/${view.code}`}
	jsonLd={[occupationJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Browse occupations', href: '/explore' },
			{ label: view.title }
		]}
	/>

	<header class="max-w-5xl">
		<div class="flex min-w-0 flex-wrap gap-2">
			<span class={badge({ variant: 'outline' })}>SSOC 2024 · {view.code}</span>
			<span class={badge({ variant: exposure ? 'info' : 'warning' })}>
				{exposure ? 'Pressure ranked' : 'Insufficient evidence'}
			</span>
		</div>
		<h1 class="mt-4 break-words {titleStyle({ size: 'page' })}">{view.title}</h1>
		{#if occupation.taxonomy.detailed_definition}
			<p class="mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground">
				{occupation.taxonomy.detailed_definition}
			</p>
		{/if}
		{#if modernQueries.length > 0}
			<p class="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
				<strong class="text-foreground">Modern job-title queries resolved here:</strong>
				{modernQueries.map(query => query.title).join(' · ')}. These labels resolve to the official
				occupation; they do not create a second estimate.
			</p>
		{/if}
	</header>

	<section class="mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.65fr)]">
		<div class={card({ padding: 'lg', variant: 'elevated' })}>
			<p class={sectionLabel()}>AI work pressure</p>
			<p
				class="mt-3 break-words font-mono text-4xl font-black tabular-nums text-foreground sm:text-5xl"
			>
				{formatPercentile(view.pressureRank)}
			</p>
			<p class="mt-3 text-base font-semibold text-foreground">{view.officialCategory}</p>
			<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
				{#if view.pressureRank == null}
					The official mapping does not yield enough scored ILO evidence. V9 leaves the rank
					unknown; it does not assign zero pressure.
				{:else}
					This occupation sits at midrank percentile {view.pressureRank.toFixed(
						view.pressureRank % 1 === 0 ? 0 : 1
					)} among scored Singapore occupations. It is a relative task-exposure rank, not a
					{view.pressureRank}% chance of job loss.
				{/if}
			</p>
		</div>

		<div class={card({ padding: 'lg', variant: 'metric' })}>
			<p class={sectionLabel()}>Direct wage evidence</p>
			<p class="mt-3 break-words font-mono text-2xl font-bold tabular-nums text-foreground">
				{formatWage(view.wageMedian)}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				{wage ? 'Gross monthly median · June 2025 MOM row' : 'No direct June 2025 MOM row'}
			</p>
			<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
				{wage
					? wage.limitations[0]
					: 'An unpublished detailed wage is unknown. It is not zero and is not inferred from a broad occupation group.'}
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>How the pressure evidence maps</h2>
		<div class="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-xs text-muted-foreground">Official ILO category</p>
				<p class="mt-2 break-words text-sm font-semibold text-foreground">
					{view.officialCategory}
				</p>
			</div>
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-xs text-muted-foreground">Mapped ILO mean score (0–100 display scale)</p>
				<p class="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
					{formatScore(view.rawExposure)}
				</p>
				{#if view.rawExposureRange && view.rawExposureRange.min !== view.rawExposureRange.max}
					<p class="mt-1 text-xs text-muted-foreground">
						Range {(view.rawExposureRange.min * 100).toFixed(1)}–{(
							view.rawExposureRange.max * 100
						).toFixed(1)}/100
					</p>
				{/if}
			</div>
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-xs text-muted-foreground">ILO task-score dispersion (0–100 display scale)</p>
				<p class="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
					{formatScore(view.taskDispersion)}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">Within mapped ISCO task scores</p>
			</div>
			<div class={card({ padding: 'md', variant: 'metric' })}>
				<p class="text-xs text-muted-foreground">Mapping support</p>
				<p class="mt-2 break-words text-sm font-semibold text-foreground">
					{mappingLabel(occupation.evidence.mapping_quality)}
				</p>
				<p class="mt-1 break-words text-xs text-muted-foreground">
					{occupation.evidence.official_isco08_codes.length > 0
						? `ISCO ${occupation.evidence.official_isco08_codes.join(', ')}`
						: 'No matched ISCO code'}
				</p>
			</div>
		</div>
		<p class="mt-3 max-w-4xl text-xs leading-relaxed text-muted-foreground">
			The rank is derived from ILO 2025 evidence through the official SSOC–ISCO crosswalk. When one
			SSOC occupation maps to several scored ISCO occupations, V9 reports the median and preserves
			the range instead of choosing one match silently.
		</p>
	</section>

	<section class="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
		<div class="min-w-0">
			<h2 class={sectionLabel()}>Direct Singapore wage row</h2>
			<div class="mt-3 {card({ padding: 'md' })}">
				{#if wage}
					<div class="grid grid-cols-3 gap-3">
						<div class="min-w-0">
							<p class="text-xs text-muted-foreground">25th percentile</p>
							<p class="mt-1 break-words font-mono text-sm font-semibold tabular-nums">
								SGD {wage.value.gross_monthly_sgd.p25.toLocaleString()}
							</p>
						</div>
						<div class="min-w-0">
							<p class="text-xs text-muted-foreground">Median</p>
							<p class="mt-1 break-words font-mono text-sm font-semibold tabular-nums">
								SGD {wage.value.gross_monthly_sgd.median.toLocaleString()}
							</p>
						</div>
						<div class="min-w-0">
							<p class="text-xs text-muted-foreground">75th percentile</p>
							<p class="mt-1 break-words font-mono text-sm font-semibold tabular-nums">
								SGD {wage.value.gross_monthly_sgd.p75.toLocaleString()}
							</p>
						</div>
					</div>
					<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
						Gross monthly wages · {wage.geography} · reference period {wage.reference_period}.
						<a
							href={wage.source.url}
							class="text-primary underline"
							target="_blank"
							rel="noreferrer">{wage.source.title}</a
						>.
					</p>
				{:else}
					<p class="text-sm leading-relaxed text-muted-foreground">
						No exact SSOC 2024 wage row is published in the selected MOM table. V9 does not
						substitute a broad-group wage or infer a value.
					</p>
				{/if}
			</div>
		</div>

		<div class="min-w-0">
			<h2 class={sectionLabel()}>Direct current-demand evidence</h2>
			<div class="mt-3 {card({ padding: 'md' })}">
				{#if view.demandSignals.length > 0}
					<div class="space-y-5">
						{#each view.demandSignals as signal (`${signal.source_key}-${signal.source_occupation}`)}
							<div class="border-b border-border pb-5 last:border-b-0 last:pb-0">
								<a
									href={signal.url}
									target="_blank"
									rel="noreferrer"
									class="break-words text-sm font-semibold text-primary underline"
								>
									{signal.label}
								</a>
								<p class="mt-1 text-xs text-muted-foreground">
									Source occupation: {signal.source_occupation}
								</p>
								<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
									{signal.rationale}
									{signal.interpretation}
								</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm leading-relaxed text-muted-foreground">
						This occupation was not named in the selected MOM demand or shortage lists. Those
						sources are not exhaustive occupation-level demand measures, so absence is not evidence
						of weak demand.
					</p>
				{/if}
			</div>
		</div>
	</section>

	{#if view.labourContext}
		<section class="mt-10">
			<h2 class={sectionLabel()}>Broad labour-market context</h2>
			<div class="mt-3 {card({ padding: 'md', variant: 'notice', accent: 'primary' })}">
				<p class="text-sm leading-relaxed text-foreground">{view.labourContext.summary}</p>
				<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
					{view.labourContext.source} · {view.labourContext.data_as_of}. This broad
					occupation-cluster context is not a detailed SSOC observation and does not change the
					pressure rank.
				</p>
			</div>
		</section>
	{/if}

	<section class="mt-10">
		<h2 class={sectionLabel()}>Independent external comparisons</h2>
		<p class="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
			These sources measure different ideas from the ILO headline. V9 reserves a separate, nullable
			evidence block for each one; none can change the pressure rank.
		</p>
		<div class="mt-3 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
			{#each comparisonEvidence as item (item.label)}
				<div class="min-w-0 bg-card p-4">
					<p class="break-words text-sm font-semibold text-foreground">{item.label}</p>
					{#if item.evidence}
						<p class="mt-2 text-xs font-semibold text-primary">Published evidence block</p>
						<a
							href={item.evidence.source.url}
							target="_blank"
							rel="noreferrer"
							class="mt-1 block break-words text-xs text-primary underline"
						>
							{item.evidence.source.title}
						</a>
					{:else}
						<p class="mt-2 text-xs font-semibold text-muted-foreground">Withheld in V9</p>
						<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
							No defensible SSOC 2024 occupation value is published.
						</p>
					{/if}
				</div>
			{/each}
		</div>
		<p class="mt-3 max-w-4xl text-xs leading-relaxed text-muted-foreground">
			All four blocks are null in the current release. The checked-in ISCO-08 to US SOC bridge lacks
			row-level source provenance; the complementarity proxy also lacks a frozen, reproducible
			source construct. V9 does not use title matching or broader-group fallbacks to fill those
			gaps.
		</p>
	</section>

	<section class="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
		<div class="min-w-0">
			<h2 class={sectionLabel()}>Evidence limits</h2>
			<ul
				class="mt-3 space-y-2 border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground"
			>
				{#each occupation.evidence.limitations as limitation (limitation)}
					<li class="flex min-w-0 gap-2">
						<span aria-hidden="true">•</span>
						<span class="min-w-0 break-words">{limitation}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="min-w-0">
			<h2 class={sectionLabel()}>Common job titles</h2>
			<div class="mt-3 border border-border bg-card p-5">
				{#if occupation.taxonomy.search_synonyms.length > 0}
					<div class="flex min-w-0 flex-wrap gap-2">
						{#each occupation.taxonomy.search_synonyms.slice(0, 16) as synonym (synonym)}
							<span
								class="max-w-full break-words border border-border px-2 py-1 text-xs text-muted-foreground"
							>
								{synonym}
							</span>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">No additional titles are published.</p>
				{/if}
			</div>
		</div>
	</section>

	{#if data.related.length > 0}
		<section class="mt-10 min-w-0">
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<div>
					<h2 class={sectionLabel()}>Related SSOC occupations</h2>
					<p class="mt-1 text-xs text-muted-foreground">
						Same unit or minor group, closest pressure ranks first
					</p>
				</div>
				{#if data.groupSlug}
					<a href="/group/{data.groupSlug}" class="text-xs font-medium text-primary underline">
						All {data.groupLabel}
					</a>
				{/if}
			</div>
			<OccupationResultList items={data.related} detail="wage" showRank={false} />
		</section>
	{/if}

	<FaqList items={faqItems} />

	<nav class="mt-10 flex min-w-0 flex-wrap gap-3 border-t border-border pt-5 text-sm">
		<a href="/explore" class="font-medium text-primary underline">Browse occupations</a>
		<a href="/rankings" class="font-medium text-primary underline">Evidence rankings</a>
		<a href="/methodology" class="font-medium text-primary underline">V9 methodology</a>
	</nav>
</main>
