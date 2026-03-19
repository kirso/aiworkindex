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
		caption
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import {
		formatCurrencyShort,
		vacancySignalClass,
		wagePremiumClass
	} from '$lib/data/detail-display';
	import OutlookSection from '$lib/components/ui/OutlookSection.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import LabourMarketCard from '$lib/components/ui/LabourMarketCard.svelte';
	import ContextItemGrid from '$lib/components/ui/ContextItemGrid.svelte';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	const WATCHLIST_KEY = 'aiworkindex-watchlist';

	let { data } = $props();
	let scored = $derived(data.scored);
	let structural = $derived(data.structural);
	let context = $derived(data.context);

	let isWatchlisted = $state(false);
	$effect(() => {
		if (!browser) return;
		try {
			const stored = localStorage.getItem(WATCHLIST_KEY);
			const list: string[] = stored ? JSON.parse(stored) : [];
			const primarySsoc = scored.components[0]?.ssoc;
			isWatchlisted = primarySsoc ? list.includes(primarySsoc) : false;
		} catch {
			isWatchlisted = false;
		}
	});

	function toggleWatchlist() {
		if (!browser) return;
		const primarySsoc = scored.components[0]?.ssoc;
		if (!primarySsoc) return;
		try {
			const stored = localStorage.getItem(WATCHLIST_KEY);
			let list: string[] = stored ? JSON.parse(stored) : [];
			if (list.includes(primarySsoc)) {
				list = list.filter((s: string) => s !== primarySsoc);
				isWatchlisted = false;
			} else {
				list.push(primarySsoc);
				isWatchlisted = true;
			}
			localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
		} catch {}
	}
	let transitions = $derived(structural.transitions);
	let singaporeContext = $derived(context.singaporeContext);
	let industryContext = $derived(context.industryContext);
	let workerProfile = $derived(context.workerProfile);
	let primaryOccupation = $derived(context.primaryOccupation);

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
				{
					'@type': 'PropertyValue',
					name: 'AI Net Displacement Risk',
					value: scored.net_risk
				},
				{
					'@type': 'PropertyValue',
					name: 'Risk Band',
					value: riskBandLabels[scored.risk_band]
				},
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
				{
					'@type': 'ListItem',
					position: 1,
					name: 'Home',
					item: SITE.url + '/'
				},
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
							'). Based on ' +
							scored.components.length +
							' official occupations.'
					}
				},
				{
					'@type': 'Question',
					name: 'What is the AI risk score for ' + scored.title + '?',
					acceptedAnswer: {
						'@type': 'Answer',
						text:
							scored.title +
							' has an estimated AI displacement risk of ' +
							(scored.net_risk * 100).toFixed(0) +
							'%, rated ' +
							riskBandLabels[scored.risk_band] +
							'. This is a synthetic role estimate based on ' +
							scored.components.length +
							' weighted official occupations.'
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
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: scored.title }]} />

	<!-- Synthetic role notice -->
	<div
		class="mb-4 flex items-start gap-2 rounded-md border border-risk-moderate-border bg-risk-moderate-subtle px-3 py-2"
	>
		<svg
			class="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-moderate"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"><path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg
		>
		<div class="text-xs text-risk-moderate">
			<p>
				Estimated modern role — scores are a weighted blend of {scored.components.length} official occupations.
				Confidence never exceeds Medium and drops to Low when component occupations disagree materially.
			</p>
			{#if structural.primaryMatch && structural.primaryMatch.riskDiff < 0.03}
				<p class="mt-1">
					Closely matches
					<a
						href="/occupation/{structural.primaryMatch.ssoc}"
						class="font-medium text-primary hover:underline">{structural.primaryMatch.title}</a
					>
					({(structural.primaryMatch.risk * 100).toFixed(0)}% risk).
				</p>
			{/if}
		</div>
	</div>

	<!-- ===== HERO: The Score IS the Interface ===== -->
	<div class={cn(card({ padding: 'lg', accent: scored.risk_band }), 'mb-8')}>
		<div class="flex flex-col sm:flex-row sm:items-start sm:gap-8">
			<!-- Left: The Big Number -->
			<div class="flex flex-col items-center sm:items-start shrink-0 mb-4 sm:mb-0">
				<p class={display({ size: 'xl' })}>{(scored.net_risk * 100).toFixed(0)}%</p>
				<span class={cn(riskBadge({ band: scored.risk_band }), 'mt-1')}>
					{riskBandLabels[scored.risk_band]} Risk
				</span>
				{#if scored.risk_range}
					<span class="mt-1 text-xs tabular-nums text-muted-foreground">
						Range: {(scored.risk_range.optimistic * 100).toFixed(0)}–{(
							scored.risk_range.pessimistic * 100
						).toFixed(0)}%
					</span>
				{/if}
			</div>

			<!-- Right: Context -->
			<div class="flex-1 min-w-0">
				<h1 class={titleStyle({ size: 'page' })}>{scored.title}</h1>
				<p class={caption()}>{scored.description}</p>

				<p class="mt-3 text-sm text-foreground/80 leading-relaxed">{structural.summaryText}</p>
				{#if structural.workflowNarrative}
					<p class="mt-2 text-sm text-foreground/60 leading-relaxed">
						{structural.workflowNarrative}
					</p>
				{/if}
				{#if scored.dispersion > 0.08}
					<div class="mt-3 rounded-md bg-inset p-3">
						<p class="text-xs font-medium text-foreground">
							Risk depends on your actual work split
						</p>
						<div class="mt-1.5 flex items-center gap-2">
							<span class="font-mono text-xs text-risk-very-low"
								>{(scored.risk_range.optimistic * 100).toFixed(0)}%</span
							>
							<div class="flex-1 h-1.5 rounded-full bg-border relative">
								<div
									class="absolute h-full rounded-full bg-gradient-to-r from-risk-very-low to-risk-very-high"
									style="left: {Math.max(scored.risk_range.optimistic * 100, 0)}%; right: {Math.max(
										100 - scored.risk_range.pessimistic * 100,
										0
									)}%;"
								></div>
								<div
									class="absolute h-3 w-0.5 bg-foreground rounded-full -top-[3px]"
									style="left: {scored.net_risk * 100}%;"
								></div>
							</div>
							<span class="font-mono text-xs text-risk-very-high"
								>{(scored.risk_range.pessimistic * 100).toFixed(0)}%</span
							>
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							More management-focused → lower risk. More hands-on → higher risk.
						</p>
					</div>
				{/if}

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class={impactBadge({ type: scored.impact_type })}>
						{impactTypeLabels[scored.impact_type]}
					</span>
					<span class={confidenceBadge({ level: scored.confidence })}>
						{scored.confidence.charAt(0).toUpperCase() + scored.confidence.slice(1)} Confidence
					</span>
					<span class="text-xs text-muted-foreground">
						Higher risk than {structural.riskPercentile}% of occupations
					</span>
					<div class="ml-auto flex items-center gap-2">
						<a
							href="/compare?entities=role:{scored.slug}"
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
			<div class="space-y-3 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">AI Task Overlap</span>
					<span class="font-mono text-xs tabular-nums">{(scored.exposure * 100).toFixed(0)}%</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">Human Advantage</span>
					<span class="font-mono text-xs tabular-nums">{(scored.bottleneck * 100).toFixed(0)}%</span
					>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">SG Demand Buffer</span>
					<span class="font-mono text-xs tabular-nums"
						>{(scored.market_resilience * 100).toFixed(0)}%</span
					>
				</div>
				<div class="flex items-center justify-between border-t border-border pt-3">
					<span class="font-semibold text-foreground">Net Risk</span>
					<span class="font-mono text-sm font-bold tabular-nums"
						>{(scored.net_risk * 100).toFixed(0)}%</span
					>
				</div>
			</div>
		</div>
		<p class="mt-2 text-xs text-muted-foreground">
			Blended structural score across {scored.components.length} official occupations. Component-level
			waterfalls are intentionally not shown here as if they were role-native evidence.
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
		</div>
	</section>

	<!-- ===== MARKET CONTEXT: Labour + Outlook ===== -->
	{#if primaryOccupation?.labour_monitor}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-1')}>Closest Official Occupation Context</h2>
			<p class="mb-3 text-xs text-muted-foreground">
				Synthetic roles do not have role-native labour series. This panel anchors on the
				highest-weight official occupation: {primaryOccupation.title}.
			</p>
			<LabourMarketCard monitor={primaryOccupation.labour_monitor} />
		</section>
	{/if}

	{#if primaryOccupation}
		<section class="mb-8">
			<p class="mb-3 text-xs text-muted-foreground">
				Scenario outlook below is anchored on {primaryOccupation.title}, not a separately validated
				synthetic-role forecast.
			</p>
			<OutlookSection occupation={primaryOccupation} />
		</section>
	{/if}

	{#if industryContext.top_industries.length > 0 || singaporeContext.items.length > 0 || workerProfile.items.length > 0}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Singapore Anchors</h2>
			<div class={card({ padding: 'md' })}>
				<div class="space-y-6">
					{#if industryContext.top_industries.length > 0}
						<div>
							<p class="text-xs font-semibold text-foreground">Industry anchors</p>
							<div class="mt-3 grid gap-6 sm:grid-cols-2">
								<div>
									<p class="text-xs font-semibold text-foreground">Largest industry anchors</p>
									<div class="mt-3 space-y-3">
										{#each industryContext.top_industries as industry (industry.key)}
											<div class="flex items-start justify-between gap-3">
												<div>
													<p class="text-sm text-foreground">{industry.label}</p>
													<p class="mt-0.5 text-xs text-muted-foreground">
														Weighted share {(industry.share_2025 * 100).toFixed(0)}%
													</p>
													{#if industry.sector_gross_wage_median}
														<p class="mt-0.5 text-xs text-muted-foreground">
															Weighted wage anchor {formatCurrencyShort(
																industry.sector_gross_wage_median
															)}
															{#if industry.sector_wage_premium_pct !== null && industry.sector_wage_premium_pct !== undefined}
																<span
																	class={cn(
																		'ml-1 font-medium',
																		wagePremiumClass(industry.sector_wage_premium_pct)
																	)}
																>
																	{industry.sector_wage_premium_pct > 0 ? '+' : ''}
																	{(industry.sector_wage_premium_pct * 100).toFixed(0)}%
																</span>
															{/if}
														</p>
													{/if}
												</div>
												<div class="text-right text-xs">
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
									<p class="text-xs font-semibold text-foreground">Fastest-growing anchors</p>
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
															Weighted wage anchor {formatCurrencyShort(
																industry.sector_gross_wage_median
															)}
															{#if industry.sector_wage_premium_pct !== null && industry.sector_wage_premium_pct !== undefined}
																<span
																	class={cn(
																		'ml-1 font-medium',
																		wagePremiumClass(industry.sector_wage_premium_pct)
																	)}
																>
																	{industry.sector_wage_premium_pct > 0 ? '+' : ''}
																	{(industry.sector_wage_premium_pct * 100).toFixed(0)}%
																</span>
															{/if}
														</p>
													{/if}
												</div>
												<div class="text-right text-xs">
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
								{industryContext.note} Wage anchors are blended from published common-occupation industry
								wage tables when component occupations are covered. Vacancy labels use industry-wide Singapore
								demand signals rather than synthetic-role vacancy estimates.
							</p>
						</div>
					{/if}

					{#if singaporeContext.items.length > 0}
						<div
							class={cn(industryContext.top_industries.length > 0 && 'border-t border-border pt-6')}
						>
							<ContextItemGrid title="Policy and labour anchors" items={singaporeContext.items} />
							<p class="mt-4 text-[11px] leading-relaxed text-muted-foreground">
								{singaporeContext.note}
							</p>
						</div>
					{/if}

					{#if workerProfile.items.length > 0}
						<div
							class={cn(
								(industryContext.top_industries.length > 0 || singaporeContext.items.length > 0) &&
									'border-t border-border pt-6'
							)}
						>
							<ContextItemGrid title="Worker anchors" items={workerProfile.items} />
							<p class="mt-4 text-[11px] leading-relaxed text-muted-foreground">
								{workerProfile.note}
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
