<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Occupation, RiskBand } from '$lib/data';
	import { majorGroups, riskBandLabels, riskBandColors } from '$lib/data';

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
	let mobileOpen = $state(false);
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

	// Apply filters reactively
	let filtered = $derived.by(() => {
		let result = occupations;

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			result = result.filter((o) => o.title.toLowerCase().includes(q));
		}

		if (selectedGroups.size > 0) {
			result = result.filter((o) => selectedGroups.has(o.major_group));
		}

		if (wageMin > WAGE_FLOOR || wageMax < WAGE_CEIL) {
			result = result.filter(
				(o) => o.gross_wage_median >= wageMin && o.gross_wage_median <= wageMax
			);
		}

		if (selectedCategory !== 'all') {
			result = result.filter((o) => o.risk_band === selectedCategory);
		}

		return result;
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
	<!-- Search -->
	<div>
		<label for="occ-search" class="mb-1 block text-xs font-medium text-gray-500">Search</label>
		<input
			id="occ-search"
			type="text"
			placeholder="Search occupations..."
			bind:value={search}
			class="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
		/>
	</div>

	<!-- Risk band chips -->
	<div>
		<span class="mb-1.5 block text-xs font-medium text-gray-500">Risk Band</span>
		<div class="flex flex-wrap gap-1.5">
			{#each riskBandOptions as opt (opt.key)}
				{@const isActive = selectedCategory === opt.key}
				{@const bandColor = opt.key !== 'all' ? riskBandColors[opt.key as RiskBand] : undefined}
				<button
					type="button"
					class="rounded-full border px-3 py-1 text-xs font-medium transition-colors
						{isActive
							? 'border-gray-900 bg-gray-900 text-white'
							: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}"
					onclick={() => (selectedCategory = opt.key)}
				>
					{#if bandColor && !isActive}
						<span
							class="mr-1 inline-block h-2 w-2 rounded-full"
							style="background-color: {bandColor};"
						></span>
					{/if}
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Major group checkboxes -->
	<div>
		<span class="mb-1.5 block text-xs font-medium text-gray-500">Major Group</span>
		<div class="space-y-1">
			{#each majorGroups as group (group.key)}
				<label class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-gray-700 hover:bg-gray-50">
					<input
						type="checkbox"
						checked={selectedGroups.has(group.key)}
						onchange={() => toggleGroup(group.key)}
						class="h-3.5 w-3.5 rounded border-gray-300"
					/>
					<span
						class="inline-block h-2.5 w-2.5 rounded-sm"
						style="background-color: {group.color};"
					></span>
					<span class="truncate text-xs">{group.label}</span>
				</label>
			{/each}
		</div>
	</div>

	<!-- Wage range -->
	<div>
		<span class="mb-1.5 block text-xs font-medium text-gray-500">
			Wage Range: SGD {wageMin.toLocaleString()} &ndash; SGD {wageMax.toLocaleString()}
		</span>
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<span class="text-[10px] text-gray-400">Min</span>
				<input
					type="range"
					min={WAGE_FLOOR}
					max={WAGE_CEIL}
					step={WAGE_STEP}
					bind:value={wageMin}
					class="h-1.5 w-full cursor-pointer accent-gray-700"
				/>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-[10px] text-gray-400">Max</span>
				<input
					type="range"
					min={WAGE_FLOOR}
					max={WAGE_CEIL}
					step={WAGE_STEP}
					bind:value={wageMax}
					class="h-1.5 w-full cursor-pointer accent-gray-700"
				/>
			</div>
		</div>
	</div>

	<!-- Clear -->
	{#if hasActiveFilters}
		<button
			type="button"
			class="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
			onclick={clearFilters}
		>
			Clear all filters
		</button>
		<p class="text-xs text-gray-400">{filtered.length} of {occupations.length} occupations</p>
	{/if}
</div>
