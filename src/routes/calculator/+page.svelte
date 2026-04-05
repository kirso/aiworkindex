<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import {
		card,
		title as titleStyle,
		sectionLabel,
		caption,
		display,
		riskBadge,
		impactBadge,
		chip,
		formInput,
		pageLayout
	} from '$lib/design-system';
	import { riskBandLabels, impactTypeLabels } from '$lib/data';
	import type { RiskBand, ImpactType } from '$lib/data';
	import { SENIORITY_MODIFIERS } from '$lib/data/scoring-constants';
	import { titleMatches } from '$lib/utils/search';
	import { findAliasMatches } from '$lib/data/aliases';

	let { data } = $props();

	type Entry = (typeof data.entries)[number];
	type Seniority = 'junior' | 'mid' | 'senior';

	let selectedEntry: Entry | null = $state(null);
	let salary = $state(0);
	let seniority: Seniority = $state('mid');
	let searchQuery = $state('');
	let showDropdown = $state(false);

	const seniorityLabels: Record<Seniority, string> = {
		junior: 'Entry-level',
		mid: 'Mid-career',
		senior: 'Senior'
	};

	let filteredEntries = $derived.by(() => {
		const q = searchQuery.trim();
		if (q.length < 2) return [];
		// Alias matches first (occupation SSOCs that match aliases)
		const aliasHits = findAliasMatches(q);
		const aliasSsocs = new Set(aliasHits.flatMap(m => m.ssocs));
		const aliasEntries =
			aliasSsocs.size > 0 ? data.entries.filter(e => aliasSsocs.has(e.ssoc)) : [];
		// Title matches (excluding alias hits)
		const aliasIds = new Set(aliasEntries.map(e => e.id));
		const titleEntries = data.entries.filter(
			e => !aliasIds.has(e.id) && titleMatches(e.title, q.toLowerCase())
		);
		return [...aliasEntries, ...titleEntries].slice(0, 8);
	});

	let seniorityAdjustedRisk = $derived.by(() => {
		if (!selectedEntry) return 0;
		const mod = SENIORITY_MODIFIERS[seniority];
		const adjustedExposure = Math.max(0, Math.min(1, selectedEntry.exposure + mod.exposure_adj));
		const adjustedBottleneck = Math.max(
			0,
			Math.min(1, selectedEntry.bottleneck + mod.bottleneck_adj)
		);
		return Math.max(
			0,
			Math.min(
				1,
				adjustedExposure *
					(1 - adjustedBottleneck) *
					(1 - (selectedEntry.demand_resilience ?? 0))
			)
		);
	});

	let riskAmount = $derived(Math.round(salary * seniorityAdjustedRisk));
	let annualAtRisk = $derived(riskAmount * 12);

	function selectEntry(entry: Entry) {
		selectedEntry = entry;
		searchQuery = entry.title;
		showDropdown = false;
		if (!entry.isRole && 'gross_wage_median' in entry) {
			const wage = entry.gross_wage_median as number;
			if (wage > 0) salary = wage;
		}
	}

	function handleSearchFocus() {
		if (filteredEntries.length > 0) {
			showDropdown = true;
		}
	}

	function handleSearchBlur() {
		// Delay to allow click on dropdown item
		setTimeout(() => {
			showDropdown = false;
		}, 200);
	}
</script>

<Seo
	path="/calculator"
	title="AI Exposure Calculator | AI Work Index"
	description="Find out how much of your salary overlaps with AI capabilities. Use the AI Work Index structural risk scores to estimate your role's AI exposure in the current selected market."
/>

