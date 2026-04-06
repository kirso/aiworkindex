<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Occupation } from '$lib/data';
	import { riskBandLabels } from '$lib/data';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import { syntheticRoles } from '$lib/data/synthetic-roles';
	import { trackEvent } from '$lib/analytics';
	import type { SyntheticRole } from '$lib/data/synthetic-roles';
	import { searchOccupationsAndRoles } from '$lib/utils/search';
	import { riskBadge, card } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Input } from '$lib/components/ui/input/index.js';
	import { formatCompactCount } from '$lib/data/home-surface';

	type SearchOccupation = Occupation & {
		linkHref?: string | null;
		localCode?: string;
		canonicalCode?: string;
		valueKind?: 'wage' | 'count';
	};

	let {
		occupations,
		occupationHrefPrefix = '/sg',
		marketLabel = 'selected market',
		occupationValueLabel = 'median wage'
	}: {
		occupations: SearchOccupation[];
		occupationHrefPrefix?: string;
		marketLabel?: string;
		occupationValueLabel?: string;
	} = $props();

	let countSurface = $derived(occupationValueLabel === 'mapped occupations');

	type SearchResult =
		| { type: 'role'; role: SyntheticRole }
		| { type: 'occupation'; occupation: SearchOccupation };

	let query = $state('');
	let showDropdown = $state(false);
	let selectedIndex = $state(-1);

	// Split results into grouped categories
	let grouped = $derived.by(() => {
		const raw = searchOccupationsAndRoles(query, occupations);
		const roles: SearchResult[] = raw.roles.map(role => ({ type: 'role', role }));
		const occs: SearchResult[] = raw.occupations.map(occupation => ({
			type: 'occupation',
			occupation
		}));
		const flat = [...roles, ...occs].slice(0, 12);
		return { roles, occupations: occs, flat };
	});

	let results = $derived(grouped.flat);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
			e.preventDefault();
			navigateToResult(results[selectedIndex]!);
		} else if (e.key === 'Escape') {
			showDropdown = false;
		}
	}

	function navigateToResult(result: SearchResult) {
		showDropdown = false;
		const searchQuery = query;
		query = '';
		if (result.type === 'role') {
			trackEvent('search_used', {
				query: searchQuery,
				selected_type: 'role',
				selected_id: result.role.slug
			});
			goto(`/role/${result.role.slug}`);
		} else {
			const code =
				result.occupation.ssoc ??
				result.occupation.localCode ??
				result.occupation.canonicalCode ??
				null;
			trackEvent('search_used', {
				query: searchQuery,
				selected_type: 'occupation',
				selected_id: code ?? 'unknown'
			});

			const target =
				result.occupation.linkHref ??
				(occupationHrefPrefix === '/global'
					? '/global'
					: occupationHrefPrefix.endsWith('/occupation')
						? code
							? `${occupationHrefPrefix}/${code}`
							: occupationHrefPrefix
					: code
						? `${occupationHrefPrefix}/occupation/${code}`
						: occupationHrefPrefix || '/global');
			goto(target);
		}
	}

	function handleFocus() {
		showDropdown = true;
	}

	function handleBlur() {
		setTimeout(() => {
			showDropdown = false;
			selectedIndex = -1;
		}, 200);
	}

	// Track flat index for keyboard nav across groups
	function flatIndex(group: 'roles' | 'occupations', groupIdx: number): number {
		if (group === 'roles') return groupIdx;
		return grouped.roles.length + groupIdx;
	}
</script>

