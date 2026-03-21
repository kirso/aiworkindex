<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Occupation, RiskBand } from '$lib/data';
	import { majorGroups, riskBandLabels, riskBandColors } from '$lib/data';
	import { findAliasMatches } from '$lib/data/aliases';
	import { chip } from '$lib/design-system';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		occupations,
		onfilter
	}: {
		occupations: Occupation[];
		onfilter: (filtered: Occupation[]) => void;
	} = $props();

	// Filter state
	let search = $state('');
	let selectedGroups = new SvelteSet<string>();
	let wageMin = $state(0);
	let wageMax = $state(30000);
	let selectedCategory = $state('all');
	let _mobileOpen = $state(false);
	let initialized = $state(false);

	// Wage bounds
	const WAGE_FLOOR = 0;
	const WAGE_CEIL = 30000;
	const WAGE_STEP = 500;

	const riskBandOptions: { key: string; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'very_low', label: riskBandLabels.very_low },
		{ key: 'low', label: riskBandLabels.low },
		{ key: 'moderate', label: riskBandLabels.moderate },
		{ key: 'high', label: riskBandLabels.high },
		{ key: 'very_high', label: riskBandLabels.very_high }
	];

	// Read URL params ONCE on mount — not reactively
	onMount(() => {
		const params = new URLSearchParams(window.location.search);

		const q = params.get('q');
		if (q) search = q;

		const groups = params.get('groups');
		if (groups) {
			for (const g of groups.split(',')) selectedGroups.add(g);
		}

		const wMin = params.get('wmin');
		if (wMin) wageMin = parseInt(wMin);

		const wMax = params.get('wmax');
		if (wMax) wageMax = parseInt(wMax);

		const cat = params.get('cat');
		if (cat) selectedCategory = cat;

		initialized = true;
	});

	// Alias matching for "Did you mean?" suggestions
	let aliasMatches = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (!q || q.length < 2) return [];
		return findAliasMatches(q);
	});

	// Apply filters reactively
	let filtered = $derived.by(() => {
		let result = occupations;

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			// Direct title match
			const directMatches = result.filter(o => o.title.toLowerCase().includes(q));

			if (directMatches.length > 0) {
				result = directMatches;
			} else if (aliasMatches.length > 0) {
				// Fall back to alias matches
				const aliasSSocs = new Set(aliasMatches.flatMap(m => m.ssocs));
				result = result.filter(o => aliasSSocs.has(o.ssoc));
			} else {
				result = directMatches; // empty
			}
		}

		if (selectedGroups.size > 0) {
			result = result.filter(o => selectedGroups.has(o.major_group));
		}

		if (wageMin > WAGE_FLOOR || wageMax < WAGE_CEIL) {
			result = result.filter(o => o.gross_wage_median >= wageMin && o.gross_wage_median <= wageMax);
		}

		if (selectedCategory !== 'all') {
			result = result.filter(o => o.risk_band === selectedCategory);
		}

		return result;
	});

	// Show "Did you mean?" when search has no direct title match but has alias matches
	let showDidYouMean = $derived.by(() => {
		if (!search.trim() || search.trim().length < 2) return false;
		const q = search.trim().toLowerCase();
		const hasDirectMatch = occupations.some(o => o.title.toLowerCase().includes(q));
		return !hasDirectMatch && aliasMatches.length > 0;
	});

	// Push filtered results to parent whenever filtered changes
	$effect(() => {
		onfilter(filtered);
	});

	// Sync filters to URL — only after initialization to prevent flash
	$effect(() => {
		if (!browser || !initialized) return;

		const params = new URLSearchParams();
		if (search.trim()) params.set('q', search.trim());
		if (selectedGroups.size > 0) params.set('groups', Array.from(selectedGroups).join(','));
		if (wageMin > WAGE_FLOOR) params.set('wmin', String(wageMin));
		if (wageMax < WAGE_CEIL) params.set('wmax', String(wageMax));
		if (selectedCategory !== 'all') params.set('cat', selectedCategory);

		const qs = params.toString();
		const newUrl = qs ? `?${qs}` : window.location.pathname;

		if (window.location.search !== (qs ? `?${qs}` : '')) {
			history.replaceState({}, '', newUrl);
		}
	});

	function toggleGroup(key: string) {
		if (selectedGroups.has(key)) {
			selectedGroups.delete(key);
		} else {
			selectedGroups.add(key);
		}
	}

	function clearFilters() {
		search = '';
		selectedGroups.clear();
		wageMin = WAGE_FLOOR;
		wageMax = WAGE_CEIL;
		selectedCategory = 'all';
	}

	let hasActiveFilters = $derived(
		search.trim() !== '' ||
			selectedGroups.size > 0 ||
			wageMin > WAGE_FLOOR ||
			wageMax < WAGE_CEIL ||
			selectedCategory !== 'all'
	);
