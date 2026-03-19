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
	import { vacancySignalClass } from '$lib/data/detail-display';
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
		} catch {}
	}

	let transitions = $derived(structural.transitions);
	let singaporeContext = $derived(context.singaporeContext);
	let industryContext = $derived(context.industryContext);
	let workerProfile = $derived(context.workerProfile);
	let geographyContext = $derived(context.geographyContext);
	let primaryOccupation = $derived(context.primaryOccupation);
	let transitionSupport = $derived(context.transitionSupport);

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
	<div class={cn(card({ padding: 'lg', accent: scored.risk_band }), 'mb-8')}>
		<div class="flex flex-col sm:flex-row sm:items-start sm:gap-8">
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

			<div class="flex-1 min-w-0">
				<h1 class={titleStyle({ size: 'page' })}>{scored.title}</h1>
				<p class={caption()}>{scored.description}</p>
				<p class="mt-3 text-sm text-foreground/80 leading-relaxed">{structural.summaryText}</p>

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
					</div>
				{/if}

				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class={impactBadge({ type: scored.impact_type })}>
						{impactTypeLabels[scored.impact_type]}
					</span>
					<span class={confidenceBadge({ level: scored.confidence })}>
						{scored.confidence.charAt(0).toUpperCase() + scored.confidence.slice(1)} Confidence
					</span>
					<span
						class="rounded-full bg-risk-moderate/10 px-2 py-0.5 text-[10px] font-medium text-risk-moderate"
					>
						Estimated · {scored.components.length} components
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

	<!-- ===== BLOCK 2: WHY THIS SCORE ===== -->
	<section class="mb-8">
		<h2 class={cn(sectionLabel(), 'mb-3')}>Why This Score</h2>
		<div class={card({ padding: 'md' })}>
			<div class="grid gap-6 lg:grid-cols-5">
				<!-- Left: Score table (3/5) -->
				<div class="lg:col-span-3">
					<div class="space-y-3 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">AI Task Overlap</span>
							<span class="font-mono text-xs tabular-nums"
								>{(scored.exposure * 100).toFixed(0)}%</span
							>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">Human Advantage</span>
							<span class="font-mono text-xs tabular-nums"
								>{(scored.bottleneck * 100).toFixed(0)}%</span
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
					<p class="mt-3 text-xs text-muted-foreground">
						Blended across {scored.components.length} occupations.
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
	{#if primaryOccupation || industryContext.top_industries.length > 0 || singaporeContext.items.length > 0}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Singapore Reality</h2>
			<div class={card({ padding: 'md' })}>
				<div class="grid gap-6 lg:grid-cols-2">
					<!-- Left: Labour market + outlook -->
					<div class="space-y-5">
						{#if primaryOccupation?.labour_monitor}
							<div>
								<div class="flex items-center gap-2 mb-2">
									<p class="text-xs font-semibold text-foreground">Labour Market</p>
									<span
										class="rounded-full px-1.5 py-0.5 text-[10px] font-medium
										{primaryOccupation.labour_monitor.overall === 'strong'
											? 'bg-risk-very-low/10 text-risk-very-low'
											: primaryOccupation.labour_monitor.overall === 'moderate'
												? 'bg-risk-moderate/10 text-risk-moderate'
												: 'bg-risk-high/10 text-risk-high'}"
									>
										{primaryOccupation.labour_monitor.overall === 'strong'
											? 'Strong'
											: primaryOccupation.labour_monitor.overall === 'moderate'
												? 'Moderate'
												: primaryOccupation.labour_monitor.overall === 'weak'
													? 'Weak'
													: 'Watch'}
									</span>
								</div>
								<div class="space-y-1.5 text-sm">
									<div class="flex items-center justify-between">
										<span class="text-xs text-muted-foreground">Vacancy rate</span>
										<span class="font-mono text-xs text-foreground">
											{primaryOccupation.labour_monitor.vacancy.latest_rate}%
											<span
												class="ml-1 {primaryOccupation.labour_monitor.vacancy.trend_4q_pct > 0
													? 'text-risk-very-low'
													: primaryOccupation.labour_monitor.vacancy.trend_4q_pct < 0
														? 'text-risk-high'
														: 'text-muted-foreground'}"
											>
												{primaryOccupation.labour_monitor.vacancy.trend_4q_pct > 0
													? '↑'
													: primaryOccupation.labour_monitor.vacancy.trend_4q_pct < 0
														? '↓'
														: '→'}
												{Math.abs(primaryOccupation.labour_monitor.vacancy.trend_4q_pct).toFixed(
													1
												)}%
											</span>
										</span>
									</div>
									{#if primaryOccupation.labour_monitor.hiring}
										<div class="flex items-center justify-between">
											<span class="text-xs text-muted-foreground">Hiring</span>
											<span class="font-mono text-xs text-foreground">
												{primaryOccupation.labour_monitor.hiring.recruitment_rate}% recruit · {primaryOccupation
													.labour_monitor.hiring.resignation_rate}% resign
											</span>
										</div>
									{/if}
									{#if primaryOccupation.labour_monitor.retrenchment}
										<div class="flex items-center justify-between">
											<span class="text-xs text-muted-foreground">Retrenchment</span>
											<span class="font-mono text-xs text-foreground">
												{#if primaryOccupation.labour_monitor.retrenchment.incidence_per_1000}
													{primaryOccupation.labour_monitor.retrenchment.incidence_per_1000}/1K
												{:else}
													{primaryOccupation.labour_monitor.retrenchment.latest_count.toLocaleString()}
													in {primaryOccupation.labour_monitor.retrenchment.latest_quarter}
												{/if}
											</span>
										</div>
									{/if}
								</div>
								<p class="mt-2 text-[10px] text-muted-foreground/60 italic">
									Based on {primaryOccupation.title} cluster data
								</p>
							</div>
						{/if}

						{#if baseOutlook}
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
								<span class="text-sm font-semibold {directionColors[baseOutlook.direction_12m]}">
									{directionLabels[baseOutlook.direction_12m]}
								</span>
								<div class="mt-2 grid grid-cols-2 gap-2">
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
							</div>
						{/if}
					</div>

					<!-- Right: Industry + policy -->
					<div class="space-y-5">
						{#if industryContext.top_industries.length > 0}
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
											{#if industry.vacancy_signal}
												<span
													class={cn(
														'text-[10px] shrink-0',
														vacancySignalClass(industry.vacancy_signal)
													)}
												>
													{industry.vacancy_signal === 'rising'
														? '↑'
														: industry.vacancy_signal === 'cooling'
															? '↓'
															: '→'}
												</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

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
	{/if}

	<!-- ===== BLOCK 4: WHAT TO DO NEXT ===== -->
	{#if transitions}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>What To Do Next</h2>
			<div class={card({ padding: 'md' })}>
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
						<p class="mt-2 text-[10px] text-muted-foreground/70">{transitionSupport.basis}</p>
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
