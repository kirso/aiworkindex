<script lang="ts">
	import { replaceState } from '$app/navigation';
	import type { V9BrowserItem } from '$lib/data/v9-browser';
	import type { V9IloExposureCategory } from '$lib/data/v9-contract';
	import { onMount } from 'svelte';
	import EqualAreaOccupationMap from './EqualAreaOccupationMap.svelte';
	import OccupationFilters from './OccupationFilters.svelte';
	import OccupationResultList from './OccupationResultList.svelte';
	import PressureWageScatter from './PressureWageScatter.svelte';

	type EvidenceFilter = 'all' | 'ranked' | 'wage' | 'demand' | 'unranked';
	type OccupationSort = 'title' | 'pressure' | 'wage';
	type ExplorerView = 'map' | 'scatter' | 'list';

	interface Props {
		items?: V9BrowserItem[];
		listPageSize?: number;
		sourceUrl?: string;
		expectedTotal?: number;
	}

	let {
		items: initialItems = [],
		listPageSize = 40,
		sourceUrl,
		expectedTotal = initialItems.length
	}: Props = $props();

	let items = $state<V9BrowserItem[]>([]);
	let query = $state('');
	let category = $state('all');
	let group = $state('all');
	let evidence = $state<EvidenceFilter>('all');
	let sort = $state<OccupationSort>('title');
	let view = $state<ExplorerView>('map');
	let selectedCode = $state<string | null>(null);
	let visibleCount = $state(0);
	let urlReady = $state(false);
	let loading = $state(true);
	let loadFailed = $state(false);

	let groups = $derived(
		Array.from(
			new Map(items.map(item => [item.majorGroupCode, item.majorGroupTitle] as const)).entries()
		).sort(([a], [b]) => a.localeCompare(b))
	);

	let filtered = $derived.by(() => {
		const normalized = query.trim().toLowerCase();
		const result = items.filter(item => {
			const matchesQuery =
				normalized.length === 0 ||
				item.title.toLowerCase().includes(normalized) ||
				item.code.includes(normalized) ||
				item.searchSynonyms.some(synonym => synonym.toLowerCase().includes(normalized));
			const matchesCategory =
				category === 'all' || item.officialCategories.includes(category as V9IloExposureCategory);
			const matchesGroup = group === 'all' || item.majorGroupCode === group;
			const matchesEvidence =
				evidence === 'all' ||
				(evidence === 'ranked' && item.pressureRank != null) ||
				(evidence === 'wage' && item.wageMedian != null) ||
				(evidence === 'demand' && item.demandSignalCount > 0) ||
				(evidence === 'unranked' && item.pressureRank == null);
			return matchesQuery && matchesCategory && matchesGroup && matchesEvidence;
		});

		return result.sort((a, b) => {
			if (sort === 'pressure') {
				if (a.pressureRank == null && b.pressureRank == null) return a.title.localeCompare(b.title);
				if (a.pressureRank == null) return 1;
				if (b.pressureRank == null) return -1;
				return b.pressureRank - a.pressureRank || a.title.localeCompare(b.title);
			}
			if (sort === 'wage') {
				if (a.wageMedian == null && b.wageMedian == null) return a.title.localeCompare(b.title);
				if (a.wageMedian == null) return 1;
				if (b.wageMedian == null) return -1;
				return b.wageMedian - a.wageMedian || a.title.localeCompare(b.title);
			}
			return a.title.localeCompare(b.title);
		});
	});

	let pageLimit = $derived(visibleCount === 0 ? listPageSize : visibleCount);
	let visible = $derived(filtered.slice(0, pageLimit));
	let listDetail = $derived(evidence === 'demand' ? ('demand' as const) : ('wage' as const));

	function isEvidenceFilter(value: string | null): value is EvidenceFilter {
		return ['all', 'ranked', 'wage', 'demand', 'unranked'].includes(value ?? '');
	}

	function isSort(value: string | null): value is OccupationSort {
		return ['title', 'pressure', 'wage'].includes(value ?? '');
	}

	function isView(value: string | null): value is ExplorerView {
		return ['map', 'scatter', 'list'].includes(value ?? '');
	}

	function readUrl(): void {
		const params = new URLSearchParams(window.location.search);
		query = params.get('q') ?? '';
		category = params.get('category') ?? 'all';
		group = params.get('group') ?? 'all';
		const requestedEvidence = params.get('evidence');
		evidence = isEvidenceFilter(requestedEvidence) ? requestedEvidence : 'all';
		const requestedSort = params.get('sort');
		sort = isSort(requestedSort) ? requestedSort : 'title';
		const requestedView = params.get('view');
		view = isView(requestedView) ? requestedView : 'map';
		const requestedJob = params.get('job');
		selectedCode = requestedJob;
	}

	async function loadItems(): Promise<void> {
		if (!sourceUrl || items.length > 0) return;
		loading = true;
		loadFailed = false;
		try {
			const response = await fetch(sourceUrl);
			if (!response.ok) throw new Error(`Occupation index returned ${response.status}`);
			const payload = (await response.json()) as { browser_occupations?: V9BrowserItem[] };
			if (!Array.isArray(payload.browser_occupations)) {
				throw new Error('Occupation index is missing browser_occupations');
			}
			items = payload.browser_occupations;
		} catch {
			loadFailed = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		items = initialItems;
		loading = initialItems.length === 0 && Boolean(sourceUrl);
		readUrl();
		urlReady = true;
		void loadItems();
		const handlePopState = () => readUrl();
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	});

	$effect(() => {
		query;
		category;
		group;
		evidence;
		sort;
		visibleCount = listPageSize;
	});

	$effect(() => {
		if (items.length > 0 && selectedCode && !filtered.some(item => item.code === selectedCode)) {
			selectedCode = null;
		}
	});

	$effect(() => {
		if (!urlReady || typeof window === 'undefined') return;
		const params = new URLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (category !== 'all') params.set('category', category);
		if (group !== 'all') params.set('group', group);
		if (evidence !== 'all') params.set('evidence', evidence);
		if (sort !== 'title') params.set('sort', sort);
		if (view !== 'map') params.set('view', view);
		if (selectedCode) params.set('job', selectedCode);

		const next = `${window.location.pathname}${params.size > 0 ? `?${params}` : ''}${window.location.hash}`;
		const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		if (next !== current) replaceState(next, {});
	});
