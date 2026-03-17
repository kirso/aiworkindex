<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Occupation } from '$lib/data';
	import { riskBandLabels, riskBandColors } from '$lib/data';
	import { findAliasMatches } from '$lib/data/aliases';

	let {
		occupations
	}: {
		occupations: Occupation[];
	} = $props();

	let query = $state('');
	let showDropdown = $state(false);
	let selectedIndex = $state(-1);

	let results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q || q.length < 2) return [];

		// Direct title matches
		let matches = occupations.filter((o) => o.title.toLowerCase().includes(q));

		// If no direct matches, try aliases
		if (matches.length === 0) {
			const aliasHits = findAliasMatches(q);
			if (aliasHits.length > 0) {
				const ssocs = new Set(aliasHits.flatMap((m) => m.ssocs));
				matches = occupations.filter((o) => ssocs.has(o.ssoc));
			}
		}

		return matches.slice(0, 8);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
			e.preventDefault();
			navigateTo(results[selectedIndex]);
		} else if (e.key === 'Escape') {
			showDropdown = false;
		}
	}

	function navigateTo(occ: Occupation) {
		showDropdown = false;
		query = '';
		goto(`/occupation/${occ.ssoc}`);
	}

	function handleFocus() {
		showDropdown = true;
	}

	function handleBlur() {
		// Delay to allow click on dropdown items
		setTimeout(() => {
			showDropdown = false;
			selectedIndex = -1;
		}, 200);
	}
</script>

<div class="relative mx-auto max-w-2xl">
	<div class="relative">
		<input
			type="text"
			placeholder="e.g., Software Developer, Nurse, Accountant..."
			bind:value={query}
			onkeydown={handleKeydown}
			onfocus={handleFocus}
			onblur={handleBlur}
			class="w-full rounded-xl border-2 border-border bg-card px-6 py-4 text-lg shadow-sm transition-colors placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
		/>
		{#if showDropdown && results.length > 0}
			<div class="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
				{#each results as occ, i (occ.ssoc)}
					<button
						type="button"
						class="flex w-full items-center justify-between px-5 py-3 text-left text-sm transition-colors hover:bg-muted
							{i === selectedIndex ? 'bg-accent' : ''}"
						onmousedown={() => navigateTo(occ)}
					>
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-foreground">{occ.title}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">
								SGD {occ.gross_wage_median.toLocaleString()} median
							</p>
						</div>
						<span
							class="ml-3 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
							style="background-color: {riskBandColors[occ.risk_band]};"
						>
							{riskBandLabels[occ.risk_band]}
						</span>
					</button>
				{/each}
			</div>
		{/if}
		{#if showDropdown && query.trim().length >= 2 && results.length === 0}
			<div class="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-lg">
				No occupations found for "{query.trim()}". Try a different job title.
			</div>
		{/if}
	</div>
</div>
