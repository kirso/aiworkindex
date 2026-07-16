<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import {
		card,
		title as titleStyle,
		sectionLabel,
		caption,
		display,
		riskBadge,
		formInput,
		pageLayout
	} from '$lib/design-system';
	import { riskBandLabels } from '$lib/data';
	import type { RiskBand } from '$lib/data';
	import { titleMatches, fuzzyTitleMatches } from '$lib/utils/search';
	import { findAliasMatches } from '$lib/data/aliases';

	let { data } = $props();

	type Entry = (typeof data.entries)[number];
	let selectedEntry: Entry | null = $state(null);
	let searchQuery = $state('');
	let showDropdown = $state(false);
	const pathwayLabels = {
		limited_direct_change: 'Limited direct impact',
		workflow_redesign: 'The work is likely to be redesigned',
		augmentation_led_growth: 'AI is more likely to assist than replace',
		demand_buffered_redesign: 'Strong demand may cushion the impact',
		hiring_or_substitution_pressure: 'Greater hiring or substitution pressure'
	} as const;

	let filteredEntries = $derived.by(() => {
		const q = searchQuery.trim();
		if (q.length < 2) return [];
		const aliasHits = findAliasMatches(q);
		const aliasSsocs = new Set(aliasHits.flatMap(m => m.ssocs));
		const aliasEntries =
			aliasSsocs.size > 0 ? data.entries.filter((e: Entry) => aliasSsocs.has(e.ssoc)) : [];
		const aliasIds = new Set(aliasEntries.map((e: Entry) => e.id));
		const titleEntries = data.entries.filter(
			(e: Entry) => !aliasIds.has(e.id) && titleMatches(e.title, q.toLowerCase())
		);
		let results = [...aliasEntries, ...titleEntries].slice(0, 8);
		// Typo-tolerant fallback: fill remaining slots so "accuntant" still finds "Accountant".
		if (results.length < 8) {
			const seen = new Set(results.map((e: Entry) => e.id));
			const fuzzy = data.entries.filter(
				(e: Entry) => !seen.has(e.id) && fuzzyTitleMatches(e.title, q.toLowerCase())
			);
			results = [...results, ...fuzzy].slice(0, 8);
		}
		return results;
	});

	function selectEntry(entry: Entry) {
		selectedEntry = entry;
		searchQuery = entry.title;
		showDropdown = false;
	}

	function handleSearchFocus() {
		if (filteredEntries.length > 0) {
			showDropdown = true;
		}
	}

	function handleSearchBlur() {
		setTimeout(() => {
			showDropdown = false;
		}, 200);
	}
</script>

<Seo
	path="/will-ai-take-my-job"
	title="Will AI Take My Job? AI Job Risk Calculator (2026) | AI Work Index"
	description="Search {DATA_VINTAGE.occupation_count} Singapore occupations and {DATA_VINTAGE.role_count} estimated modern roles. Get a relative AI Exposure Rank, likely pathway and evidence level—not a job-loss probability."
/>

<div class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Will AI Take My Job?' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Will AI Take My Job?</h1>
	<p class={caption({ class: 'mt-1 mb-6' })}>
		Search your occupation to see how exposed its work is to current AI capabilities, what still
		needs people, and what hiring demand looks like.
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

	<!-- Results -->
	{#if selectedEntry}
		<div
			class={card({ padding: 'lg', accent: selectedEntry.risk_band as RiskBand, class: 'mb-6' })}
		>
			<p class={sectionLabel({ class: 'mb-3' })}>Your result</p>

			<div class="mb-4 text-center">
				<p class={display({ size: 'xl' })}>
					{selectedEntry.score_points}/100
				</p>
				<p class={caption({ class: 'mt-1' })}>
					This work is more exposed to current AI capabilities than approximately {selectedEntry.score_points}%
					of Singapore occupations. This is a relative rank, not a job-loss probability.
				</p>
			</div>

			<div class="flex flex-wrap items-center justify-center gap-3 mb-4">
				<span class={riskBadge({ band: selectedEntry.risk_band as RiskBand })}>
					{riskBandLabels[selectedEntry.risk_band as RiskBand]} exposure
				</span>
				<span class="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
					{pathwayLabels[selectedEntry.pathway as keyof typeof pathwayLabels]}
				</span>
			</div>

			<div class={card({ variant: 'inset', padding: 'md', class: 'space-y-2' })}>
				<div class="flex items-center justify-between gap-4 text-sm">
					<span class="text-muted-foreground">How AI may affect the work</span>
					<span class="text-right font-semibold"
						>{pathwayLabels[selectedEntry.pathway as keyof typeof pathwayLabels]}</span
					>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Current hiring demand</span>
					<span class="font-mono font-semibold capitalize">{selectedEntry.demand_context}</span>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Evidence confidence</span>
					<span class="font-mono font-semibold capitalize">{selectedEntry.evidence_confidence}</span
					>
				</div>
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Result type</span>
					<span class="font-mono font-semibold"
						>{selectedEntry.isEstimated ? 'Estimated role' : 'Official occupation'}</span
					>
				</div>
			</div>
		</div>
	{/if}

	<!-- What you can do -->
	{#if selectedEntry}
		<div class={card({ padding: 'lg', class: 'mb-4' })}>
			<p class={sectionLabel({ class: 'mb-3' })}>What you can do</p>
			<div class="space-y-3 text-sm text-muted-foreground">
				<div class="flex gap-2">
					<span class="shrink-0 text-risk-very-low font-bold">1</span>
					<p>
						<span class="font-medium text-foreground">See the full picture.</span>
						Overlap does not mean replacement. View the
						<a
							href={selectedEntry.isRole
								? `/role/${selectedEntry.slug}`
								: `/occupation/${selectedEntry.ssoc}`}
							class="text-primary hover:underline">detailed breakdown</a
						>
						to understand what AI can and cannot do in this role.
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
								: `/occupation/${selectedEntry.ssoc}`}
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
			This calculator ranks relative AI exposure. It does not estimate the proportion of tasks
			automated or the probability of job loss. Actual employment effects depend on adoption,
			demand, firm behavior, regulation and worker transitions.
		</p>
	</div>
</div>
