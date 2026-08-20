<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationExplorer from '$lib/components/v9-browser/OccupationExplorer.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import OccupationSearch from '$lib/components/v9-browser/OccupationSearch.svelte';
	import {
		actionCard,
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
	title="Singapore AI Job Pressure by Occupation"
	description="Search and map 1,001 SSOC 2024 occupations. Compare AI task pressure with Singapore pay and named demand evidence, then inspect the sources and limits."
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
				<h1 class="mt-3 {titleStyle({ size: 'page' })}">Where AI puts pressure on work</h1>
				<p class="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
					Find your occupation, see which tasks face more AI overlap, and compare pay with current
					demand. Use the percentile to locate your occupation among Singapore jobs, then read pay
					and demand for the wider picture.
				</p>
				<div class="mt-5 max-w-2xl">
					<OccupationSearch label="Search your job title or SSOC code" />
				</div>
				<p class="mt-3 text-xs text-muted-foreground">
					{data.counts.occupations.toLocaleString()} official occupations · {data.counts.scored.toLocaleString()}
					with a pressure rank · updated 19 August 2026
				</p>
			</div>

			<aside class="hidden rounded-xl border border-border bg-surface-subtle p-6 lg:block">
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

	<section
		class="{pageLayout({ width: 'data' })} pt-6 sm:pt-8"
		aria-labelledby="flagship-map-title"
	>
		<div class="mb-4 flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class={sectionLabel()}>Explore all occupations</p>
				<h2
					id="flagship-map-title"
					class="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
				>
					See the whole Singapore occupation map
				</h2>
			</div>
			<a href="/explore" class="hidden text-sm font-semibold text-primary underline sm:inline">
				Open the full explorer
			</a>
		</div>

		<OccupationExplorer
			items={data.occupations}
			listPageSize={12}
			sourceUrl="/data/v9-search-index.json?v=2026-08-19-v9-role-guides"
			expectedTotal={data.counts.occupations}
		/>
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
			<OccupationResultList items={namedDemand} detail="demand" />
		</div>
	</section>

	<section class="bg-card">
		<div class="{pageLayout({ width: 'feature' })} py-12 sm:py-16">
			<p class={sectionLabel()}>What to do with the result</p>
			<h2 class="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-foreground">
				Use the score to ask better questions about your work
			</h2>
			<div class="mt-6 grid gap-4 md:grid-cols-3">
				<article class={actionCard({ action: 'try' })}>
					<h3 class="text-lg font-semibold">Try</h3>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary">
						Test AI on a low-consequence, repeatable task and compare speed, quality and review
						time.
					</p>
				</article>
				<article class={actionCard({ action: 'verify' })}>
					<h3 class="text-lg font-semibold">Verify carefully</h3>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary">
						Keep a person responsible for facts, exceptions, confidential data and consequential
						decisions.
					</p>
				</article>
				<article class={actionCard({ action: 'strengthen' })}>
					<h3 class="text-lg font-semibold">Strengthen</h3>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary">
						Build the parts of your role that depend on context, relationships, accountability and
						judgment.
					</p>
				</article>
			</div>
			<div class="mt-6 flex flex-wrap gap-3">
				<a href="/will-ai-take-my-job" class={linkPill()}>Check your own task mix →</a>
				<a href="/compare" class={linkPill()}>Compare occupations →</a>
				<a href="/methodology" class={linkPill()}>Read how V9 works →</a>
			</div>
		</div>
	</section>

	<section class="{pageLayout({ width: 'content' })} py-12">
		<div class={card({ padding: 'lg', variant: 'subtle' })}>
			<p class={sectionLabel()}>Keep the signals separate</p>
			<div class="mt-4 grid gap-5 md:grid-cols-3">
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
