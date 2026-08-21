<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationGroupOverview from '$lib/components/v9-browser/OccupationGroupOverview.svelte';
	import NamedDemandPressurePlot from '$lib/components/v9-browser/NamedDemandPressurePlot.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import OccupationSearch from '$lib/components/v9-browser/OccupationSearch.svelte';
	import PressureDistribution from '$lib/components/v9-browser/PressureDistribution.svelte';
	import {
		badge,
		card,
		linkPill,
		pageLayout,
		sectionLabel,
		title as titleStyle
	} from '$lib/design-system';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';

	let { data } = $props();
	let highestPressure = $derived(data.highestPressure);
	let namedDemand = $derived(data.namedDemand);

	const faqItems = [
		{
			question: 'What does AI task pressure mean?',
			answer:
				'AI task pressure compares how much an occupation’s tasks overlap with current generative-AI capabilities. The formal V9 field is the AI work pressure rank. V9 maps ILO 2025 evidence to SSOC 2024 occupations and ranks scored occupations within Singapore.'
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
	description="Search 1,001 Singapore occupations. See AI task overlap, pay and named demand evidence, then open a major group or the full explorer."
	path="/"
	jsonLd={[buildFaqJsonLd(faqItems)]}
/>

<main>
	<section class="border-b border-border bg-card">
		<div
			class="{pageLayout({
				width: 'data'
			})} grid gap-8 pb-8 pt-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-end lg:pb-12 lg:pt-14"
		>
			<div class="max-w-4xl">
				<span class={badge({ variant: 'outline' })}>Singapore · SSOC 2024 · V9</span>
				<h1 class="mt-3 {titleStyle({ size: 'page' })}">How does AI overlap with your job?</h1>
				<p class="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
					Find your occupation, see its relative AI task overlap, then check pay and named hiring
					lists. The percentile locates the job among scored Singapore occupations. It is not a
					job-loss probability.
				</p>
				<div class="mt-5 max-w-2xl">
					<OccupationSearch label="Search your job title or SSOC code" />
				</div>
				<p class="mt-3 text-xs text-muted-foreground">
					{data.counts.occupations.toLocaleString()} official occupations · {data.counts.scored.toLocaleString()}
					with a pressure rank · updated 19 August 2026
				</p>
			</div>

			<aside class="hidden border border-border bg-surface-subtle p-6 lg:block">
				<p class={sectionLabel()}>What you can compare</p>
				<dl class="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
					<div>
						<dt class="text-sm text-muted-foreground">Pressure-ranked</dt>
						<dd class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
							{data.counts.scored.toLocaleString()}
						</dd>
					</div>
					<div>
						<dt class="text-sm text-muted-foreground">Direct wage rows</dt>
						<dd class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
							{data.counts.direct_wages.toLocaleString()}
						</dd>
					</div>
					<div>
						<dt class="text-sm text-muted-foreground">Named demand evidence</dt>
						<dd class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
							{data.directDemandCount}
						</dd>
					</div>
					<div>
						<dt class="text-sm text-muted-foreground">Unranked, still shown</dt>
						<dd class="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
							{data.counts.insufficient_evidence.toLocaleString()}
						</dd>
					</div>
				</dl>
			</aside>
		</div>
	</section>

	<section class="{pageLayout({ width: 'data' })} py-9 sm:py-12" aria-labelledby="groups-title">
		<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class={sectionLabel()}>Start with your kind of work</p>
				<h2
					id="groups-title"
					class="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
				>
					Named jobs, grouped like a map
				</h2>
				<p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
					Switch between AI task pressure and the conservative OECD capability subset. Tile size is
					the number of official occupations, not workers or pay.
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					OECD capability profiles are available for {data.capabilityProfileCount} occupations; missing
					profiles remain hatched.
				</p>
			</div>
			<a href="/explore" class={linkPill()}> Open the 1,001-occupation explorer → </a>
		</div>

		<OccupationGroupOverview
			groups={data.groupSummaries}
			categories={data.categorySummary}
			mapItems={data.mapItems}
			rankedTotal={data.counts.scored}
			unrankedTotal={data.counts.insufficient_evidence}
		/>
	</section>

	<section class="border-y border-border bg-surface-subtle">
		<div
			class="{pageLayout({ width: 'data' })} grid gap-8 py-10 xl:grid-cols-[1.2fr_0.8fr] xl:py-14"
		>
			<PressureDistribution
				bins={data.pressureBins}
				rankedTotal={data.counts.scored}
				unrankedTotal={data.counts.insufficient_evidence}
			/>

			<div>
				<p class={sectionLabel()}>What Singapore employers reported</p>
				<h2 class="mt-1 font-sans text-2xl font-bold text-foreground">
					Current labour-market context
				</h2>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					These national figures describe firms and vacancies. They do not change an occupation’s
					pressure rank.
				</p>
				<div class="mt-5 divide-y divide-border border-y border-border bg-card">
					{#each data.marketFacts as fact (fact.label)}
						<article class="grid gap-2 px-4 py-4 sm:grid-cols-[7rem_1fr] sm:px-5">
							<p class="font-mono text-3xl font-semibold tabular-nums text-foreground">
								{fact.value}
							</p>
							<div>
								<h3 class="text-sm font-semibold text-foreground">{fact.label}</h3>
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{fact.detail}</p>
								<a
									href={fact.sourceUrl}
									class="mt-2 inline-block text-xs font-semibold text-primary underline"
									target="_blank"
									rel="noreferrer"
								>
									{fact.sourceTitle}
								</a>
							</div>
						</article>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section
		class="{pageLayout({
			width: 'data'
		})} grid min-w-0 gap-8 border-t border-border py-10 xl:grid-cols-2 xl:py-14"
	>
		<div class="min-w-0">
			<div class="mb-4 flex flex-wrap items-end justify-between gap-2">
				<div>
					<p class={sectionLabel()}>Higher relative task pressure</p>
					<h2 class="mt-1 text-xl font-semibold text-foreground">Occupations near the top of V9</h2>
				</div>
				<a href="/rankings/highest-risk" class="text-sm font-semibold text-primary underline"
					>Full ranking</a
				>
			</div>
			<OccupationResultList items={highestPressure} detail="category" />
		</div>

		<div class="min-w-0">
			<div class="mb-4 flex flex-wrap items-end justify-between gap-2">
				<div>
					<p class={sectionLabel()}>Pressure and demand can coexist</p>
					<h2 class="mt-1 text-xl font-semibold text-foreground">Named in current MOM sources</h2>
				</div>
				<a
					href="/rankings/high-exposure-in-demand"
					class="text-sm font-semibold text-primary underline"
				>
					Full list
				</a>
			</div>
			<NamedDemandPressurePlot items={namedDemand} compact />
		</div>
	</section>

	<section class="bg-card">
		<div class="{pageLayout({ width: 'feature' })} py-12 sm:py-16">
			<p class={sectionLabel()}>Next step</p>
			<h2 class="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-foreground">
				Check the tasks you actually do
			</h2>
			<p class="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary">
				The percentile locates a job among scored Singapore occupations. Your shift, employer and
				task mix still decide what is practical.
			</p>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/will-ai-take-my-job" class={linkPill()}>Check your own task mix →</a>
				<a href="/compare" class={linkPill()}>Compare jobs →</a>
			</div>
		</div>
	</section>

	<section class="{pageLayout({ width: 'content' })} py-12">
		<div class={card({ padding: 'lg', variant: 'subtle' })}>
			<p class={sectionLabel()}>Keep the signals separate</p>
			<div class="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
				<div>
					<h3 class="text-base font-semibold text-foreground">AI task pressure</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						A within-Singapore rank based on ILO task-exposure evidence and official occupation
						mappings.
					</p>
				</div>
				<div>
					<h3 class="text-base font-semibold text-foreground">Direct market evidence</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						Detailed MOM wage rows and reviewed matches to named demand or shortage lists.
					</p>
				</div>
				<div>
					<h3 class="text-base font-semibold text-foreground">Current AI capabilities</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						A separate OECD profile for {data.capabilityProfileCount} occupations whose detailed titles
						pass the conservative mapping rule.
					</p>
				</div>
				<div>
					<h3 class="text-base font-semibold text-foreground">Your real task mix</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						Your responsibilities and workplace decide what is practical. Personal answers stay
						local to your check and leave V9 unchanged.
					</p>
				</div>
			</div>
		</div>

		<FaqList items={faqItems} />
	</section>
</main>
