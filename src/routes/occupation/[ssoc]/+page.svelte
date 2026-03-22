<script lang="ts">
	import { browser } from '$app/environment';
	import { riskBandLabels, majorGroupByKey, impactTypeLabels } from '$lib/data';
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
	import WorkflowRadar from '$lib/components/viz/WorkflowRadar.svelte';
	import EvidenceBar from '$lib/components/viz/EvidenceBar.svelte';
	import SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ContextItemGrid from '$lib/components/ui/ContextItemGrid.svelte';
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
	import { toast } from 'svelte-sonner';
	import { trackEvent } from '$lib/analytics';
	import { getTransitionProgrammeUrl } from '$lib/data/detail-context';
	import { buildMarketDetailBullets } from '$lib/data/market-summary';
	import { scoringBasisDescription, scoringBasisLabel } from '$lib/data/scoring-basis-display';

	let { data } = $props();
	let occ = $derived(data.occupation);
	let structural = $derived(data.structural);
	let context = $derived(data.context);

	let isWatchlisted = $state(false);

	$effect(() => {
		if (!browser) return;
		try {
			const entries = parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY));
			isWatchlisted = hasWatchlistEntry(entries, { kind: 'occupation', id: occ.ssoc });
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
					kind: 'occupation',
					id: occ.ssoc
				}
			);
			isWatchlisted = hasWatchlistEntry(nextEntries, { kind: 'occupation', id: occ.ssoc });
			localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(nextEntries));
			toast(isWatchlisted ? 'Added to watchlist' : 'Removed from watchlist', {
				description: occ.title
			});
			trackEvent('watchlist_saved', {
				entity_kind: 'occupation',
				entity_id: occ.ssoc,
				title: occ.title,
				action: isWatchlisted ? 'added' : 'removed'
			});
		} catch {}
	}

	let group = $derived(majorGroupByKey.get(occ.major_group));
	let transitions = $derived(structural.transitions);
	let singaporeContext = $derived(context.singaporeContext);
	let industryContext = $derived(context.industryContext);
	let workerProfile = $derived(context.workerProfile);
	let geographyContext = $derived(context.geographyContext);
	let transitionSupport = $derived(context.transitionSupport);
	let offsetPotential = $derived(context.offsetPotential);
	let postings = $derived(context.postings);
	let employerPressure = $derived(context.employerPressure);
	let localContextItems = $derived(singaporeContext.items);
	let marketDetailBullets = $derived(
		buildMarketDetailBullets(occ.labour_monitor, postings, employerPressure)
	);

	// Demand signal helpers
	let hasDemand = $derived(occ.evidence.sol_match || occ.evidence.jobs_in_demand_match);
	let demandLabel = $derived.by(() => {
		if (occ.evidence.sol_match && occ.evidence.jobs_in_demand_match)
			return 'SOL 2026 + Jobs in Demand';
		if (occ.evidence.sol_match) return 'SOL 2026';
		if (occ.evidence.jobs_in_demand_match) return 'Jobs in Demand';
		return null;
	});
	let netRiskUncertainty = $derived(
		`${((occ.uncertainty?.net_risk_p10 ?? occ.net_risk) * 100).toFixed(2).replace(/\.00$/, '')}–${(
			(occ.uncertainty?.net_risk_p90 ?? occ.net_risk) * 100
		)
			.toFixed(2)
			.replace(/\.00$/, '')}%`
	);
	let exposureUncertainty = $derived(
		`${((occ.uncertainty?.exposure_p10 ?? occ.exposure) * 100).toFixed(0)}–${(
			(occ.uncertainty?.exposure_p90 ?? occ.exposure) * 100
		).toFixed(0)}%`
	);
	let taskEvidenceSummary = $derived.by(() => {
		if (occ.task_primitives?.matched_task_weight_share != null) {
			return `${(occ.task_primitives.matched_task_weight_share * 100).toFixed(0)}% weighted task match · ${((occ.task_primitives.task_effective_coverage ?? 0) * 100).toFixed(0)}% effective coverage`;
		}
		if (siteStatus.experimental_release?.status === 'blocked') {
			return 'Task-weighted shadow model is blocked in this release, so no weighted task evidence is published here yet.';
		}
		return 'Task-weighted shadow evidence is not active for this occupation yet.';
	});
	let scoringBasisSummary = $derived(scoringBasisLabel(occ.scoring_basis));
	let scoringBasisDetail = $derived(scoringBasisDescription(occ.scoring_basis));
	let priorLiveBaseline = $derived(occ.baseline_v43 ?? occ.baseline_v42 ?? null);
	let priorBaselineDeltaSummary = $derived.by(() => {
		if (!priorLiveBaseline) return null;
		const delta = occ.net_risk - priorLiveBaseline.net_risk;
		const baselineLabel = priorLiveBaseline.structural_model_version;
		if (Math.abs(delta) < 0.0001)
			return `No material change versus retained ${baselineLabel} baseline.`;
		const direction = delta > 0 ? '+' : '';
		return `${direction}${(delta * 100).toFixed(1)}pp versus retained ${baselineLabel} baseline.`;
	});

	// Outlook (inline, no tabs — base case only for Block 3)
	let selectedSeniority = $state<SeniorityLevel>('mid');
	let baseOutlook = $derived(
		computeOutlook(occ, { ...scenarioPresets.base.params, seniority: selectedSeniority })
	);

	const outlookDimensions = [
		{ key: 'displacement_pressure', label: 'Displacement' },
		{ key: 'augmentation_upside', label: 'Augmentation' },
		{ key: 'demand_outlook', label: 'Demand' },
		{ key: 'wage_pressure', label: 'Wage Pressure' }
	] as const;

	// Transition grid expand state
	let showAllTransitions = $state(false);

	// Top 3 transitions overall (sorted by composite, deduplicated)
	let top3Transitions = $derived.by(() => {
		if (!transitions) return [];
		const all = [
			...transitions.easierSwitch,
			...transitions.lowerRisk,
			...transitions.betterPay,
			...transitions.strongDemand
		];
		const seen = new Set<string>();
		const unique: typeof all = [];
		for (const t of all.sort((a, b) => b.composite - a.composite)) {
			if (!seen.has(t.to_ssoc)) {
				seen.add(t.to_ssoc);
				unique.push(t);
			}
		}
		return unique.slice(0, 3);
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

	function confidenceBarClass(v: number) {
		return v >= 0.7 ? 'bg-risk-very-low' : v >= 0.4 ? 'bg-risk-moderate' : 'bg-risk-high';
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
			value: `${(occ.net_risk * 100).toFixed(0)}%`,
			barValue: occ.net_risk,
			barClass: pressureBarClass(occ.net_risk)
		},
		{
			label: 'Market',
			value: `${(occ.market.market_resilience * 100).toFixed(0)}%`,
			barValue: occ.market.market_resilience,
			barClass: marketBarClass(occ.market.market_resilience)
		},
		{
			label: 'Evidence Quality',
			value: `${(occ.confidence.score * 100).toFixed(0)}%`,
			barValue: occ.confidence.score,
			barClass: confidenceBarClass(occ.confidence.score)
		},
		{
			label: 'Human Moat',
			value: occ.bottleneck >= 0.6 ? 'High' : occ.bottleneck >= 0.3 ? 'Medium' : 'Low',
			valueClass: 'font-sans text-sm font-semibold text-foreground',
			barValue: occ.bottleneck,
			barClass: moatBarClass(occ.bottleneck)
		}
	]);

	let occJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Occupation',
			name: occ.title,
			occupationalCategory: occ.major_group,
			estimatedSalary: {
				'@type': 'MonetaryAmountDistribution',
				name: 'Gross Monthly Wage',
				currency: 'SGD',
				median: occ.gross_wage_median,
				percentile25: occ.gross_wage_25th,
				percentile75: occ.gross_wage_75th
			},
			occupationLocation: { '@type': 'Country', name: 'Singapore' },
			additionalProperty: [
				{ '@type': 'PropertyValue', name: 'AI Net Displacement Risk', value: occ.net_risk },
				{
					'@type': 'PropertyValue',
					name: 'Risk Band',
					value: riskBandLabels[occ.risk_band]
				},
				{
					'@type': 'PropertyValue',
					name: 'Impact Type',
					value: impactTypeLabels[occ.impact_type]
				},
				{
					'@type': 'PropertyValue',
					name: 'Evidence Quality',
					value: occ.confidence.level
				}
			]
		})}<\/script>`
	);

	let breadcrumbJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{
					'@type': 'ListItem',
					position: 1,
					name: 'Home',
					item: SITE.url + '/'
				},
				{
					'@type': 'ListItem',
					position: 2,
					name: occ.title,
					item: SITE.url + '/occupation/' + occ.ssoc
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
					name: 'Will AI replace ' + occ.title + ' in Singapore?',
					acceptedAnswer: {
						'@type': 'Answer',
						text:
							structural.summaryText +
							' Net displacement risk: ' +
							(occ.net_risk * 100).toFixed(0) +
							'% (' +
							riskBandLabels[occ.risk_band] +
							'). Median wage: SGD ' +
							occ.gross_wage_median.toLocaleString() +
							'/month.'
					}
				},
				{
					'@type': 'Question',
					name: 'What is the AI risk score for ' + occ.title + '?',
					acceptedAnswer: {
						'@type': 'Answer',
						text:
							occ.title +
							' has an AI displacement risk of ' +
							(occ.net_risk * 100).toFixed(0) +
							'%, rated ' +
							riskBandLabels[occ.risk_band] +
							'. AI task overlap: ' +
							(occ.exposure * 100).toFixed(0) +
							'%. Human advantage: ' +
							(occ.bottleneck * 100).toFixed(0) +
							'%. Singapore demand buffer: ' +
							(occ.market.market_resilience * 100).toFixed(0) +
							'%.'
					}
				}
			]
		})}<\/script>`
	);

	let pageTitle = $derived(`${occ.title} — AI Risk | ${SITE.name}`);
	let pageDescription = $derived(
		`${occ.title} (SSOC ${occ.ssoc}): AI displacement risk ${(occ.net_risk * 100).toFixed(0)}%, rated ${riskBandLabels[occ.risk_band]}. Median wage SGD ${occ.gross_wage_median.toLocaleString()}.`
	);
