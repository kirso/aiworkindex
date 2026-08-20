<script lang="ts">
	import { browser } from '$app/environment';
	import { trackProductEvent } from '$lib/analytics';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { card, formInput, pageLayout, sectionLabel, title } from '$lib/design-system';
	import {
		WATCHLIST_KEY,
		WATCHLIST_TIMESTAMP_KEY,
		parseStoredWatchlist,
		serializeWatchlist,
		type WatchlistEntry
	} from '$lib/watchlist';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	type OccupationSearchEntry = {
		code: string;
		title: string;
		synonyms?: string[];
		pressure_rank: number | null;
	};
	type RoleSearchEntry = {
		slug: string;
		title: string;
		description: string;
		estimated_pressure_percentile: number | null;
	};
	type OfficialRoleAlias = { slug: string; official_ssoc2024: string };
	type RoleQuery = {
		slug: string;
		title: string;
		description: string;
		pressure_rank: number | null;
		pressure_kind: 'official' | 'estimated' | 'withheld';
		official_ssoc2024: string | null;
		href: string;
		journey_kind: string;
	};
	type SearchIndex = {
		occupations: OccupationSearchEntry[];
		roles: RoleSearchEntry[];
		role_queries?: RoleQuery[];
		official_role_aliases?: OfficialRoleAlias[];
	};
	type SavedItem =
		| { kind: 'occupation'; entry: WatchlistEntry; occupation: OccupationSearchEntry }
		| { kind: 'role'; entry: WatchlistEntry; role: RoleQuery };
	type SearchCandidate = {
		kind: WatchlistEntry['kind'];
		id: string;
		title: string;
		detail: string;
		searchText: string;
		pressure: number | null;
	};

	let occupationsByCode = $state(new Map<string, OccupationSearchEntry>());
	let roleQueriesBySlug = $state(new Map<string, RoleQuery>());
	let officialRoleAliasesBySlug = $state(new Map<string, OfficialRoleAlias>());
	let searchCandidates = $state<SearchCandidate[]>([]);
	let query = $state('');
	let searchOpen = $state(false);

	let savedEntries = $state<WatchlistEntry[]>([]);
	let savedTimestamp = $state<string | null>(null);
	let savedItems = $derived<SavedItem[]>(
		savedEntries
			.map(entry => {
				if (entry.kind === 'occupation') {
					const occupation = occupationsByCode.get(entry.id);
					return occupation ? { kind: 'occupation' as const, entry, occupation } : null;
				}
				const role = roleQueriesBySlug.get(entry.id);
				if (role) return { kind: 'role' as const, entry, role };
				const alias = officialRoleAliasesBySlug.get(entry.id);
				const occupation = alias ? occupationsByCode.get(alias.official_ssoc2024) : undefined;
				return occupation ? { kind: 'occupation' as const, entry, occupation } : null;
			})
			.filter((item): item is SavedItem => item !== null)
	);
	let unavailableCount = $derived(savedEntries.length - savedItems.length);
	let savedKeys = $derived(new Set(savedEntries.map(entry => `${entry.kind}:${entry.id}`)));
	let results = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return [] as SearchCandidate[];
		return searchCandidates
			.filter(candidate => !savedKeys.has(`${candidate.kind}:${candidate.id}`))
			.filter(candidate => candidate.searchText.includes(needle))
			.sort((a, b) => {
				const aStarts = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
				const bStarts = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
				return aStarts - bStarts || a.title.localeCompare(b.title);
			})
			.slice(0, 10);
	});
	let comparisonHref = $derived.by(() => {
		const ids = savedItems
			.slice(0, 4)
			.map(item =>
				item.kind === 'occupation' ? `occupation:${item.occupation.code}` : `role:${item.role.slug}`
			);
		return `/compare?entities=${ids.join(',')}`;
	});

	onMount(async () => {
		savedEntries = parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY));
		savedTimestamp = localStorage.getItem(WATCHLIST_TIMESTAMP_KEY);
		try {
			const response = await fetch('/data/v9-search-index.json?v=2026-08-19-v9');
			if (!response.ok) return;
			const index = (await response.json()) as SearchIndex;
			occupationsByCode = new Map(
				index.occupations.map(occupation => [occupation.code, occupation])
			);
			const fallbackRoleQueries: RoleQuery[] = index.roles.map(role => ({
				slug: role.slug,
				title: role.title,
				description: role.description,
				pressure_rank: role.estimated_pressure_percentile,
				pressure_kind: role.estimated_pressure_percentile == null ? 'withheld' : 'estimated',
				official_ssoc2024: null,
				href: `/role/${role.slug}`,
				journey_kind:
					role.estimated_pressure_percentile == null ? 'mapping_withheld' : 'composite_estimate'
			}));
			const roleQueries = index.role_queries ?? fallbackRoleQueries;
			roleQueriesBySlug = new Map(roleQueries.map(role => [role.slug, role]));
			officialRoleAliasesBySlug = new Map(
				(index.official_role_aliases ?? []).map(alias => [alias.slug, alias])
			);
			searchCandidates = [
				...index.occupations.map(occupation => ({
					kind: 'occupation' as const,
					id: occupation.code,
					title: occupation.title,
					detail: `Official occupation · SSOC ${occupation.code}`,
					searchText: [occupation.title, occupation.code, ...(occupation.synonyms ?? [])]
						.join(' ')
						.toLowerCase(),
					pressure: occupation.pressure_rank
				})),
				...roleQueries.map(role => ({
					kind: 'role' as const,
					id: role.slug,
					title: role.title,
					detail:
						role.pressure_kind === 'official'
							? 'Modern title · resolves to an official occupation'
							: role.pressure_kind === 'estimated'
								? 'Modern title · reviewed occupation mix'
								: 'Modern title · choose a closer occupation',
					searchText: [role.title, role.description, role.slug].join(' ').toLowerCase(),
					pressure: role.pressure_rank
				}))
			];
		} catch {
			// Saved IDs remain visible as unavailable when the local search index cannot load.
		}
	});

	function persist(entries: WatchlistEntry[]) {
		savedEntries = entries;
		if (!browser) return;

		if (entries.length === 0) {
			localStorage.removeItem(WATCHLIST_KEY);
			localStorage.removeItem(WATCHLIST_TIMESTAMP_KEY);
			savedTimestamp = null;
			return;
		}

		const now = new Date().toISOString().slice(0, 10);
		localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(entries));
		localStorage.setItem(WATCHLIST_TIMESTAMP_KEY, now);
		savedTimestamp = now;
	}

	function removeFromWatchlist(entry: WatchlistEntry) {
		persist(savedEntries.filter(saved => !(saved.kind === entry.kind && saved.id === entry.id)));
		trackProductEvent('job_saved', {
			entity_kind: entry.kind,
			saved: false,
			context: 'saved_jobs'
		});
	}

	function addToSaved(candidate: SearchCandidate) {
		persist([...savedEntries, { kind: candidate.kind, id: candidate.id }]);
		trackProductEvent('job_saved', {
			entity_kind: candidate.kind,
			saved: true,
			context: 'saved_jobs'
		});
		query = '';
		searchOpen = false;
	}

	function clearAll() {
		persist([]);
	}

	function formatRank(value: number | null): string {
		return value == null ? 'Position unavailable' : `${value.toFixed(1)} / 100`;
	}

	function itemTitle(item: SavedItem): string {
		return item.kind === 'occupation' ? item.occupation.title : item.role.title;
	}

	function roleStatus(role: RoleQuery): string {
		if (role.pressure_kind === 'official') return 'Resolves to an official occupation';
		if (role.pressure_kind === 'estimated') return 'Reviewed modern-role estimate';
		return 'Choose a closer occupation';
	}
