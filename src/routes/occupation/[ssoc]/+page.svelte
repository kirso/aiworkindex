<script lang="ts">
	import { browser } from '$app/environment';
	import { riskBandLabels, majorGroupByKey } from '$lib/data';
	import { likelyPathwayLabels } from '$lib/data/v8-display';
	import {
		card,
		pageLayout,
		title as titleStyle,
		sectionLabel,
		body,
		caption,
		mono,
		pill,
		microLabel,
		section,
		sectionNumber,
		dataChip
	} from '$lib/design-system';
	import { broadJobMarketContext, broadRealWageContext } from '$lib/data/job-market-context';
	import { cn } from '$lib/utils';
	import { vacancySignalClass } from '$lib/data/detail-display';
	import OccupationCard from '$lib/components/ui/OccupationCard.svelte';
	import OccupationHero from '$lib/components/ui/OccupationHero.svelte';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import WorkflowRadar from '$lib/components/viz/WorkflowRadar.svelte';
	import EvidenceBar from '$lib/components/viz/EvidenceBar.svelte';
	import _SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ContextItemGrid from '$lib/components/ui/ContextItemGrid.svelte';
	import OutcomeContextLenses from '$lib/components/ui/OutcomeContextLenses.svelte';
	import { siteStatus } from '$lib/data/site-status';
	import { countryConfigs } from '$lib/data/country-config';
	import { SITE, DATA_VINTAGE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';
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
	import { buildSingaporeOccupationAlternates } from '$lib/data/occupation-alternates';
	import { rolesBySsoc } from '$lib/data/synthetic-roles';

	let { data } = $props();
	let occ = $derived(data.occupation);
	let structural = $derived(data.structural);
	let context = $derived(data.context);
	let decision = $derived(structural.decision);
	let crossesBoundary = $derived(occ.v8.sensitivity.label === 'crosses_band');

	let isWatchlisted = $state(false);

	$effect(() => {
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
	let groupSlug = $derived(occ.major_group.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-'));
	let linkedRoles = $derived(rolesBySsoc.get(occ.ssoc) ?? []);
	let allUniqueTransitions = $derived(structural.topTransitions ?? []);
	// Quadrant verdict from the shared exit-quadrant module (null below the displacement threshold).
	let exitQuadrant = $derived(data.exitQuadrant);
	// High-risk pages show risk-reducing exits (matching the quadrant verdict copy);
	// low-risk pages keep similarity-ranked related roles.
	let displayTransitions = $derived(
		exitQuadrant?.targets?.length ? exitQuadrant.targets : allUniqueTransitions
	);
	// Explanatory per-task evidence and theta-channel decomposition (never score inputs).
	let taskDetail = $derived(data.taskDetail);
	let channelInfo = $derived(data.channelInfo);
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
		`${occ.v8.sensitivity.minimum_points}–${occ.v8.sensitivity.maximum_points}/100 across source-weight sensitivity checks`
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
	let priorBaselineDeltaSummary = $derived(null);
	let scoringBasisSummary = $derived('V8 AI Exposure Rank');
	let scoringBasisDetail = $derived(
		'A relative Singapore occupation index. It ranks AI task exposure; it is not a probability of job loss or a percentage of tasks.'
	);
	const confidenceCapLabels = {
		insufficient_source_count: 'capped for sparse source coverage',
		fallback_mapping: 'capped for fallback mapping',
		major_fallback_mapping: 'capped for broad fallback mapping',
		signal_conflict: 'capped for conflicting signals'
	} as const;
	let confidenceDetail = $derived.by(() => {
		const capReason = occ.confidence.policy_cap_reason;
		if (!capReason) return null;
		return confidenceCapLabels[capReason];
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

	let outcomeLenses = $derived.by(() => {
		const adoption = occ.v8.market_context.adoption;
		const demand = occ.v8.market_context.demand;
		const transition = occ.v8.transition;
		const labour = occ.labour_monitor;
		const taskCoverage = occ.task_primitives?.task_effective_coverage ?? 0;
		const jobQuality = broadJobMarketContext(occ.major_group);
		const wageMovement = broadRealWageContext(occ.major_group);

		return [
			{
				label: 'Workplace adoption',
				value:
					adoption === 'leading'
						? 'Leading sectors represented'
						: adoption === 'established'
							? 'Adoption established'
							: adoption === 'emerging'
								? 'Adoption emerging'
								: 'Occupation-level adoption unknown',
				detail: occ.v8.market_context.adoption_basis,
				tone: adoption === 'unknown' ? ('warning' as const) : ('neutral' as const)
			},
			{
				label: 'Task structure',
				value: taskCoverage > 0 ? 'Task evidence available' : 'Task evidence limited',
				detail: taskEvidenceSummary,
				tone: taskCoverage > 0 ? ('neutral' as const) : ('warning' as const)
			},
			{
				label: 'Human advantage',
				value: 'Coordination and judgment still matter',
				detail: structural.personalizedContent.humanNeeded,
				tone: 'positive' as const
			},
			{
				label: 'Hiring and demand',
				value: labour
					? `${labour.vacancy.latest_rate}% vacancy rate · ${labour.data_as_of}`
					: `${demand} official demand context`,
				detail: [labour?.summary ?? occ.v8.market_context.demand_basis, jobQuality, wageMovement]
					.filter(Boolean)
					.join(' '),
				tone:
					demand === 'strong'
						? ('positive' as const)
						: demand === 'weak'
							? ('caution' as const)
							: ('neutral' as const)
			},
			{
				label: 'Career transitions',
				value: transition?.to_title ?? 'No dominant route identified',
				detail: transition
					? `${transition.label} modeled transition; outcomes still depend on skills, wages and openings.`
					: 'Explore related work and published training support rather than treating exposure as destiny.',
				tone: transition ? ('positive' as const) : ('warning' as const)
			},
			{
				label: 'Evidence strength',
				value: `${occ.v8.evidence_confidence.level} confidence`,
				detail: `${occ.v8.evidence_confidence.exposure_source_count} exposure sources · sensitivity ${netRiskUncertainty.toLowerCase()}.`,
				tone:
					occ.v8.evidence_confidence.level === 'high'
						? ('positive' as const)
						: occ.v8.evidence_confidence.level === 'low'
							? ('caution' as const)
							: ('warning' as const)
			}
		];
	});

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

	async function shareCurrentPage() {
		if (!browser) return;
		const url = window.location.href;
		try {
			if (navigator.share) {
				await navigator.share({
					title: `${occ.title} — ${SITE.name}`,
					text: `AI Exposure Rank for ${occ.title}: ${occ.v8.ai_exposure_rank.points}/100`,
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
			dateModified: DATA_VINTAGE.last_updated,
			occupationalCategory: occ.major_group,
			estimatedSalary: {
				'@type': 'MonetaryAmountDistribution',
				name: 'Gross Monthly Wage',
				currency: 'SGD',
				median: occ.gross_wage_median,
				percentile25: occ.gross_wage_25th,
				percentile75: occ.gross_wage_75th
			},
			occupationLocation: { '@type': 'Country', name: 'Singapore live reference market' },
			...(occ.isco_codes_matched?.length
				? { sameAs: SITE.url + '/global/occupation/' + occ.isco_codes_matched[0] }
				: {}),
			additionalProperty: [
				{
					'@type': 'PropertyValue',
					name: 'AI Exposure Rank',
					value: occ.v8.ai_exposure_rank.points
				},
				{
					'@type': 'PropertyValue',
					name: 'AI Exposure Band',
					value: riskBandLabels[occ.v8.ai_exposure_rank.band]
				},
				{
					'@type': 'PropertyValue',
					name: 'Likely Job Pathway',
					value: likelyPathwayLabels[occ.v8.likely_pathway]
				},
				{
					'@type': 'PropertyValue',
					name: 'Evidence Quality',
					value: occ.v8.evidence_confidence.level
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
					name: countryConfigs.sg.displayName,
					item: SITE.url + '/sg'
				},
				{
					'@type': 'ListItem',
					position: 3,
					name: occ.title,
					item: SITE.url + '/occupation/' + occ.ssoc
				}
			]
		})}<\/script>`
	);

	let riskPct = $derived(String(occ.v8.ai_exposure_rank.points));

	let faqItems = $derived([
		{
			question: 'Will AI replace ' + occ.title + '?',
			answer:
				structural.summaryText +
				' AI Exposure Rank: ' +
				riskPct +
				'/100 (' +
				riskBandLabels[occ.v8.ai_exposure_rank.band] +
				'). Median wage: SGD ' +
				occ.gross_wage_median.toLocaleString() +
				'/month.'
		},
		{
			question: 'What is the AI exposure rank for ' + occ.title + '?',
			answer:
				occ.title +
				' has an AI Exposure Rank of ' +
				riskPct +
				'/100, rated ' +
				riskBandLabels[occ.v8.ai_exposure_rank.band] +
				'. It ranks higher than approximately ' +
				riskPct +
				'% of Singapore occupations for exposure to current AI capabilities; it is not a job-loss probability.'
		},
		{
			question: 'What career transitions are available for ' + occ.title + '?',
			answer: structural.decision.bestTransition
				? occ.title +
					' has modeled transition pathways to related occupations. The strongest adjacent pathway is ' +
					structural.decision.bestTransition.to_title +
					(structural.decision.bestTransition.evidence_status === 'observed_enriched'
						? ', supported by observed mobility evidence.'
						: ', based on skill and wage similarity (model-estimated).') +
					' Transition scoring accounts for wage preservation, training ease, and destination quality.'
				: occ.title +
					' does not have a clearly dominant transition pathway in the current model. Career mobility options should be explored through industry-specific training and reskilling programmes.'
		},
		{
			question: 'How does ' + occ.title + ' salary compare in the live market?',
			answer:
				occ.title +
				' earns a median gross wage of SGD ' +
				occ.gross_wage_median.toLocaleString() +
				'/month in the live market' +
				(occ.gross_wage_25th > 0 && occ.gross_wage_75th > 0
					? ' (25th-75th percentile: SGD ' +
						occ.gross_wage_25th.toLocaleString() +
						'-' +
						occ.gross_wage_75th.toLocaleString() +
						')'
					: '') +
				'. This is ' +
				structural.wageVsNational +
				' across all ' +
				DATA_VINTAGE.occupation_count +
				' scored occupations, and ' +
				structural.groupComparison.wageVsGroup +
				' within ' +
				structural.groupComparison.groupName +
				' occupations.'
		}
	]);

	let faqJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: faqItems.map(item => ({
				'@type': 'Question',
				name: item.question,
				acceptedAnswer: { '@type': 'Answer', text: item.answer }
			}))
		})}<\/script>`
	);

	let pageTitle = $derived(`Will AI Replace ${occ.title}? Exposure & Job Outlook | ${SITE.name}`);
	let pageDescription = $derived(
		`${occ.title} (SSOC ${occ.ssoc}) has an AI Exposure Rank of ${riskPct}/100, ranked ${riskBandLabels[occ.v8.ai_exposure_rank.band]}. See the likely pathway, demand context, evidence and transitions.`
	);
	const alternates = $derived(
		buildSingaporeOccupationAlternates(occ.ssoc, occ.isco_codes_matched?.[0] ?? null)
	);
</script>

<Seo
	title={pageTitle}
	description={pageDescription}
	path="/occupation/{occ.ssoc}"
	ogImage="/og/{occ.ssoc}.png"
	{alternates}
	jsonLd={[occJsonLd, breadcrumbJsonLd, faqJsonLd]}
/>

<div class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: countryConfigs.sg.displayName, href: '/sg' },
			{ label: occ.title }
		]}
	/>

	<!-- ===== BLOCK 1: THE VERDICT ===== -->
	<div class={section({ spacing: 'loose' })}>
		<OccupationHero
			scoreLabel="AI Exposure Rank"
			scoreValue={`${occ.v8.ai_exposure_rank.points}/100`}
			scoreRange={netRiskUncertainty}
			scoreBand={occ.v8.ai_exposure_rank.band}
			scoreBandLabel={riskBandLabels[occ.v8.ai_exposure_rank.band]}
			title={occ.title}
			pills={[
				{
					label: likelyPathwayLabels[occ.v8.likely_pathway],
					tone:
						occ.v8.likely_pathway === 'hiring_or_substitution_pressure'
							? 'danger'
							: occ.v8.likely_pathway === 'augmentation_led_growth'
								? 'positive'
								: occ.v8.likely_pathway === 'limited_direct_change'
									? 'neutral'
									: 'warning'
				},
				...(hasDemand ? [{ label: `In demand (${demandLabel})`, tone: 'positive' as const }] : []),
				...(crossesBoundary
					? [{ label: 'Classification uncertain', tone: 'warning' as const }]
					: [])
			]}
			summary={structural.summaryText}
			meta={[
				group?.label ?? occ.major_group,
				`SGD ${occ.gross_wage_median.toLocaleString()}/mo${occ.gross_wage_25th > 0 && occ.gross_wage_75th > 0 ? ` (${occ.gross_wage_25th.toLocaleString()}–${occ.gross_wage_75th.toLocaleString()})` : ''}`,
				occ.estimated_sg_employment_thousands
					? `~${
							occ.estimated_sg_employment_thousands >= 1
								? occ.estimated_sg_employment_thousands.toFixed(1) + 'K'
								: Math.round(occ.estimated_sg_employment_thousands * 1000).toLocaleString()
						} workers in SG`
					: 'Employment context not published',
				`Updated ${DATA_VINTAGE.last_updated}`
			]}
		>
			{#snippet actions()}
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
			{/snippet}
		</OccupationHero>

		<div class="mt-3 flex flex-wrap items-center gap-2">
			<span class={dataChip()} title="Wage compared to group median">
				Wage {structural.groupComparison.wageVsGroup}
			</span>
			<span class={dataChip()} title="AI exposure compared to group median">
				Exposure {structural.groupComparison.riskVsGroup}
			</span>
			<a
				href="/group/{groupSlug}"
				class={cn(dataChip(), 'transition-colors hover:bg-foreground hover:text-background')}
			>
				#{structural.groupComparison.riskRankInGroup} of {structural.groupComparison.groupTotal} in {group?.label ??
					'group'} →
			</a>
		</div>
		{#if occ.evidence.signal_conflict && occ.evidence.signal_conflict_reasons?.some( r => r.includes('demand') )}
			<div
				class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3 max-w-3xl')}
			>
				<p class={cn(caption({ weight: 'medium' }), 'text-risk-moderate')}>
					Mixed signal: This occupation has {riskBandLabels[occ.risk_band].toLowerCase()} relative AI
					exposure but is currently
					{#if occ.evidence.sol_match === 'exact' && occ.evidence.jobs_in_demand_match === 'exact'}
						on both the Shortage Occupation List and Jobs in Demand — indicating strong active
						demand despite AI exposure.
					{:else if occ.evidence.sol_match}
						on the Shortage Occupation List — indicating labour shortage despite AI exposure.
					{:else if occ.evidence.jobs_in_demand_match}
						flagged as Jobs in Demand — indicating positive hiring signals despite AI exposure.
					{:else}
						showing positive labour market signals despite AI exposure.
					{/if}
				</p>
			</div>
		{/if}

		{#if occ.confidence.level === 'low'}
			<p class={cn(caption(), 'mt-3 text-risk-moderate')}>Thin evidence — treat with caution.</p>
		{/if}
	</div>

	<!-- ===== BLOCK 2: HOW THIS RANK IS BUILT ===== -->
	<section class={section({ spacing: 'loose' })}>
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>01</span>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-0.5')}>How This Rank Is Built</h2>
		</div>
		<div class={card({ padding: 'md' })}>
			<div class="grid gap-6 md:grid-cols-5">
				<!-- Left: Waterfall (3/5 on desktop) -->
				<div class="md:col-span-3">
					<DriverWaterfall occupation={occ} />
					<p class={cn(caption(), 'mt-2')}>
						The evidence behind this occupation's AI exposure, with human-work and demand context
						shown separately.
						{#if occ.stability.label !== 'stable'}
							<span class="text-risk-moderate">Score stability: {occ.stability.label}.</span>
						{/if}
						<a href="/methodology" class="text-primary hover:underline">How this works</a>
					</p>
				</div>

				<!-- Right: Task split (2/5 on desktop) -->
				<div class="md:col-span-2 space-y-4">
					<div>
						<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-risk-high')}>
							Tasks AI can handle
						</p>
						<p class={body({ tone: 'muted' })}>
							{structural.personalizedContent.aiCanDo}
						</p>
						{#if (taskDetail?.most_observed.length ?? 0) > 0}
							<ul class="mt-2 space-y-1">
								{#each taskDetail?.most_observed ?? [] as item (item.task)}
									<li class={cn(caption(), 'text-muted-foreground')}>
										&bull; {item.task}
									</li>
								{/each}
							</ul>
							<p class={cn(caption(), 'mt-1 italic text-muted-foreground')}>
								O*NET tasks for this occupation with the most observed Claude usage (Anthropic task
								data).
							</p>
						{/if}
					</div>
					<div>
						<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-risk-very-low')}>
							What AI can't do here
						</p>
						<p class={body({ tone: 'muted' })}>
							{structural.personalizedContent.humanNeeded}
						</p>
						{#if (channelInfo?.top_channels.length ?? 0) > 0}
							<p class={cn(caption(), 'mt-2 text-muted-foreground')}>
								Main insulation channels:
								{#each channelInfo?.top_channels ?? [] as channel, i (channel.key)}{i > 0
										? ' + '
										: ''}<span class="font-medium text-foreground">{channel.label}</span>{/each}
								&mdash; the work-context dimensions behind this occupation's human bottleneck.
							</p>
						{/if}
						{#if (taskDetail?.most_protected.length ?? 0) > 0}
							<ul class="mt-2 space-y-1">
								{#each taskDetail?.most_protected ?? [] as item (item.task)}
									<li class={cn(caption(), 'text-muted-foreground')}>
										&bull; {item.task}
									</li>
								{/each}
							</ul>
							<p class={cn(caption(), 'mt-1 italic text-muted-foreground')}>
								Highest-importance tasks with no observed Claude usage in the same data &mdash;
								absence of observed usage, not proof of immunity.
							</p>
						{/if}
					</div>
					{#if structural.personalizedContent.skills.length > 0}
						<div class="pt-3 border-t border-border">
							<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
								Skills to focus on
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#each structural.personalizedContent.skills.slice(0, 4) as skill}
									<span class={pill({ tone: 'primary' })} title={skill.description}>
										{skill.label}
									</span>
								{/each}
							</div>
						</div>
					{/if}
					{#if structural.personalizedContent.evidence}
						<p class={cn(caption(), 'pt-2 italic text-muted-foreground')}>
							{structural.personalizedContent.evidence}
						</p>
					{/if}
					<p class={cn(caption(), 'pt-2 text-muted-foreground')}>
						Sources: {#if occ.evidence.exposure_source_keys?.length}{occ.evidence.exposure_source_keys
								.map(
									k =>
										({
											aioe: 'Felten AIOE (2021)',
											anthropic: 'Anthropic Economic Index (2026)',
											eloundou: 'Eloundou GPT Exposure (Science, 2024)',
											ilo: 'ILO GenAI (2025)'
										})[k] ?? k
								)
								.join(', ')}{:else}Felten AIOE, Anthropic{/if}, Pizzinelli et al. bottleneck model.
						<a href="/methodology" class="text-primary hover:underline">Full methodology</a>.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class={section({ spacing: 'loose' })}>
		<div class="mb-4 max-w-3xl">
			<p class={sectionLabel()}>From exposure to employment</p>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-1')}>
				What could change the employment outcome?
			</h2>
			<p class={cn(body({ tone: 'subtle' }), 'mt-2')}>
				AI capability is only the starting point. Adoption, task design, human oversight, demand,
				mobility and evidence quality determine how exposure may resolve in practice.
			</p>
		</div>
		<OutcomeContextLenses
			lenses={outcomeLenses}
			sourceNote="These lenses are reported separately and do not alter AI Exposure Rank. Labour-market figures describe a broad official occupation cluster, not this SSOC occupation alone."
		/>
	</section>

	<!-- ===== BLOCK 3: SINGAPORE NOW ===== -->
	<section class={section({ spacing: 'loose' })}>
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>02</span>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-0.5')}>Singapore Now</h2>
		</div>
		<p class={cn(caption(), 'mb-3 -mt-1')}>
			Current labour market conditions and how they affect this role.
		</p>
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
							<p class={cn(mono({ size: 'lg' }), 'mt-1 text-foreground')}>
								{postings.posting_volume_30d}
							</p>
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
					{occ.labour_monitor.cluster_label} · {occ.labour_monitor.data_as_of}
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
			</div>
		</div>
	</section>

	<!-- ===== BLOCK 4: WHAT YOU CAN DO ===== -->
	<section class={section({ spacing: 'loose' })}>
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>03</span>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-0.5')}>What You Can Do</h2>
		</div>
		<div class={card({ padding: 'md' })}>
			{#if offsetPotential}
				<p class={cn(body({ tone: 'subtle' }), 'mb-4 pb-4 border-b border-border')}>
					{offsetPotential.summary}{#if offsetPotential.components.mobility_friction > 0.5}
						Adjacent routes exist, but switching friction is still high.{/if}
				</p>
			{/if}

			{#if transitionSupport}
				<div class="mb-4 border-b border-border pb-4">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>
						Published transition support
					</p>
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

			{#if displayTransitions.length > 0}
				<div class="mb-4 border-b border-border pb-4">
					<div class="flex items-center gap-2 mb-3">
						<p class={cn(caption({ weight: 'semibold' }), 'text-foreground')}>
							Related roles you could transition to
						</p>
						<span class={pill({ size: 'sm', tone: 'muted' })}
							>{exitQuadrant?.targets?.length ? 'Exposure-reducing' : 'Similarity-based'}</span
						>
					</div>
					{#if exitQuadrant?.in_quadrant}
						<p class="mb-3 text-xs text-risk-high">
							This occupation has higher relative AI exposure, and its best adjacent move ranks in
							the weakest quarter of exposure-reducing options. Mobility outcomes also depend on
							demand, wages, skills and access to credible transitions.
							<a href="/rankings/high-risk-few-exits" class="underline hover:text-foreground"
								>See all occupations in this quadrant</a
							>.
						</p>
					{:else if exitQuadrant}
						<p class="mb-3 text-xs text-muted-foreground">
							Higher AI exposure, but comparatively credible exposure-reducing moves exist — the
							strongest scores {(exitQuadrant.best_composite * 100).toFixed(0)}% match. Escape-route
							quality and labour demand matter alongside exposure.
						</p>
					{/if}
					<div class="grid gap-2 sm:grid-cols-3">
						{#each displayTransitions.slice(0, 3) as t}
							<OccupationCard
								occupation={{ title: t.to_title, ssoc: t.to_ssoc, net_risk: 0 }}
								mode="inset"
								metricParts={[
									{
										label:
											t.risk_improvement > 0
												? `-${(t.risk_improvement * 100).toFixed(0)} points exposure`
												: t.risk_improvement < 0
													? `+${(Math.abs(t.risk_improvement) * 100).toFixed(0)} points exposure`
													: 'No exposure change',
										color:
											t.risk_improvement > 0
												? 'text-risk-very-low'
												: t.risk_improvement < 0
													? 'text-risk-high'
													: undefined
									},
									{ label: t.label }
								]}
							/>
						{/each}
					</div>
					{#if displayTransitions.length > 3}
						<details class="mt-2">
							<summary
								class={cn(
									caption({ weight: 'medium' }),
									'cursor-pointer text-primary hover:underline'
								)}>See {displayTransitions.length - 3} more</summary
							>
							<div class="mt-2 grid gap-2 sm:grid-cols-3">
								{#each displayTransitions.slice(3) as t}
									<OccupationCard
										occupation={{ title: t.to_title, ssoc: t.to_ssoc, net_risk: 0 }}
										mode="inset"
										metricParts={[
											{ label: `${(t.composite * 100).toFixed(0)}%` },
											{ label: t.label }
										]}
									/>
								{/each}
							</div>
						</details>
					{/if}
				</div>
			{/if}

			{#if structural.relatedOccupations.length > 0}
				<div class="mb-4 border-b border-border pb-4">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-3 text-foreground')}>
						Compare within {group?.label ?? 'this group'}
					</p>
					<div class="grid gap-2 sm:grid-cols-3">
						{#each structural.relatedOccupations as rel}
							<OccupationCard
								occupation={{
									title: rel.title,
									ssoc: rel.ssoc,
									net_risk: rel.net_risk,
									risk_band: rel.risk_band,
									gross_wage_median: rel.gross_wage_median
								}}
								mode="inset"
							/>
						{/each}
					</div>
				</div>
			{/if}

			{#if linkedRoles.length > 0}
				<div class="mb-4 border-b border-border pb-4">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-3 text-foreground')}>
						Modern roles using this occupation
					</p>
					<div class="flex flex-wrap gap-2">
						{#each linkedRoles as role}
							<a
								href="/role/{role.slug}"
								class={cn(pill({ tone: 'muted' }), 'hover:bg-accent transition-colors')}
							>
								{role.title}
							</a>
						{/each}
					</div>
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
			class={cn(
				sectionLabel(),
				'flex w-full items-center justify-between px-5 py-3 hover:text-foreground transition-colors'
			)}
		>
			Technical Details
			<svg
				class="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
			>
		</Collapsible.Trigger>
		<Collapsible.Content
			class="border-t border-border px-5 py-4 text-xs text-muted-foreground space-y-3"
		>
			<!-- Group 1: Classification & scoring -->
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Classification</p>
					<p>
						More exposed than approximately {structural.riskPercentile}% of occupations · {scoringBasisSummary}{#if occ.education_label}
							· {occ.education_label}{/if}
					</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Raw scores</p>
					<p class={mono({ size: 'sm' })}>
						AIOE {occ.raw.aioe.toFixed(3)} · θ {occ.raw.theta.toFixed(3)} · C-AIOE {occ.raw.c_aioe.toFixed(
							3
						)}
					</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Stability</p>
					<p>
						{occ.stability.label} · Optimistic {(occ.stability.optimistic_risk * 100).toFixed(0)}% ·
						Pessimistic {(occ.stability.pessimistic_risk * 100).toFixed(0)}%
					</p>
				</div>
				<div>
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>
						Score range (best/worst case)
					</p>
					<p>
						Exposure sensitivity {exposureUncertainty} · Rank sensitivity {netRiskUncertainty}
					</p>
				</div>
				<div class="sm:col-span-2">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>Scoring basis</p>
					<p>
						{scoringBasisSummary}. {scoringBasisDetail}{#if priorBaselineDeltaSummary}
							{priorBaselineDeltaSummary}{/if}
					</p>
				</div>
				<div class="sm:col-span-2">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-1 text-foreground')}>
						Wage range (SGD/mo)
					</p>
					<p class={mono({ size: 'sm' })}>
						25th {occ.gross_wage_25th.toLocaleString()} · Median {occ.gross_wage_median.toLocaleString()}
						· 75th {occ.gross_wage_75th.toLocaleString()}
					</p>
				</div>
			</div>

			<!-- Group 2: Evidence & sources -->
			<details class="pt-3 border-t border-border">
				<summary class="cursor-pointer text-xs font-semibold text-foreground hover:text-primary"
					>Evidence & sources</summary
				>
				<div class="mt-3 grid gap-3 sm:grid-cols-2">
					<div>
						<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>Data matching</p>
						<p>{occ.match_quality} · SSOC {occ.ssoc}</p>
						{#if occ.evidence.sol_match}<p class="text-risk-very-low">
								SOL 2026: {occ.evidence.sol_match} match
							</p>{/if}
						{#if occ.evidence.jobs_in_demand_match}<p class="text-risk-very-low">
								Jobs in Demand: {occ.evidence.jobs_in_demand_match} match
							</p>{/if}
						{#if occ.evidence.anthropic_calibrated}<p>
								Real-world AI usage: {occ.evidence.anthropic_gap !== null
									? (occ.evidence.anthropic_gap > 0 ? '+' : '') +
										Math.round(occ.evidence.anthropic_gap * 100) +
										'% vs estimated'
									: 'verified'}
							</p>{/if}
					</div>
					<div>
						<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>Data quality</p>
						<p>
							{occ.v8.evidence_confidence.level} evidence · {occ.v8.evidence_confidence
								.exposure_source_count}
							exposure sources · {occ.v8.evidence_confidence.mapping_quality} mapping
						</p>
						{#if confidenceDetail}
							<p class="mt-1">
								Capped at {occ.confidence.threshold_level ?? occ.confidence.level} · Final rating: {occ
									.confidence.level} · {confidenceDetail}
							</p>
						{/if}
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
							<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>
								AI overlap by data source
							</p>
							<div class="flex flex-wrap gap-3 mt-1">
								{#each Object.entries(occ.evidence.exposure_source_pctiles) as [source, pctile]}
									{@const sourceLabels = {
										aioe: 'AIOE',
										anthropic: 'Anthropic',
										eloundou: 'GPT',
										ilo: 'ILO'
									} as Record<string, string>}
									<div class="flex items-center gap-2">
										<span class={cn(microLabel(), 'w-16')}>{sourceLabels[source] ?? source}</span>
										<div class="h-2 w-24 rounded-full bg-muted overflow-hidden">
											<div
												class="h-full rounded-full bg-foreground/60"
												style="width: {(pctile ?? 0) * 100}%"
											></div>
										</div>
										<span class={mono({ size: 'sm' })}>{((pctile ?? 0) * 100).toFixed(0)}%</span>
									</div>
								{/each}
							</div>
							{#if occ.evidence?.exposure_source_weights}
								<p class="mt-1">
									Weights: {Object.entries(occ.evidence.exposure_source_weights)
										.map(([k, v]) => `${k} ${((v ?? 0) * 100).toFixed(0)}%`)
										.join(' · ')}
								</p>
							{/if}
						</div>
					{/if}
					{#if occ.evidence?.signal_conflict_reasons?.length}
						<div class="sm:col-span-2">
							<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>
								Conflicting data signals
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#each occ.evidence.signal_conflict_reasons as reason}
									<span class={pill({ size: 'sm', tone: 'warning' })}
										>{reason.replaceAll('_', ' ')}</span
									>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</details>

			<!-- Group 3: O*NET + offset factors -->
			{#if (structural.onetEnrichment?.technologies.length ?? 0) > 0 || (offsetPotential && (offsetPotential.strengths.length > 0 || offsetPotential.cautions.length > 0))}
				<details class="pt-3 border-t border-border">
					<summary class="cursor-pointer text-xs font-semibold text-foreground hover:text-primary"
						>Tools & offset factors</summary
					>
					<div class="mt-3 space-y-3">
						{#if (structural.onetEnrichment?.technologies.length ?? 0) > 0}
							<div>
								<p class={cn(caption({ weight: 'medium' }), 'mb-1 text-foreground')}>
									Common tools (O*NET proxy)
								</p>
								<div class="flex flex-wrap gap-1.5">
									{#each structural.onetEnrichment?.technologies.slice(0, 6) ?? [] as technology}
										<span class={pill({ tone: technology.hot ? 'positive' : 'muted' })}
											>{technology.name}</span
										>
									{/each}
								</div>
							</div>
						{/if}
						{#if offsetPotential && (offsetPotential.strengths.length > 0 || offsetPotential.cautions.length > 0)}
							<div class="grid gap-3 sm:grid-cols-2">
								{#if offsetPotential.strengths.length > 0}
									<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'min-w-0')}>
										<p class={cn(caption({ weight: 'semibold' }), 'text-impact-leveraged')}>
											What helps
										</p>
										<ul class="mt-1 space-y-0.5">
											{#each offsetPotential.strengths as item}<li>{item}</li>{/each}
										</ul>
									</div>
								{/if}
								{#if offsetPotential.cautions.length > 0}
									<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'min-w-0')}>
										<p class={cn(caption({ weight: 'semibold' }), 'text-risk-high')}>
											What could slow it down
										</p>
										<ul class="mt-1 space-y-0.5">
											{#each offsetPotential.cautions as item}<li>{item}</li>{/each}
										</ul>
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
					<summary class="cursor-pointer text-xs font-semibold text-foreground hover:text-primary"
						>Worker profile & local context</summary
					>
					<div class="mt-3 space-y-4">
						{#if marketDetailBullets.length > 0}
							<ul class="space-y-1">
								{#each marketDetailBullets as item}<li>{item}</li>{/each}
							</ul>
						{/if}
						{#if localContextItems.length > 0}
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
										title={item.description}>{item.label}: {item.value}</span
									>
								{/each}
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
				</details>
			{/if}

			<!-- Role profile (moved from Why This Score) -->
			{#if occ.workflow_overlay}
				<div class="mt-5 pt-5 border-t border-border">
					<p class={cn(caption({ weight: 'semibold' }), 'mb-2 text-foreground')}>Role profile</p>
					<p class={cn(caption(), 'mb-3')}>
						How this role's work breaks down across key dimensions. This is a general profile, not
						an individual measurement.
					</p>
					<div class="flex justify-center">
						<WorkflowRadar dimensions={occ.workflow_overlay} size={240} />
					</div>
				</div>
			{/if}

			<!-- Career-stage modifiers (moved from Singapore Now) -->
			<div class={card({ padding: 'sm' })}>
				<p class={cn(microLabel(), 'mb-1')}>How this changes by career stage</p>
				<p class={cn(caption(), 'mb-3')}>
					Career stage can change the task mix and human context. These directional profiles are
					illustrative, not occupation-level forecasts of hiring or displacement.
				</p>
				<div class="space-y-2">
					<div
						class={cn(
							card({ padding: 'sm', variant: 'inset' }),
							'flex items-center justify-between'
						)}
					>
						<span class={caption()}>Junior / Entry-level</span>
						<span class={caption({ weight: 'medium' })}
							><span class="text-risk-high">Potentially more exposed task mix</span></span
						>
					</div>
					<div
						class={cn(
							card({ padding: 'sm', variant: 'inset' }),
							'flex items-center justify-between'
						)}
					>
						<span class={caption()}>Mid-career</span>
						<span class={cn(caption({ weight: 'medium' }), 'text-foreground')}
							>Reference task profile</span
						>
					</div>
					<div
						class={cn(
							card({ padding: 'sm', variant: 'inset' }),
							'flex items-center justify-between'
						)}
					>
						<span class={caption()}>Senior / Lead</span>
						<span class={caption({ weight: 'medium' })}
							><span class="text-risk-very-low">Potentially more judgment-heavy task mix</span
							></span
						>
					</div>
				</div>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>

	<!-- ===== FAQ (visible HTML matching JSON-LD) ===== -->
	<section class="mt-8">
		<h2 class={sectionLabel()}>Frequently asked questions</h2>
		<div class="mt-3 space-y-1">
			{#each faqItems as item}
				<details class={cn(card({ padding: 'md' }), 'group')}>
					<summary class="cursor-pointer text-sm font-semibold text-foreground select-none">
						{item.question}
					</summary>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
				</details>
			{/each}
		</div>
	</section>
</div>
