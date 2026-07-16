<script lang="ts">
	import {
		pageLayout,
		card,
		sectionLabel,
		title as titleStyle,
		caption,
		body
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import OccupationCard from '$lib/components/ui/OccupationCard.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { buildCountryModuleStatuses } from '$lib/data/country-modules';
	import { getRiskBand } from '$lib/data/scoring-constants';

	let { data } = $props();

	const moduleStates = $derived(buildCountryModuleStatuses(data.country));
	const publishedCount = $derived(moduleStates.filter(m => m.available).length);
	const highRiskPct = $derived(
		data.stats.count > 0 ? ((data.stats.highRisk / data.stats.count) * 100).toFixed(0) : '0'
	);
	const statusLabel = $derived(
		data.country.status === 'live'
			? 'Full index published'
			: data.country.status === 'ready'
				? 'Data ready, publishing soon'
				: data.country.status === 'planned'
					? 'Coming soon'
					: 'In research'
	);

	/** Plain-language descriptions for evidence modules */
	const userFriendlyModules: Record<string, { title: string; description: string }> = {
		structuralProfile: {
			title: 'AI exposure signals',
			description: 'How much each job overlaps with what AI can do today.'
		},
		wageContext: {
			title: 'Local salary data',
			description: 'Median and percentile wages from official sources.'
		},
		employmentContext: {
			title: 'Employment data',
			description: 'How many people work in each occupation and projected trends.'
		},
		demandSignals: {
			title: 'Job market demand',
			description: 'Shortage lists, vacancy data, and hiring outlook from government sources.'
		},
		transitionCapacity: {
			title: 'Career transition support',
			description: 'Training programmes and redeployment pathways available to workers.'
		},
		workerProfile: {
			title: 'Worker demographics',
			description: 'Age, gender, qualification, and experience breakdowns by occupation.'
		},
		skillsContext: {
			title: 'Skills and task detail',
			description: 'What tasks make up the job and which specific skills matter most.'
		},
		narrativeContext: {
			title: 'Job descriptions',
			description: 'What the job involves day-to-day, work environment, and typical entry routes.'
		},
		adoptionContext: {
			title: 'Real-world AI adoption',
			description: 'Observed AI usage data used as one input to the relative change signal.'
		},
		regulatoryOverlay: {
			title: 'Licensing and regulation',
			description: 'Professional licensing, compliance, and public-sector constraints.'
		}
	};
</script>

<Seo
	title={data.country.seoTitle}
	description={data.country.seoDescription}
	path={data.country.routePrefix}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: data.country.displayName }]} />

	<!-- Hero -->
	<section class="max-w-3xl">
		<p class={sectionLabel()}>Country Index</p>
		<h1 class={titleStyle({ size: 'page' })}>{data.country.displayName}</h1>
		<p class={cn(body({ size: 'lg', tone: 'muted' }), 'mt-3')}>
			{#if data.country.status === 'live'}
				AI displacement pressure scores for every occupation, combined with local wages, job market
				demand signals, and government support programmes.
			{:else if data.country.status === 'ready'}
				AI exposure rankings combined with local wages, employment projections, and skills data.
				Full index publishing soon.
			{:else}
				AI exposure rankings based on the global structural baseline. Local data layers are being
				prepared.
			{/if}
		</p>
	</section>

	<!-- Key stats -->
	<section class="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
		<div class={card({ padding: 'sm' })}>
			<p class={caption({ weight: 'medium' })}>Occupations scored</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">{data.stats.count.toLocaleString()}</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class={caption({ weight: 'medium' })}>High pressure</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{data.stats.highRisk.toLocaleString()}
			</p>
			<p class={caption()}>
				{highRiskPct}% of all occupations score above 30%
			</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class={caption({ weight: 'medium' })}>Median AI Exposure Rank</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">
				{(data.stats.medianRisk * 100).toFixed(0)}%
			</p>
			<p class={caption()}>Midpoint across all occupations</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class={caption({ weight: 'medium' })}>Index status</p>
			<p class="mt-1 text-lg font-semibold text-foreground">{statusLabel}</p>
			{#if data.stats.medianWage != null}
				<p class={caption()}>
					Median wage: {data.country.currency}
					{data.stats.medianWage.toLocaleString()}/{data.country.wagePeriod === 'annual'
						? 'yr'
						: 'mo'}
				</p>
			{/if}
		</div>
	</section>

	<!-- Available data -->
	<section class="mt-8">
		<p class={sectionLabel()}>What data is available</p>
		<p class={cn(caption(), 'mt-1')}>
			{publishedCount} of {moduleStates.length} research areas are published for {data.country
				.name}.
		</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each moduleStates as module}
				{@const friendly = userFriendlyModules[module.key]}
				<div
					class={card({
						padding: 'sm',
						variant: module.available ? 'default' : 'subtle',
						accent: module.available ? 'primary' : 'none'
					})}
				>
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="text-sm font-semibold text-foreground">{friendly?.title ?? module.title}</p>
							<p class="mt-1 text-sm text-muted-foreground">
								{friendly?.description ??
									(module.available ? module.publishedDescription : module.unavailableDescription)}
							</p>
						</div>
						<span
							class={cn(
								'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
								module.available
									? 'bg-risk-very-low/10 text-risk-very-low'
									: 'bg-muted text-muted-foreground'
							)}
						>
							{module.available ? 'Available' : 'Coming'}
						</span>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Top risk occupations -->
	<section class="mt-8">
		<p class={sectionLabel()}>Highest pressure occupations</p>
		<p class={cn(caption(), 'mt-1')}>
			Occupations with the most structural overlap between AI capabilities and current job tasks.
		</p>
		{#if data.rows.length > 0}
			<div class="mt-3 space-y-1.5">
				{#each data.rows as row, i}
					<OccupationCard
						occupation={{
							title: row.title,
							linkHref:
								data.country.code === 'sg'
									? `/occupation/${row.code}`
									: `${data.country.routePrefix}/occupation/${row.code}`,
							net_risk: row.risk,
							risk_band: getRiskBand(row.risk),
							gross_wage_median: row.wage ?? undefined,
							currency: data.country.currency
						}}
						mode="compact"
						index={i + 1}
						indexColor="text-risk-very-high"
						rightColor="text-risk-very-high"
					/>
				{/each}
			</div>
		{:else}
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
				<p class="text-sm font-semibold text-foreground">Local data coming soon</p>
				<p class="mt-1 text-sm text-muted-foreground">
					You can view global AI exposure rankings for all occupations while we prepare local data
					for {data.country.name}.
				</p>
			</div>
		{/if}
	</section>

	<!-- Next steps -->
	<section class="mt-10 border-t border-border pt-6">
		<p class={sectionLabel()}>Explore further</p>
		<div class="mt-3 grid gap-3 sm:grid-cols-3">
			<a href="/explore" class="block no-underline">
				<div class={cn(card({ padding: 'sm', hover: true }), 'h-full')}>
					<p class="text-sm font-semibold text-foreground">Browse all occupations</p>
					<p class={cn(caption(), 'mt-1')}>Filter, search, and compare detailed risk profiles</p>
				</div>
			</a>
			<a href="/compare" class="block no-underline">
				<div class={cn(card({ padding: 'sm', hover: true }), 'h-full')}>
					<p class="text-sm font-semibold text-foreground">Compare occupations</p>
					<p class={cn(caption(), 'mt-1')}>Side-by-side risk and demand analysis</p>
				</div>
			</a>
			<a href="/methodology" class="block no-underline">
				<div class={cn(card({ padding: 'sm', hover: true }), 'h-full')}>
					<p class="text-sm font-semibold text-foreground">How scores work</p>
					<p class={cn(caption(), 'mt-1')}>Understand the methodology and data sources</p>
				</div>
			</a>
		</div>
	</section>
</main>
