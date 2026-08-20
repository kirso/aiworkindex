<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { trackProductEvent } from '$lib/analytics';
	import * as Command from '$lib/components/ui/command/index.js';
	import { countryConfigs } from '$lib/data/country-config';
	import { cn } from '$lib/utils';

	type SearchIndex = {
		occupations: Array<{
			code: string;
			title: string;
			pressure_rank: number | null;
			synonyms: string[];
		}>;
		role_queries: Array<{
			slug: string;
			title: string;
			description: string;
			tags: string[];
			journey_kind:
				| 'exact_official_title'
				| 'reviewed_official_match'
				| 'composite_estimate'
				| 'mapping_withheld';
			official_ssoc2024: string | null;
			pressure_rank: number | null;
			pressure_kind: 'official' | 'estimated' | 'withheld';
			href: string;
			family_label: string;
			family_accent: string;
		}>;
	};

	let open = $state(false);
	let query = $state('');
	let loading = $state(false);
	let loaded = $state(false);
	let occupations = $state<
		Array<{
			code: string;
			title: string;
			rank: number | null;
			search: string;
		}>
	>([]);
	let roles = $state<
		Array<{
			slug: string;
			title: string;
			rank: number | null;
			pressureKind: 'official' | 'estimated' | 'withheld';
			journeyKind:
				| 'exact_official_title'
				| 'reviewed_official_match'
				| 'composite_estimate'
				| 'mapping_withheld';
			officialCode: string | null;
			href: string;
			familyLabel: string;
			familyAccent: string;
			search: string;
		}>
	>([]);
	let loadPromise: Promise<void> | null = null;

	function loadSearchIndex(): Promise<void> {
		if (loaded) return Promise.resolve();
		if (loadPromise) return loadPromise;
		loading = true;
		loadPromise = fetch('/data/v9-search-index.json?v=2026-08-19-v9-role-guides')
			.then(response => {
				if (!response.ok) throw new Error(`Search index returned ${response.status}`);
				return response.json() as Promise<SearchIndex>;
			})
			.then(searchIndex => {
				occupations = searchIndex.occupations.map(occupation => ({
					code: occupation.code,
					title: occupation.title,
					rank: occupation.pressure_rank,
					search: [occupation.title, occupation.code, ...occupation.synonyms]
						.join(' ')
						.toLowerCase()
				}));
				roles = (searchIndex.role_queries ?? []).map(role => ({
					slug: role.slug,
					title: role.title,
					rank: role.pressure_rank,
					pressureKind: role.pressure_kind,
					journeyKind: role.journey_kind,
					officialCode: role.official_ssoc2024,
					href: role.href,
					familyLabel: role.family_label,
					familyAccent: role.family_accent,
					search: [role.title, role.description, role.slug, ...role.tags].join(' ').toLowerCase()
				}));
				loaded = true;
			})
			.catch(() => {
				loaded = false;
			})
			.finally(() => {
				loading = false;
				loadPromise = null;
			});
		return loadPromise;
	}

	function openSearch() {
		open = true;
		void loadSearchIndex();
	}

	const pages = [
		{ href: '/', label: 'Find a job' },
		{ href: '/explore', label: 'Browse occupations' },
		{ href: '/roles', label: 'Modern roles' },
		{ href: '/rankings', label: 'Rankings' },
		{ href: '/compare', label: 'Compare evidence' },
		{ href: '/will-ai-take-my-job', label: 'AI job pressure checker' },
		{ href: '/reports', label: 'Reports' },
		{ href: '/research', label: 'Research' },
		{ href: '/methodology', label: 'Methodology' },
		{ href: '/data', label: 'Data downloads' },
		{ href: '/about', label: 'About' }
	];

	const markets = [countryConfigs.sg, countryConfigs.us, countryConfigs.global];

	let roleResults = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return [];
		return roles
			.filter(role => role.search.includes(needle))
			.sort((a, b) => {
				const aStarts = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
				const bStarts = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
				return aStarts - bStarts || a.title.localeCompare(b.title);
			})
			.slice(0, 5);
	});

	let occupationResults = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return [];
		const roleCodes = new Set(
			roleResults.flatMap(role => (role.officialCode ? [role.officialCode] : []))
		);
		return occupations
			.filter(occupation => occupation.search.includes(needle) && !roleCodes.has(occupation.code))
			.sort((a, b) => {
				const aStarts = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
				const bStarts = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
				return aStarts - bStarts || a.title.localeCompare(b.title);
			})
			.slice(0, 8);
	});

	function roleRankLabel(role: (typeof roles)[number]): string {
		if (role.rank == null)
			return role.journeyKind === 'mapping_withheld' ? 'Needs context' : 'Not ranked';
		return `${role.pressureKind === 'estimated' ? 'Est. ' : ''}${role.rank.toFixed(1)}`;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
			event.preventDefault();
			open = !open;
			if (open) void loadSearchIndex();
		}
	}

	function navigate(href: string) {
		open = false;
		query = '';
		goto(href);
	}

	function navigateToSearchResult(href: string, entityKind: 'occupation' | 'role') {
		trackProductEvent('job_search_selected', {
			entity_kind: entityKind,
			context: 'navigation'
		});
		navigate(href);
	}

	let hideHeaderSearch = $derived(page.url.pathname === '/');