</script>

<div class="min-w-0 space-y-4">
	<OccupationFilters
		bind:query
		bind:category
		bind:group
		bind:evidence
		bind:sort
		{groups}
		resultCount={filtered.length}
		totalCount={expectedTotal || items.length}
	/>

	<div class="flex flex-wrap items-center justify-between gap-3">
		<nav
			class="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs"
			aria-label="Occupation explorer view"
		>
			{#each [['map', 'Map'], ['scatter', 'Pressure & pay'], ['list', 'List']] as [key, label] (key)}
				<button
					type="button"
					class="touch-target rounded-md px-3 py-2 text-sm font-semibold transition-colors {view ===
					key
						? 'bg-foreground text-background'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
					onclick={() => (view = key as ExplorerView)}
					aria-pressed={view === key}
				>
					{label}
				</button>
			{/each}
		</nav>

		<p class="text-xs leading-relaxed text-muted-foreground">
			Your filters stay with you across every view.
		</p>
	</div>

	{#if loading}
		<div
			class="grid min-h-[32.5rem] place-items-center rounded-lg border border-border bg-surface-subtle px-5 text-center"
			aria-live="polite"
		>
			<div>
				<p class="text-sm font-semibold text-foreground">Loading the occupation map…</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Preparing {expectedTotal.toLocaleString()} official occupation records.
				</p>
			</div>
		</div>
	{:else if loadFailed}
		<div class="rounded-lg border border-border bg-card px-5 py-10 text-center">
			<p class="text-sm font-semibold text-foreground">The occupation explorer could not load.</p>
			<button
				type="button"
				class="touch-target mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
				onclick={() => void loadItems()}
			>
				Try again
			</button>
		</div>
	{:else if view === 'map'}
		<EqualAreaOccupationMap
			items={filtered}
			totalCount={expectedTotal || items.length}
			bind:selectedCode
		/>
	{:else if view === 'scatter'}
		<PressureWageScatter items={filtered} bind:selectedCode />
	{:else}
		<section class="min-w-0" aria-labelledby="occupation-list-title">
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<div>
					<h3 id="occupation-list-title" class="text-lg font-semibold text-foreground">
						Occupation list
					</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						Showing {Math.min(visible.length, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()}
						matching records
					</p>
				</div>
				<p class="text-xs text-muted-foreground">
					Open an occupation to see its sources and limits.
				</p>
			</div>

			<OccupationResultList
				items={visible}
				detail={listDetail}
				showRank={sort === 'pressure'}
				emptyMessage="No occupation matches these filters. Remove one evidence constraint."
			/>

			{#if pageLimit < filtered.length}
				<button
					type="button"
					class="touch-target mt-4 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-xs transition-colors hover:border-primary hover:bg-accent"
					onclick={() => (visibleCount = pageLimit + listPageSize)}
				>
					Show {Math.min(listPageSize, filtered.length - pageLimit)} more
				</button>
			{/if}
		</section>
	{/if}
</div>
