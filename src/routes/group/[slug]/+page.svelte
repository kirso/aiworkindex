<script lang="ts">
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import { buildItemListJsonLd } from '$lib/data/ranking-jsonld';
	import { card, pageLayout, pill, sectionLabel, title as titleStyle } from '$lib/design-system';

	let { data } = $props();

	function formatPercentile(value: number | null): string {
		if (value == null) return 'Unknown';
		return `percentile ${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
	}

	const faqItems = $derived([
		{
			question: `What is the AI work pressure for ${data.group.label} jobs?`,
			answer: `${data.stats.scoredCount} of ${data.stats.count} occupations in this SSOC 2024 major group have a V9 pressure rank. The median occupation-level rank is ${formatPercentile(data.stats.medianPressure)}. This is not weighted by employment and is not a job-loss forecast.`
		},
		{
			question: `Does the group median include wages or demand?`,
			answer:
				'No. Direct MOM wages and named demand evidence are displayed separately and never change the pressure rank.'
		}
	]);

	let groupJsonLd = $derived(
		buildItemListJsonLd(
			`${data.group.label} occupations in SSOC 2024`,
			`Official occupations in SSOC 2024 major group ${data.group.code}, with V9 evidence pages.`,
			data.occupations.map(occupation => ({ title: occupation.title, ssoc: occupation.code }))
		)
	);
</script>

<Seo
	title={`${data.group.label}: AI Work Pressure by Job`}
	description={`Compare ${data.stats.count} SSOC 2024 ${data.group.label} occupations by AI work pressure, direct MOM wage coverage and named demand evidence.`}
	path={`/group/${data.group.slug}`}
	jsonLd={[groupJsonLd]}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Occupation groups', href: '/groups' },
			{ label: data.group.label }
		]}
	/>

	<header class="mb-8 max-w-4xl">
		<p class="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
			SSOC 2024 major group {data.group.code}
		</p>
		<h1 class="mt-2 {titleStyle({ size: 'page' })}">{data.group.label}</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			Compare {data.stats.count} detailed occupations in this group. The pressure rank comes from ILO
			2025 task evidence; Singapore wages and demand signals are direct context and stay outside the score.
		</p>
	</header>

	<section aria-label="Group evidence summary" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-xl font-bold tabular-nums">{data.stats.count}</p>
			<p class="mt-1 text-xs text-muted-foreground">Detailed occupations</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-xl font-bold tabular-nums">
				{formatPercentile(data.stats.medianPressure)}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">Median pressure rank</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-xl font-bold tabular-nums">{data.stats.directWageCount}</p>
			<p class="mt-1 text-xs text-muted-foreground">Direct MOM wage rows</p>
		</div>
		<div class={card({ padding: 'md', variant: 'metric' })}>
			<p class="font-mono text-xl font-bold tabular-nums">{data.stats.namedDemandCount}</p>
			<p class="mt-1 text-xs text-muted-foreground">Named MOM demand matches</p>
		</div>
	</section>

	<p class="mt-3 text-xs leading-relaxed text-muted-foreground">
		Each scored detailed occupation contributes one observation to the group median. Employment size
		is not used as a weight.
	</p>

	<section class="mt-10 grid min-w-0 gap-7 xl:grid-cols-2">
		<div class="min-w-0">
			<h2 class={sectionLabel()}>Highest pressure in this group</h2>
			<p class="mb-3 mt-1 text-xs text-muted-foreground">
				Relative to all scored Singapore occupations
			</p>
			<OccupationResultList items={data.highestPressure} detail="wage" />
		</div>
		<div class="min-w-0">
			<h2 class={sectionLabel()}>Lowest pressure in this group</h2>
			<p class="mb-3 mt-1 text-xs text-muted-foreground">
				Still a task-overlap measure, not “AI-proof” work
			</p>
			<OccupationResultList items={data.lowestPressure} detail="wage" />
		</div>
	</section>

	<section class="mt-10 min-w-0">
		<h2 class={sectionLabel()}>All {data.stats.count} occupations</h2>
		<p class="mb-3 mt-1 text-xs text-muted-foreground">
			Ordered by pressure; unranked occupations appear last and remain unknown.
		</p>
		<OccupationResultList items={data.occupations} detail="wage" />
	</section>

	<section class="mt-10 border-t border-border pt-5">
		<h2 class={sectionLabel()}>Other occupation groups</h2>
		<div class="mt-3 flex min-w-0 flex-wrap gap-2">
			{#each data.allGroups.filter(group => group.slug !== data.group.slug) as group (group.slug)}
				<a href="/group/{group.slug}" class={pill({ tone: 'muted', interactive: true })}>
					{group.label}
				</a>
			{/each}
		</div>
	</section>

	<FaqList items={faqItems} />
</main>
