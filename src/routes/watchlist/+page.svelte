<script lang="ts">
	import { browser } from '$app/environment';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { card, pageLayout, sectionLabel, title } from '$lib/design-system';
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
		pressure_rank: number | null;
	};
	type RoleSearchEntry = {
		slug: string;
		title: string;
		description: string;
		estimated_pressure_percentile: number | null;
	};
	type OfficialRoleAlias = { slug: string; official_ssoc2024: string };
	type SearchIndex = {
		occupations: OccupationSearchEntry[];
		roles: RoleSearchEntry[];
		official_role_aliases?: OfficialRoleAlias[];
	};
	type SavedItem =
		| { kind: 'occupation'; entry: WatchlistEntry; occupation: OccupationSearchEntry }
		| { kind: 'role'; entry: WatchlistEntry; role: RoleSearchEntry };

	let occupationsByCode = $state(new Map<string, OccupationSearchEntry>());
	let rolesBySlug = $state(new Map<string, RoleSearchEntry>());
	let officialRoleAliasesBySlug = $state(new Map<string, OfficialRoleAlias>());

	let savedEntries = $state<WatchlistEntry[]>([]);
	let savedTimestamp = $state<string | null>(null);
	let savedItems = $derived<SavedItem[]>(
		savedEntries
			.map(entry => {
				if (entry.kind === 'occupation') {
					const occupation = occupationsByCode.get(entry.id);
					return occupation ? { kind: 'occupation' as const, entry, occupation } : null;
				}
				const role = rolesBySlug.get(entry.id);
				if (role) return { kind: 'role' as const, entry, role };
				const alias = officialRoleAliasesBySlug.get(entry.id);
				const occupation = alias ? occupationsByCode.get(alias.official_ssoc2024) : undefined;
				return occupation ? { kind: 'occupation' as const, entry, occupation } : null;
			})
			.filter((item): item is SavedItem => item !== null)
	);
	let unavailableCount = $derived(savedEntries.length - savedItems.length);

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
			rolesBySlug = new Map(index.roles.map(role => [role.slug, role]));
			officialRoleAliasesBySlug = new Map(
				(index.official_role_aliases ?? []).map(alias => [alias.slug, alias])
			);
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
	}

	function clearAll() {
		persist([]);
	}

	function formatRank(value: number | null): string {
		return value == null ? 'Not ranked' : `Percentile ${value.toFixed(1)}`;
	}

	function itemTitle(item: SavedItem): string {
		return item.kind === 'occupation' ? item.occupation.title : item.role.title;
	}
</script>

<Seo
	title="Watchlist"
	description="Your locally saved V9 Singapore occupations and non-official modern-role queries."
	path="/watchlist"
	noindex={true}
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Watchlist' }]} />

	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="max-w-3xl">
			<p class={sectionLabel()}>Stored on this device</p>
			<h1 class={title({ size: 'page' })}>Your watchlist</h1>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Saved occupations and roles stay in your browser. V9 keeps official SSOC 2024 occupations
				and non-official modern-role estimates visibly separate.
			</p>
		</div>
		{#if savedEntries.length > 0}
			<Button variant="outline" size="sm" onclick={clearAll}>Clear all</Button>
		{/if}
	</div>

	{#if unavailableCount > 0}
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-5')}>
			<p class="text-sm font-bold text-foreground">
				{unavailableCount} saved {unavailableCount === 1 ? 'item is' : 'items are'} not in V9
			</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				V9 moved Singapore occupations to SSOC 2024 and did not carry old codes forward as if they
				were equivalent. These unmatched entries remain in local storage until you clear them.
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
				Browse an occupation or modern role, then use its bookmark control to save it here.
			</p>
			<div class="mt-4 flex flex-wrap justify-center gap-3">
				<Button href="/explore">Browse occupations</Button>
				<Button variant="outline" href="/roles">Browse modern roles</Button>
				<Button variant="outline" href="/rankings">View rankings</Button>
			</div>
		</div>
	{:else}
		<p class={cn(sectionLabel(), 'mt-7 mb-3')}>Saved jobs</p>
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
										<p class="text-xs text-muted-foreground">AI Work Pressure Rank</p>
										<p class="break-words font-mono text-sm font-bold tabular-nums text-foreground">
											{formatRank(item.occupation.pressure_rank)}
										</p>
									</div>
									<div class="min-w-0 bg-card py-2 pr-3 sm:px-3">
										<p class="text-xs text-muted-foreground">Full evidence record</p>
										<p class="break-words text-sm font-bold text-foreground">
											Open occupation page
										</p>
									</div>
								</div>
							</a>
						{:else}
							<a href="/role/{item.role.slug}" class="min-w-0 flex-1 no-underline">
								<div class="flex min-w-0 flex-wrap items-center gap-2">
									<h2 class="break-words text-sm font-bold text-foreground hover:text-primary">
										{item.role.title}
									</h2>
									<Badge variant="outline" class="shrink-0 text-xs">Non-official estimate</Badge>
								</div>
								<p class="mt-1 text-xs text-muted-foreground">
									{item.role.description}
								</p>
								<div class="mt-3 grid gap-px bg-border sm:grid-cols-2">
									<div class="min-w-0 bg-card py-2 pr-3 sm:px-3">
										<p class="text-xs text-muted-foreground">Estimated pressure rank</p>
										<p class="break-words font-mono text-sm font-bold tabular-nums text-foreground">
											{formatRank(item.role.estimated_pressure_percentile)}
										</p>
									</div>
									<div class="min-w-0 bg-card py-2 pr-3 sm:px-3">
										<p class="text-xs text-muted-foreground">Full component evidence</p>
										<p class="break-words text-sm font-bold text-foreground">Open role page</p>
									</div>
								</div>
							</a>
						{/if}
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => removeFromWatchlist(item.entry)}
							class="shrink-0 text-muted-foreground"
							aria-label="Remove {itemTitle(item)} from watchlist"
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
