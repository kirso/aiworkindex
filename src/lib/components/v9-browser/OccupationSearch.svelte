<script lang="ts">
	type SearchItem = {
		code: string;
		title: string;
		synonyms: string[];
		query_aliases: string[];
		pressure_rank: number | null;
		official_category: string;
	};
	type SearchPayload = {
		occupations: Array<Omit<SearchItem, 'query_aliases'>>;
		official_role_aliases?: Array<{
			title: string;
			official_ssoc2024: string;
		}>;
	};

	let { label = 'Search by occupation title or SSOC code' }: { label?: string } = $props();

	let query = $state('');
	let items = $state<SearchItem[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let loadPromise: Promise<void> | null = null;

	function loadItems(): Promise<void> {
		if (loaded) return Promise.resolve();
		if (loadPromise) return loadPromise;
		loading = true;
		loadPromise = fetch('/data/v9-search-index.json?v=2026-08-19-v9')
			.then(response => {
				if (!response.ok) throw new Error(`Search index returned ${response.status}`);
				return response.json() as Promise<SearchPayload>;
			})
			.then(data => {
				const aliasesByCode = new Map<string, string[]>();
				for (const alias of data.official_role_aliases ?? []) {
					const aliases = aliasesByCode.get(alias.official_ssoc2024) ?? [];
					aliases.push(alias.title);
					aliasesByCode.set(alias.official_ssoc2024, aliases);
				}
				items = data.occupations.map(occupation => ({
					...occupation,
					query_aliases: aliasesByCode.get(occupation.code) ?? []
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
	let matches = $derived.by(() => {
		const normalized = query.trim().toLowerCase();
		if (normalized.length < 2) return [];
		return items
			.filter(item => {
				if (item.code.includes(normalized) || item.title.toLowerCase().includes(normalized)) {
					return true;
				}
				return [...item.synonyms, ...item.query_aliases].some(synonym =>
					synonym.toLowerCase().includes(normalized)
				);
			})
			.slice(0, 8);
	});

	function matchingAlias(item: SearchItem): string | null {
		const needle = query.trim().toLowerCase();
		return item.query_aliases.find(alias => alias.toLowerCase().includes(needle)) ?? null;
	}
</script>

<div class="relative mx-auto w-full max-w-2xl text-left">
	<label for="occupation-search" class="sr-only">{label}</label>
	<input
		id="occupation-search"
		type="search"
		bind:value={query}
		onfocus={() => void loadItems()}
		placeholder={label}
		autocomplete="off"
		class="w-full min-w-0 border border-foreground bg-card px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
	/>

	{#if query.trim().length >= 2}
		<div
			class="absolute inset-x-0 z-20 mt-1 max-h-80 overflow-y-auto border border-border bg-card shadow-lg"
		>
			{#if loading}
				<p class="px-4 py-3 text-sm text-muted-foreground">Loading occupation search…</p>
			{:else if matches.length === 0}
				<p class="px-4 py-3 text-sm text-muted-foreground">No matching SSOC 2024 occupation.</p>
			{:else}
				{#each matches as item (item.code)}
					<a
						href="/occupation/{item.code}"
						class="block min-w-0 border-b border-border px-4 py-3 no-underline last:border-b-0 hover:bg-accent"
					>
						<span class="block break-words text-sm font-semibold text-foreground">{item.title}</span
						>
						<span class="mt-0.5 block text-xs text-muted-foreground">
							{matchingAlias(item) ? `Modern title “${matchingAlias(item)}” · ` : ''}SSOC {item.code}
							· {item.official_category}
						</span>
					</a>
				{/each}
			{/if}
		</div>
	{/if}
</div>
