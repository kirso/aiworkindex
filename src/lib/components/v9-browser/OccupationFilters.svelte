<script lang="ts">
	import { formInput } from '$lib/design-system';
	import type { V9IloExposureCategory } from '$lib/data/v9-contract';

	export type EvidenceFilter = 'all' | 'ranked' | 'wage' | 'demand' | 'unranked';
	export type OccupationSort = 'title' | 'pressure' | 'wage';

	interface Props {
		query: string;
		category: string;
		group: string;
		evidence: EvidenceFilter;
		sort: OccupationSort;
		groups: Array<[string, string]>;
		resultCount: number;
		totalCount: number;
	}

	let {
		query = $bindable(),
		category = $bindable(),
		group = $bindable(),
		evidence = $bindable(),
		sort = $bindable(),
		groups,
		resultCount,
		totalCount
	}: Props = $props();

	const categoryOptions: V9IloExposureCategory[] = [
		'Not Exposed',
		'Minimal Exposure',
		'Exposed: Gradient 1',
		'Exposed: Gradient 2',
		'Exposed: Gradient 3',
		'Exposed: Gradient 4'
	];

	let filtersOpen = $state(false);
	let activeFilterCount = $derived(
		Number(category !== 'all') + Number(group !== 'all') + Number(evidence !== 'all')
	);

	function resetFilters(): void {
		query = '';
		category = 'all';
		group = 'all';
		evidence = 'all';
		sort = 'title';
	}
</script>

<section
	aria-label="Filter occupations"
	class="rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4"
>
	<div class="grid min-w-0 gap-3 md:grid-cols-[minmax(15rem,1.5fr)_auto] md:items-end">
		<label class="block min-w-0 text-sm font-medium text-foreground">
			Official occupation or SSOC code
			<input
				type="search"
				bind:value={query}
				placeholder="Try accountant or 25143"
				class="mt-1.5 {formInput()}"
			/>
		</label>

		<button
			type="button"
			class="touch-target inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground md:hidden"
			onclick={() => (filtersOpen = !filtersOpen)}
			aria-controls="occupation-filter-controls"
			aria-expanded={filtersOpen}
		>
			Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
		</button>

		<p class="hidden pb-2 text-right text-sm text-muted-foreground md:block" aria-live="polite">
			<span class="font-mono font-medium tabular-nums text-foreground"
				>{resultCount.toLocaleString()}</span
			>
			of {totalCount.toLocaleString()} occupations
		</p>
	</div>

	<div
		id="occupation-filter-controls"
		class="{filtersOpen
			? 'grid'
			: 'hidden'} mt-3 min-w-0 gap-3 border-t border-border pt-3 sm:grid-cols-2 md:grid md:grid-cols-4"
	>
		<label class="block min-w-0 text-sm font-medium text-foreground">
			Major group
			<select bind:value={group} class="mt-1.5 {formInput()}">
				<option value="all">All groups</option>
				{#each groups as [code, label] (code)}
					<option value={code}>{code}. {label}</option>
				{/each}
			</select>
		</label>

		<label class="block min-w-0 text-sm font-medium text-foreground">
			Official ILO category
			<select bind:value={category} class="mt-1.5 {formInput()}">
				<option value="all">All categories</option>
				{#each categoryOptions as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</label>

		<label class="block min-w-0 text-sm font-medium text-foreground">
			Evidence available
			<select bind:value={evidence} class="mt-1.5 {formInput()}">
				<option value="all">All occupations</option>
				<option value="ranked">Pressure ranked</option>
				<option value="wage">Direct wage row</option>
				<option value="demand">Named demand signal</option>
				<option value="unranked">Pressure not ranked</option>
			</select>
		</label>

		<label class="block min-w-0 text-sm font-medium text-foreground">
			List order
			<select bind:value={sort} class="mt-1.5 {formInput()}">
				<option value="title">Occupation title</option>
				<option value="pressure">AI task pressure</option>
				<option value="wage">Direct wage</option>
			</select>
		</label>
	</div>

	<div class="mt-3 flex flex-wrap items-center justify-between gap-2 md:hidden">
		<p class="text-sm text-muted-foreground" aria-live="polite">
			<span class="font-mono font-medium tabular-nums text-foreground"
				>{resultCount.toLocaleString()}</span
			>
			of {totalCount.toLocaleString()} occupations
		</p>
		{#if activeFilterCount > 0 || query.trim() !== '' || sort !== 'title'}
			<button
				type="button"
				class="touch-target text-sm font-semibold text-primary underline"
				onclick={resetFilters}
			>
				Reset
			</button>
		{/if}
	</div>

	{#if activeFilterCount > 0 || query.trim() !== '' || sort !== 'title'}
		<div class="mt-3 hidden justify-end md:flex">
			<button
				type="button"
				class="touch-target text-sm font-semibold text-primary underline"
				onclick={resetFilters}
			>
				Reset filters
			</button>
		</div>
	{/if}
</section>
