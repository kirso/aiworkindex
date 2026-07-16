<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import Treemap from '$lib/components/viz/Treemap.svelte';
	import Histogram from '$lib/components/viz/Histogram.svelte';
	import DemandPressureMatrix from '$lib/components/viz/DemandPressureMatrix.svelte';
	import HeroSearch from '$lib/components/ui/HeroSearch.svelte';
	import FilterPanel from '$lib/components/ui/FilterPanel.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import OccupationCard from '$lib/components/ui/OccupationCard.svelte';
	import OccupationCardList from '$lib/components/ui/OccupationCardList.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { card, sectionLabel, caption, pill, badge } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';
	import type { RiskBand, ImpactType } from '$lib/data';
	import type { Occupation } from '$lib/data';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import { shortTitle } from '$lib/data/display-names';
	import { formatCompactCount, type HomeSurfaceItem } from '$lib/data/home-surface';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';
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
			? [...filteredOccupations].sort((a, b) => b.surfaceFootprint - a.surfaceFootprint)
			: [...filteredOccupations].sort(
					(a, b) => b.market.market_resilience - a.market.market_resilience
				)
		).slice(0, 5)
	);
	let focusCardTitle = $derived(
		data.surface.code === 'global' ? 'Most mapped occupations' : 'Strongest Demand'
	);
	let focusCardHref = $derived(
		data.surface.code === 'global'
			? '/global'
			: data.surface.code === 'sg'
				? '/rankings/high-exposure-in-demand'
				: data.surface.config.routePrefix
	);

	const chartTabs = [
		{ key: 'treemap' as const, label: 'Occupation Map' },
		{ key: 'pressure' as const, label: 'Demand vs Exposure' },
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
			return `${formatCompactCount(occ.surfaceFootprint)} mapped occupations`;
		}
		return `${(occ.market.market_resilience * 100).toFixed(0)}%`;
	}

	const faqItems = [
		{
			question: 'Will AI take my job?',
			answer:
				'The index cannot predict whether an individual will lose a job. It shows how exposed an occupation is to current AI capabilities, what still requires people, and whether current hiring demand may soften the impact.'
		},
		{
			question: 'What does the AI Exposure Rank mean?',
			answer:
				'A rank of 72/100 means the occupation is more exposed to AI capabilities than approximately 72% of Singapore occupations. It is a relative rank, not a 72% probability of job loss.'
		}
	];
</script>

<Seo
	title="Will AI Take My Job? AI Exposure by Occupation"
	description="Search 562 Singapore occupations to see how exposed their work is to AI, what still needs people, and whether hiring demand may soften the impact."
	path="/"
	ogImage="/og/default.png"
	jsonLd={[buildFaqJsonLd(faqItems)]}
/>

