<script lang="ts">
	import { browser } from '$app/environment';
	import { riskBandLabels, impactTypeLabels, augmentationBandLabels } from '$lib/data';
	import {
		card,
		riskBadge,
		impactBadge,
		confidenceBadge,
		pageLayout,
		display,
		title as titleStyle,
		sectionLabel,
		caption,
		pill,
		chip,
		scoreTileClasses,
		microLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { vacancySignalClass } from '$lib/data/detail-display';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ContextItemGrid from '$lib/components/ui/ContextItemGrid.svelte';
	import PostingsSignalSummary from '$lib/components/ui/PostingsSignalSummary.svelte';
	import { siteStatus } from '$lib/data/site-status';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';
	import {
		computeOutlook,
		scenarioPresets,
		seniorityAdjustments,
		outlookStatusLabels,
		outlookStatusColors,
		directionLabels,
		directionColors,
		type SeniorityLevel
	} from '$lib/data/forecast-engine';
	import {
		WATCHLIST_KEY,
		hasWatchlistEntry,
		parseStoredWatchlist,
		serializeWatchlist,
		toggleWatchlistEntry
	} from '$lib/watchlist';
	import { getTransitionProgrammeUrl } from '$lib/data/detail-context';
	import { toast } from 'svelte-sonner';
	import { buildMarketNowSummary, buildMarketDetailBullets } from '$lib/data/market-summary';

	let { data } = $props();
	let scored = $derived(data.scored);
	let structural = $derived(data.structural);
	let context = $derived(data.context);

	let isWatchlisted = $state(false);
	$effect(() => {
		if (!browser) return;
		try {
			const entries = parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY));
			isWatchlisted = hasWatchlistEntry(entries, { kind: 'role', id: scored.slug });
		} catch {
			isWatchlisted = false;
		}
	});

	function toggleWatchlist() {
		if (!browser) return;
		try {
			const nextEntries = toggleWatchlistEntry(
				parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY)),
				{
					kind: 'role',
					id: scored.slug
				}
			);
			isWatchlisted = hasWatchlistEntry(nextEntries, { kind: 'role', id: scored.slug });
			localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(nextEntries));
			toast(isWatchlisted ? 'Added to watchlist' : 'Removed from watchlist', {
				description: scored.title
			});
		} catch {}
	}

	let transitions = $derived(structural.transitions);
	let singaporeContext = $derived(context.singaporeContext);
	let industryContext = $derived(context.industryContext);
	let workerProfile = $derived(context.workerProfile);
	let geographyContext = $derived(context.geographyContext);
	let primaryOccupation = $derived(context.primaryOccupation);
	let transitionSupport = $derived(context.transitionSupport);
	let offsetPotential = $derived(context.offsetPotential);
	let postings = $derived(context.postings);
	let employerPressure = $derived(context.employerPressure);
	let localContextItems = $derived(singaporeContext.items);
	let marketNowSummary = $derived(
		buildMarketNowSummary(primaryOccupation?.labour_monitor ?? null, postings, employerPressure)
	);
	let marketDetailBullets = $derived(
		buildMarketDetailBullets(primaryOccupation?.labour_monitor ?? null, postings, employerPressure)
	);
	let roleWaterfallSubject = $derived.by(() => {
		const weightedAnthropicGap = scored.components.reduce((sum, component) => {
			const gap = component.occupation?.evidence.anthropic_gap ?? 0;
			return sum + gap * component.weight;
		}, 0);
		const solMatch: false | 'prefix' = scored.components.some(
			component => component.occupation?.evidence.sol_match
		)
			? 'prefix'
			: false;
		const jobsInDemandMatch: false | 'prefix' = scored.components.some(
			component => component.occupation?.evidence.jobs_in_demand_match
		)
			? 'prefix'
			: false;
		return {
			exposure: scored.exposure,
			bottleneck: scored.bottleneck,
			net_risk: scored.net_risk,
			market: {
				market_resilience: scored.market_resilience
			},
			evidence: {
				anthropic_calibrated: scored.components.some(
					component => component.occupation?.evidence.anthropic_calibrated
				),
				anthropic_gap: scored.components.some(
					component => component.occupation?.evidence.anthropic_gap !== null
				)
					? weightedAnthropicGap
					: null,
				sol_match: solMatch,
				jobs_in_demand_match: jobsInDemandMatch
			}
		};
	});

	// Outlook (inline, base case)
	let selectedSeniority = $state<SeniorityLevel>('mid');
	let baseOutlook = $derived.by(() => {
		if (!primaryOccupation) return null;
		return computeOutlook(primaryOccupation, {
			...scenarioPresets.base.params,
			seniority: selectedSeniority
		});
	});
	const outlookDimensions = [
		{ key: 'displacement_pressure', label: 'Displacement' },
		{ key: 'augmentation_upside', label: 'Augmentation' },
		{ key: 'demand_outlook', label: 'Demand' },
		{ key: 'wage_pressure', label: 'Wage Pressure' }
	] as const;

	let showMoreContext = $state(false);

	function pressureBarClass(v: number) {
		return v >= 0.5
			? 'bg-risk-very-high'
			: v >= 0.3
				? 'bg-risk-high'
				: v >= 0.15
					? 'bg-risk-moderate'
					: 'bg-risk-very-low';
	}

	function marketBarClass(v: number) {
		return v >= 0.6 ? 'bg-risk-very-low' : v >= 0.35 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	function confidenceBarClass(level: string) {
		return level === 'high'
			? 'bg-risk-very-low'
			: level === 'medium'
				? 'bg-risk-moderate'
				: 'bg-risk-high';
	}

	function moatBarClass(v: number) {
		return v >= 0.6 ? 'bg-risk-very-low' : v >= 0.3 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	function labourStateLabel(state: string | null | undefined) {
		if (state === 'strong') return 'Strong';
		if (state === 'moderate') return 'Moderate';
		if (state === 'weak') return 'Weak';
		return 'Watch';
	}

	function labourStateClass(state: string | null | undefined) {
		if (state === 'strong') return 'bg-risk-very-low/10 text-risk-very-low';
		if (state === 'moderate') return 'bg-risk-moderate/10 text-risk-moderate';
		return 'bg-risk-high/10 text-risk-high';
	}

	function offsetLevelLabel(value: number, inverse = false) {
		const score = inverse ? 1 - value : value;
		if (score >= 0.68) return 'High';
		if (score >= 0.42) return 'Medium';
		return 'Low';
	}

	let signalProfileItems = $derived([
		{
			label: 'Pressure',
			value: `${(scored.net_risk * 100).toFixed(0)}%`,
			barValue: scored.net_risk,
			barClass: pressureBarClass(scored.net_risk)
		},
		{
			label: 'Market',
			value: `${(scored.market_resilience * 100).toFixed(0)}%`,
			barValue: scored.market_resilience,
			barClass: marketBarClass(scored.market_resilience)
		},
		{
			label: 'Confidence',
			value: `${(scored.confidence_score * 100).toFixed(0)}%`,
			barValue: scored.confidence_score,
			barClass: confidenceBarClass(scored.confidence)
		},
		{
			label: 'Human Moat',
			value: scored.bottleneck >= 0.6 ? 'High' : scored.bottleneck >= 0.3 ? 'Medium' : 'Low',
			valueClass: 'font-sans text-sm font-semibold text-foreground',
			barValue: scored.bottleneck,
			barClass: moatBarClass(scored.bottleneck)
		}
	]);

	let roleJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Occupation',
			name: scored.title,
			description:
				'Estimated modern role — weighted blend of ' +
				scored.components.length +
				' official Singapore occupations',
			occupationLocation: { '@type': 'Country', name: 'Singapore' },
			additionalProperty: [
				{ '@type': 'PropertyValue', name: 'AI Net Displacement Risk', value: scored.net_risk },
				{ '@type': 'PropertyValue', name: 'Risk Band', value: riskBandLabels[scored.risk_band] },
				{
					'@type': 'PropertyValue',
					name: 'Estimate Type',
					value: 'Synthetic role (weighted SSOC blend)'
				}
			]
		})}<\/script>`
	);

	let breadcrumbJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
				{
					'@type': 'ListItem',
					position: 2,
					name: scored.title,
					item: SITE.url + '/role/' + scored.slug
				}
			]
		})}<\/script>`
	);

	let faqJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: 'Will AI replace ' + scored.title + ' in Singapore?',
					acceptedAnswer: {
						'@type': 'Answer',
						text:
							structural.summaryText +
							' Estimated displacement risk: ' +
							(scored.net_risk * 100).toFixed(0) +
							'% (' +
							riskBandLabels[scored.risk_band] +
							').'
					}
				}
			]
		})}<\/script>`
	);

	let pageTitle = $derived(`${scored.title} — AI Risk Estimate | AI Work Index`);
	let pageDescription = $derived(
		`${scored.title}: Estimated AI risk ${(scored.net_risk * 100).toFixed(0)}%, rated ${riskBandLabels[scored.risk_band]}. Based on ${scored.components.length} official occupations.`
	);
</script>

<Seo
	title={pageTitle}
	description={pageDescription}
	path="/role/{scored.slug}"
	ogImage="/og/role-{scored.slug}.png"
	jsonLd={[roleJsonLd, breadcrumbJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Roles', href: '/roles' },
			{ label: scored.title }
		]}
	/>

	<!-- ===== BLOCK 1: THE VERDICT ===== -->
	<div class={cn(card({ padding: 'lg' }), 'mb-8 overflow-hidden')}>
		<div class="grid gap-6 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-start">
			<div class={cn('rounded-2xl border p-5', scoreTileClasses(scored.risk_band))}>
				<p class={microLabel()}>Structural pressure</p>
				<p class={cn(display({ size: 'xl' }), 'mt-2')}>{(scored.net_risk * 100).toFixed(0)}%</p>
				<span class={cn(riskBadge({ band: scored.risk_band }), 'mt-2 inline-flex')}>
					{riskBandLabels[scored.risk_band]} Risk
				</span>
				{#if scored.risk_range}
					<div class="mt-5 border-t border-border/70 pt-3">
						<p class={microLabel()}>Likely range</p>
						<p class="mt-1 font-mono text-sm text-foreground">
							{(scored.risk_range.optimistic * 100).toFixed(0)}–{(
								scored.risk_range.pessimistic * 100
							).toFixed(0)}%
						</p>
					</div>
				{/if}
			</div>

			<div class="min-w-0">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
					<div class="min-w-0">
						<h1 class={titleStyle({ size: 'page' })}>{scored.title}</h1>
						<p class={caption({ weight: 'medium' })}>{scored.description}</p>
						<p class="mt-3 max-w-3xl text-[15px] leading-relaxed text-text-secondary">
							{structural.summaryText}
						</p>
					</div>

					<div class="flex items-center gap-2 shrink-0">
						<Button
							variant="outline"
							size="sm"
							class="h-8 text-xs"
							href="/compare?entities=role:{scored.slug}"
						>
							Compare
						</Button>
						<Button
							variant={isWatchlisted ? 'default' : 'outline'}
							size="sm"
							class="h-8 gap-1.5 text-xs"
							onclick={toggleWatchlist}
						>
							<svg
								class="h-3.5 w-3.5"
								viewBox="0 0 24 24"
								fill={isWatchlisted ? 'currentColor' : 'none'}
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
							</svg>
							{isWatchlisted ? 'Saved' : 'Save'}
						</Button>
					</div>
				</div>

				{#if scored.dispersion > 0.08}
					<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'mt-4')}>
						<p class="text-xs font-medium text-foreground">
							Risk depends on your actual work split
						</p>
						<div class="mt-2 flex items-center gap-2">
							<span class="font-mono text-xs text-risk-very-low"
								>{(scored.risk_range.optimistic * 100).toFixed(0)}%</span
							>
							<div class="relative h-1.5 flex-1 rounded-full bg-border">
								<div
									class="absolute h-full rounded-full bg-gradient-to-r from-risk-very-low to-risk-very-high"
									style="left: {Math.max(scored.risk_range.optimistic * 100, 0)}%; right: {Math.max(
										100 - scored.risk_range.pessimistic * 100,
										0
									)}%;"
								></div>
								<div
									class="absolute -top-[3px] h-3 w-0.5 rounded-full bg-foreground"
									style="left: {scored.net_risk * 100}%;"
								></div>
							</div>
							<span class="font-mono text-xs text-risk-very-high"
								>{(scored.risk_range.pessimistic * 100).toFixed(0)}%</span
							>
						</div>
					</div>
				{/if}

				<div class="mt-4 flex flex-col gap-3">
					<div class="flex flex-wrap items-center gap-2">
						<span class={impactBadge({ type: scored.impact_type })}>
							{impactTypeLabels[scored.impact_type]}
						</span>
						<span class={confidenceBadge({ level: scored.confidence })}>
							{scored.confidence.charAt(0).toUpperCase() + scored.confidence.slice(1)} Confidence
						</span>
						<span class={pill({ tone: 'muted' })}>
							Estimated · {scored.components.length}-part blend
						</span>
					</div>
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
						<span>Higher risk than {structural.riskPercentile}% of occupations</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Built from: surface component occupations above the fold -->
		<div class="mt-5 border-t border-border/70 pt-4">
			<p class={cn(microLabel(), 'mb-2')}>Built from {scored.components.length} official occupations</p>
			<div class="flex flex-wrap gap-x-4 gap-y-1">
				{#each scored.components as comp}
					{#if comp.occupation}
						<a
							href="/occupation/{comp.ssoc}"
							class="text-xs text-text-secondary hover:text-primary hover:underline underline-offset-2"
						>
							{comp.occupation.title}
							<span class="tabular-nums text-muted-foreground">({(comp.weight * 100).toFixed(0)}%)</span>
						</a>
					{/if}
				{/each}
			</div>
		</div>

		<div class="mt-4 border-t border-border/70 pt-5">
			<SignalProfileGrid items={signalProfileItems} />
		</div>
	</div>

	<!-- ===== BLOCK 2: WHY THIS SCORE ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Why This Score</h2>
		<div class={card({ padding: 'md' })}>
			<div class="grid gap-6 lg:grid-cols-5">
				<!-- Left: Waterfall (3/5) -->
				<div class="lg:col-span-3">
					<DriverWaterfall occupation={roleWaterfallSubject} />
					<p class="mt-3 text-xs text-muted-foreground">
						Blended across {scored.components.length} occupations using the same score logic as an occupation
						page.
						<a href="/methodology" class="text-primary hover:underline">How this works</a>
					</p>
				</div>

				<!-- Right: What AI changes (2/5) -->
				<div class="lg:col-span-2 space-y-4">
					<div>
						<p class="text-xs font-semibold text-risk-high mb-1">Tasks AI can handle</p>
						<p class="text-sm text-muted-foreground leading-relaxed">
							{structural.personalizedContent.aiCanDo}
						</p>
					</div>
					<div>
						<p class="text-xs font-semibold text-risk-very-low mb-1">Where humans stay essential</p>
						<p class="text-sm text-muted-foreground leading-relaxed">
							{structural.personalizedContent.humanNeeded}
						</p>
					</div>
					{#if structural.personalizedContent.skills.length > 0}
						<div class="pt-3 border-t border-border">
							<p class="text-xs font-semibold text-foreground mb-2">Skills to focus on</p>
							<div class="flex flex-wrap gap-1.5">
								{#each structural.personalizedContent.skills.slice(0, 4) as skill}
									<span class={pill({ tone: 'primary' })} title={skill.description}>
										{skill.label}
									</span>
								{/each}
							</div>
						</div>
					{/if}
					{#if (structural.onetEnrichment?.technologies.length ?? 0) > 0}
						<div class="pt-3 border-t border-border">
							<p class="text-xs font-semibold text-foreground mb-2">Common tools in similar work</p>
							<div class="flex flex-wrap gap-1.5">
								{#each structural.onetEnrichment?.technologies.slice(0, 4) ?? [] as technology}
									<span class={pill({ tone: technology.hot ? 'positive' : 'muted' })}>
										{technology.name}
									</span>
								{/each}
							</div>
							<p class="mt-2 text-xs text-muted-foreground">
								{structural.onetEnrichment?.note ??
									'Derived from matched O*NET technology-skill profiles.'}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- ===== BLOCK 3: SINGAPORE REALITY ===== -->
	{#if primaryOccupation || industryContext.top_industries.length > 0 || singaporeContext.items.length > 0}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Singapore Reality</h2>
			<div class={cn(card({ padding: 'md' }), 'space-y-4')}>
				<div
					class="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between"
				>
					<div>
						<p class="text-sm font-semibold text-foreground">Current Singapore signal</p>
						<p class="text-xs text-muted-foreground">
							Labour now, industry footprint, and a directional 12-month read.
						</p>
					</div>
					{#if primaryOccupation?.labour_monitor}
						<span
							class={cn(
								'rounded-full px-2.5 py-1 text-xs font-medium',
								labourStateClass(primaryOccupation.labour_monitor.overall)
							)}
						>
							{labourStateLabel(primaryOccupation.labour_monitor.overall)} market
						</span>
					{/if}
				</div>

				{#if primaryOccupation?.labour_monitor || (postings && postings.hiring_state !== 'no_signal') || (employerPressure && employerPressure.signal_count > 0)}
					<div>
						<p class="text-sm leading-relaxed text-text-secondary">{marketNowSummary}</p>
						<div class="mt-3 grid gap-3 sm:grid-cols-3">
							{#if primaryOccupation?.labour_monitor}
								<div class={card({ padding: 'sm', variant: 'metric' })}>
									<p class={microLabel()}>Vacancy rate</p>
									<p class="mt-1 font-mono text-lg text-foreground">
										{primaryOccupation.labour_monitor.vacancy.latest_rate}%
									</p>
									<p
										class={cn(
											'text-xs font-medium',
											primaryOccupation.labour_monitor.vacancy.trend_4q_pct > 0
												? 'text-risk-very-low'
												: primaryOccupation.labour_monitor.vacancy.trend_4q_pct < 0
													? 'text-risk-high'
													: 'text-muted-foreground'
										)}
									>
										{primaryOccupation.labour_monitor.vacancy.trend_4q_pct > 0
											? '↑'
											: primaryOccupation.labour_monitor.vacancy.trend_4q_pct < 0
												? '↓'
												: '→'}
										{Math.abs(primaryOccupation.labour_monitor.vacancy.trend_4q_pct).toFixed(1)}%
										year-on-year
									</p>
								</div>
							{/if}
							{#if primaryOccupation?.labour_monitor?.hiring}
								<div class={card({ padding: 'sm', variant: 'metric' })}>
									<p class={microLabel()}>Hiring balance</p>
									<p class="mt-1 font-mono text-lg text-foreground">
										{primaryOccupation.labour_monitor.hiring.recruitment_rate}%
									</p>
									<p class="text-xs text-muted-foreground">
										recruit vs {primaryOccupation.labour_monitor.hiring.resignation_rate}% resign
									</p>
								</div>
							{/if}
							{#if primaryOccupation?.labour_monitor?.retrenchment?.incidence_per_1000}
								<div class={card({ padding: 'sm', variant: 'metric' })}>
									<p class={microLabel()}>Retrenchment</p>
									<p class="mt-1 font-mono text-lg text-foreground">
										{primaryOccupation.labour_monitor.retrenchment.incidence_per_1000} per 1,000
									</p>
									<p class="text-xs text-muted-foreground">
										{primaryOccupation.labour_monitor.retrenchment.incidence_per_1000 < 2
											? 'Low incidence'
											: primaryOccupation.labour_monitor.retrenchment.incidence_per_1000 < 5
												? 'Moderate incidence'
												: 'Elevated'}
									</p>
								</div>
							{:else if postings && postings.hiring_state !== 'no_signal'}
								<div class={card({ padding: 'sm', variant: 'metric' })}>
									<p class={microLabel()}>Live postings</p>
									<p class="mt-1 font-mono text-lg text-foreground">
										{postings.posting_volume_30d}
									</p>
									<p class="text-xs text-muted-foreground">in the last 30 days</p>
								</div>
							{/if}
						</div>
						<p class="mt-2 text-xs text-muted-foreground">
							{primaryOccupation?.labour_monitor?.cluster_label ?? 'Cluster'} data · {siteStatus
								.live_monitor.labour_monitor_artifact_vintage}
						</p>
					</div>
				{/if}

				<div class="grid gap-5 lg:grid-cols-2">
					{#if industryContext.top_industries.length > 0}
						<div class="space-y-4">
							<div>
								<p class="text-xs font-semibold text-foreground">Top Industries</p>
								<p class="text-xs text-muted-foreground">Where this work is concentrated</p>
							</div>
							<div class="space-y-3">
								{#each industryContext.top_industries.slice(0, 3) as industry (industry.key)}
									<div class="space-y-1.5">
										<div class="flex items-start justify-between gap-3">
											<p class="min-w-0 flex-1 text-sm text-foreground">{industry.label}</p>
											{#if industry.vacancy_signal}
												<span
													class={cn(
														'text-xs shrink-0',
														vacancySignalClass(industry.vacancy_signal)
													)}
												>
													{industry.vacancy_signal === 'rising'
														? '↑ hiring'
														: industry.vacancy_signal === 'cooling'
															? '↓ cooling'
															: '→ stable'}
												</span>
											{/if}
										</div>
										<div class="flex items-center gap-2">
											<div class="h-1.5 flex-1 rounded-full bg-muted-foreground/10">
												<div
													class="h-1.5 rounded-full bg-primary/60"
													style="width: {Math.min(industry.share_2025 * 100 * 2, 100)}%;"
												></div>
											</div>
											<span class="font-mono text-xs text-muted-foreground">
												{(industry.share_2025 * 100).toFixed(0)}%
											</span>
										</div>
										{#if industry.vacancy_rank_latest !== null && industry.vacancy_rank_latest <= 5}
											<p class="text-xs text-muted-foreground">
												Top {Math.round(industry.vacancy_rank_latest)} vacancy sector
											</p>
										{/if}
									</div>
								{/each}
							</div>
							{#if industryContext.metadata?.vacancy_overlay_vintage}
								<p class="text-xs text-muted-foreground">
									Industry vacancy overlays use the latest published detailed cross-tab ({industryContext
										.metadata.vacancy_overlay_vintage}), which can lag the main labour monitor.
								</p>
							{/if}
						</div>
					{/if}

					{#if baseOutlook}
						<div class="space-y-4">
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="text-xs font-semibold text-foreground">12-Month Outlook</p>
									<p class="text-xs text-muted-foreground">Rule-based, not a prediction</p>
								</div>
								<div class="flex items-center gap-1">
									{#each ['junior', 'mid', 'senior'] as const as level}
										<button
											class={chip({ active: selectedSeniority === level })}
											onclick={() => (selectedSeniority = level)}
										>
											{seniorityAdjustments[level].label}
										</button>
									{/each}
								</div>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-lg font-semibold {directionColors[baseOutlook.direction_12m]}">
									{directionLabels[baseOutlook.direction_12m]}
								</span>
							</div>
							<div class="grid grid-cols-2 gap-3">
								{#each outlookDimensions as dim}
									{@const status = baseOutlook[dim.key]}
									{@const level =
										status === 'resilient'
											? 0.15
											: status === 'watch'
												? 0.4
												: status === 'under_pressure'
													? 0.7
													: 0.95}
									{@const barColor =
										status === 'resilient'
											? 'bg-risk-very-low'
											: status === 'watch'
												? 'bg-risk-moderate'
												: status === 'under_pressure'
													? 'bg-risk-high'
													: 'bg-risk-very-high'}
									<div>
										<div class="mb-1 flex items-center justify-between">
											<span class="text-xs text-muted-foreground">{dim.label}</span>
											<span class="text-xs font-medium {outlookStatusColors[status]}">
												{outlookStatusLabels[status]}
											</span>
										</div>
										<div class="h-1.5 w-full rounded-full bg-muted-foreground/10">
											<div
												class="h-1.5 rounded-full transition-all duration-300 {barColor}"
												style="width: {level * 100}%;"
											></div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				{#if workerProfile.items.length > 0 || geographyContext.items.length > 0 || localContextItems.length > 0}
					<div class="mt-4 border-t border-border pt-4">
						<button
							class="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
							onclick={() => (showMoreContext = !showMoreContext)}
						>
							<svg
								class="h-3 w-3 transition-transform {showMoreContext ? 'rotate-180' : ''}"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
							>
							{showMoreContext
								? 'Less local context'
								: 'Worker profile, geography & policy context'}
						</button>
						{#if showMoreContext}
							<div class="mt-3 space-y-4">
								{#if marketDetailBullets.length > 0}
									<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'space-y-3')}>
										<div>
											<p class="text-xs font-semibold text-foreground">Market detail</p>
											<p class="text-xs text-muted-foreground">
												More detailed monitor context in plain English.
											</p>
										</div>
										<ul class="space-y-1.5 text-sm text-muted-foreground">
											{#each marketDetailBullets as item}
												<li>{item}</li>
											{/each}
										</ul>
										{#if postings && postings.hiring_state !== 'no_signal'}
											<PostingsSignalSummary
												{postings}
												label="Hiring now"
												contextLabel="Role-normalized postings monitor"
											/>
										{/if}
									</div>
								{/if}
								{#if localContextItems.length > 0}
									<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'space-y-3')}>
										<div>
											<p class="text-xs font-semibold text-foreground">Local context & support</p>
											<p class="text-xs text-muted-foreground">
												Institutional, education, and transition-support signals behind the role
												estimate.
											</p>
										</div>
										<div class="flex flex-wrap gap-1.5">
											{#each localContextItems as item (item.key)}
												<span
													class={pill({
														size: 'sm',
														tone:
															item.tone === 'protective'
																? 'positive'
																: item.tone === 'pressure'
																	? 'danger'
																	: item.tone === 'support'
																		? 'primary'
																		: 'neutral'
													})}
													title={item.description}
												>
													{item.label}: {item.value}
												</span>
											{/each}
										</div>
									</div>
								{/if}
								{#if workerProfile.items.length > 0}
									<ContextItemGrid title="Worker profile" items={workerProfile.items} />
								{/if}
								{#if geographyContext.items.length > 0}
									<ContextItemGrid
										title="Where this work is concentrated"
										items={geographyContext.items}
									/>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- ===== BLOCK 4: WHAT TO DO NEXT ===== -->
	{#if transitions}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>What To Do Next</h2>
			<div class={card({ padding: 'md' })}>
				{#if offsetPotential}
					<div class="mb-4 border-b border-border pb-4">
						<div class="flex flex-wrap items-center gap-2">
							<span
								class={pill({
									tone:
										offsetPotential.band === 'high'
											? 'positive'
											: offsetPotential.band === 'medium'
												? 'warning'
												: 'danger'
								})}
							>
								Offset potential: {offsetPotential.band === 'high'
									? 'High'
									: offsetPotential.band === 'medium'
										? 'Medium'
										: 'Low'}
							</span>
							<span class="text-xs text-muted-foreground">
								Separate from the core score. This is a blended estimate of how much demand,
								redesign room, and transition support could cushion pressure.
							</span>
						</div>
						<p class="mt-2 text-sm text-text-secondary">{offsetPotential.summary}</p>
						<div class="mt-3 flex flex-wrap gap-2">
							<span class={pill({ tone: 'neutral' })}>
								Demand support: {offsetLevelLabel(offsetPotential.components.demand_persistence)}
							</span>
							<span class={pill({ tone: 'neutral' })}>
								Transition support: {offsetLevelLabel(
									offsetPotential.components.transition_support
								)}
							</span>
							<span class={pill({ tone: 'neutral' })}>
								Reallocation room: {offsetLevelLabel(offsetPotential.components.reallocation_room)}
							</span>
							<span class={pill({ tone: 'neutral' })}>
								Switching friction: {offsetLevelLabel(
									offsetPotential.components.mobility_friction,
									true
								)}
							</span>
						</div>
						{#if offsetPotential.strengths.length > 0 || offsetPotential.cautions.length > 0}
							<div class="mt-3 grid gap-3 sm:grid-cols-2">
								{#if offsetPotential.strengths.length > 0}
									<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'min-w-0')}>
										<p class="text-xs font-semibold text-impact-leveraged">What helps</p>
										<ul class="mt-2 space-y-1 text-xs text-text-secondary">
											{#each offsetPotential.strengths as item}
												<li>{item}</li>
											{/each}
										</ul>
									</div>
								{/if}
								{#if offsetPotential.cautions.length > 0}
									<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'min-w-0')}>
										<p class="text-xs font-semibold text-risk-high">What could slow it down</p>
										<ul class="mt-2 space-y-1 text-xs text-text-secondary">
											{#each offsetPotential.cautions as item}
												<li>{item}</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						{/if}
						<p class="mt-2 text-xs text-text-secondary">{offsetPotential.basis}</p>
					</div>
				{/if}

				{#if transitionSupport}
					<div class="mb-4 pb-4 border-b border-border">
						<div class="flex flex-wrap items-center gap-2">
							{#if transitionSupport.skillsfuture_eligible}
								<span class={pill({ tone: 'positive' })}> SkillsFuture eligible </span>
							{/if}
							{#each transitionSupport.recommended_programmes as programme}
								{@const programmeUrl = getTransitionProgrammeUrl(programme)}
								<a
									href={programmeUrl ?? '#'}
									target="_blank"
									rel="noopener noreferrer"
									class={pill({ tone: 'primary', interactive: true })}
								>
									{programme} ↗
								</a>
							{/each}
						</div>
						<p class="mt-2 text-xs text-text-secondary">{transitionSupport.basis}</p>
					</div>
				{/if}

				<div class="grid gap-6 sm:grid-cols-2">
					{#if transitions.easierSwitch.length > 0}
						<div>
							<p class="text-xs font-semibold text-impact-leveraged mb-2">Easier Switch</p>
							{#each transitions.easierSwitch as t (t.to_ssoc)}
								<a
									href="/occupation/{t.to_ssoc}"
									class="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 text-sm hover:bg-accent hover:text-primary transition-colors"
								>
									<span class="truncate text-text-secondary">{t.to_title}</span>
									<span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground"
										>{(t.composite * 100).toFixed(0)}%</span
									>
								</a>
							{/each}
						</div>
					{/if}
					{#if transitions.lowerRisk.length > 0}
						<div>
							<p class="text-xs font-semibold text-risk-very-low mb-2">Lower Risk</p>
							{#each transitions.lowerRisk as t (t.to_ssoc)}
								<a
									href="/occupation/{t.to_ssoc}"
									class="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 text-sm hover:bg-accent hover:text-primary transition-colors"
								>
									<span class="truncate text-text-secondary">{t.to_title}</span>
									<span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground"
										>{(t.composite * 100).toFixed(0)}%</span
									>
								</a>
							{/each}
						</div>
					{/if}
					{#if transitions.betterPay.length > 0}
						<div>
							<p class="text-xs font-semibold text-risk-moderate mb-2">Better Pay</p>
							{#each transitions.betterPay as t (t.to_ssoc)}
								<a
									href="/occupation/{t.to_ssoc}"
									class="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 text-sm hover:bg-accent hover:text-primary transition-colors"
								>
									<span class="truncate text-text-secondary">{t.to_title}</span>
									<span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground"
										>{(t.composite * 100).toFixed(0)}%</span
									>
								</a>
							{/each}
						</div>
					{/if}
					{#if transitions.strongDemand.length > 0}
						<div>
							<p class="text-xs font-semibold text-chart-5 mb-2">Strong Demand</p>
							{#each transitions.strongDemand as t (t.to_ssoc)}
								<a
									href="/occupation/{t.to_ssoc}"
									class="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 text-sm hover:bg-accent hover:text-primary transition-colors"
								>
									<span class="truncate text-text-secondary">{t.to_title}</span>
									<span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground"
										>{(t.composite * 100).toFixed(0)}%</span
									>
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<div class="mt-4 pt-4 border-t border-border flex items-center justify-between">
					<p class="text-xs text-muted-foreground">Compare with similar roles or occupations</p>
					<a
						href="/compare?entities=role:{scored.slug}"
						class="text-xs font-medium text-primary hover:underline"
					>
						Compare with... →
					</a>
				</div>
			</div>
		</section>
	{/if}

	<!-- ===== TECHNICAL DETAILS ===== -->
	<Collapsible.Root class={cn(card({ padding: 'none' }), 'mb-8')}>
		<Collapsible.Trigger
			class="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
		>
			Technical Details · {scored.components.length} components · {scored.confidence} confidence
			<svg
				class="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
			>
		</Collapsible.Trigger>
		<Collapsible.Content class="border-t border-border px-5 py-4">
			<div class="grid gap-4 sm:grid-cols-2 text-xs text-muted-foreground">
				<div>
					<p class="font-semibold text-foreground mb-1">Built From</p>
					{#each scored.components as comp}
						<div class="flex items-center justify-between py-0.5">
							{#if comp.occupation}
								<a href="/occupation/{comp.ssoc}" class="hover:text-primary"
									>{comp.occupation.title} (SSOC {comp.ssoc})</a
								>
							{:else}
								<span>SSOC {comp.ssoc} — not found</span>
							{/if}
							<span class="tabular-nums font-mono font-medium"
								>{(comp.weight * 100).toFixed(0)}%</span
							>
						</div>
					{/each}
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Augmentation</p>
					<p>
						{augmentationBandLabels[scored.augmentation_band]} ({(
							scored.augmentation * 100
						).toFixed(0)}%)
					</p>
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Dispersion</p>
					<p class="font-mono">
						{(scored.dispersion * 100).toFixed(1)}pp spread · {(
							scored.risk_range.optimistic * 100
						).toFixed(0)}%–{(scored.risk_range.pessimistic * 100).toFixed(0)}% range
					</p>
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Raw Scores</p>
					<p class="font-mono">
						Exp {scored.exposure.toFixed(3)} · Bot {scored.bottleneck.toFixed(3)} · Mkt {scored.market_resilience.toFixed(
							3
						)}
					</p>
				</div>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</main>
