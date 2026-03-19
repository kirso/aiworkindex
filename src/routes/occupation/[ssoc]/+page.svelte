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
		caption
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { vacancySignalClass } from '$lib/data/detail-display';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import TransitionGraph from '$lib/components/viz/TransitionGraph.svelte';
	import EvidenceBar from '$lib/components/viz/EvidenceBar.svelte';
	import OccupationMeter from '$lib/components/viz/OccupationMeter.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ContextItemGrid from '$lib/components/ui/ContextItemGrid.svelte';
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
		} catch {}
	}

	let group = $derived(majorGroupByKey.get(occ.major_group));
	let transitions = $derived(structural.transitions);
	let topTransitions = $derived(structural.topTransitions);
	let singaporeContext = $derived(context.singaporeContext);
	let industryContext = $derived(context.industryContext);
	let workerProfile = $derived(context.workerProfile);
	let geographyContext = $derived(context.geographyContext);
	let transitionSupport = $derived(context.transitionSupport);

	let innerWidth = $state(1024);
	$effect(() => {
		if (!browser) return;
		innerWidth = window.innerWidth;
		function onResize() {
			innerWidth = window.innerWidth;
		}
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});

	// Demand signal helpers
	let hasDemand = $derived(occ.evidence.sol_match || occ.evidence.jobs_in_demand_match);
	let demandLabel = $derived.by(() => {
		if (occ.evidence.sol_match && occ.evidence.jobs_in_demand_match)
			return 'SOL 2026 + Jobs in Demand';
		if (occ.evidence.sol_match) return 'SOL 2026';
		if (occ.evidence.jobs_in_demand_match) return 'Jobs in Demand';
		return null;
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

	// Singapore context expandable state
	let showMoreContext = $state(false);

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
					name: 'Estimate Confidence',
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
	<div class={cn(card({ padding: 'lg', accent: occ.risk_band }), 'mb-8')}>
		<div class="flex flex-col sm:flex-row sm:items-start sm:gap-8">
			<!-- Left: The Big Number -->
			<div class="flex flex-col items-center sm:items-start shrink-0 mb-4 sm:mb-0">
				<p class={display({ size: 'xl' })}>{(occ.net_risk * 100).toFixed(0)}%</p>
				<span class={cn(riskBadge({ band: occ.risk_band }), 'mt-1')}>
					{riskBandLabels[occ.risk_band]} Risk
				</span>
				<span class="mt-1 text-xs tabular-nums text-muted-foreground">
					Range: {(occ.stability.optimistic_risk * 100).toFixed(0)}–{(
						occ.stability.pessimistic_risk * 100
					).toFixed(0)}%
				</span>
			</div>

			<!-- Right: Context -->
			<div class="flex-1 min-w-0">
				<h1 class={titleStyle({ size: 'page' })}>{occ.title}</h1>
				<p class={caption()}>
					{group?.label ?? occ.major_group} · SGD {occ.gross_wage_median.toLocaleString()}/mo ({structural.wageVsNational})
				</p>

				<p class="mt-3 text-sm text-foreground/80 leading-relaxed">{structural.summaryText}</p>

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class={impactBadge({ type: occ.impact_type })}>
						{impactTypeLabels[occ.impact_type]}
					</span>
					<span class={confidenceBadge({ level: occ.confidence.level })}>
						{occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)} Confidence
					</span>
					{#if occ.education_label}
						<span
							class="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
						>
							{occ.education_label}
						</span>
					{/if}
					{#if hasDemand}
						<span
							class="rounded-full bg-risk-very-low/10 px-2 py-0.5 text-[10px] font-medium text-risk-very-low"
						>
							In demand ({demandLabel})
						</span>
					{/if}
					<span class="text-xs text-muted-foreground">
						Higher risk than {structural.riskPercentile}% of occupations
					</span>
					<div class="ml-auto flex items-center gap-2">
						<a
							href="/compare?entities=occupation:{occ.ssoc}"
							class="text-xs text-primary hover:underline">Compare</a
						>
						<Button
							variant={isWatchlisted ? 'default' : 'outline'}
							size="sm"
							class="h-7 gap-1 text-xs"
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
			</div>
		</div>

		<!-- Summary meter + evidence bar -->
		<div class="mt-4 pt-4 border-t border-border space-y-2">
			<OccupationMeter occupation={occ} />
			<EvidenceBar
				sourceCount={occ.evidence.exposure_source_count ?? 0}
				sourceKeys={occ.evidence.exposure_source_keys ?? []}
				agreement={occ.evidence.exposure_agreement ?? null}
				signalConflict={occ.evidence.signal_conflict ?? false}
			/>
		</div>
	</div>

	<!-- ===== BLOCK 2: WHY THIS SCORE ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Why This Score</h2>
		<div class={card({ padding: 'md' })}>
			<div class="grid gap-6 lg:grid-cols-5">
				<!-- Left: Waterfall (3/5 on desktop) -->
				<div class="lg:col-span-3">
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
									<span
										class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
										title={skill.description}
									>
										{skill.label}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- ===== BLOCK 3: SINGAPORE REALITY ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Singapore Reality</h2>
		<div class={card({ padding: 'md' })}>
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- Left column: Labour market + outlook -->
				<div class="space-y-5">
					<!-- Labour market metrics (compact flex rows) -->
					{#if occ.labour_monitor}
						<div>
							<div class="flex items-center gap-2 mb-2">
								<p class="text-xs font-semibold text-foreground">Labour Market</p>
								<span
									class="rounded-full px-1.5 py-0.5 text-[10px] font-medium
									{occ.labour_monitor.overall === 'strong'
										? 'bg-risk-very-low/10 text-risk-very-low'
										: occ.labour_monitor.overall === 'moderate'
											? 'bg-risk-moderate/10 text-risk-moderate'
											: 'bg-risk-high/10 text-risk-high'}"
								>
									{occ.labour_monitor.overall === 'strong'
										? 'Strong'
										: occ.labour_monitor.overall === 'moderate'
											? 'Moderate'
											: occ.labour_monitor.overall === 'weak'
												? 'Weak'
												: 'Watch'}
								</span>
							</div>
							<div class="space-y-1.5 text-sm">
								<div class="flex items-center justify-between">
									<span class="text-xs text-muted-foreground">Vacancy rate</span>
									<span class="font-mono text-xs text-foreground">
										{occ.labour_monitor.vacancy.latest_rate}%
										<span
											class="ml-1 {occ.labour_monitor.vacancy.trend_4q_pct > 0
												? 'text-risk-very-low'
												: occ.labour_monitor.vacancy.trend_4q_pct < 0
													? 'text-risk-high'
													: 'text-muted-foreground'}"
										>
											{occ.labour_monitor.vacancy.trend_4q_pct > 0
												? '↑'
												: occ.labour_monitor.vacancy.trend_4q_pct < 0
													? '↓'
													: '→'}
											{Math.abs(occ.labour_monitor.vacancy.trend_4q_pct).toFixed(1)}%
										</span>
									</span>
								</div>
								{#if occ.labour_monitor.hiring}
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">Hiring</span>
										<span class="font-mono text-xs text-foreground">
											{occ.labour_monitor.hiring.recruitment_rate}% recruit · {occ.labour_monitor
												.hiring.resignation_rate}% resign
										</span>
									</div>
								{/if}
								{#if occ.labour_monitor.retrenchment}
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">Retrenchment</span>
										<span class="font-mono text-xs text-foreground">
											{#if occ.labour_monitor.retrenchment.incidence_per_1000}
												{occ.labour_monitor.retrenchment.incidence_per_1000}/1K
												<span class="text-muted-foreground ml-1">
													({occ.labour_monitor.retrenchment.incidence_per_1000 < 2
														? 'Low'
														: occ.labour_monitor.retrenchment.incidence_per_1000 < 5
															? 'Moderate'
															: 'Elevated'})
												</span>
											{:else}
												{occ.labour_monitor.retrenchment.latest_count.toLocaleString()} in {occ
													.labour_monitor.retrenchment.latest_quarter}
											{/if}
										</span>
									</div>
								{/if}
							</div>
							<p class="mt-2 text-[10px] text-muted-foreground/60 italic">
								{occ.labour_monitor.cluster_label} cluster data ·
								<a
									href="https://stats.mom.gov.sg/iMAS_PdfLibrary/mrsd-Labour-Market-Report-3Q-2025.pdf"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary hover:underline not-italic"
								>
									MOM Q3 2025
								</a>
							</p>
						</div>
					{/if}

					<!-- Outlook (compact progress bars, not a separate section) -->
					<div>
						<div class="flex items-center justify-between mb-2">
							<p class="text-xs font-semibold text-foreground">12-Month Outlook</p>
							<div class="flex items-center gap-1">
								{#each ['junior', 'mid', 'senior'] as const as level}
									<button
										class="rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors {selectedSeniority ===
										level
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
										onclick={() => (selectedSeniority = level)}
									>
										{seniorityAdjustments[level].label}
									</button>
								{/each}
							</div>
						</div>
						<div class="flex items-center gap-2 mb-3">
							<span class="text-sm font-semibold {directionColors[baseOutlook.direction_12m]}">
								{directionLabels[baseOutlook.direction_12m]}
							</span>
							{#if selectedSeniority !== 'mid'}
								<span class="text-[10px] text-muted-foreground italic">
									{seniorityAdjustments[selectedSeniority].label} adjusted
								</span>
							{/if}
						</div>
						<div class="grid grid-cols-2 gap-2">
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
									<div class="flex items-center justify-between mb-0.5">
										<span class="text-[10px] text-muted-foreground">{dim.label}</span>
										<span class="text-[10px] font-medium {outlookStatusColors[status]}">
											{outlookStatusLabels[status]}
										</span>
									</div>
									<div class="h-1 w-full rounded-full bg-muted-foreground/10">
										<div
											class="h-1 rounded-full transition-all duration-300 {barColor}"
											style="width: {level * 100}%;"
										></div>
									</div>
								</div>
							{/each}
						</div>
						<p class="mt-2 text-[10px] text-muted-foreground/60 italic">
							Rule-based directional forecast, not a prediction.
							<a href="/methodology" class="text-primary hover:underline not-italic">Methodology</a>
						</p>
					</div>
				</div>

				<!-- Right column: Industry footprint + policy badges -->
				<div class="space-y-5">
					{#if industryContext}
						<div>
							<p class="text-xs font-semibold text-foreground mb-2">Top Industries</p>
							<div class="space-y-2">
								{#each industryContext.top_industries.slice(0, 3) as industry (industry.key)}
									<div class="flex items-center justify-between gap-2">
										<div class="min-w-0 flex-1">
											<p class="text-xs text-foreground truncate">{industry.label}</p>
											<div class="mt-0.5 flex items-center gap-2">
												<div class="h-1 flex-1 rounded-full bg-muted-foreground/10">
													<div
														class="h-1 rounded-full bg-primary/60"
														style="width: {Math.min(industry.share_2025 * 100 * 2, 100)}%;"
													></div>
												</div>
												<span class="text-[10px] font-mono text-muted-foreground shrink-0">
													{(industry.share_2025 * 100).toFixed(0)}%
												</span>
											</div>
										</div>
										<div class="text-right shrink-0">
											<span class="text-[10px] font-mono text-foreground/70">
												{industry.employment_2025.toFixed(1)}K
											</span>
											{#if industry.vacancy_signal}
												<p class={cn('text-[10px]', vacancySignalClass(industry.vacancy_signal))}>
													{industry.vacancy_signal === 'rising'
														? '↑ hiring'
														: industry.vacancy_signal === 'cooling'
															? '↓ cooling'
															: '→ stable'}
												</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Policy flags as inline badges -->
					{#if singaporeContext.items.length > 0}
						<div>
							<p class="text-xs font-semibold text-foreground mb-2">Policy Context</p>
							<div class="flex flex-wrap gap-1.5">
								{#each singaporeContext.items as item (item.key)}
									<span
										class="rounded-full px-2 py-0.5 text-[10px] font-medium
										{item.tone === 'protective'
											? 'bg-risk-very-low/10 text-risk-very-low'
											: item.tone === 'pressure'
												? 'bg-risk-high/10 text-risk-high'
												: item.tone === 'support'
													? 'bg-primary/10 text-primary'
													: 'bg-muted text-muted-foreground'}"
										title={item.description}
									>
										{item.label}: {item.value}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Expandable: Worker profile + Geography -->
			{#if workerProfile.items.length > 0 || geographyContext.items.length > 0}
				<div class="mt-4 pt-4 border-t border-border">
					<button
						class="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
						onclick={() => (showMoreContext = !showMoreContext)}
					>
						<svg
							class="h-3 w-3 transition-transform {showMoreContext ? 'rotate-180' : ''}"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
						>
						{showMoreContext ? 'Less context' : 'Worker profile & geography'}
					</button>
					{#if showMoreContext}
						<div class="mt-3 space-y-4">
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

	<!-- ===== BLOCK 4: WHAT TO DO NEXT ===== -->
	{#if transitions}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>What To Do Next</h2>
			<div class={card({ padding: 'md' })}>
				<!-- Transition support context -->
				{#if transitionSupport}
					<div class="mb-4 pb-4 border-b border-border">
						<div class="flex flex-wrap items-center gap-2">
							{#if transitionSupport.skillsfuture_eligible}
								<span
									class="rounded-full bg-risk-very-low/10 px-2.5 py-1 text-[11px] font-medium text-risk-very-low"
								>
									SkillsFuture eligible
								</span>
							{/if}
							{#each transitionSupport.recommended_programmes as programme}
								{@const programmeUrl = getTransitionProgrammeUrl(programme)}
								<a
									href={programmeUrl ?? '#'}
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
								>
									{programme} ↗
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Career transition grid -->
				<div class="grid gap-6 sm:grid-cols-2">
					{#if transitions.easierSwitch.length > 0}
						<div>
							<p class="text-xs font-semibold text-impact-leveraged mb-2">Easier Switch</p>
							{#each transitions.easierSwitch as t (t.to_ssoc)}
								<a
									href="/occupation/{t.to_ssoc}"
									class="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 text-sm hover:bg-accent hover:text-primary transition-colors"
								>
									<span class="truncate text-foreground/80">{t.to_title}</span>
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
									<span class="truncate text-foreground/80">{t.to_title}</span>
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
									<span class="truncate text-foreground/80">{t.to_title}</span>
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
									<span class="truncate text-foreground/80">{t.to_title}</span>
									<span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground"
										>{(t.composite * 100).toFixed(0)}%</span
									>
								</a>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Transition graph (desktop) -->
				{#if innerWidth >= 768 && topTransitions.length > 0}
					<div class="mt-4 pt-4 border-t border-border">
						<TransitionGraph
							currentTitle={occ.title}
							currentRiskBand={occ.risk_band}
							transitions={topTransitions}
						/>
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
			Technical Details · SSOC {occ.ssoc} · {occ.confidence.level} confidence · {occ.stability
				.label}
			band
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
					<p class="font-semibold text-foreground mb-1">Confidence</p>
					<p>
						{(occ.confidence.score * 100).toFixed(0)}% · Crosswalk {occ.confidence.crosswalk_quality.toFixed(
							2
						)} · Market {occ.confidence.market_data_granularity.toFixed(2)} · Fresh {occ.confidence.source_freshness.toFixed(
							2
						)}
					</p>
				</div>
				<div class="sm:col-span-2">
					<p class="font-semibold text-foreground mb-1">Wage (SGD/mo)</p>
					<p class="font-mono">
						25th {occ.gross_wage_25th.toLocaleString()} · Median {occ.gross_wage_median.toLocaleString()}
						· 75th {occ.gross_wage_75th.toLocaleString()}
					</p>
				</div>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</main>
