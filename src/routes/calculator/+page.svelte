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

	let filteredEntries = $derived(
		searchQuery.length < 2
			? []
			: data.entries
					.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
					.slice(0, 8)
	);

	let seniorityAdjustedRisk = $derived.by(() => {
		if (!selectedEntry) return 0;
		const mod = SENIORITY_MODIFIERS[seniority];
		const adjustedExposure = Math.max(0, Math.min(1, selectedEntry.exposure + mod.exposure_adj));
		const adjustedBottleneck = Math.max(
			0,
			Math.min(1, selectedEntry.bottleneck + mod.bottleneck_adj)
		);
		return Math.max(0, Math.min(1, adjustedExposure * (1 - adjustedBottleneck)));
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
	title="AI Salary Risk Calculator for Singapore Jobs"
	description="Find out how much of your salary overlaps with AI capabilities. Use the AI Work Index structural risk scores to estimate your role's AI exposure."
/>

<div class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'AI Risk Calculator' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Your Salary vs AI Risk</h1>
	<p class={caption({ class: 'mt-1 mb-6' })}>
		See how much of your monthly income overlaps with current AI capabilities.
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
			<span class="text-sm font-medium text-muted-foreground">SGD</span>
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
				Pre-filled with median gross wage for this occupation. Feel free to adjust.
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
					SGD {riskAmount.toLocaleString()}
				</p>
				<p class={caption({ class: 'mt-1' })}>
					of your monthly income overlaps with current AI capabilities
				</p>
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
					<span class="font-mono font-semibold">SGD {annualAtRisk.toLocaleString()}</span>
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

	<!-- Disclaimer -->
	<div class={card({ variant: 'inset', padding: 'md' })}>
		<p class="text-xs text-muted-foreground">
			<strong>Disclaimer:</strong> This calculator applies the AI Work Index structural risk score to
			your salary. It does not predict job loss — it shows the proportion of your role's tasks that overlap
			with current AI capabilities. Actual impact depends on employer adoption, regulatory environment,
			and many other factors.
		</p>
	</div>
</div>
