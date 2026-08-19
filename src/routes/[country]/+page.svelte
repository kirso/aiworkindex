<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, caption, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
</script>

<Seo
	title={data.country.seoTitle}
	description={data.country.seoDescription}
	path={data.country.routePrefix}
	noindex={data.mode === 'research'}
/>

<main class={pageLayout({ width: data.mode === 'singapore' ? 'data' : 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: data.country.name }]} />

	{#if data.mode === 'singapore'}
		<header class="max-w-4xl border-b-2 border-foreground pb-6">
			<p class={sectionLabel()}>Live market · V9</p>
			<h1 class={title({ size: 'page' })}>Singapore AI Work Pressure Index</h1>
			<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
				A complete SSOC 2024 view of where generative AI overlaps with occupational tasks. The
				headline is a relative pressure rank. Wages, current demand and broad labour-market context
				stay separate because they measure different things.
			</p>
		</header>

		<section
			class="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-5"
			aria-label="Singapore V9 coverage"
		>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.occupations.toLocaleString()}
				</p>
				<p class={caption()}>SSOC 2024 occupations</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.scored.toLocaleString()}
				</p>
				<p class={caption()}>pressure ranks published</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.insufficient.toLocaleString()}
				</p>
				<p class={caption()}>ranks withheld</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.directWages.toLocaleString()}
				</p>
				<p class={caption()}>direct wage rows</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.namedDemand.toLocaleString()}
				</p>
				<p class={caption()}>named demand matches</p>
			</div>
		</section>

		<section class="mt-10">
			<div class="flex flex-wrap items-end justify-between gap-3 border-b border-foreground pb-2">
				<div>
					<p class={sectionLabel()}>Highest relative pressure</p>
					<h2 class={title({ size: 'section' })}>Highest-ranked V9 occupations</h2>
				</div>
				<a class="text-sm font-medium text-primary hover:underline" href="/rankings/highest-risk"
					>Open the full ranking</a
				>
			</div>
			<div class="mt-3 grid min-w-0 gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
				{#each data.topPressure as occupation (occupation.code)}
					<a class="min-w-0 bg-card p-4 hover:bg-accent" href="/occupation/{occupation.code}">
						<div class="flex min-w-0 items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="font-mono text-xs text-muted-foreground">SSOC {occupation.code}</p>
								<h3 class="mt-1 break-words text-sm font-bold leading-tight">{occupation.title}</h3>
							</div>
							<div class="shrink-0 text-right">
								<p class="font-mono text-xl font-black tabular-nums">
									{occupation.pressureRank?.toFixed(1)}
								</p>
								<p class="text-[10px] text-muted-foreground">pressure percentile</p>
							</div>
						</div>
						<div
							class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2 text-xs text-muted-foreground"
						>
							<span>{occupation.officialCategory}</span>
							<span
								>{occupation.wageMedian == null
									? 'Wage not published'
									: `SGD ${occupation.wageMedian.toLocaleString()}/mo`}</span
							>
							<span
								>{occupation.demandSignals.length
									? 'Named demand match'
									: 'Not named in selected lists'}</span
							>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<section class="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<a class={cn(card({ padding: 'sm', hover: true }), 'block')} href="/explore">
				<p class="text-sm font-bold">Browse all occupations</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Search SSOC 2024 and inspect each evidence record.
				</p>
			</a>
			<a class={cn(card({ padding: 'sm', hover: true }), 'block')} href="/roles">
				<p class="text-sm font-bold">Explore modern roles</p>
				<p class="mt-1 text-xs text-muted-foreground">
					See non-official role mixtures and their assumptions.
				</p>
			</a>
			<a class={cn(card({ padding: 'sm', hover: true }), 'block')} href="/compare">
				<p class="text-sm font-bold">Compare evidence</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Keep pressure, wages and demand in separate columns.
				</p>
			</a>
			<a class={cn(card({ padding: 'sm', hover: true }), 'block')} href="/methodology">
				<p class="text-sm font-bold">Read the method</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Formulas, mappings, missingness and limitations.
				</p>
			</a>
		</section>
	{:else if data.mode === 'us_preview'}
		<header class="max-w-4xl border-b-2 border-foreground pb-6">
			<p
				class="mb-2 inline-flex border border-risk-moderate px-2 py-1 font-mono text-xs font-bold uppercase tracking-wide text-risk-moderate"
			>
				Preview · separate from Singapore V9
			</p>
			<h1 class={title({ size: 'page' })}>United States occupation evidence preview</h1>
			<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
				This frozen preview retains the existing US public-data layer. It is not rebuilt with the
				Singapore V9 method, and this page does not publish a cross-country risk ranking. Use the
				wages, employment projections and occupational context as US evidence only.
			</p>
		</header>

		<section class="mt-6 grid gap-px bg-border sm:grid-cols-3">
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.occupations.toLocaleString()}
				</p>
				<p class={caption()}>US occupation records</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.wageRows.toLocaleString()}
				</p>
				<p class={caption()}>records with wage evidence</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{data.stats.employmentRows.toLocaleString()}
				</p>
				<p class={caption()}>records with employment context</p>
			</div>
		</section>

		<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-6')}>
			<p class="text-sm font-bold">Frozen source bundle</p>
			<p class="mt-1 break-words text-sm leading-relaxed text-text-secondary">
				{data.stats.sourceVintage}
			</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Generated {data.stats.generatedAt}. Updating research references does not silently
				recalculate this preview.
			</p>
		</div>

		<section class="mt-10">
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>Evidence sample</p>
				<h2 class={title({ size: 'section' })}>Large occupations in the frozen preview</h2>
			</div>
			<p class="mt-2 text-xs text-muted-foreground">
				Sorted by reported employment, not by AI pressure or job risk.
			</p>
			<div class="mt-3 grid gap-px bg-border sm:grid-cols-2">
				{#each data.sample as row (row.code)}
					<article class="min-w-0 bg-card p-4">
						<p class="font-mono text-xs text-muted-foreground">SOC {row.code}</p>
						<h3 class="mt-1 text-sm font-bold">{row.title}</h3>
						<div class="mt-3 grid grid-cols-2 gap-3 text-xs">
							<div>
								<p class="text-muted-foreground">Employment (thousand workers)</p>
								<p class="mt-0.5 font-mono font-bold tabular-nums">
									{row.employmentThousands?.toLocaleString()}
								</p>
							</div>
							<div>
								<p class="text-muted-foreground">Median annual wage</p>
								<p class="mt-0.5 font-mono font-bold tabular-nums">
									{row.wage == null ? 'Not published' : `USD ${row.wage.toLocaleString()}`}
								</p>
							</div>
							<div>
								<p class="text-muted-foreground">Projected change</p>
								<p class="mt-0.5 font-mono font-bold tabular-nums">
									{row.projectedChange == null
										? 'Not published'
										: `${row.projectedChange.toFixed(1)}%`}
								</p>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</section>

		<p class="mt-8 text-sm text-muted-foreground">
			For the live scored release, use the <a
				class="font-medium text-primary hover:underline"
				href="/sg">Singapore V9 index</a
			>.
		</p>
	{:else}
		<header class="max-w-3xl border-b-2 border-foreground pb-6">
			<p class={sectionLabel()}>Research only</p>
			<h1 class={title({ size: 'page' })}>{data.country.name}</h1>
			<p class="mt-3 text-base leading-relaxed text-text-secondary">
				No occupation scores are published for this market. A credible country index needs a current
				local occupation taxonomy, official mappings and locally meaningful labour-market evidence.
			</p>
		</header>
		<p class="mt-6 text-sm">
			<a class="font-medium text-primary hover:underline" href="/global"
				>Read the global research context</a
			>
		</p>
	{/if}
</main>