</script>

<svelte:document onkeydown={handleKeydown} />

<button
	class={cn(
		'items-center gap-2 rounded-none border border-header-active-bg bg-header-active-bg/30 px-3 py-1.5 text-xs text-header-muted transition-colors hover:bg-header-active-bg hover:text-header-text',
		hideHeaderSearch ? 'hidden' : 'hidden sm:flex'
	)}
	onclick={openSearch}
>
	<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
	</svg>
	<span>Search</span>
	<kbd
		class="ml-2 rounded border border-header-active-bg bg-header-bg px-1.5 py-0.5 font-mono text-xs text-header-muted"
		>⌘K</kbd
	>
</button>

<button
	class={cn(
		'items-center justify-center rounded-none p-1.5 text-header-muted transition-colors hover:bg-header-active-bg hover:text-header-text',
		hideHeaderSearch ? 'hidden' : 'flex sm:hidden'
	)}
	onclick={openSearch}
	aria-label="Search occupations and pages"
>
	<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
	</svg>
</button>

<Command.Dialog
	bind:open
	shouldFilter={false}
	title="Search occupations and pages"
	description="Find an occupation, a familiar job title, or a site page."
>
	<Command.Input
		placeholder="Search occupations, roles or pages…"
		aria-label="Search occupations, roles or pages"
		bind:value={query}
	/>
	<Command.List>
		<Command.Empty>
			<div class="py-4 text-center">
				<p class="text-sm text-muted-foreground">
					{loading ? 'Loading occupation search…' : `No results for “${query}”`}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Try nurse, accountant, driver or developer.
				</p>
			</div>
		</Command.Empty>

		{#if !query.trim()}
			<Command.Group heading="Go to">
				{#each pages as item (item.href)}
					<Command.Item onSelect={() => navigate(item.href)}>
						<svg
							class="mr-2 h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg
						>
						{item.label}
					</Command.Item>
				{/each}
			</Command.Group>
			<Command.Group heading="Markets">
				{#each markets as market (market.code)}
					<Command.Item onSelect={() => navigate(market.routePrefix)}>
						<svg
							class="mr-2 h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							><circle cx="12" cy="12" r="9" /><path
								d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
							/></svg
						>
						{market.name}{market.code === 'us'
							? ' Preview'
							: market.code === 'global'
								? ' research'
								: ''}
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}

		{#if roleResults.length > 0}
			<Command.Group heading="Familiar job titles">
				{#each roleResults as role (role.slug)}
					<Command.Item
						value="role-{role.slug}"
						onSelect={() =>
							navigateToSearchResult(
								role.href,
								role.journeyKind === 'exact_official_title' ? 'occupation' : 'role'
							)}
					>
						<div class="flex w-full min-w-0 items-center justify-between gap-3">
							<div class="flex min-w-0 items-center gap-2">
								<span class="h-2.5 w-2.5 shrink-0 rounded-full" style:background={role.familyAccent}
								></span>
								<div class="min-w-0">
									<span class="block truncate">{role.title}</span>
									<span class="block truncate text-xs text-muted-foreground">
										{role.journeyKind === 'exact_official_title'
											? `Official SSOC title · ${role.officialCode} · ${role.familyLabel}`
											: role.journeyKind === 'reviewed_official_match'
												? `Familiar-title guide · SSOC ${role.officialCode} · ${role.familyLabel}`
												: role.journeyKind === 'composite_estimate'
													? `Reviewed composite · ${role.familyLabel}`
													: `Choose a work context · ${role.familyLabel}`}
									</span>
								</div>
							</div>
							<span class="shrink-0 font-mono text-xs text-muted-foreground">
								{roleRankLabel(role)}
							</span>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}

		{#if occupationResults.length > 0}
			<Command.Group heading="SSOC 2024 occupations">
				{#each occupationResults as occupation (occupation.code)}
					<Command.Item
						value="occupation-{occupation.code}"
						onSelect={() => navigateToSearchResult(`/occupation/${occupation.code}`, 'occupation')}
					>
						<div class="flex w-full min-w-0 items-center justify-between gap-3">
							<div class="min-w-0">
								<span class="block truncate">{occupation.title}</span>
								<span class="font-mono text-xs text-muted-foreground">SSOC {occupation.code}</span>
							</div>
							<span class="shrink-0 font-mono text-xs font-bold tabular-nums"
								>{occupation.rank == null ? 'Not ranked' : occupation.rank.toFixed(1)}</span
							>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
