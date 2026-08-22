<script lang="ts">
	import { onMount } from 'svelte';
	import SaveJobButton from '$lib/components/product/SaveJobButton.svelte';
	import CapabilityProfile from '$lib/components/product/CapabilityProfile.svelte';
	import EconomicOutcomeEvidence from '$lib/components/product/EconomicOutcomeEvidence.svelte';
	import MappedTaskEvidence from '$lib/components/product/MappedTaskEvidence.svelte';
	import PressureEvidenceChain from '$lib/components/product/PressureEvidenceChain.svelte';
	import ResearchSignalComparison from '$lib/components/product/ResearchSignalComparison.svelte';
	import SharePageButton from '$lib/components/product/SharePageButton.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import OccupationHero from '$lib/components/ui/OccupationHero.svelte';
	import OfficialSkillsPanel from '$lib/components/product/OfficialSkillsPanel.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import { card, pageLayout, sectionLabel } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import {
		formatIloCodebookCategory,
		formatPressureNumber,
		spokenOccupationTitle
	} from '$lib/data/v9-display';

	let { data } = $props();
	let view = $derived(data.view);
	let modernQueries = $derived(data.modernQueries);
	let familiarQuerySlug = $state<string | null>(null);
	let familiarQuery = $derived(
		modernQueries.find(query => query.slug === familiarQuerySlug) ?? null
	);
	let occupation = $derived(view.occupation);
	let spokenTitle = $derived(
		familiarQuery?.title ??
			spokenOccupationTitle(
				view.title,
				modernQueries.map(query => query.title)
			)
	);
	let exposure = $derived(occupation.genai_task_exposure);
	let wage = $derived(occupation.singapore_market.wages);

	onMount(() => {
		familiarQuerySlug = new URLSearchParams(window.location.search).get('as');
	});

	function formatPercentile(value: number | null): string {
		if (value == null) return 'Unranked';
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
		return value == null ? 'No direct row' : `SGD ${value.toLocaleString()}`;
	}

	let demandSummary = $derived(
		view.demandSignals.length > 0
			? `${view.demandSignals.length} named ${view.demandSignals.length === 1 ? 'list' : 'lists'}`
			: 'Not named in the selected lists'
	);

	const faqItems = $derived([
		{
			question: `How much AI task pressure does ${view.title} face?`,
			answer:
				view.pressureRank == null
					? `The official SSOC-to-ISCO mapping yielded insufficient usable ILO evidence for ${view.title}, so V9 leaves it unranked.`
					: `${view.title} is at ${formatPercentile(view.pressureRank)} among 987 scored SSOC 2024 occupations. Its mapped ILO category is ${view.officialCategory}. The rank compares mapped task overlap.`
		},
		{
			question: `What is the salary for ${view.title} in Singapore?`,
			answer:
				view.wageMedian == null
					? `The selected MOM June 2025 detailed wage table has no direct row for SSOC ${view.code}, so V9 reports no value.`
					: `MOM's June 2025 table reports a gross monthly median of SGD ${view.wageMedian.toLocaleString()} for this occupation. It covers full-time resident employees in establishments with at least 25 employees.`
		},
		{
			question: `Is ${view.title} in demand in Singapore?`,
			answer:
				view.demandSignals.length > 0
					? `${view.title} is matched to ${view.demandSignals.length} named entry or entries in the selected MOM demand sources. Vacancy totals come from a different national source.`
					: `The selected MOM demand and shortage lists contain no match for ${view.title}. Their coverage is limited to the occupations and categories each source names.`
		}
	]);

	let seoDescription = $derived(
		`${spokenTitle} (SSOC ${view.code}): ${formatPercentile(view.pressureRank)} AI work pressure, ${view.wageMedian == null ? 'no direct pay row in the selected detailed MOM table' : `SGD ${view.wageMedian.toLocaleString()} gross monthly median`}, and ${view.demandSignals.length} named demand ${view.demandSignals.length === 1 ? 'source' : 'sources'}.`
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
				`Official SSOC 2024 occupation ${view.code} with V9 AI task-pressure evidence.`,
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
								value: 'Insufficient evidence; unranked'
							}
						]),
				{
					'@type': 'PropertyValue',
					name: 'Evidence reviewed through',
					value: occupation.evidence.data_as_of
				}
			].filter(property => property.value !== null)
		})
	);
