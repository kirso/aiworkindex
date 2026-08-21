<script lang="ts">
	import { goto } from '$app/navigation';
	import { trackProductEvent } from '$lib/analytics';
	import { v9DestinationEntityKind, v9RoleDestination } from '$lib/data/v9-destination';

	type OccupationItem = {
		code: string;
		title: string;
		synonyms: string[];
		pressure_rank: number | null;
		official_category: string;
	};

	type RoleQueryItem = {
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
		family_label: string;
	};

	type SearchPayload = {
		occupations: OccupationItem[];
		role_queries: RoleQueryItem[];
	};

	type SearchResult =
		| { kind: 'role'; key: string; role: RoleQueryItem }
		| { kind: 'occupation'; key: string; occupation: OccupationItem };

	let { label = 'Search your job title or SSOC code' }: { label?: string } = $props();

	let query = $state('');
	let occupations = $state<OccupationItem[]>([]);
	let roleQueries = $state<RoleQueryItem[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let selectedIndex = $state(-1);
	let loadPromise: Promise<void> | null = null;

	function loadItems(): Promise<void> {
		if (loaded) return Promise.resolve();
		if (loadPromise) return loadPromise;
		loading = true;
		loadPromise = fetch('/data/v9-search-index.json?v=2026-08-19-v9-role-guides')
			.then(response => {
				if (!response.ok) throw new Error(`Search index returned ${response.status}`);
				return response.json() as Promise<SearchPayload>;
			})
			.then(data => {
				occupations = data.occupations;
				roleQueries = data.role_queries ?? [];
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

	let matches = $derived.by((): SearchResult[] => {
		const needle = query.trim().toLowerCase();
		if (needle.length < 2) return [];

		const matchingRoles = roleQueries
			.filter(role =>
				[role.title, role.slug, role.description, ...role.tags]
					.join(' ')
					.toLowerCase()
					.includes(needle)
			)
			.sort((a, b) => {
				const aExact = a.title.toLowerCase() === needle ? 0 : 1;
				const bExact = b.title.toLowerCase() === needle ? 0 : 1;
				const aStarts = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
				const bStarts = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
				return aExact - bExact || aStarts - bStarts || a.title.localeCompare(b.title);
			})
			.slice(0, 5);
		const matchedCodes = new Set(
			matchingRoles.flatMap(role => (role.official_ssoc2024 ? [role.official_ssoc2024] : []))
		);
		const matchingOccupations = occupations
			.filter(occupation => {
				if (matchedCodes.has(occupation.code)) return false;
				return [occupation.title, occupation.code, ...occupation.synonyms]
					.join(' ')
					.toLowerCase()
					.includes(needle);
			})
			.sort((a, b) => {
				const aStarts = a.title.toLowerCase().startsWith(needle) ? 0 : 1;
				const bStarts = b.title.toLowerCase().startsWith(needle) ? 0 : 1;
				return aStarts - bStarts || a.title.localeCompare(b.title);
			})
			.slice(0, Math.max(0, 8 - matchingRoles.length));

		return [
			...matchingRoles.map(
				(role): SearchResult => ({ kind: 'role', key: `role:${role.slug}`, role })
			),
			...matchingOccupations.map(
				(occupation): SearchResult => ({
					kind: 'occupation',
					key: `occupation:${occupation.code}`,
					occupation
				})
			)
		];
	});

	function roleMeta(role: RoleQueryItem): string {
		switch (role.journey_kind) {
			case 'exact_official_title':
				return `Official SSOC title · SSOC ${role.official_ssoc2024}`;
			case 'reviewed_official_match':
				return `Familiar-title guide · official SSOC ${role.official_ssoc2024}`;
			case 'composite_estimate':
				return 'Reviewed cross-occupation estimate';
			case 'mapping_withheld':
				return 'Choose a sector and task profile';
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			query = '';
			selectedIndex = -1;
			return;
		}
		if (matches.length === 0) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, matches.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (event.key === 'Enter' && selectedIndex >= 0) {
			const result = matches[selectedIndex];
			if (!result) return;
			event.preventDefault();
			if (result.kind === 'role') {
				trackRoleSelection(result.role);
				void goto(v9RoleDestination(result.role));
			} else {
				trackProductEvent('job_search_selected', {
					entity_kind: 'occupation',
					context: 'home'
				});
				void goto(`/occupation/${result.occupation.code}`);
			}
		}
	}

	function trackRoleSelection(role: RoleQueryItem): void {
		trackProductEvent('job_search_selected', {
			entity_kind: v9DestinationEntityKind(role),
			context: 'home'
		});
	}
</script>

<div class="relative mx-auto w-full max-w-2xl text-left">
	<label for="occupation-search" class="sr-only">{label}</label>
	<input
		id="occupation-search"
		type="search"
		role="combobox"
		aria-autocomplete="list"
		aria-expanded={query.trim().length >= 2}
		aria-controls="occupation-search-results"
		aria-activedescendant={selectedIndex >= 0
			? `occupation-search-option-${selectedIndex}`
			: undefined}
		value={query}
		oninput={event => {
			query = event.currentTarget.value;
			selectedIndex = -1;
		}}
		onfocus={() => void loadItems()}
		onkeydown={handleKeydown}
		placeholder={label}
		autocomplete="off"
		class="min-h-13 w-full min-w-0 border border-foreground bg-card px-4 py-3 text-base text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
	/>

	{#if query.trim().length >= 2}
		<div
			id="occupation-search-results"
			role="listbox"
			aria-label="Matching jobs"
			class="absolute inset-x-0 z-20 mt-2 max-h-96 overflow-y-auto border border-border bg-popover shadow-lg"
		>
			{#if loading}
				<p class="px-4 py-3 text-sm text-muted-foreground">Loading job-title search…</p>
			{:else if matches.length === 0}
				<div class="px-4 py-3">
					<p class="text-sm text-muted-foreground">No matches. Try a shorter title.</p>
					<a
						class="mt-1 inline-block text-xs font-medium text-primary hover:underline"
						href="/roles">Browse familiar titles</a
					>
				</div>
			{:else}
				{#each matches as result, index (result.key)}
					{#if result.kind === 'role'}
						<a
							id="occupation-search-option-{index}"
							href={v9RoleDestination(result.role)}
							role="option"
							aria-selected={index === selectedIndex}
							onclick={() => trackRoleSelection(result.role)}
							class="block min-h-11 min-w-0 border-b border-border px-4 py-3 no-underline last:border-b-0 {index ===
							selectedIndex
								? 'bg-accent'
								: 'hover:bg-accent'}"
						>
							<span class="block break-words text-sm font-semibold text-foreground">
								{result.role.title}
							</span>
							<span class="mt-0.5 block text-xs text-muted-foreground">
								{roleMeta(result.role)} · {result.role.family_label}{result.role.pressure_rank ==
								null
									? ''
									: ` · ${result.role.pressure_kind === 'estimated' ? 'Est. ' : ''}${result.role.pressure_rank.toFixed(1)}`}
							</span>
						</a>
					{:else}
						<a
							id="occupation-search-option-{index}"
							href="/occupation/{result.occupation.code}"
							role="option"
							aria-selected={index === selectedIndex}
							onclick={() =>
								trackProductEvent('job_search_selected', {
									entity_kind: 'occupation',
									context: 'home'
								})}
							class="block min-h-11 min-w-0 border-b border-border px-4 py-3 no-underline last:border-b-0 {index ===
							selectedIndex
								? 'bg-accent'
								: 'hover:bg-accent'}"
						>
							<span class="block break-words text-sm font-semibold text-foreground">
								{result.occupation.title}
							</span>
							<span class="mt-0.5 block text-xs text-muted-foreground">
								Official occupation · SSOC {result.occupation.code}{result.occupation
									.pressure_rank == null
									? ' · Not ranked'
									: ` · ${result.occupation.pressure_rank.toFixed(1)}`}
							</span>
						</a>
					{/if}
				{/each}
			{/if}
		</div>
	{/if}
</div>