</script>

<Seo
	title="Saved Jobs"
	description="Save Singapore occupations and modern job titles on this device, then compare their AI task pressure, pay and demand evidence."
	path="/watchlist"
	noindex={true}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Saved jobs' }]} />

	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="max-w-3xl">
			<p class={sectionLabel()}>Stored on this device</p>
			<h1 class={title({ size: 'page' })}>Saved jobs</h1>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Keep a short list while you explore. Your saved jobs stay in this browser, ready to compare
				or revisit when the market evidence changes.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if savedItems.length >= 2}
				<Button href={comparisonHref}>Compare up to 4</Button>
			{/if}
			{#if savedEntries.length > 0}
				<Button variant="outline" size="sm" onclick={clearAll}>Clear all</Button>
			{/if}
		</div>
	</div>

	<section class="relative mt-7 max-w-2xl" aria-label="Add a saved job">
		<label class={sectionLabel()} for="saved-job-search">Add a job</label>
		<input
			id="saved-job-search"
			type="search"
			class={cn(formInput(), 'mt-2 w-full')}
			placeholder="Search occupations and modern job titles…"
			bind:value={query}
			onfocus={() => (searchOpen = true)}
			onblur={() => setTimeout(() => (searchOpen = false), 180)}
		/>
		{#if searchOpen && query.trim().length >= 2}
			<div
				class="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border border-foreground bg-card"
			>
				{#if results.length === 0}
					<p class="p-3 text-sm text-muted-foreground">No unsaved match found.</p>
				{:else}
					{#each results as result (`${result.kind}:${result.id}`)}
						<button
							type="button"
							class="flex min-h-14 w-full items-start justify-between gap-3 border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-accent"
							onmousedown={() => addToSaved(result)}
						>
							<span class="min-w-0">
								<strong class="block truncate text-sm">{result.title}</strong>
								<span class="block text-xs text-muted-foreground">{result.detail}</span>
							</span>
							<span class="shrink-0 font-mono text-xs font-bold tabular-nums">
								{result.pressure == null ? '—' : result.pressure.toFixed(1)}
							</span>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
		<p class="mt-2 text-xs text-muted-foreground">
			Save up to any number; the comparison view opens the first four current matches.
		</p>
	</section>

	{#if unavailableCount > 0}
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-5')}>
			<p class="text-sm font-bold text-foreground">
				{unavailableCount} saved {unavailableCount === 1 ? 'item is' : 'items are'} not in V9
			</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				V9 uses Singapore's SSOC 2024 classification. These older saved identifiers have no reviewed
				match in the current release and remain on this device until you clear them.
			</p>
		</div>
	{/if}

	{#if savedItems.length === 0}
		<div class={cn(card({ padding: 'lg' }), 'mt-8 text-center')}>
			<svg
				class="mx-auto h-12 w-12 text-text-ghost"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
			</svg>
			<h2 class="mt-4 text-base font-semibold text-foreground">
				{unavailableCount > 0 ? 'No saved items match the current release' : 'No saved jobs yet'}
			</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Search above, or save a job from its occupation or modern-title page.
			</p>
			<div class="mt-4 flex flex-wrap justify-center gap-3">
				<Button href="/explore">Browse occupations</Button>
				<Button variant="outline" href="/roles">Browse modern roles</Button>
				<Button variant="outline" href="/rankings">View rankings</Button>
			</div>
		</div>
	{:else}
		<p class={cn(sectionLabel(), 'mt-7 mb-3')}>{savedItems.length} current matches</p>
		<div class="space-y-3">
			{#each savedItems as item (`${item.entry.kind}:${item.entry.id}`)}
				<article class={card({ padding: 'md' })}>
					<div class="flex min-w-0 items-start justify-between gap-4">
						{#if item.kind === 'occupation'}
							<a href="/occupation/{item.occupation.code}" class="min-w-0 flex-1 no-underline">
								<div class="flex min-w-0 flex-wrap items-center gap-2">
									<h2 class="break-words text-sm font-bold text-foreground hover:text-primary">
										{item.occupation.title}
									</h2>
									<Badge variant="outline" class="shrink-0 text-xs tabular-nums">
										SSOC {item.occupation.code}
									</Badge>
								</div>
								<p class="mt-1 text-xs text-muted-foreground">Official SSOC 2024 occupation</p>
								<div class="mt-3 grid gap-px bg-border sm:grid-cols-2">
									<div class="min-w-0 bg-card py-2 pr-3 sm:px-3">
										<p class="text-xs text-muted-foreground">Relative AI task pressure</p>
										<p class="break-words font-mono text-sm font-bold tabular-nums text-foreground">
											{formatRank(item.occupation.pressure_rank)}
										</p>
									</div>
									<div class="min-w-0 bg-card py-2 pr-3 sm:px-3">
										<p class="text-xs text-muted-foreground">Job page</p>
										<p class="break-words text-sm font-bold text-foreground">
											Open occupation page
										</p>
									</div>
								</div>
							</a>
						{:else}
							<a href={item.role.href} class="min-w-0 flex-1 no-underline">
								<div class="flex min-w-0 flex-wrap items-center gap-2">
									<h2 class="break-words text-sm font-bold text-foreground hover:text-primary">
										{item.role.title}
									</h2>
									<Badge variant="outline" class="shrink-0 text-xs">Modern title</Badge>
								</div>
								<p class="mt-1 text-xs text-muted-foreground">
									{item.role.description}
								</p>
								<div class="mt-3 grid gap-px bg-border sm:grid-cols-2">
									<div class="min-w-0 bg-card py-2 pr-3 sm:px-3">
										<p class="text-xs text-muted-foreground">
											{item.role.pressure_kind === 'official'
												? 'Official pressure position'
												: 'Comparison position'}
										</p>
										<p class="break-words font-mono text-sm font-bold tabular-nums text-foreground">
											{formatRank(item.role.pressure_rank)}
										</p>
									</div>
									<div class="min-w-0 bg-card py-2 pr-3 sm:px-3">
										<p class="text-xs text-muted-foreground">Title status</p>
										<p class="break-words text-sm font-bold text-foreground">
											{roleStatus(item.role)}
										</p>
									</div>
								</div>
							</a>
						{/if}
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => removeFromWatchlist(item.entry)}
							class="shrink-0 text-muted-foreground"
							aria-label="Remove {itemTitle(item)} from saved jobs"
						>
							<svg
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</Button>
					</div>
				</article>
			{/each}
		</div>

		<div
			class="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
		>
			<p>{savedItems.length} saved {savedItems.length === 1 ? 'job' : 'jobs'} in V9.</p>
			{#if savedTimestamp}<p>Last changed on this device: {savedTimestamp}</p>{/if}
		</div>
	{/if}
</main>