</script>

<Seo
	title={`${spokenTitle}: AI work pressure in Singapore`}
	description={seoDescription}
	path={`/occupation/${view.code}`}
	jsonLd={[occupationJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Browse occupations', href: '/explore' },
			{ label: spokenTitle }
		]}
	/>

	<OccupationHero
		{spokenTitle}
		officialTitle={spokenTitle === view.title ? undefined : view.title}
		code={view.code}
		scoreValue={formatPressureNumber(view.pressureRank)}
		ranked={view.pressureRank != null}
		pressureLabel={view.pressureRank == null
			? 'Not ranked — not enough mapped task evidence yet.'
			: view.pressureLabel}
		pressureTone={view.pressureTone}
		statusLabel={exposure ? 'Pressure ranked' : 'Not ranked'}
		meaning={view.pressureRank == null
			? 'This official occupation is shown, but V9 does not assign a pressure percentile.'
			: `Relative AI work pressure among ${view.pressurePopulation?.toLocaleString() ?? 987} scored Singapore occupations.`}
		caveat="This is mapped AI task overlap, not a job-loss probability."
		payValue={formatWage(view.wageMedian)}
		payDetail={wage
			? 'Gross monthly median · June 2025 · establishments with at least 25 employees.'
			: 'No direct pay row in this table.'}
		demandValue={demandSummary}
		demandDetail={view.demandSignals.length > 0
			? 'A reviewed match in a selected MOM demand or shortage list.'
			: 'No match in selected lists. Coverage is limited to the occupations each source names.'}
		definition={occupation.taxonomy.detailed_definition}
		alsoFoundAs={modernQueries.length > 0
			? modernQueries.map(query => query.title).join(' · ')
			: undefined}
	>
		{#snippet actions()}
			<Button variant="outline" href="/compare?entities=occupation:{view.code}" class="min-h-11"
				>Compare these jobs</Button
			>
			<SaveJobButton kind="occupation" id={view.code} size="default" class="min-h-11" />
			<SharePageButton title={`${spokenTitle} | ${SITE.name}`} size="default" />
		{/snippet}
	</OccupationHero>

	<PressureEvidenceChain
		ssocCode={view.code}
		iscoCodes={occupation.evidence.official_isco08_codes}
		mappedScore={view.rawExposure}
		percentile={view.pressureRank}
		population={view.pressurePopulation ?? 987}
		mappingLabel={mappingLabel(occupation.evidence.mapping_quality)}
	/>

	<MappedTaskEvidence
		groups={data.mappedTaskExamples}
		sourceUrl={data.taskEvidenceSource.url}
		licenseUrl={data.taskEvidenceSource.licenseUrl}
		occupationCode={view.code}
	/>

	<CapabilityProfile profile={data.capabilityProfile} status={data.capabilityStatus} />

	<ResearchSignalComparison
		profile={data.researchSignalProfile}
		sources={data.researchSignalSources}
	/>

	<OfficialSkillsPanel profile={data.skillsPilotProfile} />

	<section class="mt-10" aria-labelledby="actions-heading">
		<p class={sectionLabel()}>Turn evidence into a work plan</p>
		<h2 id="actions-heading" class="mt-1 text-2xl font-bold text-foreground">
			What you can do next
		</h2>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			Use the result to inspect your own tasks, test approved tools and agree how work will be
			checked. These practical prompts do not change the occupation rank.
		</p>
		<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground">List your recurring tasks</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Separate drafting, searching and summarising from decisions, relationships, physical work
					and sign-off.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground">Test one low-consequence task</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Compare time, errors and review effort before expanding a tool to more important work.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground">Keep accountability visible</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Write down who checks facts, handles exceptions and owns the result when mistakes carry a
					cost.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground">Check the hiring evidence</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Use the named official signal alongside live vacancy listings and evidence from your
					industry.
				</p>
			</div>
		</div>
		<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a
				href="/will-ai-take-my-job?job=occupation:{view.code}"
				class="font-medium text-primary underline">Explore your task mix</a
			>
			<a href="/reports/job-market-evidence" class="font-medium text-primary underline"
				>See Singapore job-market evidence</a
			>
			<a href="/compare?entities=occupation:{view.code}" class="font-medium text-primary underline"
				>Compare another occupation</a
			>
		</div>
	</section>

	{#if data.economicContext}
		<EconomicOutcomeEvidence context={data.economicContext} />
	{/if}

	<section class="mt-10 grid min-w-0 gap-6 lg:grid-cols-2">
		<div class="min-w-0">
			<h2 class={sectionLabel()}>Pay in Singapore</h2>
			<div class="mt-3 {card({ padding: 'md' })}">
				{#if wage}
					<div class="grid gap-3 sm:grid-cols-3">
						{#each [['25th percentile', wage.value.gross_monthly_sgd.p25], ['Median', wage.value.gross_monthly_sgd.median], ['75th percentile', wage.value.gross_monthly_sgd.p75]] as row}
							<div class="min-w-0">
								<p class="text-xs text-muted-foreground">{row[0]}</p>
								<p class="mt-1 break-words font-mono text-sm font-semibold tabular-nums">
									SGD {Number(row[1]).toLocaleString()}
								</p>
							</div>
						{/each}
					</div>
					<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
						Gross monthly wages · {wage.geography} · observed {wage.reference_period}.
						<a
							href={wage.source.url}
							class="text-primary underline"
							target="_blank"
							rel="noreferrer">{wage.source.title}</a
						>.
					</p>
				{:else}
					<p class="text-sm leading-relaxed text-muted-foreground">
						The selected MOM table has no exact SSOC 2024 row, so pay is shown as unknown.
					</p>
				{/if}
			</div>
		</div>

		<div class="min-w-0">
			<h2 class={sectionLabel()}>Named demand evidence</h2>
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
									Published {signal.published_at} · source label “{signal.source_occupation}”
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
						The selected MOM demand and shortage lists contain no match for this occupation. Each
						source covers only the categories and occupations it names.
					</p>
				{/if}
			</div>
		</div>
	</section>

	<section class="mt-10 min-w-0">
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

	<details class="mt-10 border border-border bg-card">
		<summary class="cursor-pointer px-5 py-4 text-sm font-semibold text-foreground">
			How this was calculated
		</summary>
		<div class="border-t border-border p-5">
			<p class="max-w-4xl text-sm leading-relaxed text-muted-foreground">
				V9 maps this SSOC 2024 occupation to the ILO's 2025 ISCO-08 evidence through the official
				Singapore correspondence. Several matches use the median as the point estimate and keep the
				full range visible.
			</p>
			<div class="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div class={card({ padding: 'md', variant: 'metric' })}>
					<p class="text-xs text-muted-foreground">ILO codebook category</p>
					<p class="mt-2 break-words text-sm font-semibold text-foreground">
						{formatIloCodebookCategory(exposure)}
					</p>
				</div>
				<div class={card({ padding: 'md', variant: 'metric' })}>
					<p class="text-xs text-muted-foreground">Mapped ILO mean · display scale</p>
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
					<p class="text-xs text-muted-foreground">Variation across listed ILO tasks</p>
					<p class="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
						{formatScore(view.taskDispersion)}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">Task-score variation only</p>
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

			<div class="mt-6 grid gap-5 lg:grid-cols-2">
				<div>
					<h3 class="text-sm font-semibold text-foreground">Limits for this record</h3>
					<ul class="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
						{#each occupation.evidence.limitations as limitation (limitation)}
							<li>{limitation}</li>
						{/each}
					</ul>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-foreground">Source boundary</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						The rank is derived from the ILO 2025 task-exposure measure. Pay and demand come from
						separate Singapore sources and never change it. Evidence was reviewed through
						{occupation.evidence.data_as_of}.
					</p>
				</div>
			</div>
		</div>
	</details>

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