<div class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI Risk Calculator' }]} />

	<h1 class={titleStyle({ size: 'page' })}>AI Exposure Calculator</h1>
		<p class={caption({ class: 'mt-1 mb-6' })}>
		Estimate how much of your role's tasks overlap with current AI capabilities, and what to do
		about it. The current calculator uses the live reference market data.
		</p>

	<!-- Search + Select -->
	<div class={card({ padding: 'lg', class: 'mb-4' })}>
		<p class={sectionLabel({ class: 'mb-2' })}>1. Find your occupation or role</p>
		<div class="relative">
			<input
				type="text"
				class={formInput({ size: 'lg' })}
				placeholder="Search occupations or roles..."
				bind:value={searchQuery}
				onfocus={handleSearchFocus}
				onblur={handleSearchBlur}
				oninput={() => {
					showDropdown = true;
				}}
			/>
			{#if showDropdown && filteredEntries.length > 0}
				<div
					class="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-md"
				>
					{#each filteredEntries as entry}
						<button
							type="button"
							class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
							onmousedown={() => selectEntry(entry)}
						>
							<span class="truncate">
								{entry.title}
								{#if entry.isRole}
									<span class={caption()}>role</span>
								{/if}
							</span>
							<span
								class={riskBadge({ band: entry.risk_band as RiskBand, class: 'ml-2 shrink-0' })}
							>
								{riskBandLabels[entry.risk_band as RiskBand]}
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Salary Input -->
	<div class={card({ padding: 'lg', class: 'mb-4' })}>
		<p class={sectionLabel({ class: 'mb-2' })}>2. Enter your monthly salary</p>
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Local currency</span>
			<input
				type="number"
				class={formInput({ size: 'lg', class: 'max-w-xs' })}
				placeholder="e.g. 5000"
				bind:value={salary}
				min={0}
				step={100}
			/>
		</div>
		{#if selectedEntry && !selectedEntry.isRole && salary > 0}
			<p class={caption({ class: 'mt-1' })}>
				Pre-filled with the median gross wage for this occupation in the live market. Feel free to adjust.
			</p>
		{/if}
	</div>

	<!-- Seniority Toggle -->
	<div class={card({ padding: 'lg', class: 'mb-6' })}>
		<p class={sectionLabel({ class: 'mb-2' })}>3. Select your career stage</p>
		<div class="flex gap-2">
			{#each ['junior', 'mid', 'senior'] as const as level}
				<button
					type="button"
					class={chip({ active: seniority === level })}
					onclick={() => {
						seniority = level;
					}}
				>
					{seniorityLabels[level]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Results -->
	{#if selectedEntry && salary > 0}
		<div
			class={card({ padding: 'lg', accent: selectedEntry.risk_band as RiskBand, class: 'mb-6' })}
		>
			<p class={sectionLabel({ class: 'mb-3' })}>Your result</p>

			<div class="mb-4 text-center">
				<p class={display({ size: 'xl' })}>
					{(seniorityAdjustedRisk * 100).toFixed(0)}%
				</p>
				<p class={caption({ class: 'mt-1' })}>of tasks overlap with current AI capabilities</p>
				<p class="mt-2 text-xs text-muted-foreground/80 italic">
					This measures task overlap with current AI capabilities, not predicted income change.
				</p>
				<p class="mt-3 text-base font-mono font-semibold text-muted-foreground">
					{selectedEntry && 'currency' in selectedEntry && selectedEntry.currency
						? selectedEntry.currency
						: 'Local'} {riskAmount.toLocaleString()}/mo
				</p>
				<p class={caption()}>salary equivalent of overlapping tasks</p>
			</div>

			<div class="flex flex-wrap items-center justify-center gap-3 mb-4">
				<span class={riskBadge({ band: selectedEntry.risk_band as RiskBand })}>
					{riskBandLabels[selectedEntry.risk_band as RiskBand]} Risk
				</span>
				<span class={impactBadge({ type: selectedEntry.impact_type as ImpactType })}>
					{impactTypeLabels[selectedEntry.impact_type as ImpactType]}
				</span>
			</div>

			<div class={card({ variant: 'inset', padding: 'md', class: 'space-y-2' })}>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Annual overlap</span>
					<span class="font-mono font-semibold">
						{selectedEntry && 'currency' in selectedEntry && selectedEntry.currency
							? selectedEntry.currency
							: 'Local'} {annualAtRisk.toLocaleString()}
					</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Base risk score</span>
					<span class="font-mono font-semibold">{(selectedEntry.net_risk * 100).toFixed(1)}%</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Seniority-adjusted risk</span>
					<span class="font-mono font-semibold">{(seniorityAdjustedRisk * 100).toFixed(1)}%</span>
				</div>
				{#if seniority !== 'mid'}
					<p class={caption({ class: 'pt-1' })}>
						As a <strong>{seniorityLabels[seniority].toLowerCase()}</strong> professional, your
						estimated risk is {(seniorityAdjustedRisk * 100).toFixed(1)}% (vs {(
							selectedEntry.net_risk * 100
						).toFixed(1)}% at mid-career).
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- What you can do -->
	{#if selectedEntry && salary > 0}
		<div class={card({ padding: 'lg', class: 'mb-4' })}>
			<p class={sectionLabel({ class: 'mb-3' })}>What you can do</p>
			<div class="space-y-3 text-sm text-muted-foreground">
				<div class="flex gap-2">
					<span class="shrink-0 text-risk-very-low font-bold">1</span>
					<p>
						<span class="font-medium text-foreground">See the full picture.</span>
						Overlap ≠ replacement. View the
						<a
							href={selectedEntry.isRole
								? `/role/${selectedEntry.slug}`
								: `/sg/occupation/${selectedEntry.ssoc}`}
							class="text-primary hover:underline">detailed breakdown</a
						>
						to understand what AI can and can't do in this role.
					</p>
				</div>
				<div class="flex gap-2">
					<span class="shrink-0 text-risk-very-low font-bold">2</span>
					<p>
						<span class="font-medium text-foreground">Focus on human-advantage skills.</span>
						Judgment, coordination, stakeholder management, and physical presence are the strongest bottlenecks
						against AI displacement.
					</p>
				</div>
				<div class="flex gap-2">
					<span class="shrink-0 text-risk-very-low font-bold">3</span>
					<p>
						<span class="font-medium text-foreground">Explore career paths.</span>
						<a
							href={selectedEntry.isRole
								? `/role/${selectedEntry.slug}`
								: `/sg/occupation/${selectedEntry.ssoc}`}
							class="text-primary hover:underline">Career transitions</a
						>
						show lower-risk and higher-paying options with skills you already have.
					</p>
				</div>
				<div class="flex gap-2">
					<span class="shrink-0 text-risk-very-low font-bold">4</span>
					<p>
						<span class="font-medium text-foreground">Use AI, don't avoid it.</span>
						Workers who adopt AI tools see the largest productivity gains (Brynjolfsson et al., 2023).
						The goal is to be AI-augmented, not AI-replaced.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Disclaimer -->
	<div class={card({ variant: 'inset', padding: 'md' })}>
		<p class="text-xs text-muted-foreground">
			This calculator shows the proportion of your role's tasks that overlap with current AI
			capabilities — it does not predict job loss. Actual impact depends on employer adoption,
			regulatory environment, and many other factors.
		</p>
	</div>
</div>
