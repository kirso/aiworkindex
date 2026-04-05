<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import DemandPressureMatrix from '$lib/components/viz/DemandPressureMatrix.svelte';
	import HeroSearch from '$lib/components/ui/HeroSearch.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { card, sectionLabel, caption, pill } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';
	import type { RiskBand, ImpactType } from '$lib/data';
	import type { Occupation } from '$lib/data';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import { shortTitle } from '$lib/data/display-names';
	import { formatWorkerCount, type HomeSurfaceItem } from '$lib/data/home-surface';
	import { innerWidth as windowWidth } from 'svelte/reactivity/window';

	let { data } = $props();

	let viewportWidth = $derived(windowWidth.current ?? 1024);
	let surfaceOccupations = $derived(data.occupations as HomeSurfaceItem[]);
	let filterResult: HomeSurfaceItem[] | null = $state(null);
	let activeChartTab = $state<'treemap' | 'pressure' | 'distribution'>('treemap');
	let filteredOccupations = $derived(filterResult ?? surfaceOccupations);
	let isFiltered = $derived(
		filterResult !== null && filteredOccupations.length !== surfaceOccupations.length
	);

	let surfaceValueScale = $derived.by(() => {
		const maxValue = surfaceOccupations.reduce(
			(max, occ) => Math.max(max, occ.gross_wage_median ?? 0),
			0
		);
		const step = maxValue <= 100 ? 1 : maxValue <= 1000 ? 10 : maxValue <= 10000 ? 100 : 1000;
		return {
			min: 0,
			max: Math.max(step, Math.ceil(maxValue / step) * step),
			step
		};
	});

	let topHighRisk = $derived(
		[...filteredOccupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5)
	);
	let topSafest = $derived(
		[...filteredOccupations].sort((a, b) => a.net_risk - b.net_risk).slice(0, 5)
	);
	let topAugmented = $derived(
		filteredOccupations
			.filter(o => o.impact_type === 'ai_leveraged')
			.sort((a, b) => b.exposure - a.exposure)
			.slice(0, 5)
	);
	let topFocus = $derived(
		(data.surface.code === 'global'
			? [...filteredOccupations].sort((a, b) => b.employment_thousands - a.employment_thousands)
			: [...filteredOccupations].sort((a, b) => b.market.market_resilience - a.market.market_resilience)
		).slice(0, 5)
	);
	let focusCardTitle = $derived(data.surface.code === 'global' ? 'Largest Occupations' : 'Strongest Demand');
	let focusCardHref = $derived(
		data.surface.code === 'global'
			? '/explore'
			: data.surface.code === 'sg'
				? '/rankings/high-exposure-in-demand'
				: data.surface.config.routePrefix
	);

	const chartTabs = [
		{ key: 'treemap' as const, label: 'Occupation Map' },
		{ key: 'pressure' as const, label: 'Demand vs Pressure' },
		{ key: 'distribution' as const, label: 'Distribution' }
	];

	function handleFilter(filtered: Occupation[]) {
		filterResult = filtered as unknown as HomeSurfaceItem[];
	}

	function surfaceHref(code: string): string {
		return code === 'global' ? '/' : `/?surface=${code}`;
	}

	function formatFocusValue(occ: HomeSurfaceItem): string {
		if (data.surface.code === 'global') {
			return `${formatWorkerCount(occ.gross_wage_median ?? 0)} workers`;
		}
		return `${(occ.market.market_resilience * 100).toFixed(0)}%`;
	}
</script>

