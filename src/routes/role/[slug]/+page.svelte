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
		scoreTileClasses,
		microLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { vacancySignalClass } from '$lib/data/detail-display';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import WorkflowRadar from '$lib/components/viz/WorkflowRadar.svelte';
	import SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ContextItemGrid from '$lib/components/ui/ContextItemGrid.svelte';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';
	import {
		WATCHLIST_KEY,
		hasWatchlistEntry,
		parseStoredWatchlist,
		serializeWatchlist,
		toggleWatchlistEntry
	} from '$lib/watchlist';
	import { getTransitionProgrammeUrl } from '$lib/data/detail-context';
	import { toast } from 'svelte-sonner';
	import { buildMarketDetailBullets } from '$lib/data/market-summary';

	let { data } = $props();
	let scored = $derived(data.scored);
	let structural = $derived(data.structural);
	let context = $derived(data.context);
	let decision = $derived(structural.decision);

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

	const workflowDimensionLabels = {
		creative_generation: 'Creative generation',
		real_time_coordination: 'Real-time coordination',
		ambiguity_tolerance: 'Ambiguity tolerance',
		institutional_knowledge: 'Institutional knowledge',
		relationship_intensity: 'Relationship intensity',
		regulatory_weight: 'Regulatory weight',
		physical_presence: 'Physical presence',
		tool_velocity: 'Tool velocity'
	} as const;

	let _workflowItems = $derived.by(() => {
		const overlay = scored.workflow_overlay;
		if (!overlay) return [];
		return (
			Object.entries(workflowDimensionLabels) as Array<
				[keyof typeof workflowDimensionLabels, string]
			>
		).map(([key, label]) => ({
			key,
			label,
			value: overlay[key]
		}));
	});

	let roleMarketHeadline = $derived.by(() => {
		if (postings?.hiring_state === 'active') {
			return 'Hiring is active in closely related work. Treat it as directional market context rather than a role-specific labour statistic.';
		}
		if (postings?.hiring_state === 'moderate') {
			return 'There is some hiring in closely related work, but not enough to treat it as a strong standalone market signal.';
		}
		if (employerPressure?.label === 'high' || employerPressure?.label === 'critical') {
			return 'Employer demand is elevated for closely related work. Use it as directional context, not a role-specific forecast.';
		}
		return 'Use these signals as directional context from closely related occupations and recent postings.';
	});

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

	function adaptationBarClass(v: number) {
		return v >= 0.55 ? 'bg-risk-very-low' : v >= 0.35 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	function realizedBarClass(v: number) {
		return v >= 0.1 ? 'bg-risk-very-high' : v >= 0.05 ? 'bg-risk-moderate' : 'bg-risk-very-low';
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

	function offsetLevelLabel(value: number, inverse = false) {
		const score = inverse ? 1 - value : value;
		if (score >= 0.68) return 'High';
		if (score >= 0.42) return 'Medium';
		return 'Low';
	}

	function adaptationTone() {
		if (!decision) return 'muted';
		return decision.adaptationLabel === 'strong'
			? 'positive'
			: decision.adaptationLabel === 'moderate'
				? 'warning'
				: 'danger';
	}

	function realizedTone() {
		if (!decision) return 'muted';
		return decision.realizedLabel === 'contained'
			? 'positive'
			: decision.realizedLabel === 'watch'
				? 'warning'
				: 'danger';
	}

	function pathwayTone() {
		return decision?.bestTransition?.evidence_status === 'observed_enriched' ? 'positive' : 'muted';
	}

	function formatPercent(value: number, digits = 0) {
		return `${(value * 100).toFixed(digits)}%`;
	}

	let decisionHeroSummary = $derived.by(() => {
		if (!decision) return '';
		const realizedSentence =
			decision.realizedLabel === 'contained'
				? 'Near-term realized pressure is still contained in the blended read.'
				: decision.realizedLabel === 'watch'
					? 'Near-term realized pressure is worth watching in the blended read.'
					: 'Near-term realized pressure is elevated in the blended read.';
		return `${formatPercent(decision.transitionAdjustedRisk)} blended transition-adjusted pressure after current buffers. ${realizedSentence}`;
	});

	let signalProfileItems = $derived.by(() => {
		if (!decision) {
			return [
				{
					label: 'Pressure',
					value: formatPercent(scored.net_risk),
					barValue: scored.net_risk,
					barClass: pressureBarClass(scored.net_risk)
				},
				{
					label: 'Market',
					value: formatPercent(scored.market_resilience),
					barValue: scored.market_resilience,
					barClass: marketBarClass(scored.market_resilience)
				},
				{
					label: 'Evidence Quality',
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
			];
		}

		return [
			{
				label: 'Adaptation room',
				value: decision.adaptationLabel.charAt(0).toUpperCase() + decision.adaptationLabel.slice(1),
				valueClass: 'font-sans text-sm font-semibold text-foreground',
				barValue: decision.adaptationCapacity,
				barClass: adaptationBarClass(decision.adaptationCapacity),
				note: `Blended transition-adjusted pressure ${formatPercent(
					decision.transitionAdjustedRisk
				)}`
			},
			{
				label: 'Market',
				value: `${(scored.market_resilience * 100).toFixed(0)}%`,
				barValue: scored.market_resilience,
				barClass: marketBarClass(scored.market_resilience)
			},
			{
				label: '12m realized',
				value: formatPercent(decision.realizedRiskProxy),
				barValue: decision.realizedRiskProxy,
				barClass: realizedBarClass(decision.realizedRiskProxy),
				note: 'Blended short-run proxy from the component occupations'
			},
			{
				label: 'Evidence Quality',
				value: `${(scored.confidence_score * 100).toFixed(0)}%`,
				barValue: scored.confidence_score,
				barClass: confidenceBarClass(scored.confidence),
				note: 'Role estimate from weighted occupation components'
			}
		];
	});

	async function shareCurrentPage() {
		if (!browser) return;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `${scored.title} — ${SITE.name}`,
					text: `Estimated AI displacement risk for ${scored.title}: ${(scored.net_risk * 100).toFixed(0)}%`,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url);
			toast('Link copied', { description: scored.title });
		} catch {}
	}

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
		<div class="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
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
						{#if decision}
							<div class="mt-4 max-w-3xl border-t border-border/70 pt-3">
								<div class="flex flex-wrap items-center gap-2">
									<span class={microLabel()}>Blended read</span>
									<span class={pill({ tone: adaptationTone() })}>
										Adaptation room: {decision.adaptationLabel}
									</span>
									<span class={pill({ tone: 'neutral' })}>
										Transition-adjusted: {formatPercent(decision.transitionAdjustedRisk)}
									</span>
									<span class={pill({ tone: realizedTone() })}>
										12m signal: {formatPercent(decision.realizedRiskProxy)}
									</span>
									{#if decision.bestTransition}
										<a
											href="/occupation/{decision.bestTransition.to_ssoc}"
											class={pill({ tone: pathwayTone(), interactive: true })}
										>
											Best route: {decision.bestTransition.to_title} →
										</a>
									{/if}
								</div>
								<p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
									{decisionHeroSummary}
								</p>
								{#if primaryOccupation}
									<p class="mt-2 text-xs text-muted-foreground">
										Seniority-specific outlook is still calibrated on official occupations. Use
										<a
											href="/occupation/{primaryOccupation.ssoc}"
											class="text-foreground underline decoration-border underline-offset-4 hover:text-primary"
										>
											{primaryOccupation.title}
										</a>
										for the junior, mid, and senior view.
									</p>
								{/if}
							</div>
						{/if}
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
						<Button variant="outline" size="sm" class="h-8 text-xs" onclick={shareCurrentPage}>
							Share
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

				<div class="mt-4 flex flex-wrap items-center gap-2">
					<span class={riskBadge({ band: scored.risk_band })}>
						{riskBandLabels[scored.risk_band]} Risk
					</span>
					<span class={impactBadge({ type: scored.impact_type })}>
						{impactTypeLabels[scored.impact_type]}
					</span>
					<span class={confidenceBadge({ level: scored.confidence })}>
						{scored.confidence.charAt(0).toUpperCase() + scored.confidence.slice(1)} Evidence Quality
					</span>
					<span class={pill({ tone: 'muted' })}>
						Estimated · {scored.components.length}-part blend
					</span>
				</div>
			</div>
		</div>

		<!-- Built from: surface component occupations above the fold -->
		<div class="mt-5 border-t border-border/70 pt-4">
			<p class={cn(microLabel(), 'mb-2')}>
				Built from {scored.components.length} official occupations
			</p>
			<div class="flex flex-wrap gap-x-4 gap-y-1">
				{#each scored.components as comp}
					{#if comp.occupation}
						<a
							href="/occupation/{comp.ssoc}"
							class="text-xs text-text-secondary hover:text-primary hover:underline underline-offset-2"
						>
							{comp.occupation.title}
							<span class="font-mono tabular-nums text-muted-foreground"
								>({(comp.weight * 100).toFixed(0)}%)</span
							>
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
			<div class="grid gap-6 md:grid-cols-5">
				<!-- Left: Waterfall (3/5) -->
				<div class="md:col-span-3">
					<DriverWaterfall occupation={roleWaterfallSubject} />
					<p class="mt-3 text-xs text-muted-foreground">
						Blended across {scored.components.length} occupations using the same score logic as an occupation
						page.
						<a href="/methodology" class="text-primary hover:underline">How this works</a>
					</p>
				</div>

				<!-- Right: What AI changes (2/5) -->
				<div class="md:col-span-2 space-y-4">
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
				</div>
			</div>

			{#if scored.workflow_overlay}
				<div class="mt-5 border-t border-border pt-5">
					<p class="text-xs font-semibold text-foreground mb-3">What this role involves</p>
					<div class="mx-auto max-w-xs">
						<WorkflowRadar dimensions={scored.workflow_overlay} size={280} />
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- ===== BLOCK 3: SINGAPORE NOW ===== -->
	{#if postings || employerPressure || industryContext.top_industries.length > 0 || localContextItems.length > 0}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Singapore Now</h2>
			<div class={card({ padding: 'md' })}>
				<p class="text-sm leading-relaxed text-text-secondary mb-4">{roleMarketHeadline}</p>

				<div class="grid gap-3 sm:grid-cols-3 mb-4">
					{#if postings}
						<div class={card({ padding: 'sm', variant: 'metric' })}>
							<p class={microLabel()}>Observed hiring</p>
							<p class="mt-1 font-mono text-lg text-foreground">{postings.posting_volume_30d}</p>
							<p class="text-xs text-muted-foreground">
								30-day postings · {postings.hiring_state}
							</p>
						</div>
					{/if}
					{#if employerPressure}
						<div class={card({ padding: 'sm', variant: 'metric' })}>
							<p class={microLabel()}>Employer pressure</p>
							<p class="mt-1 font-mono text-lg text-foreground">{employerPressure.label}</p>
							<p class="text-xs text-muted-foreground">
								{employerPressure.signal_count} recent signals
							</p>
						</div>
					{/if}
					{#if localContextItems.length > 0}
						<div class={card({ padding: 'sm', variant: 'metric' })}>
							<p class={microLabel()}>Local support</p>
							<p class="mt-1 font-mono text-lg text-foreground">{localContextItems.length}</p>
							<p class="text-xs text-muted-foreground">blended context anchors</p>
						</div>
					{/if}
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					{#if industryContext.top_industries.length > 0}
						<div class={card({ padding: 'sm' })}>
							<p class={cn(microLabel(), 'mb-2')}>Top Industries</p>
							{#each industryContext.top_industries.slice(0, 3) as industry (industry.key)}
								<div
									class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
								>
									<span class="text-sm text-foreground truncate mr-2">{industry.label}</span>
									<div class="flex items-center gap-2 shrink-0">
										{#if industry.vacancy_signal && industry.vacancy_signal !== 'stable'}
											<span class={cn('text-xs', vacancySignalClass(industry.vacancy_signal))}>
												{industry.vacancy_signal === 'rising' ? '↑' : '↓'}
											</span>
										{/if}
										<span class="font-mono text-xs text-muted-foreground"
											>{(industry.share_2025 * 100).toFixed(0)}%</span
										>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<div class={card({ padding: 'sm' })}>
						<p class={cn(microLabel(), 'mb-2')}>Context note</p>
						<ul class="space-y-2 text-xs leading-relaxed text-muted-foreground">
							<li>
								These signals come from closely related occupations and recent postings, so they are
								best used as directional context.
							</li>
							<li>
								Short-term conditions can move faster than this blended view, especially for newer
								or narrower roles.
							</li>
							<li>
								For official labour-market detail, inspect the occupation matches listed above.
							</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- ===== BLOCK 4: WHAT YOU CAN DO ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>What You Can Do</h2>
		<div class={card({ padding: 'md' })}>
			{#if decision}
				<div class="mb-4 border-b border-border pb-4">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-xs font-semibold text-foreground">Blended adaptation snapshot</p>
						<span class={pill({ size: 'sm', tone: adaptationTone() })}>
							Adaptation room: {decision.adaptationLabel}
						</span>
						<span class={pill({ size: 'sm', tone: 'neutral' })}>
							Transition-adjusted: {formatPercent(decision.transitionAdjustedRisk)}
						</span>
						<span class={pill({ size: 'sm', tone: realizedTone() })}>
							12m realized pressure: {decision.realizedLabel}
						</span>
					</div>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary">{decision.summaryText}</p>
					{#if primaryOccupation}
						<p class="mt-2 text-xs text-muted-foreground">
							Use the anchor occupation page for seniority tabs and official labour-market outlook:
							<a
								href="/occupation/{primaryOccupation.ssoc}"
								class="text-foreground underline decoration-border underline-offset-4 hover:text-primary"
							>
								{primaryOccupation.title}
							</a>
						</p>
					{/if}
				</div>
			{/if}

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
					</div>
					<p class="mt-2 text-sm text-text-secondary">{offsetPotential.summary}</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<span class={pill({ tone: 'neutral' })}>
							Demand support: {offsetLevelLabel(offsetPotential.components.demand_persistence)}
						</span>
						<span class={pill({ tone: 'neutral' })}>
							Transition support: {offsetLevelLabel(offsetPotential.components.transition_support)}
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
				</div>
			{/if}

			{#if transitionSupport}
				<div class="mb-4 border-b border-border pb-4">
					<p class="text-xs font-semibold text-foreground mb-2">Published transition support</p>
					<div class="flex flex-wrap items-center gap-2">
						{#if transitionSupport.skillsfuture_eligible}
							<span class={pill({ tone: 'positive' })}>SkillsFuture eligible</span>
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
				</div>
			{/if}

			{#if decision?.bestTransition}
				<div class="mb-4 border-b border-border pb-4">
					<div class="flex items-center gap-2 mb-3">
						<p class="text-xs font-semibold text-foreground">Best adjacent pathway</p>
						<span class={pill({ size: 'sm', tone: pathwayTone() })}>
							{decision.bestTransition.evidence_status === 'observed_enriched'
								? 'Observed-enriched'
								: 'Model-led'}
						</span>
					</div>
					<a
						href="/occupation/{decision.bestTransition.to_ssoc}"
						class={cn(card({ padding: 'md', variant: 'metric', hover: true }), 'block')}
					>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<p class="text-sm font-semibold text-foreground">
									{decision.bestTransition.to_title}
								</p>
								<p class="mt-1 text-sm text-text-secondary">
									Blended from the underlying occupations' strongest adjacent routes.
								</p>
							</div>
							<div class="shrink-0 text-left sm:text-right">
								<p class={microLabel()}>Blended transition-adjusted pressure</p>
								<p class="mt-1 font-mono text-lg font-semibold text-foreground">
									{formatPercent(decision.transitionAdjustedRisk)}
								</p>
							</div>
						</div>
						<div class="mt-3 flex flex-wrap gap-2">
							{#if decision.bestTransition.observed_transition_rate != null}
								<span class={pill({ tone: 'positive' })}>
									Observed transition rate {formatPercent(
										decision.bestTransition.observed_transition_rate,
										1
									)}
								</span>
							{/if}
							{#if decision.bestTransition.wage_preservation != null}
								<span class={pill({ tone: 'neutral' })}>
									Wage preservation {formatPercent(decision.bestTransition.wage_preservation)}
								</span>
							{/if}
							{#if decision.bestTransition.training_ease != null}
								<span class={pill({ tone: 'neutral' })}>
									Training ease {formatPercent(decision.bestTransition.training_ease)}
								</span>
							{/if}
						</div>
					</a>
				</div>
			{/if}

			<div class={card({ padding: 'sm', variant: 'inset' })}>
				<p class="text-xs text-foreground">Related occupations</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#each scored.components as comp}
						{#if comp.occupation}
							<a href="/occupation/{comp.ssoc}" class={pill({ tone: 'primary', interactive: true })}
								>{comp.occupation.title} →</a
							>
						{/if}
					{/each}
				</div>
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

	<!-- ===== TECHNICAL DETAILS (collapsed) ===== -->
	<Collapsible.Root class={cn(card({ padding: 'none' }), 'mb-8')}>
		<Collapsible.Trigger
			class="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
		>
			Technical Details · {scored.components.length} components · {scored.confidence} evidence quality
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

				<!-- Percentile (moved from Block 1) -->
				<div>
					<p class="font-semibold text-foreground mb-1">Percentile Rank</p>
					<p>Higher risk than {structural.riskPercentile}% of occupations</p>
				</div>

				<!-- O*NET tools (moved from Block 2) -->
				{#if (structural.onetEnrichment?.technologies.length ?? 0) > 0}
					<div>
						<p class="font-semibold text-foreground mb-1">Common tools in similar work</p>
						<div class="flex flex-wrap gap-1.5">
							{#each structural.onetEnrichment?.technologies.slice(0, 4) ?? [] as technology}
								<span class={pill({ tone: technology.hot ? 'positive' : 'muted' })}>
									{technology.name}
								</span>
							{/each}
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							{structural.onetEnrichment?.note ??
								'Proxy enrichment from matched O*NET technology profiles, not direct role-native evidence.'}
						</p>
					</div>
				{/if}

				<!-- What helps / What slows (moved from Block 4) -->
				{#if offsetPotential && (offsetPotential.strengths.length > 0 || offsetPotential.cautions.length > 0)}
					<div>
						{#if offsetPotential.strengths.length > 0}
							<p class="font-semibold text-impact-leveraged mb-1">What helps</p>
							<ul class="space-y-1">
								{#each offsetPotential.strengths as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}
					</div>
					<div>
						{#if offsetPotential.cautions.length > 0}
							<p class="font-semibold text-risk-high mb-1">What could slow it down</p>
							<ul class="space-y-1">
								{#each offsetPotential.cautions as item}
									<li>{item}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<!-- Worker profile (moved from Block 3) -->
				{#if workerProfile.items.length > 0}
					<div class="sm:col-span-2">
						<ContextItemGrid title="Worker profile" items={workerProfile.items} />
					</div>
				{/if}

				<!-- Geography context (moved from Block 3) -->
				{#if geographyContext.items.length > 0}
					<div class="sm:col-span-2">
						<ContextItemGrid
							title="Where this work is concentrated"
							items={geographyContext.items}
						/>
					</div>
				{/if}

				<!-- Local context items (moved from Block 3) -->
				{#if localContextItems.length > 0}
					<div class="sm:col-span-2">
						<p class="font-semibold text-foreground mb-1">Local context & support</p>
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

				<!-- Market detail bullets (moved from Block 3) -->
				{#if marketDetailBullets.length > 0}
					<div class="sm:col-span-2">
						<p class="font-semibold text-foreground mb-1">Market detail</p>
						<p class="mb-2">
							Industry vacancy overlays use the latest published detailed cross-tab, which can lag
							the main labour monitor.
						</p>
						<ul class="space-y-1">
							{#each marketDetailBullets as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</main>