</script>

<div class="space-y-4">
	<!-- Filter by name -->
	<div>
		<Label for="occ-search" class="mb-1 text-xs">Filter by name</Label>
		<Input
			id="occ-search"
			type="text"
			placeholder="Filter occupations..."
			bind:value={search}
			aria-label="Search occupations by title"
		/>
		{#if showDidYouMean}
			<p class="mt-1.5 text-xs text-muted-foreground">
				Matched via alias: {aliasMatches.map(m => `"${m.alias}"`).join(', ')}
				<span class="text-muted-foreground">({filtered.length} results)</span>
			</p>
		{/if}
	</div>

	<!-- Risk band chips -->
	<div>
		<span class="mb-1.5 block text-xs font-medium text-muted-foreground">Risk Band</span>
		<div class="flex flex-wrap gap-1.5" aria-label="Filter by risk level">
			{#each riskBandOptions as opt (opt.key)}
				{@const isActive = selectedCategory === opt.key}
				{@const bandColor = opt.key !== 'all' ? riskBandColors[opt.key as RiskBand] : undefined}
				<button
					type="button"
					class={chip({ active: isActive })}
					onclick={() => (selectedCategory = opt.key)}
					aria-pressed={isActive}
				>
					{#if bandColor && !isActive}
						<span
							class="mr-1 inline-block h-2 w-2 rounded-full"
							style="background-color: {bandColor};"
							aria-hidden="true"
						></span>
					{/if}
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Major group checkboxes -->
	<div>
		<span class="mb-1.5 block text-xs font-medium text-muted-foreground">Occupation Group</span>
		<div class="space-y-0.5">
			{#each majorGroups as group (group.key)}
				{@const shortLabel = group.label
					.replace('Associate Professionals & Technicians', 'Assoc. Professionals')
					.replace('Plant & Machine Operators & Assemblers', 'Plant & Machine Ops')
					.replace('Cleaners, Labourers & Related Workers', 'Cleaners & Labourers')
					.replace('Craftsmen & Related Trades Workers', 'Craftsmen & Trades')
					.replace('Agricultural & Fishery Workers', 'Agriculture & Fishery')
					.replace('Service & Sales Workers', 'Service & Sales')
					.replace('Clerical Support Workers', 'Clerical Support')}
				<label
					class="flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 text-text-secondary hover:bg-muted"
				>
					<input
						type="checkbox"
						checked={selectedGroups.has(group.key)}
						onchange={() => toggleGroup(group.key)}
						class="h-3 w-3 shrink-0 rounded border-border"
					/>
					<span
						class="inline-block h-2 w-2 shrink-0 rounded-full"
						style="background-color: {group.color};"
					></span>
					<span class="text-xs leading-tight">{shortLabel}</span>
				</label>
			{/each}
		</div>
	</div>

	<!-- Wage range -->
	<div>
		<span class="mb-1.5 block text-xs font-medium text-muted-foreground">
			Wage Range: SGD {wageMin.toLocaleString()} &ndash; SGD {wageMax.toLocaleString()}
		</span>
		<div class="space-y-3">
			<div class="flex items-center gap-2">
				<span class="w-7 text-xs text-muted-foreground">Min</span>
				<Slider
					bind:value={wageMin}
					min={WAGE_FLOOR}
					max={WAGE_CEIL}
					step={WAGE_STEP}
					class="flex-1"
				/>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-7 text-xs text-muted-foreground">Max</span>
				<Slider
					bind:value={wageMax}
					min={WAGE_FLOOR}
					max={WAGE_CEIL}
					step={WAGE_STEP}
					class="flex-1"
				/>
			</div>
		</div>
	</div>

	<!-- Clear -->
	{#if hasActiveFilters}
		<Button variant="outline" size="sm" class="w-full text-xs" onclick={clearFilters}>
			Clear all filters
		</Button>
		<p class="text-xs text-muted-foreground">
			{filtered.length} of {occupations.length} occupations
		</p>
	{/if}
</div>