<div class="relative mx-auto max-w-2xl">
	<div class="relative">
		<Input
			type="text"
			placeholder="e.g., Software Developer, Nurse, Accountant..."
			bind:value={query}
			onkeydown={handleKeydown}
			onfocus={handleFocus}
			onblur={handleBlur}
			aria-label="Search for an occupation or role"
			class="h-12 rounded-xl border-2 text-base shadow-sm"
		/>
		{#if showDropdown && results.length > 0}
			<div
				role="listbox"
				class={cn(
					card({ padding: 'none' }),
					'absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto shadow-lg'
				)}
			>
				<!-- Estimated Modern Roles group -->
				{#if grouped.roles.length > 0}
					<div class="border-b border-border/50 px-4 py-1.5">
						<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>Estimated Modern Roles</span
						>
					</div>
					{#each grouped.roles as result, i}
						<button
							type="button"
							role="option"
							aria-selected={flatIndex('roles', i) === selectedIndex}
							class="flex w-full items-center justify-between px-5 py-2.5 text-left text-sm transition-colors hover:bg-muted
								{flatIndex('roles', i) === selectedIndex ? 'bg-accent' : ''}"
							onmousedown={() => navigateToResult(result)}
						>
							<div class="min-w-0 flex-1">
								<p class="truncate font-medium text-foreground">
									{result.type === 'role' ? result.role.title : ''}
								</p>
								<p class="mt-0.5 text-xs text-risk-moderate">
									Weighted blend of official occupations
								</p>
							</div>
							<span
								class="ml-3 shrink-0 rounded-full bg-risk-moderate-subtle px-2.5 py-0.5 text-xs font-medium text-risk-moderate"
							>
								Estimate
							</span>
						</button>
					{/each}
				{/if}

				<!-- Selected surface occupations -->
				{#if grouped.occupations.length > 0}
					<div
						class="border-b border-border/50 px-4 py-1.5 {grouped.roles.length > 0
							? 'border-t'
							: ''}"
					>
						<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>Selected Occupations</span
						>
					</div>
					{#each grouped.occupations as result, i}
						{@const occ = result.type === 'occupation' ? result.occupation : null}
						{#if occ}
							<button
								type="button"
								role="option"
								aria-selected={flatIndex('occupations', i) === selectedIndex}
								class="flex w-full items-center justify-between px-5 py-2.5 text-left text-sm transition-colors hover:bg-muted
									{flatIndex('occupations', i) === selectedIndex ? 'bg-accent' : ''}"
								onmousedown={() => navigateToResult(result)}
							>
								<div class="min-w-0 flex-1">
									<p class="truncate font-medium text-foreground">{occ.title}</p>
									<p class="mt-0.5 text-xs text-muted-foreground">
										{#if occupationHrefPrefix === '/global' && occ.canonicalCode}
											ISCO {occ.canonicalCode}
										{:else if occ.localCode}
											Code {occ.localCode}
										{:else if occ.ssoc}
											SSOC {occ.ssoc}
										{:else if occ.canonicalCode}
											ISCO {occ.canonicalCode}
										{/if}
										&middot;
										{#if countSurface}
											{formatCompactCount(occ.gross_wage_median ?? 0)} mapped occupations
										{:else}
											{occupationValueLabel} {occ.gross_wage_median.toLocaleString()} in {marketLabel}
										{/if}
									</p>
								</div>
								<span class={cn(riskBadge({ band: occ.risk_band }), 'ml-3 shrink-0')}>
									{riskBandLabels[occ.risk_band]}
								</span>
							</button>
						{/if}
					{/each}
				{/if}
			</div>
		{/if}
		{#if showDropdown && query.trim().length >= 2 && results.length === 0}
			<div class={cn(card({ padding: 'md' }), 'absolute left-0 right-0 z-50 mt-2 shadow-lg')}>
				<p class="text-sm text-muted-foreground">
					No occupations found for "<span class="font-medium text-foreground">{query.trim()}</span
					>".
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Try a different job title, open <a href="/global" class="text-primary underline">the
						global baseline</a>, or browse our <a href="/rankings" class="text-primary underline"
						>rankings</a
					>.
				</p>
				<div class="mt-3 border-t border-border/50 pt-3">
					<p class="text-xs text-muted-foreground">
						We cover {DATA_VINTAGE.occupation_count} official occupations and {syntheticRoles.length}
							estimated modern roles. Open the global baseline for the comparable structural layer;
							the search results follow the selected surface view.
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
