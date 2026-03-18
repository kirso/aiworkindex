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
	import { blendArchetypes, classifyArchetype } from '$lib/data/role-archetypes';
	import { archetypeOverlayDefaults, generateWorkflowNarrative } from '$lib/data/workflow-overlay';
	import OutlookSection from '$lib/components/ui/OutlookSection.svelte';
	import DriverWaterfall from '$lib/components/viz/DriverWaterfall.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import LabourMarketCard from '$lib/components/ui/LabourMarketCard.svelte';

	const WATCHLIST_KEY = 'sg-ai-jobs-watchlist';

	let { data } = $props();
	let scored = $derived(data.scored);

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

	function levelLabel(v: number): string {
		return v > 0.66 ? 'high' : v >= 0.33 ? 'moderate' : 'low';
	}

	let summaryText = $derived.by(() => {
		const e = levelLabel(scored.exposure);
		switch (scored.impact_type) {
			case 'ai_leveraged':
				return `AI is likely to enhance ${scored.title}, not replace it. ${e} AI exposure, but strong human bottlenecks mean AI augments rather than substitutes.`;
			case 'at_risk':
				return `${scored.title} faces significant AI displacement pressure. ${e} AI exposure with few human bottlenecks.`;
			case 'stable':
				return `AI is unlikely to significantly disrupt ${scored.title}. ${e} AI exposure — limited overlap with core tasks.`;
			case 'mixed':
				return `${scored.title} shows mixed AI signals — high exposure but also strong human dependencies.`;
			default:
				return '';
		}
	});

	let primaryComponent = $derived.by(() => {
		return [...scored.components].sort((a, b) => b.weight - a.weight)[0] ?? null;
	});

	// Blended archetype content
	let personalizedContent = $derived.by(() => {
		const components = scored.components
			.filter((c: { occupation: { title: string; major_group: string } | null }) => c.occupation)
			.map(
				(c: {
					ssoc: string;
					weight: number;
					occupation: { title: string; major_group: string } | null;
				}) => ({
					ssoc: c.ssoc,
					title: c.occupation!.title,
					majorGroup: c.occupation!.major_group,
					weight: c.weight
				})
			);
		return blendArchetypes(scored.title, components);
	});

	let transitions = $derived(data.transitions);

	// Workflow narrative from primary archetype
	let workflowNarrative = $derived.by(() => {
		const archetype = classifyArchetype('00000', scored.title, '');
		const overlay = archetypeOverlayDefaults[archetype];
		return overlay ? generateWorkflowNarrative(overlay) : null;
	});
</script>

<svelte:head>
	<title>{scored.title} — AI Risk Estimate | SG AI Jobs</title>
	<meta
		name="description"
		content="{scored.title}: Estimated AI risk {(scored.net_risk * 100).toFixed(
			0
		)}%, rated {riskBandLabels[scored.risk_band]}. Based on {scored.components
			.length} official occupations."
	/>
	<meta property="og:title" content="{scored.title} — AI Risk Estimate | SG AI Jobs" />
	<meta
		property="og:description"
		content="Estimated risk: {(scored.net_risk * 100).toFixed(0)}% ({riskBandLabels[
			scored.risk_band
		]})."
	/>
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/role/{scored.slug}" />
	<meta property="og:image" content="https://sg-ai-jobs.vercel.app/og/role-{scored.slug}.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
</svelte:head>

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
				Confidence capped at Medium.
			</p>
			{#if data.primaryMatch && data.primaryMatch.riskDiff < 0.03}
				<p class="mt-1">
					Closely matches
					<a
						href="/occupation/{data.primaryMatch.ssoc}"
						class="font-medium text-primary hover:underline">{data.primaryMatch.title}</a
					>
					({(data.primaryMatch.risk * 100).toFixed(0)}% risk).
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
			</div>

			<!-- Right: Context -->
			<div class="flex-1 min-w-0">
				<h1 class={titleStyle({ size: 'page' })}>{scored.title}</h1>
				<p class={caption()}>{scored.description}</p>

				<p class="mt-3 text-sm text-foreground/80 leading-relaxed">{summaryText}</p>
				{#if workflowNarrative}
					<p class="mt-2 text-sm text-foreground/60 leading-relaxed">{workflowNarrative}</p>
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
					<span class={confidenceBadge({ level: 'medium' })}>Medium Confidence</span>
					<span class="text-xs text-muted-foreground">
						Higher risk than {data.riskPercentile}% of occupations
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
			{#if primaryComponent?.occupation}
				<DriverWaterfall occupation={primaryComponent.occupation} />
			{:else}
				<!-- Fallback: simple bar display when no primary occupation available -->
				<div class="space-y-3 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-muted-foreground">AI Task Overlap</span>
						<span class="font-mono text-xs tabular-nums">{(scored.exposure * 100).toFixed(0)}%</span
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
			{/if}
		</div>
		<p class="mt-2 text-xs text-muted-foreground">
			Weighted average of {scored.components.length} official occupations.
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
		</div>
	</section>

	<!-- ===== MARKET CONTEXT: Labour + Outlook ===== -->
	{#if primaryComponent?.occupation?.labour_monitor}
		<section class="mb-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Market Context</h2>
			<LabourMarketCard monitor={primaryComponent.occupation.labour_monitor} />
		</section>
	{/if}

	{#if primaryComponent?.occupation}
		<section class="mb-8">
			<OutlookSection occupation={primaryComponent.occupation} />
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
			Technical Details · {scored.components.length} components · medium confidence
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