</script>

<Seo
	title={pageTitle}
	description={pageDescription}
	path="/occupation/{occ.ssoc}"
	ogImage="/og/{occ.ssoc}.png"
	jsonLd={[occJsonLd, breadcrumbJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: occ.title }]} />

	<!-- ===== BLOCK 1: THE VERDICT ===== -->
	<div class={cn(card({ padding: 'lg' }), 'mb-8 overflow-hidden')}>
		<div class="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)] md:items-start">
			<div
				class={cn('rounded-2xl border p-5', scoreTileClasses(occ.risk_band))}
				role="figure"
				aria-label="Structural AI displacement pressure: {(occ.net_risk * 100).toFixed(
					0
				)}%, rated {riskBandLabels[occ.risk_band]} risk"
			>
				<p class={microLabel()}>Structural pressure</p>
				<p class={cn(display({ size: 'xl' }), 'mt-2')}>
					{(occ.net_risk * 100).toFixed(0)}%
				</p>
				<span class={cn(riskBadge({ band: occ.risk_band }), 'mt-2 inline-flex')}>
					{riskBandLabels[occ.risk_band]} Risk
				</span>
			</div>

			<div class="min-w-0">
				<div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
					<div class="min-w-0">
						<h1 class={titleStyle({ size: 'page' })}>{occ.title}</h1>
						<p class={caption({ weight: 'medium' })}>
							{group?.label ?? occ.major_group} · SGD {occ.gross_wage_median.toLocaleString()}/mo ({structural.wageVsNational}){#if occ.estimated_sg_employment_thousands} · ~{occ.estimated_sg_employment_thousands >= 1 ? occ.estimated_sg_employment_thousands.toFixed(1) + 'K' : Math.round(occ.estimated_sg_employment_thousands * 1000).toLocaleString()} workers in SG{/if}
						</p>
						<p class="mt-3 max-w-3xl text-[15px] leading-relaxed text-text-secondary">
							{structural.summaryText}
						</p>
					</div>

					<div class="flex items-center gap-2 shrink-0">
						<Button
							variant="outline"
							size="sm"
							class="h-8 text-xs"
							href="/compare?entities=occupation:{occ.ssoc}"
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

				<div class="mt-4 flex flex-wrap items-center gap-2">
					<span class={riskBadge({ band: occ.risk_band })}>
						{riskBandLabels[occ.risk_band]} Risk
					</span>
					<span class={impactBadge({ type: occ.impact_type })}>
						{impactTypeLabels[occ.impact_type]}
					</span>
					<span class={confidenceBadge({ level: occ.confidence.level })}>
						{occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)} Evidence Quality
					</span>
					{#if hasDemand}
						<span class={pill({ tone: 'positive' })}>
							In demand ({demandLabel})
						</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="mt-6 border-t border-border/70 pt-5">
			<SignalProfileGrid items={signalProfileItems} />
		</div>
	</div>

	<!-- ===== BLOCK 2: WHY THIS SCORE ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Why This Score</h2>
		<div class={card({ padding: 'md' })}>
			<div class="grid gap-6 md:grid-cols-5">
				<!-- Left: Waterfall (3/5 on desktop) -->
				<div class="md:col-span-3">
					<DriverWaterfall occupation={occ} />
					<p class="mt-2 text-xs text-muted-foreground">
						Exposure × (1 − Bottleneck) × Market Modifier.
						{#if occ.stability.label !== 'stable'}
							<span class="text-risk-moderate">Band stability: {occ.stability.label}.</span>
						{/if}
						<a href="/methodology" class="text-primary hover:underline">How this works</a>
					</p>
				</div>

				<!-- Right: What AI Changes (2/5 on desktop) -->
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

			<!-- Workflow dimensions -->
			{#if occ.workflow_overlay}
				<div class="mt-5 border-t border-border pt-5">
					<p class="text-xs font-semibold text-foreground mb-3">What this role involves</p>
					<div class="mx-auto max-w-xs">
						<WorkflowRadar dimensions={occ.workflow_overlay} size={280} />
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- ===== BLOCK 3: SINGAPORE NOW ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-1')}>Singapore Now</h2>
		<p class="text-xs text-muted-foreground mb-3">Current local conditions — separate from the structural score.</p>

		<!-- Labour metrics row -->
		{#if occ.labour_monitor}
			<div class="grid gap-3 sm:grid-cols-4 mb-4">
				<div class={card({ padding: 'sm', variant: 'metric' })}>
					<p class={microLabel()}>Vacancy</p>
					<p class="mt-1 font-mono text-lg text-foreground">{occ.labour_monitor.vacancy.latest_rate}%</p>
					<p class={cn('text-xs font-medium', occ.labour_monitor.vacancy.trend_4q_pct > 0 ? 'text-risk-very-low' : occ.labour_monitor.vacancy.trend_4q_pct < 0 ? 'text-risk-high' : 'text-muted-foreground')}>
						{occ.labour_monitor.vacancy.trend_4q_pct > 0 ? '↑' : occ.labour_monitor.vacancy.trend_4q_pct < 0 ? '↓' : '→'} {Math.abs(occ.labour_monitor.vacancy.trend_4q_pct).toFixed(1)}% YoY
					</p>
				</div>
				{#if occ.labour_monitor.hiring}
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Hiring</p>
						<p class="mt-1 font-mono text-lg text-foreground">{occ.labour_monitor.hiring.recruitment_rate}%</p>
						<p class="text-xs text-muted-foreground">vs {occ.labour_monitor.hiring.resignation_rate}% resign</p>
					</div>
				{/if}
				{#if occ.labour_monitor.retrenchment?.incidence_per_1000}
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Retrenchment</p>
						<p class="mt-1 font-mono text-lg text-foreground">{occ.labour_monitor.retrenchment.incidence_per_1000}</p>
						<p class="text-xs text-muted-foreground">per 1,000 · {occ.labour_monitor.retrenchment.incidence_per_1000 < 2 ? 'low' : occ.labour_monitor.retrenchment.incidence_per_1000 < 5 ? 'moderate' : 'elevated'}</p>
					</div>
				{:else if postings && postings.hiring_state !== 'no_signal'}
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Postings</p>
						<p class="mt-1 font-mono text-lg text-foreground">{postings.posting_volume_30d}</p>
						<p class="text-xs text-muted-foreground">last 30 days</p>
					</div>
				{/if}
				{#if occ.labour_monitor.re_entry?.rate_12m}
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Re-entry</p>
						<p class="mt-1 font-mono text-lg text-foreground">{occ.labour_monitor.re_entry.rate_12m}%</p>
						<p class="text-xs text-muted-foreground">find work in 12mo{#if occ.labour_monitor.re_entry.rate_12m_delta_pp} · <span class={occ.labour_monitor.re_entry.rate_12m_delta_pp > 0 ? 'text-risk-very-low' : 'text-risk-high'}>{occ.labour_monitor.re_entry.rate_12m_delta_pp > 0 ? '+' : ''}{occ.labour_monitor.re_entry.rate_12m_delta_pp.toFixed(1)}pp</span>{/if}</p>
					</div>
				{/if}
			</div>
			<p class="text-xs text-muted-foreground mb-4">{occ.labour_monitor.cluster_label} · {siteStatus.live_monitor.labour_monitor_artifact_vintage}</p>
		{/if}

		<!-- Industries + Outlook side by side -->
		<div class="grid gap-4 md:grid-cols-2">
			{#if industryContext}
				<div class={card({ padding: 'sm' })}>
					<p class={cn(microLabel(), 'mb-2')}>Top Industries</p>
					{#each industryContext.top_industries.slice(0, 3) as industry (industry.key)}
						<div class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
							<span class="text-sm text-foreground truncate mr-2">{industry.label}</span>
							<div class="flex items-center gap-2 shrink-0">
								{#if industry.vacancy_signal && industry.vacancy_signal !== 'stable'}
									<span class={cn('text-xs', vacancySignalClass(industry.vacancy_signal))}>
										{industry.vacancy_signal === 'rising' ? '↑' : '↓'}
									</span>
								{/if}
								<span class="font-mono text-xs text-muted-foreground">{(industry.share_2025 * 100).toFixed(0)}%</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class={card({ padding: 'sm' })}>
				<div class="flex items-center justify-between mb-2">
					<p class={microLabel()}>12-Month Outlook</p>
					<div class="flex items-center gap-0.5" role="group" aria-label="Seniority level">
						{#each ['junior', 'mid', 'senior'] as const as level}
							<button
								class={cn('rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors', selectedSeniority === level ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
								onclick={() => (selectedSeniority = level)}
								aria-pressed={selectedSeniority === level}
							>
								{level === 'junior' ? 'Jr' : level === 'mid' ? 'Mid' : 'Sr'}
							</button>
						{/each}
					</div>
				</div>
				{#each outlookDimensions as dim}
					{@const status = baseOutlook[dim.key]}
					<div class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
						<span class="text-xs text-muted-foreground">{dim.label}</span>
						<span class="text-xs font-medium {outlookStatusColors[status]}">{outlookStatusLabels[status]}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ===== BLOCK 4: WHAT YOU CAN DO ===== -->
	{#if transitions}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>What You Can Do</h2>
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
								Separate from the core score. This estimates how much demand, redesign room, and
								transition support could cushion pressure.
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
					</div>
				{/if}

				<!-- Transition support context -->
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
					</div>
				{/if}

				<!-- Top 3 transitions -->
				{#if top3Transitions.length > 0}
					<div class="space-y-2">
						<p class="text-xs font-semibold text-foreground">Top transitions</p>
						{#each top3Transitions as t (t.to_ssoc)}
							<a
								href="/occupation/{t.to_ssoc}"
								class="flex items-center justify-between rounded-md px-3 py-2 -mx-1 text-sm hover:bg-accent hover:text-primary transition-colors border border-border/50"
							>
								<div class="min-w-0 flex-1">
									<span class="truncate text-text-secondary block">{t.to_title}</span>
									<span class="text-xs text-muted-foreground">
										{t.label === 'easy' ? 'Easy' : t.label === 'moderate' ? 'Moderate' : t.label === 'stretch' ? 'Stretch' : 'Difficult'} transition
										{#if t.risk_improvement > 0}
											· <span class="text-risk-very-low">-{(t.risk_improvement * 100).toFixed(0)}pp risk</span>
										{:else if t.risk_improvement < 0}
											· <span class="text-risk-high">+{(Math.abs(t.risk_improvement) * 100).toFixed(0)}pp risk</span>
										{/if}
									</span>
								</div>
								<span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground"
									>{(t.composite * 100).toFixed(0)}%</span
								>
							</a>
						{/each}
					</div>

					{#if !showAllTransitions}
						<button
							class="mt-3 text-xs font-medium text-primary hover:underline"
							onclick={() => (showAllTransitions = true)}
						>
							See more transitions
						</button>
					{/if}
				{/if}

				<!-- Full transition grid (revealed on demand) -->
				{#if showAllTransitions}
					<div class="mt-4 pt-4 border-t border-border grid gap-6 sm:grid-cols-2">
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
				{/if}

				<!-- Compare CTA -->
				<div class="mt-4 pt-4 border-t border-border flex items-center justify-between">
					<p class="text-xs text-muted-foreground">See how this compares to similar occupations</p>
					<a
						href="/compare?entities=occupation:{occ.ssoc}"
						class="text-xs font-medium text-primary hover:underline"
					>
						Compare with... →
					</a>
				</div>
			</div>
		</section>
	{/if}

	<!-- ===== TECHNICAL DETAILS (collapsible) ===== -->
	<Collapsible.Root class={cn(card({ padding: 'none' }), 'mb-8')}>
		<Collapsible.Trigger
			class="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
		>
			Technical Details · SSOC {occ.ssoc}
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
				<!-- Percentile rank, scoring basis, education (moved from Block 1) -->
				<div class="sm:col-span-2">
					<p class="font-semibold text-foreground mb-1">Classification</p>
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
						<span>Higher risk than {structural.riskPercentile}% of occupations</span>
						{#if occ.scoring_basis}
							<span>{scoringBasisSummary}</span>
						{/if}
						{#if occ.education_label}
							<span>{occ.education_label}</span>
						{/if}
					</div>
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Evidence</p>
					<p>Crosswalk: {occ.match_quality} · SSOC {occ.ssoc}</p>
					{#if occ.evidence.sol_match}
						<p class="text-risk-very-low">SOL 2026: {occ.evidence.sol_match} match</p>
					{/if}
					{#if occ.evidence.jobs_in_demand_match}
						<p class="text-risk-very-low">
							Jobs in Demand: {occ.evidence.jobs_in_demand_match} match
						</p>
					{/if}
					{#if occ.evidence.anthropic_calibrated}
						<p>
							Anthropic: {occ.evidence.anthropic_gap !== null
								? (occ.evidence.anthropic_gap > 0 ? '+' : '') +
									Math.round(occ.evidence.anthropic_gap * 100) +
									'pp vs theory'
								: 'calibrated'}
						</p>
					{/if}
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Raw Scores</p>
					<p class="font-mono">
						AIOE {occ.raw.aioe.toFixed(3)} · θ {occ.raw.theta.toFixed(3)} · C-AIOE {occ.raw.c_aioe.toFixed(
							3
						)}
					</p>
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Stability</p>
					<p>
						{occ.stability.label} · Optimistic {(occ.stability.optimistic_risk * 100).toFixed(0)}% ({riskBandLabels[
							occ.stability.optimistic_band
						]}) · Pessimistic {(occ.stability.pessimistic_risk * 100).toFixed(0)}% ({riskBandLabels[
							occ.stability.pessimistic_band
						]})
					</p>
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Sensitivity Band</p>
					<p>
						Exposure {exposureUncertainty} · Net risk {netRiskUncertainty} · Method {occ.uncertainty
							?.method ?? 'n/a'}
					</p>
				</div>
				<div>
					<p class="font-semibold text-foreground mb-1">Scoring Basis</p>
					<p>{scoringBasisSummary}. {scoringBasisDetail}</p>
					{#if priorBaselineDeltaSummary}
						<p class="mt-1">{priorBaselineDeltaSummary}</p>
					{/if}
				</div>
				{#if occ.evidence?.signal_conflict_reasons?.length}
					<div class="sm:col-span-2">
						<p class="font-semibold text-foreground mb-1">Signal Conflicts</p>
						<div class="flex flex-wrap gap-1.5">
							{#each occ.evidence.signal_conflict_reasons as reason}
								<span class={cn(pill({ size: 'sm' }), 'bg-risk-moderate/10 text-risk-moderate')}>{reason.replaceAll('_', ' ')}</span>
							{/each}
						</div>
					</div>
				{/if}
				<div class="sm:col-span-2">
					<p class="font-semibold text-foreground mb-1">Source Coverage</p>
					<div class="mt-2">
						<EvidenceBar
							sourceCount={occ.evidence.exposure_source_count ?? 0}
							sourceKeys={occ.evidence.exposure_source_keys ?? []}
							agreement={occ.evidence.exposure_agreement ?? null}
							signalConflict={occ.evidence.signal_conflict ?? false}
						/>
					</div>
				</div>
				{#if occ.evidence?.exposure_source_pctiles}
					<div class="sm:col-span-2">
						<p class="font-semibold text-foreground mb-1">Exposure by Source</p>
						<div class="flex flex-wrap gap-3 mt-1">
							{#each Object.entries(occ.evidence.exposure_source_pctiles) as [source, pctile]}
								<div class="flex items-center gap-2">
									<span class="text-xs font-medium uppercase tracking-wider text-muted-foreground w-16">{source}</span>
									<div class="h-2 w-24 rounded-full bg-muted overflow-hidden">
										<div class="h-full rounded-full bg-foreground/60" style="width: {(pctile ?? 0) * 100}%"></div>
									</div>
									<span class="font-mono text-xs text-text-secondary">{((pctile ?? 0) * 100).toFixed(0)}%</span>
								</div>
							{/each}
						</div>
						{#if occ.evidence?.exposure_source_weights}
							<p class="mt-1 text-xs text-muted-foreground">
								Weights: {Object.entries(occ.evidence.exposure_source_weights).map(([k, v]) => `${k} ${((v ?? 0) * 100).toFixed(0)}%`).join(' · ')}
							</p>
						{/if}
					</div>
				{/if}
				<div>
					<p class="font-semibold text-foreground mb-1">Evidence Quality</p>
					<p>
						{(occ.confidence.score * 100).toFixed(0)}% · Crosswalk {occ.confidence.crosswalk_quality.toFixed(
							2
						)} · Market {occ.confidence.market_data_granularity.toFixed(2)} · Fresh {occ.confidence.source_freshness.toFixed(
							2
						)}
					</p>
				</div>
				<div class="sm:col-span-2">
					<p class="font-semibold text-foreground mb-1">Task Evidence</p>
					<p>{taskEvidenceSummary}</p>
				</div>
				<div class="sm:col-span-2">
					<p class="font-semibold text-foreground mb-1">Wage (SGD/mo)</p>
					<p class="font-mono">
						25th {occ.gross_wage_25th.toLocaleString()} · Median {occ.gross_wage_median.toLocaleString()}
						· 75th {occ.gross_wage_75th.toLocaleString()}
					</p>
				</div>

				<!-- O*NET tools (moved from Block 2) -->
				{#if (structural.onetEnrichment?.technologies.length ?? 0) > 0}
					<div class="sm:col-span-2">
						<p class="font-semibold text-foreground mb-1">Common Tools (O*NET)</p>
						<div class="flex flex-wrap gap-1.5">
							{#each structural.onetEnrichment?.technologies.slice(0, 4) ?? [] as technology}
								<span class={pill({ tone: technology.hot ? 'positive' : 'muted' })}>
									{technology.name}
								</span>
							{/each}
						</div>
						<p class="mt-1">Derived from matched O*NET technology-skill profiles.</p>
					</div>
				{/if}

				<!-- Worker profile, geography context (moved from Block 3) -->
				{#if workerProfile.items.length > 0 || geographyContext.items.length > 0 || localContextItems.length > 0}
					<div class="sm:col-span-2 space-y-4 pt-2 border-t border-border">
						<p class="font-semibold text-foreground">Worker Profile & Local Context</p>
						{#if marketDetailBullets.length > 0}
							<div>
								<p class="font-semibold text-foreground mb-1">Market Detail</p>
								<ul class="space-y-1 text-xs text-muted-foreground">
									{#each marketDetailBullets as item}
										<li>{item}</li>
									{/each}
								</ul>
							</div>
						{/if}
						{#if localContextItems.length > 0}
							<div>
								<p class="font-semibold text-foreground mb-1">Local Context & Support</p>
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

				<!-- What helps / What slows (moved from Block 4) -->
				{#if offsetPotential && (offsetPotential.strengths.length > 0 || offsetPotential.cautions.length > 0)}
					<div class="sm:col-span-2 pt-2 border-t border-border">
						<p class="font-semibold text-foreground mb-2">Offset Factors</p>
						<div class="grid gap-3 sm:grid-cols-2">
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
					</div>
				{/if}
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</main>
