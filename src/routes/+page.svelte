<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import NamedDemandPressurePlot from '$lib/components/v9-browser/NamedDemandPressurePlot.svelte';
	import OccupationExplorer from '$lib/components/v9-browser/OccupationExplorer.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import OccupationSearch from '$lib/components/v9-browser/OccupationSearch.svelte';
	import { badge, pageLayout, sectionLabel } from '$lib/design-system';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';

	let { data } = $props();
	let highestPressure = $derived(data.highestPressure);
	let namedDemand = $derived(data.namedDemand);

	const faqItems = [
		{
			question: 'What does AI task pressure mean?',
			answer:
				'AI task pressure compares how much an occupation’s mapped tasks overlap with current generative-AI capabilities. V9 maps ILO 2025 evidence to SSOC 2024 occupations and ranks scored occupations within Singapore.'
		},
		{
			question: 'How does current demand relate to task pressure?',
			answer:
				'Task pressure and current demand answer different questions. An occupation can have substantial AI task overlap and still appear on a current MOM demand or shortage list.'
		},
		{
			question: 'What happens when wage or demand data is missing?',
			answer:
				'Unpublished evidence stays marked Unknown. Wage and demand fields appear only when a reviewed source supports the occupation-level match.'
		}
	];
</script>

<Seo
	title="How does AI overlap with your job in Singapore?"
	description="Search and map 1,001 Singapore occupations. Compare AI task pressure, direct pay, named demand and available OECD capability evidence."
	path="/"
	jsonLd={[buildFaqJsonLd(faqItems)]}
/>

<main>
	<section class="border-b border-border bg-card">
		<div class="{pageLayout({ width: 'data' })} !py-5 lg:!py-6">
			<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
				<div class="max-w-4xl">
					<div class="flex flex-wrap items-center gap-2">
						<span class={badge({ variant: 'outline' })}>Singapore · SSOC 2024 · V9</span>
						<span class="text-xs text-muted-foreground"
							>V9 released 19 Aug · evidence updated 22 Aug</span
						>
					</div>
					<h1
						class="mt-3 max-w-4xl text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl"
					>
						How does AI overlap with your job?
					</h1>
					<p class="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
						Find a job, compare its relative task pressure with pay and named demand, then open the
						evidence and practical next steps.
					</p>
					<div class="mt-4 max-w-2xl">
						<OccupationSearch label="Search a job title or SSOC code" />
					</div>
				</div>

				<dl class="grid grid-cols-4 gap-px border border-border bg-border lg:w-[32rem]">
					{#each [['Ranked', data.counts.scored], ['Pay rows', data.counts.direct_wages], ['Named demand', data.directDemandCount], ['Capability', data.capabilityProfileCount]] as item (item[0])}
						<div class="min-w-0 bg-card px-3 py-3">
							<dt class="text-[11px] leading-tight text-muted-foreground">{item[0]}</dt>
							<dd class="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
								{Number(item[1]).toLocaleString()}
							</dd>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	</section>

	<section class="{pageLayout({ width: 'data' })} !py-4 sm:!py-5" aria-labelledby="explorer-title">
		<div class="mb-3 flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class={sectionLabel()}>Singapore occupation explorer</p>
				<h2 id="explorer-title" class="mt-1 text-xl font-bold text-foreground sm:text-2xl">
					Explore all 1,001 official occupations
				</h2>
			</div>
			<p class="max-w-xl text-xs leading-relaxed text-muted-foreground">
				Every map tile has equal weight. Filters stay active across the map, pay, demand and
				distribution views.
			</p>
		</div>

		<OccupationExplorer
			sourceUrl="/data/v9-search-index.json?v=2026-08-21-compact-explorer"
			expectedTotal={data.counts.occupations}
			listPageSize={40}
		/>
	</section>

	<section class="border-y border-border bg-surface-subtle">
		<div class="{pageLayout({ width: 'data' })} !py-6">
			<div class="grid gap-px border border-border bg-border md:grid-cols-3">
				{#each data.marketFacts as fact (fact.label)}
					<article class="grid gap-2 bg-card p-4 sm:grid-cols-[6rem_1fr]">
						<p class="font-mono text-2xl font-semibold tabular-nums text-foreground">
							{fact.value}
						</p>
						<div>
							<h3 class="text-sm font-semibold text-foreground">{fact.label}</h3>
							<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{fact.detail}</p>
							<a
								href={fact.sourceUrl}
								class="mt-1 inline-block text-xs font-semibold text-primary underline"
								target="_blank"
								rel="noreferrer">Source</a
							>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="{pageLayout({ width: 'data' })} grid min-w-0 gap-6 !py-7 xl:grid-cols-2">
		<div class="min-w-0">
			<div class="mb-3 flex items-end justify-between gap-3">
				<div>
					<p class={sectionLabel()}>Higher relative pressure</p>
					<h2 class="mt-1 text-xl font-bold text-foreground">Occupations near the top of V9</h2>
				</div>
				<a href="/rankings/highest-risk" class="text-sm font-semibold text-primary underline">All</a
				>
			</div>
			<OccupationResultList items={highestPressure} detail="category" />
		</div>

		<div class="min-w-0">
			<div class="mb-3 flex items-end justify-between gap-3">
				<div>
					<p class={sectionLabel()}>Pressure and demand can coexist</p>
					<h2 class="mt-1 text-xl font-bold text-foreground">Named in current MOM sources</h2>
				</div>
				<a
					href="/rankings/high-exposure-in-demand"
					class="text-sm font-semibold text-primary underline">All</a
				>
			</div>
			<NamedDemandPressurePlot items={namedDemand} compact />
		</div>
	</section>

	<section class="border-t border-border bg-card">
		<div class="{pageLayout({ width: 'content' })} !py-7">
			<FaqList items={faqItems} />
		</div>
	</section>
</main>
