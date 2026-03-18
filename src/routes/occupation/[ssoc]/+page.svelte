<script lang="ts">
	import { browser } from '$app/environment';
	import {
		riskBandLabels,
		majorGroupByKey,
		impactTypeLabels,
		occupations as allOccupations
	} from '$lib/data';
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
	import { getPersonalizedContent } from '$lib/data/role-archetypes';
	import { archetypeOverlayDefaults, generateWorkflowNarrative } from '$lib/data/workflow-overlay';
	import { classifyArchetype } from '$lib/data/role-archetypes';
	import OutlookSection from '$lib/components/ui/OutlookSection.svelte';
	import LabourMarketCard from '$lib/components/ui/LabourMarketCard.svelte';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import TransitionGraph from '$lib/components/viz/TransitionGraph.svelte';
	import { findBestTransitions } from '$lib/data/transition-capacity';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	const WATCHLIST_KEY = 'aiworkindex-watchlist';

	let { data } = $props();
	let occ = $derived(data.occupation);

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

	let netRiskPercentile = $derived.by(() => {
		const sorted = [...allOccupations].sort((a, b) => a.net_risk - b.net_risk);
		const rank = sorted.findIndex(o => o.ssoc === occ.ssoc);
		return Math.round((rank / (sorted.length - 1)) * 100);
	});

	let wageVsNational = $derived.by(() => {
		const diff = occ.gross_wage_median - data.nationalMedian;
		const pct = Math.round((Math.abs(diff) / data.nationalMedian) * 100);
		if (pct < 3) return 'near median';
		return diff > 0 ? `${pct}% above median` : `${pct}% below median`;
	});

	function levelLabel(v: number): string {
		return v > 0.66 ? 'high' : v >= 0.33 ? 'moderate' : 'low';
	}

	let summaryText = $derived.by(() => {
		const e = levelLabel(occ.exposure);
		switch (occ.impact_type) {
			case 'ai_leveraged':
				return `AI is likely to enhance this role, not replace it. ${e} exposure, but strong human bottlenecks mean AI augments rather than substitutes.`;
			case 'at_risk':
				return `Significant AI displacement pressure. ${e} exposure with few human bottlenecks to slow adoption.`;
			case 'stable':
				return `AI is unlikely to significantly disrupt this role. ${e} exposure — limited overlap with core tasks.`;
			case 'mixed':
				return `Mixed signals — high exposure but also strong human dependencies. Outcome depends on adoption patterns.`;
			default:
				return '';
		}
	});

	let personalizedContent = $derived(getPersonalizedContent(occ.ssoc, occ.title, occ.major_group));
	let transitions = $derived(data.transitions);
	let topTransitions = $derived(findBestTransitions(occ, allOccupations, 8));

	let workflowNarrative = $derived.by(() => {
		if (occ.workflow_overlay) return generateWorkflowNarrative(occ.workflow_overlay);
		const archetype = classifyArchetype(occ.ssoc, occ.title, occ.major_group);
		const overlay = archetypeOverlayDefaults[archetype];
		return overlay ? generateWorkflowNarrative(overlay) : null;
	});

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
							summaryText +
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
					{group?.label ?? occ.major_group} · SGD {occ.gross_wage_median.toLocaleString()}/mo ({wageVsNational})
				</p>

				<p class="mt-3 text-sm text-foreground/80 leading-relaxed">{summaryText}</p>

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class={impactBadge({ type: occ.impact_type })}>
						{impactTypeLabels[occ.impact_type]}
					</span>
					<span class={confidenceBadge({ level: occ.confidence.level })}>
						{occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)} Confidence
					</span>
					<span class="text-xs text-muted-foreground">
						Higher risk than {netRiskPercentile}% of occupations
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
						{personalizedContent.aiCanDo}
					</p>
				</div>
				<div>
					<p class="text-xs font-semibold text-risk-very-low mb-1">Where humans stay essential</p>
					<p class="text-sm text-muted-foreground leading-relaxed">
						{personalizedContent.humanNeeded}
					</p>
				</div>
				{#if workflowNarrative}
					<p class="text-sm text-foreground/60 leading-relaxed">{workflowNarrative}</p>
				{/if}
			</div>

			{#if personalizedContent.skills.length > 0}
				<div class="mt-4 pt-4 border-t border-border">
					<p class="text-xs font-semibold text-foreground mb-2">Skills to focus on</p>
					<div class="grid gap-2 sm:grid-cols-2">
						{#each personalizedContent.skills.slice(0, 4) as skill}
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

			{#if personalizedContent.evidence}
				<p class="mt-3 text-xs text-muted-foreground/70 italic">
					{personalizedContent.evidence}
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
