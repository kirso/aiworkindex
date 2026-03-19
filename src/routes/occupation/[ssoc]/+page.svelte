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
	import {
		formatCurrencyShort,
		vacancySignalClass,
		wagePremiumClass
	} from '$lib/data/detail-display';
	import OutlookSection from '$lib/components/ui/OutlookSection.svelte';
	import LabourMarketCard from '$lib/components/ui/LabourMarketCard.svelte';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import TransitionGraph from '$lib/components/viz/TransitionGraph.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import ContextItemGrid from '$lib/components/ui/ContextItemGrid.svelte';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	const WATCHLIST_KEY = 'aiworkindex-watchlist';

	let { data } = $props();
	let occ = $derived(data.occupation);
	let structural = $derived(data.structural);
	let context = $derived(data.context);

	let isWatchlisted = $state(false);

	$effect(() => {
		if (!browser) return;
		try {
			const stored = localStorage.getItem(WATCHLIST_KEY);
			const list: string[] = stored ? JSON.parse(stored) : [];
			isWatchlisted = list.includes(occ.ssoc);
		} catch {
			isWatchlisted = false;
		}
	});

	function toggleWatchlist() {
		if (!browser) return;
		try {
			const stored = localStorage.getItem(WATCHLIST_KEY);
			let list: string[] = stored ? JSON.parse(stored) : [];
			if (list.includes(occ.ssoc)) {
				list = list.filter(s => s !== occ.ssoc);
				isWatchlisted = false;
			} else {
				list.push(occ.ssoc);
				isWatchlisted = true;
			}
			localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
		} catch {}
	}

	let group = $derived(majorGroupByKey.get(occ.major_group));
	let transitions = $derived(structural.transitions);
	let topTransitions = $derived(structural.topTransitions);
	let singaporeContext = $derived(context.singaporeContext);
	let industryContext = $derived(context.industryContext);
	let workerProfile = $derived(context.workerProfile);
	let geographyContext = $derived(context.geographyContext);

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

	<!-- ===== HERO: The Score IS the Interface ===== -->
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
	</div>

	<!-- ===== SCORE BREAKDOWN: Waterfall gets visual prominence ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Score Breakdown</h2>
		<div class={card({ padding: 'md' })}>
			<DriverWaterfall occupation={occ} />
		</div>
		<p class="mt-2 text-xs text-muted-foreground">
			Exposure × (1 − Bottleneck) × Market Modifier.
			{#if occ.stability.label !== 'stable'}
				<span class="text-risk-moderate">Band stability: {occ.stability.label}.</span>
			{/if}
			<a href="/methodology" class="text-primary hover:underline">How this works</a>
		</p>
	</section>

	<!-- ===== WHAT AI CHANGES: Narrative, not grid ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>What AI Changes</h2>
		<div class={card({ padding: 'md' })}>
			<div class="space-y-4">
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
				{#if structural.workflowNarrative}
					<p class="text-sm text-foreground/60 leading-relaxed">{structural.workflowNarrative}</p>
				{/if}
			</div>

			{#if structural.personalizedContent.skills.length > 0}
				<div class="mt-4 pt-4 border-t border-border">
					<p class="text-xs font-semibold text-foreground mb-2">Skills to focus on</p>
					<div class="grid gap-2 sm:grid-cols-2">
						{#each structural.personalizedContent.skills.slice(0, 4) as skill}
							<div class="flex gap-2">
								<div class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary"></div>
								<div>
									<p class="text-xs font-medium text-foreground">{skill.label}</p>
									<p class="text-xs text-muted-foreground">{skill.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if structural.personalizedContent.evidence}
				<p class="mt-3 text-xs text-muted-foreground/70 italic">
					{structural.personalizedContent.evidence}
				</p>
			{/if}
		</div>
	</section>

	<!-- ===== MARKET CONTEXT: Labour + Outlook combined ===== -->
	{#if occ.labour_monitor}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Market Context</h2>
			<LabourMarketCard monitor={occ.labour_monitor} />
		</section>
	{/if}

	<section class="mb-8">
		<OutlookSection occupation={occ} />
	</section>

	<!-- ===== SINGAPORE CONTEXT ===== -->
	{#if industryContext || singaporeContext.items.length > 0 || workerProfile.items.length > 0 || geographyContext.items.length > 0}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Singapore Context</h2>
			<div class={card({ padding: 'md' })}>
				<div class="space-y-6">
					{#if industryContext}
						<div>
							<p class="text-xs font-semibold text-foreground">Industry footprint</p>
							<div class="mt-3 grid gap-6 sm:grid-cols-2">
								<div>
									<p class="text-xs font-semibold text-foreground">Largest employing industries</p>
									<div class="mt-3 space-y-3">
										{#each industryContext.top_industries as industry (industry.key)}
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm text-foreground">{industry.label}</p>
													<p class="mt-0.5 text-xs text-muted-foreground">
														{(industry.share_2025 * 100).toFixed(0)}% of this job family in 2025
													</p>
													{#if industry.sector_gross_wage_median}
														<p class="mt-0.5 text-xs text-muted-foreground">
															Median gross {formatCurrencyShort(industry.sector_gross_wage_median)}
															{#if industry.sector_wage_premium_pct !== null && industry.sector_wage_premium_pct !== undefined}
																<span
																	class={cn(
																		'ml-1 font-medium',
																		wagePremiumClass(industry.sector_wage_premium_pct)
																	)}
																>
																	{industry.sector_wage_premium_pct > 0 ? '+' : ''}
																	{(industry.sector_wage_premium_pct * 100).toFixed(0)}% vs all
																	industries
																</span>
															{/if}
														</p>
													{/if}
												</div>
												<div class="text-right text-xs">
													<p class="font-mono text-foreground">
														{industry.employment_2025.toFixed(1)}K
													</p>
													{#if industry.vacancy_signal}
														<p class={cn(vacancySignalClass(industry.vacancy_signal))}>
															{industry.vacancy_signal === 'rising'
																? 'Vacancies rising'
																: industry.vacancy_signal === 'cooling'
																	? 'Vacancies cooling'
																	: 'Vacancies stable'}
														</p>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>

								<div>
									<p class="text-xs font-semibold text-foreground">Fastest-growing industries</p>
									<div class="mt-3 space-y-3">
										{#each industryContext.fastest_growing_industries as industry (industry.key)}
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm text-foreground">{industry.label}</p>
													<p class="mt-0.5 text-xs text-muted-foreground">
														5Y CAGR
														{industry.cagr_5y !== null
															? `${(industry.cagr_5y * 100).toFixed(1)}%`
															: 'n/a'}
													</p>
													{#if industry.sector_gross_wage_median}
														<p class="mt-0.5 text-xs text-muted-foreground">
															Median gross {formatCurrencyShort(industry.sector_gross_wage_median)}
															{#if industry.sector_wage_premium_pct !== null && industry.sector_wage_premium_pct !== undefined}
																<span
																	class={cn(
																		'ml-1 font-medium',
																		wagePremiumClass(industry.sector_wage_premium_pct)
																	)}
																>
																	{industry.sector_wage_premium_pct > 0 ? '+' : ''}
																	{(industry.sector_wage_premium_pct * 100).toFixed(0)}% vs all
																	industries
																</span>
															{/if}
														</p>
													{/if}
												</div>
												<div class="text-right text-xs">
													<p class="font-mono text-foreground">
														{(industry.share_2025 * 100).toFixed(0)}%
													</p>
													{#if industry.vacancy_latest !== null}
														<p class={cn(vacancySignalClass(industry.vacancy_signal))}>
															{industry.vacancy_latest.toFixed(0)} vacancies
														</p>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							</div>
							<p class="mt-4 text-[11px] leading-relaxed text-muted-foreground">
								Industry footprint comes from the official Singapore industry × occupation
								employment cross-tab. Wage anchors appear only where the published common-occupation
								wage tables cover this occupation. Vacancy labels are industry-wide 2025 Q3 signals,
								shown as sector context rather than occupation-level truth.
							</p>
						</div>
					{/if}

					{#if singaporeContext.items.length > 0}
						<div class={cn(industryContext && 'border-t border-border pt-6')}>
							<ContextItemGrid title="Policy and labour context" items={singaporeContext.items} />
							<p class="mt-4 text-[11px] leading-relaxed text-muted-foreground">
								{singaporeContext.note}
							</p>
						</div>
					{/if}

					{#if workerProfile.items.length > 0}
						<div
							class={cn(
								(industryContext || singaporeContext.items.length > 0) &&
									'border-t border-border pt-6'
							)}
						>
							<ContextItemGrid title="Worker profile" items={workerProfile.items} />
							<p class="mt-4 text-[11px] leading-relaxed text-muted-foreground">
								{workerProfile.note}
							</p>
						</div>
					{/if}

					{#if geographyContext.items.length > 0}
						<div
							class={cn(
								(industryContext ||
									singaporeContext.items.length > 0 ||
									workerProfile.items.length > 0) &&
									'border-t border-border pt-6'
							)}
						>
							<ContextItemGrid
								title="Where this work is concentrated"
								items={geographyContext.items}
							/>
							<p class="mt-4 text-[11px] leading-relaxed text-muted-foreground">
								{geographyContext.note}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<!-- ===== CAREER PATHS ===== -->
	{#if transitions}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Career Paths</h2>
			<div class={card({ padding: 'md' })}>
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
			</div>
		</section>
	{/if}

	<!-- ===== TECHNICAL DETAILS ===== -->
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
