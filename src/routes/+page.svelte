<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import OccupationSearch from '$lib/components/v9-browser/OccupationSearch.svelte';
	import PressureWageScatter from '$lib/components/v9-browser/PressureWageScatter.svelte';
	import {
		badge,
		card,
		pageLayout,
		pill,
		sectionLabel,
		title as titleStyle
	} from '$lib/design-system';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';

	let { data } = $props();
	let highestPressure = $derived(data.highestPressure);
	let namedDemand = $derived(data.namedDemand);
	let wageEvidence = $derived(data.wageEvidence);

	const faqItems = [
		{
			question: 'What does AI work pressure mean?',
			answer:
				'AI work pressure is the relative amount of task overlap with current generative AI capabilities. V9 maps ILO 2025 task-exposure evidence to SSOC 2024 occupations and ranks scored occupations within Singapore. It is not a probability of job loss.'
		},
		{
			question: 'Does a high pressure rank mean demand is falling?',
			answer:
				'No. Pressure and current demand are separate. A job can have substantial AI task overlap and still appear on a current MOM demand or shortage list.'
		},
		{
			question: 'What happens when wage or demand data is missing?',
			answer:
				'Missing evidence stays unknown. The index does not turn an unpublished wage into zero or absence from a selected demand list into weak demand.'
		}
	];
</script>

<Seo
	title="Singapore AI Work Pressure by Occupation"
	description="Search 1,001 SSOC 2024 occupations. Compare AI work pressure, official ILO exposure categories, direct Singapore wages and named MOM demand evidence."
	path="/"
	jsonLd={[buildFaqJsonLd(faqItems)]}
/>

<header class="border-b border-border bg-card">
	<div class="mx-auto max-w-5xl px-5 py-12 text-center sm:px-6 sm:py-16">
		<span class={badge({ variant: 'outline' })}>Singapore · SSOC 2024 · V9</span>
		<h1 class="mx-auto mt-4 max-w-4xl {titleStyle({ size: 'page' })}">
			How much AI pressure does your job face?
		</h1>
		<p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
			Search Singapore occupations to compare AI task pressure with direct wage and current-demand
			evidence. The pressure rank measures task overlap, not the chance that a job disappears.
		</p>
		<div class="mt-7">
			<OccupationSearch />
		</div>
		<div class="mt-6 flex flex-wrap justify-center gap-2">
			<a href="/explore" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
				Browse every occupation
			</a>
			<a href="/rankings" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
				See evidence rankings
			</a>
			<a href="/methodology" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
				How V9 works
			</a>
		</div>
	</div>
</header>

<main class={pageLayout({ width: 'data' })}>
	<section aria-label="V9 coverage" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-2xl font-bold tabular-nums">
				{data.counts.occupations.toLocaleString()}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">Official SSOC 2024 occupations</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-2xl font-bold tabular-nums">{data.counts.scored.toLocaleString()}</p>
			<p class="mt-1 text-xs text-muted-foreground">Occupations with a pressure rank</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-2xl font-bold tabular-nums">
				{data.counts.direct_wages.toLocaleString()}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">Direct MOM wage rows</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-2xl font-bold tabular-nums">{data.directDemandCount}</p>
			<p class="mt-1 text-xs text-muted-foreground">Occupations with named MOM demand evidence</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Pressure and pay are different signals</h2>
		<p class="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			The plot includes only occupations with direct June 2025 wage evidence. Hover or focus a point
			for the occupation, then open it for the source and mapping limitations.
		</p>
		<div class="mt-4">
			<PressureWageScatter items={wageEvidence} />
		</div>
	</section>

	<section class="mt-10 grid min-w-0 gap-6 xl:grid-cols-2">
		<div class="min-w-0">
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<div>
					<h2 class={sectionLabel()}>Highest relative pressure</h2>
					<p class="mt-1 text-xs text-muted-foreground">Within the 987 scored SSOC occupations</p>
				</div>
				<a href="/rankings/highest-risk" class="text-xs font-medium text-primary underline"
					>Full ranking</a
				>
			</div>
			<OccupationResultList items={highestPressure} detail="category" />
		</div>

		<div class="min-w-0">
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<div>
					<h2 class={sectionLabel()}>Named in current demand sources</h2>
					<p class="mt-1 text-xs text-muted-foreground">
						Direct MOM list evidence, ordered by pressure
					</p>
				</div>
				<a
					href="/rankings/high-exposure-in-demand"
					class="text-xs font-medium text-primary underline"
				>
					Full list
				</a>
			</div>
			<OccupationResultList items={namedDemand} detail="demand" />
		</div>
	</section>

	<section class="mt-10 border-y border-border py-8">
		<h2 class={sectionLabel()}>Read each kind of evidence separately</h2>
		<div class="mt-4 grid gap-5 md:grid-cols-3">
			<div>
				<h3 class="text-base font-semibold text-foreground">AI work pressure</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					A derived within-Singapore rank based on ILO 2025 task exposure and the official SSOC–ISCO
					mapping. It does not estimate job losses.
				</p>
			</div>
			<div>
				<h3 class="text-base font-semibold text-foreground">Direct market evidence</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Detailed MOM wage rows and reviewed matches to named demand or shortage lists. Neither is
					filled in when the source does not support it.
				</p>
			</div>
			<div>
				<h3 class="text-base font-semibold text-foreground">Broader context</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Firm adoption and broad labour-market conditions help interpretation, but they do not
					change the headline pressure rank.
				</p>
			</div>
		</div>
	</section>

	<FaqList items={faqItems} />
</main>
