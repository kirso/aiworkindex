<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import OccupationResultList from '$lib/components/v9-browser/OccupationResultList.svelte';
	import { card, pageLayout, sectionLabel, title as titleStyle } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import type { V9IloExposureCategory } from '$lib/data/v9-contract';
	import { onMount } from 'svelte';

	let { data } = $props();
	let loadedOccupations = $state<typeof data.occupations | null>(null);
	let occupations = $derived(loadedOccupations ?? data.occupations);
	let fullIndexLoaded = $state(false);
	let loadFailed = $state(false);

	onMount(async () => {
		try {
			const response = await fetch('/data/v9-search-index.json?v=2026-08-19-v9');
			if (!response.ok) throw new Error(`Browse index returned ${response.status}`);
			const index = (await response.json()) as {
				occupations: Array<{ code: string; synonyms: string[] }>;
				browser_occupations: typeof data.occupations;
			};
			const synonymsByCode = new Map(index.occupations.map(item => [item.code, item.synonyms]));
			loadedOccupations = index.browser_occupations.map(item => ({
				...item,
				searchSynonyms: synonymsByCode.get(item.code) ?? []
			}));
			fullIndexLoaded = true;
		} catch {
			loadFailed = true;
		}
	});

	const PAGE_SIZE = 40;
	const categoryOptions: V9IloExposureCategory[] = [
		'Not Exposed',
		'Minimal Exposure',
		'Exposed: Gradient 1',
		'Exposed: Gradient 2',
		'Exposed: Gradient 3',
		'Exposed: Gradient 4'
	];
	let groups = $derived(data.groups);

	let query = $state('');
	let category = $state('all');
	let group = $state('all');
	let evidence = $state<'all' | 'wage' | 'demand' | 'unranked'>('all');
	let sort = $state<'title' | 'pressure' | 'wage'>('title');
	let visibleCount = $state(PAGE_SIZE);

	let filtered = $derived.by(() => {
		const normalized = query.trim().toLowerCase();
		const result = occupations.filter(item => {
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
	let visible = $derived(filtered.slice(0, visibleCount));
	let detail = $derived(evidence === 'demand' ? ('demand' as const) : ('wage' as const));

	$effect(() => {
		query;
		category;
		group;
		evidence;
		sort;
		visibleCount = PAGE_SIZE;
	});

	const itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Singapore SSOC 2024 occupations with AI work pressure evidence',
			numberOfItems: filtered.length,
			itemListElement: filtered.slice(0, 10).map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.title,
				url: `${SITE.url}/occupation/${item.code}`
			}))
		})}<\/script>`
	);
</script>

<Seo
	title="Browse Singapore Jobs by AI Work Pressure"
	description="Search all 1,001 SSOC 2024 occupations. Filter official ILO exposure categories, direct MOM wages, named demand evidence and occupation groups."
	path="/explore"
	jsonLd={[itemListJsonLd]}
/>

<main class={pageLayout({ width: 'data' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Browse occupations' }]} />

	<header class="mb-7 max-w-4xl">
		<h1 class={titleStyle({ size: 'page' })}>Browse Singapore occupations</h1>
		<p class="mt-3 text-base leading-relaxed text-muted-foreground">
			Search all 1,001 SSOC 2024 occupations. Pressure ranks, official ILO categories, direct wage
			rows and named demand evidence remain separate so a missing observation cannot look like zero.
		</p>
	</header>

	<section class="grid min-w-0 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
		<aside class="min-w-0 lg:sticky lg:top-16 lg:h-fit">
			<div class={card({ padding: 'md' })}>
				<h2 class={sectionLabel()}>Filter evidence</h2>
				<div class="mt-4 space-y-4">
					<label class="block text-xs font-medium text-foreground">
						Occupation or SSOC code
						<input
							type="search"
							bind:value={query}
							placeholder="e.g. accountant or 2411"
							class="mt-1.5 w-full min-w-0 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
						/>
					</label>

					<label class="block text-xs font-medium text-foreground">
						Official ILO category
						<select
							bind:value={category}
							class="mt-1.5 w-full min-w-0 border border-border bg-background px-3 py-2 text-sm"
						>
							<option value="all">All categories</option>
							{#each categoryOptions as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select>
					</label>

					<label class="block text-xs font-medium text-foreground">
						Major group
						<select
							bind:value={group}
							class="mt-1.5 w-full min-w-0 border border-border bg-background px-3 py-2 text-sm"
						>
							<option value="all">All groups</option>
							{#each groups as [code, label] (code)}
								<option value={code}>{code}. {label}</option>
							{/each}
						</select>
					</label>

					<label class="block text-xs font-medium text-foreground">
						Evidence available
						<select
							bind:value={evidence}
							class="mt-1.5 w-full min-w-0 border border-border bg-background px-3 py-2 text-sm"
						>
							<option value="all">All occupations</option>
							<option value="wage">Direct wage row</option>
							<option value="demand">Named demand signal</option>
							<option value="unranked">Pressure not ranked</option>
						</select>
					</label>

					<label class="block text-xs font-medium text-foreground">
						Sort by
						<select
							bind:value={sort}
							class="mt-1.5 w-full min-w-0 border border-border bg-background px-3 py-2 text-sm"
						>
							<option value="title">Occupation title</option>
							<option value="pressure">AI work pressure</option>
							<option value="wage">Direct wage</option>
						</select>
					</label>
				</div>

				<button
					type="button"
					class="mt-5 text-xs font-medium text-primary underline"
					onclick={() => {
						query = '';
						category = 'all';
						group = 'all';
						evidence = 'all';
						sort = 'title';
					}}
				>
					Reset filters
				</button>
			</div>
		</aside>

		<div class="min-w-0">
			{#if !fullIndexLoaded}
				<p class="mb-3 text-xs text-muted-foreground" aria-live="polite">
					{loadFailed
						? 'The full browser index could not load; showing the first 40 official occupations.'
						: `Loading all ${data.totalCount.toLocaleString()} occupations…`}
				</p>
			{/if}
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<p class="text-sm text-muted-foreground">
					Showing {Math.min(visible.length, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()}
					matching occupations
				</p>
				<p class="text-xs text-muted-foreground">Unknown values sort last</p>
			</div>

			<OccupationResultList
				items={visible}
				{detail}
				showRank={sort === 'pressure'}
				emptyMessage="No occupation matches these filters. Try removing one evidence constraint."
			/>

			{#if visibleCount < filtered.length}
				<button
					type="button"
					class="mt-4 w-full border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:border-foreground"
					onclick={() => (visibleCount += PAGE_SIZE)}
				>
					Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
				</button>
			{/if}
		</div>
	</section>
</main>