<Seo
	title="AI Work Index — Global baseline and country layers"
	description="Explore the global structural baseline, then switch into Singapore or the United States for local labour-market context."
	path="/"
	ogImage="/og/default.png"
	jsonLd={[
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: 'What does the AI Work Index measure?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'It measures structural AI pressure on occupations. The homepage defaults to the global structural baseline, and country layers add local demand, wage, and policy context when selected.'
					}
				},
				{
					'@type': 'Question',
					name: 'How is the score calculated?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: 'Global structural pressure is exposure multiplied by bottleneck protection. Country headline risk layers local demand resilience on top. No LLM is used in the scoring pipeline.'
					}
				}
			]
		})}<\/script>`
	]}/>

<div class="border-b border-risk-moderate-border bg-risk-moderate-subtle">
	<div class="mx-auto flex max-w-screen-2xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:px-6">
		<span class="text-text-secondary">
			{siteStatus.homepage_banner.body}
			<a href={siteStatus.homepage_banner.link_href} class="ml-1 text-primary hover:underline">
				{siteStatus.homepage_banner.link_label}
			</a>
		</span>
	</div>
</div>

<div class="bg-card border-b border-border">
	<div class="mx-auto max-w-screen-2xl px-4 sm:px-6">
		<div class="mx-auto max-w-2xl py-10 text-center sm:py-12">
			<h1 class="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				How will AI affect your job?
			</h1>
			<p class="mt-1.5 text-sm text-muted-foreground">
				Search any occupation or modern role
			</p>
			<div class="mt-4">
				<HeroSearch
					occupations={surfaceOccupations as unknown as Occupation[]}
					occupationHrefPrefix={data.surface.code === 'global'
						? '/global'
						: data.surface.config.routePrefix}
					marketLabel={data.surface.config.displayName}
					occupationValueLabel={data.surface.valueLabel}
				/>
			</div>

			<div class="mt-6 grid grid-cols-3 gap-4">
				{#each data.surface.metrics as metric}
					<div>
						<p class="font-mono text-xl font-bold text-foreground sm:text-2xl">
							{metric.value}
						</p>
						<p class="text-xs text-muted-foreground sm:text-xs">{metric.label}</p>
						<p class="mt-1 text-xs text-muted-foreground">{metric.note}</p>
					</div>
				{/each}
			</div>

			<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
				<a
					href="/rankings/highest-risk"
					class={pill({ size: 'lg', tone: 'outline', interactive: true })}
				>
					Highest pressure jobs →
				</a>
				<a
					href="/rankings/high-exposure-in-demand"
					class={pill({ size: 'lg', tone: 'outline', interactive: true })}
				>
					In-demand but exposed →
				</a>
				<a href="/roles" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
					Modern roles →
				</a>
				<a href="/explore" class={pill({ size: 'lg', tone: 'outline', interactive: true })}>
					View all occupations →
				</a>
			</div>
		</div>
	</div>
</div>

<div class="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6">
	<div class="mb-4 flex flex-wrap items-center gap-2">
		<span class={caption({ weight: 'medium' })}>Data surface:</span>
		{#each data.surfaceChoices as choice (choice.code)}
			<a
				href={surfaceHref(choice.code)}
				title={choice.description}
				class={pill({
					size: 'lg',
					tone: data.surface.code === choice.code ? 'primary' : 'outline',
					interactive: true
				})}
				aria-current={data.surface.code === choice.code ? 'page' : undefined}
			>
				{choice.label}
			</a>
		{/each}
	</div>

	<div class="flex gap-5">
		<aside class="hidden w-[220px] shrink-0 lg:block">
			<div
				class={cn(
					card({ padding: 'sm' }),
					'sticky top-14 max-h-[calc(100vh-4.5rem)] overflow-y-auto'
				)}
			>
				<FilterPanel
					occupations={surfaceOccupations as unknown as Occupation[]}
					onfilter={handleFilter}
					showTextSearch={false}
					valueLabel={data.surface.code === 'global' ? 'Workforce range' : 'Wage range'}
					valuePrefix={data.surface.code === 'global' ? null : data.surface.config.currency}
					valueMin={surfaceValueScale.min}
					valueMax={surfaceValueScale.max}
					valueStep={surfaceValueScale.step}
				/>

				<div class="mt-3 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Risk Bands</p>
					<div class="mt-1.5 space-y-0.5">
						{#each ['very_low', 'low', 'moderate', 'high', 'very_high'] as const as band}
							{@const count = filteredOccupations.filter(o => o.risk_band === band).length}
							{@const pct =
								filteredOccupations.length > 0 ? (count / filteredOccupations.length) * 100 : 0}
							<div class="flex items-center gap-1">
								<span class="w-16 shrink-0 text-right text-xs text-muted-foreground">
									{riskBandLabels[band as RiskBand]}
								</span>
								<div
									class="h-3.5 rounded-sm"
									style="width: {Math.max(pct, 4)}%; background-color: {riskBandColors[
										band as RiskBand
									]};"
								></div>
								<span class="shrink-0 font-mono text-xs text-foreground">{count}</span>
							</div>
						{/each}
					</div>
				</div>

				<div class="mt-3 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>Impact Type</p>
					<div class="mt-1.5 space-y-0.5">
						{#each ['ai_leveraged', 'at_risk', 'stable', 'mixed'] as const as type}
							{@const count = filteredOccupations.filter(o => o.impact_type === type).length}
							{@const pct =
								filteredOccupations.length > 0 ? (count / filteredOccupations.length) * 100 : 0}
							<div class="flex items-center gap-1">
								<span class="w-16 shrink-0 text-right text-xs text-muted-foreground">
									{impactTypeLabels[type as ImpactType]}
								</span>
								<div
									class="h-3.5 rounded-sm"
									style="width: {Math.max(pct, 4)}%; background-color: {impactTypeColors[
										type as ImpactType
									]};"
								></div>
								<span class="shrink-0 font-mono text-xs text-foreground">{count}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</aside>

		<div class="min-w-0 flex-1">
			{#if viewportWidth < 1024}
				<div class="mb-4">
					<details class={cn(card({ padding: 'none' }))}>
						<summary
							class="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-text-secondary list-none [&::-webkit-details-marker]:hidden"
						>
							Filters & Search
							<svg
								class="h-4 w-4 text-muted-foreground"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="m6 9 6 6 6-6" />
							</svg>
						</summary>
						<div class="border-t border-border/50 p-4">
							<FilterPanel
								occupations={surfaceOccupations as unknown as Occupation[]}
								onfilter={handleFilter}
								showTextSearch={false}
								valueLabel={data.surface.code === 'global'
									? 'Workforce range'
									: 'Wage range'}
								valuePrefix={data.surface.code === 'global' ? null : data.surface.config.currency}
								valueMin={surfaceValueScale.min}
								valueMax={surfaceValueScale.max}
								valueStep={surfaceValueScale.step}
							/>
						</div>
					</details>
				</div>
			{/if}

			{#if isFiltered}
				<p class="mb-3 text-xs text-muted-foreground">
					Showing {filteredOccupations.length} of {surfaceOccupations.length} occupations ·
					<button class="text-primary hover:underline" onclick={() => (filterResult = null)}>
						Reset
					</button>
				</p>
			{/if}

			<div class={cn(card({ padding: 'sm' }), 'mb-4')}>
				<Tabs.Root bind:value={activeChartTab} class="w-full gap-3">
					<div class="flex flex-col gap-3 px-1 md:flex-row md:items-center md:justify-between">
						<div>
							<h2 class={sectionLabel()}>{chartTabs.find(t => t.key === activeChartTab)?.label}</h2>
							<p class={caption()}>
								{#if activeChartTab === 'treemap'}
									{data.surface.chartNotes.treemap}
								{:else if activeChartTab === 'pressure'}
									{data.surface.chartNotes.matrix}
								{:else}
									{data.surface.chartNotes.histogram}
								{/if}
							</p>
						</div>
						<Tabs.List class="w-full md:w-auto">
							{#each chartTabs as tab (tab.key)}
								<Tabs.Trigger value={tab.key} class="min-w-0 flex-1 text-xs sm:flex-initial sm:text-sm">
									{tab.label}
								</Tabs.Trigger>
							{/each}
						</Tabs.List>
					</div>

					<Tabs.Content value="treemap">
						{#if viewportWidth >= 768}
							<Treemap
								occupations={filteredOccupations as unknown as Occupation[]}
								surfaceLabel={data.surface.config.displayName}
								valueLabel={data.surface.valueLabel}
							/>
						{:else}
							<OccupationCardList
								occupations={filteredOccupations.slice(0, 20) as unknown as Occupation[]}
								expandFirst={2}
							/>
							<a
								href="/explore"
								class="mt-2 block text-center text-xs font-medium text-primary hover:underline"
							>
								View all {filteredOccupations.length} occupations →
							</a>
						{/if}
					</Tabs.Content>
					<Tabs.Content value="pressure">
						<DemandPressureMatrix
							occupations={filteredOccupations as unknown as Occupation[]}
							surfaceLabel={data.surface.config.displayName}
							xAxisLabel={data.surface.code === 'global' ? 'Structural pressure' : 'Headline risk'}
							yAxisLabel={data.surface.code === 'global'
								? 'Human bottleneck protection'
								: 'Demand resilience'}
							quadrantLabels={
								data.surface.code === 'global'
									? [
											{ label: 'Low pressure, high bottleneck', x: 0.1, y: 0.85 },
											{ label: 'Low pressure, low bottleneck', x: 0.1, y: 0.15 },
											{ label: 'High pressure, high bottleneck', x: 0.55, y: 0.85 },
											{ label: 'High pressure, low bottleneck', x: 0.55, y: 0.15 }
										]
									: undefined
							}
						/>
					</Tabs.Content>
					<Tabs.Content value="distribution">
						<Histogram
							occupations={filteredOccupations as unknown as Occupation[]}
							scoreLabel={data.surface.code === 'global' ? 'Structural pressure' : 'Headline risk'}
						/>
					</Tabs.Content>
				</Tabs.Root>
			</div>

			<div class="grid gap-4 pb-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>Highest Risk</h3>
						<a href="/rankings/highest-risk" class="text-xs text-primary hover:underline">All →</a>
					</div>
					{#each topHighRisk as occ, i (occ.displayCode)}
						<a
							href={occ.linkHref ?? '/global'}
							class="flex items-center gap-1.5 rounded-sm py-1 text-xs transition-colors hover:bg-accent"
						>
							<span class="w-3 font-mono font-bold text-risk-very-high">{i + 1}</span>
							<span class="flex-1 truncate text-foreground">{shortTitle(occ.title)}</span>
							<span class="shrink-0 font-mono text-risk-very-high">
								{(occ.net_risk * 100).toFixed(0)}%
							</span>
						</a>
					{/each}
				</div>

				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>Most Resilient</h3>
						<a href="/rankings/safest-high-paying" class="text-xs text-primary hover:underline">
							All →
						</a>
					</div>
					{#each topSafest as occ, i (occ.displayCode)}
						<a
							href={occ.linkHref ?? '/global'}
							class="flex items-center gap-1.5 rounded-sm py-1 text-xs transition-colors hover:bg-accent"
						>
							<span class="w-3 font-mono font-bold text-risk-very-low">{i + 1}</span>
							<span class="flex-1 truncate text-foreground">{shortTitle(occ.title)}</span>
							<span class="shrink-0 font-mono text-risk-very-low">
								{(occ.net_risk * 100).toFixed(0)}%
							</span>
						</a>
					{/each}
				</div>

				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>Augmented</h3>
						<a href="/rankings/ai-leveraged" class="text-xs text-primary hover:underline">All →</a>
					</div>
					{#each topAugmented as occ, i (occ.displayCode)}
						<a
							href={occ.linkHref ?? '/global'}
							class="flex items-center gap-1.5 rounded-sm py-1 text-xs transition-colors hover:bg-accent"
						>
							<span class="w-3 font-mono font-bold text-impact-leveraged">{i + 1}</span>
							<span class="flex-1 truncate text-foreground">{shortTitle(occ.title)}</span>
							<span class="shrink-0 font-mono text-muted-foreground">{riskBandLabels[occ.risk_band]}</span>
						</a>
					{/each}
				</div>

				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>{focusCardTitle}</h3>
						<a href={focusCardHref} class="text-xs text-primary hover:underline">
							All →
						</a>
					</div>
					{#each topFocus as occ, i (occ.displayCode)}
						<a
							href={occ.linkHref ?? '/global'}
							class="flex items-center gap-1.5 rounded-sm py-1 text-xs transition-colors hover:bg-accent"
						>
							<span class="w-3 font-mono font-bold text-risk-very-low">{i + 1}</span>
							<span class="flex-1 truncate text-foreground">{shortTitle(occ.title)}</span>
							<span class="shrink-0 font-mono text-muted-foreground">{formatFocusValue(occ)}</span>
						</a>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2 text-xs">
				<span class={caption({ weight: 'medium' })}>More:</span>
				{#each [
					{ href: '/roles', label: 'Modern Roles' },
					{ href: '/rankings', label: 'All Rankings' },
					{ href: '/compare', label: 'Compare' },
					{ href: '/methodology', label: 'Methodology' }
				] as link}
					<a
						href={link.href}
						class="rounded-md border border-border bg-card px-2.5 py-1 font-medium text-foreground transition-colors hover:bg-accent"
					>
						{link.label}
					</a>
				{/each}
			</div>

			<p class="mt-4 text-xs text-muted-foreground">
				Homepage default surface: {data.surface.config.displayName} · Structural release {DATA_VINTAGE.model_version}
				· {surfaceOccupations.length.toLocaleString()} records · MIT licensed
			</p>
		</div>
	</div>
</div>
