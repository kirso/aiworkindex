<script lang="ts">
	import { browser } from '$app/environment';
	import { riskBandLabels, majorGroupByKey, impactTypeLabels } from '$lib/data';
	import {
		card,
		riskBadge,
		impactBadge,
		pageLayout,
		display,
		title as titleStyle,
		sectionLabel,
		body,
		caption,
		mono,
		pill,
		scoreTileClasses,
		microLabel,
		section
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { vacancySignalClass } from '$lib/data/detail-display';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import WorkflowRadar from '$lib/components/viz/WorkflowRadar.svelte';
	import EvidenceBar from '$lib/components/viz/EvidenceBar.svelte';
	import _SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
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
	let decision = $derived(structural.decision);

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
	let allUniqueTransitions = $derived(structural.topTransitions ?? []);
	let _fallbackTransitions = $derived.by(() =>
		allUniqueTransitions.filter(
			transition => transition.to_ssoc !== decision.bestTransition?.to_ssoc
		)
	);
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
	let selectedSeniority = $state<SeniorityLevel>('mid');
	let _baseOutlook = $derived.by(() =>
		computeOutlook(occ, { ...scenarioPresets.base.params, seniority: selectedSeniority })
	);

	const _seniorityLevels: SeniorityLevel[] = ['junior', 'mid', 'senior'];
	const _seniorityTabLabels: Record<SeniorityLevel, string> = {
		junior: 'Junior',
		mid: 'Mid',
		senior: 'Senior'
	};
	const _outlookDimensions = [
		{ key: 'displacement_pressure', label: 'Displacement' },
		{ key: 'augmentation_upside', label: 'Augmentation' },
		{ key: 'demand_outlook', label: 'Demand' },
		{ key: 'wage_pressure', label: 'Wage pressure' }
	] as const;

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
		const overlay = occ.workflow_overlay;
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

	let marketHeadline = $derived.by(() => {
		const lm = occ.labour_monitor;
		if (!lm) return 'Current Singapore labour data is thin for this occupation family.';
		const vacancyCooling = lm.vacancy.trend_4q_pct < -2;
		const hiringPositive = (lm.hiring?.net_pressure ?? 0) > 0;
		const lowRetrenchment =
			lm.retrenchment?.incidence_per_1000 != null && lm.retrenchment.incidence_per_1000 < 2;
		const reentrySoft =
			lm.re_entry?.rate_12m_delta_pp != null && lm.re_entry.rate_12m_delta_pp < -2;

		if (vacancyCooling && lowRetrenchment && hiringPositive) {
			return reentrySoft
				? 'Cooling, but not collapsing. Vacancies and re-entry are softer, yet retrenchment remains low and hiring still exceeds resignations.'
				: 'Cooling, but not collapsing. Vacancies are softer, yet retrenchment remains low and hiring still exceeds resignations.';
		}
		if (!vacancyCooling && hiringPositive && lowRetrenchment) {
			return 'Still healthy locally. Hiring remains positive and retrenchment stays low, even if demand is not accelerating.';
		}
		if (vacancyCooling && !lowRetrenchment) {
			return 'Local conditions are under more strain. Vacancies have softened and displacement signals are less forgiving.';
		}
		return 'Mixed local picture. Read these labour indicators as current Singapore context rather than a forecast.';
	});

	function pressureBarClass(v: number) {
		return v >= 0.5 ? 'bg-risk-very-high' : v >= 0.3 ? 'bg-risk-high' : v >= 0.15 ? 'bg-risk-moderate' : 'bg-risk-very-low';
	}

	function marketBarClass(v: number) {
		return v >= 0.6 ? 'bg-risk-very-low' : v >= 0.35 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	function _adaptationBarClass(v: number) {
		return v >= 0.55 ? 'bg-risk-very-low' : v >= 0.35 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	function _realizedBarClass(v: number) {
		return v >= 0.1 ? 'bg-risk-very-high' : v >= 0.05 ? 'bg-risk-moderate' : 'bg-risk-very-low';
	}

	function confidenceBarClass(v: number) {
		return v >= 0.7 ? 'bg-risk-very-low' : v >= 0.4 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	function _offsetLevelLabel(value: number, inverse = false) {
		const score = inverse ? 1 - value : value;
		if (score >= 0.68) return 'High';
		if (score >= 0.42) return 'Medium';
		return 'Low';
	}

	function _adaptationTone() {
		return decision.adaptationLabel === 'strong'
			? 'positive'
			: decision.adaptationLabel === 'moderate'
				? 'warning'
				: 'danger';
	}

	function _realizedTone() {
		return decision.realizedLabel === 'contained'
			? 'positive'
			: decision.realizedLabel === 'watch'
				? 'warning'
				: 'danger';
	}

	function _pathwayTone() {
		return decision.bestTransition?.evidence_status === 'observed_enriched' ? 'positive' : 'muted';
	}

	function formatPercent(value: number, digits = 0) {
		return `${(value * 100).toFixed(digits)}%`;
	}

	let _decisionHeroSummary = $derived.by(() => {
		const realizedSentence =
			decision.realizedLabel === 'contained'
				? 'Near-term realized pressure is still contained.'
				: decision.realizedLabel === 'watch'
					? 'Near-term realized pressure is worth watching.'
					: 'Near-term realized pressure is elevated.';
		return `${formatPercent(decision.transitionAdjustedRisk)} transition-adjusted pressure after current buffers. ${realizedSentence}`;
	});

	let _seniorityOutlookNote = $derived.by(() =>
		selectedSeniority === 'mid'
			? 'Mid-career is the neutral baseline for the base-case outlook.'
			: `${seniorityAdjustments[selectedSeniority].label} modifier applied to the base-case outlook.`
	);

	let _signalProfileItems = $derived([
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
			label: 'Evidence',
			value: `${(occ.confidence.score * 100).toFixed(0)}%`,
			barValue: occ.confidence.score,
			barClass: confidenceBarClass(occ.confidence.score)
		}
	]);

	async function shareCurrentPage() {
		if (!browser) return;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `${occ.title} — ${SITE.name}`,
					text: `AI displacement risk for ${occ.title}: ${(occ.net_risk * 100).toFixed(0)}%`,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url);
			toast('Link copied', { description: occ.title });
		} catch {}
	}

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
	<div class={cn(card({ padding: 'lg' }), section({ spacing: 'loose' }), 'overflow-hidden')}>
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
						<div class="mt-1.5 flex flex-wrap items-center gap-2">
							<span class={impactBadge({ type: occ.impact_type })}>
								{impactTypeLabels[occ.impact_type]}
							</span>
							<span class={pill({ tone: 'muted' })}>
								{group?.label ?? occ.major_group}
							</span>
							{#if hasDemand}
								<span class={pill({ tone: 'positive' })}>
									In demand ({demandLabel})
								</span>
							{/if}
						</div>
						<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
							<span class={cn(mono({ size: 'md' }), 'text-muted-foreground')}>
								SGD {occ.gross_wage_median.toLocaleString()}/mo
								{#if occ.gross_wage_25th > 0 && occ.gross_wage_75th > 0}
									<span class="opacity-60">({occ.gross_wage_25th.toLocaleString()}–{occ.gross_wage_75th.toLocaleString()})</span>
								{/if}
							</span>
							{#if occ.estimated_sg_employment_thousands}
								<span class={caption()}>
									~{occ.estimated_sg_employment_thousands >= 1 ? occ.estimated_sg_employment_thousands.toFixed(1) + 'K' : Math.round(occ.estimated_sg_employment_thousands * 1000).toLocaleString()} workers in SG
								</span>
							{/if}
						</div>
						<p class={cn(body({ size: 'lg', tone: 'subtle' }), 'mt-3 max-w-3xl')}>
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
						<Button variant="outline" size="sm" class="h-8 text-xs" onclick={shareCurrentPage}>
							Share
						</Button>
					</div>
				</div>

				<!-- Buffer line + conditional trust cue -->
				<p class={cn(caption(), 'mt-3')}>
					{#if decision.adaptationCapacity >= 0.55}
						Current buffers materially reduce the raw score.
					{:else if decision.adaptationCapacity >= 0.35}
						Current buffers soften the raw score somewhat.
					{:else}
						Limited buffers available against the structural pressure.
					{/if}
					{#if occ.confidence.level === 'low'}
						<span class="ml-1 text-risk-moderate">Thin evidence — treat with caution.</span>
					{:else if occ.evidence.signal_conflict}
						<span class="ml-1 text-risk-moderate">Mixed signals across sources.</span>
					{/if}
				</p>
			</div>
		</div>
	</div>

	<!-- ===== BLOCK 2: WHY THIS SCORE ===== -->
	<section class={section({ spacing: 'loose' })}>
		<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
			<span class="h-4 w-1 rounded-full bg-primary"></span>
			Why This Score
		</h2>
		<div class={card({ padding: 'md' })}>
			<div class="grid gap-6 md:grid-cols-5">
				<!-- Left: Waterfall (3/5 on desktop) -->
				<div class="md:col-span-3">
					<DriverWaterfall occupation={occ} />
					<p class={cn(caption(), 'mt-2')}>
						Exposure × (1 − Bottleneck) × Market Modifier.
						{#if occ.stability.label !== 'stable'}
							<span class="text-risk-moderate">Band stability: {occ.stability.label}.</span>
						{/if}
						<a href="/methodology" class="text-primary hover:underline">How this works</a>
					</p>
				</div>

				<!-- Right: Task split (2/5 on desktop) -->
				<div class="md:col-span-2 space-y-4">
					<div>
						<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-risk-high')}>Tasks AI can handle</p>
						<p class={body({ tone: 'muted' })}>
							{structural.personalizedContent.aiCanDo}
						</p>
					</div>
					<div>
						<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-risk-very-low')}>Where humans stay essential</p>
						<p class={body({ tone: 'muted' })}>
							{structural.personalizedContent.humanNeeded}
						</p>
					</div>
					{#if structural.personalizedContent.skills.length > 0}
						<div class="pt-3 border-t border-border">
							<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>Skills to focus on</p>
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

			{#if occ.workflow_overlay}
				<div class="mt-5 pt-5 border-t border-border">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>Role profile</p>
					<div class="flex justify-center">
						<WorkflowRadar dimensions={occ.workflow_overlay} size={240} />
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- ===== BLOCK 3: SINGAPORE NOW ===== -->
	<section class={section({ spacing: 'loose' })}>
		<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
			<span class="h-4 w-1 rounded-full bg-impact-leveraged"></span>
			Singapore Now
		</h2>
		<div class={card({ padding: 'md' })}>
			<p class={cn(body({ tone: 'subtle' }), 'mb-4')}>{marketHeadline}</p>

			<!-- Labour metrics row -->
			{#if occ.labour_monitor}
				<div class="grid gap-3 sm:grid-cols-4 mb-4">
					<div class={card({ padding: 'sm', variant: 'metric' })}>
						<p class={microLabel()}>Vacancy</p>
						<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
							{occ.labour_monitor.vacancy.latest_rate}%
						</p>
						<p
							class={cn(
								caption({ weight: 'medium' }),
								occ.labour_monitor.vacancy.trend_4q_pct > 0
									? 'text-risk-very-low'
									: occ.labour_monitor.vacancy.trend_4q_pct < 0
										? 'text-risk-high'
										: ''
							)}
						>
							{occ.labour_monitor.vacancy.trend_4q_pct > 0
								? '↑'
								: occ.labour_monitor.vacancy.trend_4q_pct < 0
									? '↓'
									: '→'}
							{Math.abs(occ.labour_monitor.vacancy.trend_4q_pct).toFixed(1)}% YoY
						</p>
					</div>
					{#if occ.labour_monitor.hiring}
						<div class={card({ padding: 'sm', variant: 'metric' })}>
							<p class={microLabel()}>Hiring</p>
							<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
								{occ.labour_monitor.hiring.recruitment_rate}%
							</p>
							<p class={caption()}>
								vs {occ.labour_monitor.hiring.resignation_rate}% resign
							</p>
						</div>
					{/if}
					{#if occ.labour_monitor.retrenchment?.incidence_per_1000}
						<div class={card({ padding: 'sm', variant: 'metric' })}>
							<p class={microLabel()}>Retrenchment</p>
							<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
								{occ.labour_monitor.retrenchment.incidence_per_1000}
							</p>
							<p class={caption()}>
								per 1,000 · {occ.labour_monitor.retrenchment.incidence_per_1000 < 2
									? 'low'
									: occ.labour_monitor.retrenchment.incidence_per_1000 < 5
										? 'moderate'
										: 'elevated'}
							</p>
						</div>
					{:else if postings && postings.hiring_state !== 'no_signal'}
						<div class={card({ padding: 'sm', variant: 'metric' })}>
							<p class={microLabel()}>Postings</p>
							<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>{postings.posting_volume_30d}</p>
							<p class={caption()}>last 30 days</p>
						</div>
					{/if}
					{#if occ.labour_monitor.re_entry?.rate_12m}
						<div class={card({ padding: 'sm', variant: 'metric' })}>
							<p class={microLabel()}>Re-entry</p>
							<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
								{occ.labour_monitor.re_entry.rate_12m}%
							</p>
							<p class={caption()}>
								find work in 12mo{#if occ.labour_monitor.re_entry.rate_12m_delta_pp}
									· <span
										class={occ.labour_monitor.re_entry.rate_12m_delta_pp > 0
											? 'text-risk-very-low'
											: 'text-risk-high'}
										>{occ.labour_monitor.re_entry.rate_12m_delta_pp > 0
											? '+'
											: ''}{occ.labour_monitor.re_entry.rate_12m_delta_pp.toFixed(1)}pp</span
									>{/if}
							</p>
						</div>
					{/if}
				</div>
				<p class={cn(caption(), 'mb-4')}>
					{occ.labour_monitor.cluster_label} · {siteStatus.live_monitor
						.labour_monitor_artifact_vintage}
				</p>
			{/if}

			<div class="grid gap-4 md:grid-cols-2">
				{#if industryContext}
					<div class={card({ padding: 'sm' })}>
						<p class={cn(microLabel(), 'mb-2')}>Top Industries</p>
						{#each industryContext.top_industries.slice(0, 3) as industry (industry.key)}
							<div
								class="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
							>
								<span class={body()}>{industry.label}</span>
								<div class="flex items-center gap-2 shrink-0">
									{#if industry.vacancy_signal && industry.vacancy_signal !== 'stable'}
										<span class={cn(caption(), vacancySignalClass(industry.vacancy_signal))}>
											{industry.vacancy_signal === 'rising' ? '↑' : '↓'}
										</span>
									{/if}
									<span class={cn(mono({ size: 'sm' }), 'text-muted-foreground')}
										>{(industry.share_2025 * 100).toFixed(0)}%</span
									>
								</div>
							</div>
						{/each}
						<p class={cn(caption(), 'mt-3')}>
							Industry vacancy overlays use the latest published detailed cross-tab, which can lag
							the main labour monitor.
						</p>
					</div>
				{/if}

				<div class={card({ padding: 'sm' })}>
					<p class={cn(microLabel(), 'mb-3')}>How this changes by career stage</p>
					<div class="space-y-2">
						<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'flex items-center justify-between')}>
							<span class={caption()}>Junior / Entry-level</span>
							<span class={caption({ weight: 'medium' })}><span class="text-risk-high">Higher substitution exposure</span></span>
						</div>
						<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'flex items-center justify-between')}>
							<span class={caption()}>Mid-career</span>
							<span class={cn(caption({ weight: 'medium' }), 'text-foreground')}>Baseline role profile</span>
						</div>
						<div class={cn(card({ padding: 'sm', variant: 'inset' }), 'flex items-center justify-between')}>
							<span class={caption()}>Senior / Lead</span>
							<span class={caption({ weight: 'medium' })}><span class="text-risk-very-low">More insulated</span></span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- ===== BLOCK 4: WHAT YOU CAN DO ===== -->
	<section class={section({ spacing: 'loose' })}>
		<h2 class={cn(titleStyle({ size: 'subsection' }), 'mb-3 flex items-center gap-2')}>
			<span class="h-4 w-1 rounded-full bg-risk-very-low"></span>
			What You Can Do
		</h2>
		<div class={card({ padding: 'md' })}>
			{#if offsetPotential}
				<p class={cn(body({ tone: 'subtle' }), 'mb-4 pb-4 border-b border-border')}>
					{offsetPotential.summary}{#if offsetPotential.components.mobility_friction > 0.5} Adjacent routes exist, but switching friction is still high.{/if}
				</p>
			{/if}

			{#if transitionSupport}
				<div class="mb-4 border-b border-border pb-4">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>Published transition support</p>
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

			{#if allUniqueTransitions.length > 0}
				<div class="mb-4 border-b border-border pb-4">
					<div class="flex items-center gap-2 mb-3">
						<p class={cn(caption({ weight: 'semibold' }), 'text-foreground')}>Adjacent pathways to investigate</p>
						<span class={pill({ size: 'sm', tone: 'muted' })}>Similarity-based</span>
					</div>
					<div class="grid gap-2 sm:grid-cols-3">
						{#each allUniqueTransitions.slice(0, 3) as t}
							<a href="/occupation/{t.to_ssoc}" class={cn(card({ padding: 'sm', variant: 'inset' }), 'block hover:bg-accent hover:shadow-sm transition-all group')}>
								<p class={cn(body(), 'font-medium text-foreground truncate')}>{t.to_title} <span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span></p>
								<div class={cn(caption(), 'mt-1 flex items-center gap-2')}>
									<span class={t.risk_improvement > 0 ? 'text-risk-very-low' : t.risk_improvement < 0 ? 'text-risk-high' : ''}>
										{#if t.risk_improvement > 0}-{(t.risk_improvement * 100).toFixed(0)}pp risk{:else if t.risk_improvement < 0}+{(Math.abs(t.risk_improvement) * 100).toFixed(0)}pp risk{:else}No risk change{/if}
									</span>
									<span>·</span>
									<span>{t.label}</span>
								</div>
							</a>
						{/each}
					</div>
					{#if allUniqueTransitions.length > 3}
						<details class="mt-2">
							<summary class={cn(caption({ weight: 'medium' }), 'cursor-pointer text-primary hover:underline')}>See {allUniqueTransitions.length - 3} more</summary>
							<div class="mt-2 grid gap-2 sm:grid-cols-3">
								{#each allUniqueTransitions.slice(3) as t}
									<a href="/occupation/{t.to_ssoc}" class={cn(card({ padding: 'sm', variant: 'inset' }), 'block hover:bg-accent hover:shadow-sm transition-all group')}>
										<p class={cn(body(), 'font-medium text-foreground truncate')}>{t.to_title} <span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span></p>
										<div class={cn(caption(), 'mt-1 flex items-center gap-2')}>
											<span>{(t.composite * 100).toFixed(0)}%</span>
											<span>·</span>
											<span>{t.label}</span>
										</div>
									</a>
								{/each}
							</div>
						</details>
					{/if}
				</div>
			{/if}

			<div class="flex items-center justify-between">
				<p class={caption()}>See how this compares to similar occupations</p>
				<a
					href="/compare?entities=occupation:{occ.ssoc}"
					class={cn(caption({ weight: 'medium' }), 'text-primary hover:underline')}
				>
					Compare with... →
				</a>
			</div>
		</div>
	</section>

	<!-- ===== TECHNICAL DETAILS (collapsible) ===== -->
	<Collapsible.Root class={cn(card({ padding: 'none' }), section({ spacing: 'loose' }))}>
		<Collapsible.Trigger
			class={cn(sectionLabel(), 'flex w-full items-center justify-between px-5 py-3 hover:text-foreground transition-colors')}
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
		<Collapsible.Content class="border-t border-border px-5 py-4 text-xs text-muted-foreground space-y-3">
			<!-- Group 1: Classification & scoring -->
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Classification</p>
					<p>Higher risk than {structural.riskPercentile}% of occupations{#if occ.scoring_basis} · {scoringBasisSummary}{/if}{#if occ.education_label} · {occ.education_label}{/if}</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Raw scores</p>
					<p class={mono({ size: 'sm' })}>AIOE {occ.raw.aioe.toFixed(3)} · θ {occ.raw.theta.toFixed(3)} · C-AIOE {occ.raw.c_aioe.toFixed(3)}</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Stability</p>
					<p>{occ.stability.label} · Optimistic {(occ.stability.optimistic_risk * 100).toFixed(0)}% · Pessimistic {(occ.stability.pessimistic_risk * 100).toFixed(0)}%</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Sensitivity band</p>
					<p>Exposure {exposureUncertainty} · Net risk {netRiskUncertainty}</p>
				</div>
				<div class="sm:col-span-2">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Scoring basis</p>
					<p>{scoringBasisSummary}. {scoringBasisDetail}{#if priorBaselineDeltaSummary} {priorBaselineDeltaSummary}{/if}</p>
				</div>
				<div class="sm:col-span-2">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Wage range (SGD/mo)</p>
					<p class={mono({ size: 'sm' })}>25th {occ.gross_wage_25th.toLocaleString()} · Median {occ.gross_wage_median.toLocaleString()} · 75th {occ.gross_wage_75th.toLocaleString()}</p>
				</div>
			</div>

			<!-- Group 2: Evidence & sources -->
			<details class="pt-3 border-t border-border">
				<summary class="cursor-pointer text-xs font-semibold text-foreground hover:text-primary">Evidence & sources</summary>
				<div class="mt-3 grid gap-3 sm:grid-cols-2">
					<div>
						<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>Crosswalk</p>
						<p>{occ.match_quality} · SSOC {occ.ssoc}</p>
						{#if occ.evidence.sol_match}<p class="text-risk-very-low">SOL 2026: {occ.evidence.sol_match} match</p>{/if}
						{#if occ.evidence.jobs_in_demand_match}<p class="text-risk-very-low">Jobs in Demand: {occ.evidence.jobs_in_demand_match} match</p>{/if}
						{#if occ.evidence.anthropic_calibrated}<p>Anthropic: {occ.evidence.anthropic_gap !== null ? (occ.evidence.anthropic_gap > 0 ? '+' : '') + Math.round(occ.evidence.anthropic_gap * 100) + 'pp vs theory' : 'calibrated'}</p>{/if}
					</div>
					<div>
						<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>Evidence quality</p>
						<p>{(occ.confidence.score * 100).toFixed(0)}% · Crosswalk {occ.confidence.crosswalk_quality.toFixed(2)} · Market {occ.confidence.market_data_granularity.toFixed(2)} · Fresh {occ.confidence.source_freshness.toFixed(2)}</p>
						<p class="mt-1">{taskEvidenceSummary}</p>
					</div>
					<div class="sm:col-span-2">
						<EvidenceBar
							sourceCount={occ.evidence.exposure_source_count ?? 0}
							sourceKeys={occ.evidence.exposure_source_keys ?? []}
							agreement={occ.evidence.exposure_agreement ?? null}
							signalConflict={occ.evidence.signal_conflict ?? false}
						/>
					</div>
					{#if occ.evidence?.exposure_source_pctiles}
						<div class="sm:col-span-2">
							<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>Exposure by source</p>
							<div class="flex flex-wrap gap-3 mt-1">
								{#each Object.entries(occ.evidence.exposure_source_pctiles) as [source, pctile]}
									<div class="flex items-center gap-2">
										<span class={cn(microLabel(), 'w-16')}>{source}</span>
										<div class="h-2 w-24 rounded-full bg-muted overflow-hidden">
											<div class="h-full rounded-full bg-foreground/60" style="width: {(pctile ?? 0) * 100}%"></div>
										</div>
										<span class={mono({ size: 'sm' })}>{((pctile ?? 0) * 100).toFixed(0)}%</span>
									</div>
								{/each}
							</div>
							{#if occ.evidence?.exposure_source_weights}
								<p class="mt-1">Weights: {Object.entries(occ.evidence.exposure_source_weights).map(([k, v]) => `${k} ${((v ?? 0) * 100).toFixed(0)}%`).join(' · ')}</p>
							{/if}
						</div>
					{/if}
					{#if occ.evidence?.signal_conflict_reasons?.length}
						<div class="sm:col-span-2">
							<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>Signal conflicts</p>
							<div class="flex flex-wrap gap-1.5">
								{#each occ.evidence.signal_conflict_reasons as reason}
									<span class={pill({ size: 'sm', tone: 'warning' })}>{reason.replaceAll('_', ' ')}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</details>

			<!-- Group 3: O*NET + offset factors -->
			{#if (structural.onetEnrichment?.technologies.length ?? 0) > 0 || (offsetPotential && (offsetPotential.strengths.length > 0 || offsetPotential.cautions.length > 0))}
				<details class="pt-3 border-t border-border">
					<summary class="cursor-pointer text-xs font-semibold text-foreground hover:text-primary">Tools & offset factors</summary>
					<div class="mt-3 space-y-3">
						{#if (structural.onetEnrichment?.technologies.length ?? 0) > 0}
							<div>
								<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>Common tools (O*NET proxy)</p>
								<div class="flex flex-wrap gap-1.5">
									{#each structural.onetEnrichment?.technologies.slice(0, 6) ?? [] as technology}
										<span class={pill({ tone: technology.hot ? 'positive' : 'muted' })}>{technology.name}</span>
									{/each}
								</div>
							</div>
						{/if}
						{#if offsetPotential && (offsetPotential.strengths.length > 0 || offsetPotential.cautions.length > 0)}
							<div class="grid gap-3 sm:grid-cols-2">
								{#if offsetPotential.strengths.length > 0}
									<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'min-w-0')}>
										<p class={cn(caption({ weight: 'semibold' }), 'text-impact-leveraged')}>What helps</p>
										<ul class="mt-1 space-y-0.5">{#each offsetPotential.strengths as item}<li>{item}</li>{/each}</ul>
									</div>
								{/if}
								{#if offsetPotential.cautions.length > 0}
									<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'min-w-0')}>
										<p class={cn(caption({ weight: 'semibold' }), 'text-risk-high')}>What could slow it down</p>
										<ul class="mt-1 space-y-0.5">{#each offsetPotential.cautions as item}<li>{item}</li>{/each}</ul>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</details>
			{/if}

			<!-- Group 4: Worker profile & local context -->
			{#if workerProfile.items.length > 0 || geographyContext.items.length > 0 || localContextItems.length > 0 || marketDetailBullets.length > 0}
				<details class="pt-3 border-t border-border">
					<summary class="cursor-pointer text-xs font-semibold text-foreground hover:text-primary">Worker profile & local context</summary>
					<div class="mt-3 space-y-4">
						{#if marketDetailBullets.length > 0}
							<ul class="space-y-1">{#each marketDetailBullets as item}<li>{item}</li>{/each}</ul>
						{/if}
						{#if localContextItems.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each localContextItems as item (item.key)}
									<span class={pill({ size: 'sm', tone: item.tone === 'protective' ? 'positive' : item.tone === 'pressure' ? 'danger' : item.tone === 'support' ? 'primary' : 'neutral' })} title={item.description}>{item.label}: {item.value}</span>
								{/each}
							</div>
						{/if}
						{#if workerProfile.items.length > 0}
							<ContextItemGrid title="Worker profile" items={workerProfile.items} />
						{/if}
						{#if geographyContext.items.length > 0}
							<ContextItemGrid title="Where this work is concentrated" items={geographyContext.items} />
						{/if}
					</div>
				</details>
			{/if}
		</Collapsible.Content>
	</Collapsible.Root>
</main>