<div class="border-b border-risk-moderate-border bg-risk-moderate-subtle">
	<div
		class="mx-auto flex max-w-screen-2xl items-center justify-center gap-2 px-4 py-1.5 text-xs sm:px-6"
	>
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
				Will AI take your job?
			</h1>
			<p class="mt-1.5 text-sm text-muted-foreground">
				See how exposed the work is, what still needs people, and what hiring demand looks like.
			</p>
			<div class="mt-4">
				<HeroSearch
					occupations={surfaceOccupations as unknown as Occupation[]}
					occupationHrefPrefix={data.surface.code === 'global'
						? '/global/occupation'
						: data.surface.config.routePrefix}
					marketLabel={data.surface.config.displayName}
					occupationValueLabel={data.surface.valueLabel}
				/>
			</div>

			<Tooltip.Provider delayDuration={150}>
				<div class="mt-6 grid grid-cols-3 gap-4 text-center">
					{#each data.surface.metrics as metric}
						<div>
							<p class="font-mono text-xl font-bold text-foreground sm:text-2xl">
								{metric.value}
							</p>
							<p class="inline-flex items-center gap-1 text-xs text-muted-foreground">
								{metric.label}
								{#if metric.tooltip}
									<Tooltip.Root>
										<Tooltip.Trigger>
											<svg
												class="h-3 w-3 text-text-ghost transition-colors hover:text-foreground"
												viewBox="0 0 16 16"
												fill="currentColor"
											>
												<path
													d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
												/>
												<path
													d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"
												/>
											</svg>
										</Tooltip.Trigger>
										<Tooltip.Content sideOffset={6} class="max-w-xs">
											{metric.tooltip}
										</Tooltip.Content>
									</Tooltip.Root>
								{/if}
							</p>
						</div>
					{/each}
				</div>
			</Tooltip.Provider>

			<div class="mt-4 flex flex-wrap items-center justify-center gap-2">
				<a
					href="/rankings/highest-risk"
					class={pill({ size: 'lg', tone: 'outline', interactive: true })}
				>
					Most exposed jobs →
				</a>
				<a
					href="/rankings/high-exposure-in-demand"
					class={pill({ size: 'lg', tone: 'outline', interactive: true })}
				>
					In demand, higher AI exposure →
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
		<span class={caption({ weight: 'medium' })}>View:</span>
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
					valueLabel={data.surface.code === 'global' ? 'Mapped occupations' : 'Wage range'}
					valuePrefix={data.surface.code === 'global' ? null : data.surface.config.currency}
					valueMin={surfaceValueScale.min}
					valueMax={surfaceValueScale.max}
					valueStep={surfaceValueScale.step}
				/>

				<div class="mt-3 border-t border-border pt-3">
					<p class={caption({ weight: 'semibold' })}>AI Exposure Bands</p>
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
								valueLabel={data.surface.code === 'global' ? 'Mapped occupations' : 'Wage range'}
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
						<Tabs.List class="w-full overflow-x-auto md:w-auto">
							{#each chartTabs as tab (tab.key)}
								<Tabs.Trigger
									value={tab.key}
									class="shrink-0 whitespace-nowrap text-xs sm:flex-1 sm:text-sm md:flex-initial"
								>
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
								View all {filteredOccupations.length}
								{data.surface.code === 'global' ? 'occupation groups' : 'occupations'} →
							</a>
						{/if}
					</Tabs.Content>
					<Tabs.Content value="pressure">
						<DemandPressureMatrix
							occupations={filteredOccupations as unknown as Occupation[]}
							surfaceLabel={data.surface.config.displayName}
							xAccessor={data.surface.code === 'sg' ? 'net_risk' : 'structuralPressure'}
							xAxisLabel={data.surface.code === 'sg' ? 'AI Exposure Rank' : 'Relative AI exposure'}
							yAxisLabel={data.surface.code === 'global'
								? 'Human bottleneck protection'
								: 'Demand resilience'}
							quadrantLabels={data.surface.code === 'global'
								? [
										{ label: 'Lower exposure, high human advantage', x: 0.1, y: 0.85 },
										{ label: 'Lower exposure, low human advantage', x: 0.1, y: 0.15 },
										{ label: 'Higher exposure, high human advantage', x: 0.55, y: 0.85 },
										{ label: 'Higher exposure, low human advantage', x: 0.55, y: 0.15 }
									]
								: data.surface.code === 'us'
									? [
											{ label: 'Lower exposure, high demand', x: 0.1, y: 0.85 },
											{ label: 'Lower exposure, low demand', x: 0.1, y: 0.15 },
											{ label: 'Higher exposure, high demand', x: 0.55, y: 0.85 },
											{ label: 'Higher exposure, low demand', x: 0.55, y: 0.15 }
										]
									: undefined}
						/>
					</Tabs.Content>
					<Tabs.Content value="distribution">
						<Histogram
							occupations={filteredOccupations as unknown as Occupation[]}
							scoreLabel="AI Exposure Rank"
						/>
					</Tabs.Content>
				</Tabs.Root>
			</div>

			<div class="grid gap-4 pb-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>Most exposed to AI</h3>
						<a href="/rankings/highest-risk" class="text-xs text-primary hover:underline">All →</a>
					</div>
					{#each topHighRisk as occ, i (occ.displayCode)}
						<OccupationCard
							occupation={{
								title: shortTitle(occ.title),
								linkHref: occ.linkHref ?? '/global',
								net_risk: occ.net_risk,
								risk_band: occ.risk_band
							}}
							mode="compact"
							index={i + 1}
							indexColor="text-risk-very-high"
							rightColor="text-risk-very-high"
						/>
					{/each}
				</div>

				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>Lowest AI Exposure</h3>
						<a href="/rankings/safest-high-paying" class="text-xs text-primary hover:underline">
							All →
						</a>
					</div>
					{#each topSafest as occ, i (occ.displayCode)}
						<OccupationCard
							occupation={{
								title: shortTitle(occ.title),
								linkHref: occ.linkHref ?? '/global',
								net_risk: occ.net_risk,
								risk_band: occ.risk_band
							}}
							mode="compact"
							index={i + 1}
							indexColor="text-risk-very-low"
							rightColor="text-risk-very-low"
						/>
					{/each}
				</div>

				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>AI-Augmented</h3>
						<a href="/rankings/ai-leveraged" class="text-xs text-primary hover:underline">All →</a>
					</div>
					{#each topAugmented as occ, i (occ.displayCode)}
						<OccupationCard
							occupation={{
								title: shortTitle(occ.title),
								linkHref: occ.linkHref ?? '/global',
								net_risk: occ.net_risk,
								risk_band: occ.risk_band
							}}
							mode="compact"
							index={i + 1}
							indexColor="text-impact-leveraged"
							rightLabel={riskBandLabels[occ.risk_band]}
						/>
					{/each}
				</div>

				<div class={card({ padding: 'sm' })}>
					<div class="mb-2 flex items-center justify-between">
						<h3 class={sectionLabel()}>{focusCardTitle}</h3>
						<a href={focusCardHref} class="text-xs text-primary hover:underline"> All → </a>
					</div>
					{#each topFocus as occ, i (occ.displayCode)}
						<OccupationCard
							occupation={{
								title: shortTitle(occ.title),
								linkHref: occ.linkHref ?? '/global',
								net_risk: occ.net_risk,
								risk_band: occ.risk_band
							}}
							mode="compact"
							index={i + 1}
							indexColor="text-risk-very-low"
							rightLabel={formatFocusValue(occ)}
						/>
					{/each}
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2 text-xs">
				<span class={caption({ weight: 'medium' })}>More:</span>
				{#each [{ href: '/roles', label: 'Modern Roles' }, { href: '/rankings', label: 'All Rankings' }, { href: '/ai-proof-jobs', label: 'AI-Proof Jobs' }, { href: '/ai-job-loss', label: 'AI Job Loss' }, { href: '/will-ai-take-my-job', label: 'Will AI Take My Job?' }, { href: '/compare', label: 'Compare' }, { href: '/methodology', label: 'Methodology' }] as link}
					<a href={link.href} class={badge({ variant: 'outline' })}>
						{link.label}
					</a>
				{/each}
			</div>

			<p class="mt-4 text-xs text-muted-foreground">
				{data.surface.config.displayName} · {DATA_VINTAGE.public_version} · {surfaceOccupations.length.toLocaleString()}
				occupations
			</p>

			<FaqList items={faqItems} />
		</div>
	</div>
</div>
