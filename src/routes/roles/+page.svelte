<script lang="ts">
	import { impactTypeLabels, riskBandLabels, majorGroups } from '$lib/data';
	import type { Occupation } from '$lib/data';
	import type { ScoredRole } from '$lib/data/synthetic-roles';
	import { roleCategoryMap } from '$lib/data/role-taxonomy';
	import type { RoleCategory } from '$lib/data/role-taxonomy';
	import { titleMatches } from '$lib/utils/search';
	import { findAliasMatches } from '$lib/data/aliases';
	import {
		card,
		riskBadge,
		impactBadge,
		riskColorScale,
		pageLayout,
		title as titleStyle,
		caption,
		pill,
		chip,
		formInput,
		sectionLabel,
		body
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	// --- State ---
	let searchQuery = $state('');
	let occGroupFilter = $state<string | null>(null);
	let occSortKey = $state<'title' | 'net_risk' | 'exposure' | 'bottleneck' | 'wage'>('net_risk');
	let occSortDir = $state<'asc' | 'desc'>('desc');
	let occViewMode = $state<'cards' | 'table'>('cards');

	// --- Counts ---
	let occCount = $derived((data.occupations as Occupation[]).length);
	let roleCount = $derived((data.scoredRoles as ScoredRole[]).length);
	let totalCount = $derived(occCount + roleCount);

	// --- Search (alias-aware) ---
	let isSearching = $derived(searchQuery.trim().length >= 2);

	let searchFilteredRoles = $derived.by((): ScoredRole[] => {
		if (!isSearching) return data.scoredRoles as ScoredRole[];
		const q = searchQuery.trim().toLowerCase();
		return (data.scoredRoles as ScoredRole[]).filter(
			r => titleMatches(r.title, q) || titleMatches(r.description, q) || r.slug.includes(q)
		);
	});

	let searchFilteredOccupations = $derived.by((): Occupation[] => {
		const allOccs = data.occupations as Occupation[];
		if (!isSearching) return allOccs;
		const q = searchQuery.trim().toLowerCase();

		// Alias matches first (highest relevance)
		const aliasHits = findAliasMatches(q);
		const aliasSsocs = new Set(aliasHits.flatMap(m => m.ssocs));
		const aliasOccs = aliasSsocs.size > 0 ? allOccs.filter(o => aliasSsocs.has(o.ssoc)) : [];

		// Direct title/SSOC matches
		const aliasSet = new Set(aliasOccs.map(o => o.ssoc));
		const titleOccs = allOccs.filter(
			o => !aliasSet.has(o.ssoc) && (titleMatches(o.title, q) || o.ssoc.includes(q))
		);

		return [...aliasOccs, ...titleOccs];
	});

	// --- Role grouping by category ---
	let rolesByCategory = $derived.by(() => {
		const cats = data.roleCategories as RoleCategory[];
		const roles = searchFilteredRoles;
		const groups: Array<{ category: RoleCategory; roles: ScoredRole[] }> = [];
		for (const cat of cats) {
			const catRoles = roles.filter(r => roleCategoryMap[r.slug]?.category === cat.key);
			if (catRoles.length > 0) {
				groups.push({ category: cat, roles: catRoles });
			}
		}
		return groups;
	});

	// --- Occupation group pills ---
	type GroupPill = { key: string; label: string; count: number };

	let occGroupPills = $derived.by((): GroupPill[] => {
		const occs = searchFilteredOccupations;
		return majorGroups
			.map(g => ({
				key: g.key,
				label: g.label.charAt(0) + g.label.slice(1).toLowerCase(),
				count: occs.filter(o => {
					const gk = majorGroups.find(mg => mg.label === o.major_group)?.key ?? 'other';
					return gk === g.key;
				}).length
			}))
			.filter(g => g.count > 0);
	});

	// --- Filtered + sorted occupations ---
	let filteredOccupations = $derived.by(() => {
		let items = searchFilteredOccupations;

		if (occGroupFilter) {
			items = items.filter(o => {
				const gk = majorGroups.find(g => g.label === o.major_group)?.key ?? 'other';
				return gk === occGroupFilter;
			});
		}

		const dir = occSortDir === 'desc' ? -1 : 1;
		items = [...items].sort((a, b) => {
			if (occSortKey === 'title') return dir * a.title.localeCompare(b.title);
			if (occSortKey === 'wage')
				return dir * ((a.gross_wage_median ?? 0) - (b.gross_wage_median ?? 0));
			const aVal = a[occSortKey] as number;
			const bVal = b[occSortKey] as number;
			return dir * (aVal - bVal);
		});

		return items;
	});

	let filteredOccCount = $derived(filteredOccupations.length);

	// --- Sort handler ---
	function toggleSort(key: typeof occSortKey) {
		if (occSortKey === key) {
			occSortDir = occSortDir === 'desc' ? 'asc' : 'desc';
		} else {
			occSortKey = key;
			occSortDir = key === 'title' ? 'asc' : 'desc';
		}
	}

	function sortIndicator(key: typeof occSortKey): string {
		if (occSortKey !== key) return '';
		return occSortDir === 'desc' ? ' \u2193' : ' \u2191';
	}

	// --- Search result count ---
	let searchResultCount = $derived(searchFilteredRoles.length + searchFilteredOccupations.length);

	// --- SEO ---
	let pageTitle = $derived(`All Jobs & Roles \u2014 Structural AI Risk | ${SITE.name}`);
	let pageDescription = $derived(
		`Browse ${occCount} official occupations and ${roleCount} modern roles scored for AI displacement risk. Search, filter, and sort by risk, exposure, or wage in the current live reference market, or open the global baseline first.`
	);

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'AI Work Index Jobs & Roles',
			description: `${totalCount} occupations and modern roles scored for structural AI pressure in the current live reference market`,
			numberOfItems: totalCount,
			itemListElement: [
				...(data.scoredRoles as ScoredRole[]).slice(0, 5).map((r, i) => ({
					'@type': 'ListItem',
					position: i + 1,
					name: r.title,
					url: SITE.url + `/role/${r.slug}`
				})),
				...(data.occupations as Occupation[]).slice(0, 5).map((o, i) => ({
					'@type': 'ListItem',
					position: i + 6,
					name: o.title,
					url: SITE.url + `/occupation/${o.ssoc}`
				}))
			]
		})}<\/script>`
	);
</script>

<Seo title={pageTitle} description={pageDescription} path="/roles" />

{@html itemListJsonLd}

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'All Jobs & Roles' }]} />

	<div class="mb-6">
		<h1 class={titleStyle({ size: 'page' })}>All Jobs & Roles</h1>
		<p class={cn(caption(), 'mt-1')}>
			{occCount} official occupations and {roleCount} modern roles, all scored for AI displacement risk. Open the global baseline first, then drill into the current live reference market.
		</p>
	</div>

	<!-- Search bar -->
	<div class="mb-6">
		<div class="relative">
			<svg
				class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<input
				type="text"
				placeholder="Search by job title, SSOC code, or alias (e.g. 'product manager')..."
				bind:value={searchQuery}
				aria-label="Search jobs and roles"
				class={cn(formInput(), 'pl-9')}
			/>
		</div>
		{#if isSearching}
			<p class="mt-2 text-xs text-muted-foreground">
				{searchResultCount} results for "{searchQuery.trim()}"
				<button class="ml-1 text-primary hover:underline" onclick={() => (searchQuery = '')}>
					Clear
				</button>
			</p>
		{/if}
	</div>

	<!-- ======================== -->
	<!-- MODERN ROLES SECTION     -->
	<!-- ======================== -->
	<section class="mb-10">
		<div class="mb-4 flex items-baseline justify-between gap-4">
			<div>
				<h2 class={titleStyle({ size: 'section' })}>Modern Roles</h2>
				<p class={cn(body({ tone: 'muted', size: 'sm' }), 'mt-0.5')}>
					{roleCount} estimated roles scored as weighted blends of official occupations
				</p>
			</div>
			{#if isSearching}
				<p class="text-xs text-muted-foreground shrink-0">
					{searchFilteredRoles.length} of {roleCount}
				</p>
			{/if}
		</div>

		{#if rolesByCategory.length === 0}
			<div class={cn(card({ padding: 'md', variant: 'subtle' }), 'text-center')}>
				<p class="text-sm text-muted-foreground">No roles match your search.</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each rolesByCategory as group (group.category.key)}
					<div>
						<div class="mb-2">
							<h3 class={sectionLabel()}>
								{group.category.label}
							</h3>
							<p class="text-xs text-muted-foreground">{group.category.description}</p>
						</div>
						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
							{#each group.roles as role (role.slug)}
								<a
									href="/role/{role.slug}"
									class={cn(card({ padding: 'sm', hover: true }), 'group block')}
								>
									<div class="flex items-start justify-between gap-2 mb-1.5">
										<h4
											class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight"
										>
											{role.title}
										</h4>
										<span class={cn(riskBadge({ band: role.risk_band }), 'shrink-0 text-xs')}>
											{(role.net_risk * 100).toFixed(0)}%
										</span>
									</div>
									<p class="text-xs text-muted-foreground line-clamp-2 mb-2">
										{role.description}
									</p>
									<div class="flex items-center gap-1.5 flex-wrap">
										<span
											class={cn(impactBadge({ type: role.impact_type }), 'text-xs px-1.5 py-0')}
										>
											{impactTypeLabels[role.impact_type]}
										</span>
										<span class={pill({ size: 'sm', tone: 'warning' })}> Estimated </span>
										<span class="ml-auto text-xs text-muted-foreground">
											{role.components.length} parts
										</span>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Divider + cross-link -->
	<div class="mb-8 flex items-center gap-4">
		<div class="h-px flex-1 bg-border"></div>
		<a href="/explore" class="text-xs text-primary hover:underline underline-offset-2 shrink-0">
			Want to filter the full dataset? Use Explore &rarr;
		</a>
		<div class="h-px flex-1 bg-border"></div>
	</div>

	<!-- ======================== -->
	<!-- OFFICIAL OCCUPATIONS     -->
	<!-- ======================== -->
	<section>
		<div class="mb-4 flex items-baseline justify-between gap-4 flex-wrap">
			<div>
				<h2 class={titleStyle({ size: 'section' })}>Official Occupations</h2>
				<p class={cn(body({ tone: 'muted', size: 'sm' }), 'mt-0.5')}>
					{occCount} occupations from the current live occupation set, with SSOC as the Singapore reference classification
				</p>
			</div>
			<div class="flex items-center gap-2">
				<p class="text-xs text-muted-foreground shrink-0">
					{filteredOccCount} of {searchFilteredOccupations.length}
				</p>
				<div class="flex items-center rounded-md border border-border">
					<button
						class="px-2 py-1 text-xs {occViewMode === 'cards'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'} rounded-l-md transition-colors"
						onclick={() => (occViewMode = 'cards')}
						title="Card view"
						aria-label="Card view"
						aria-pressed={occViewMode === 'cards'}
					>
						<svg
							class="h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
							<rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
						</svg>
					</button>
					<button
						class="px-2 py-1 text-xs {occViewMode === 'table'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'} rounded-r-md transition-colors"
						onclick={() => (occViewMode = 'table')}
						title="Table view"
						aria-label="Table view"
						aria-pressed={occViewMode === 'table'}
					>
						<svg
							class="h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 6h18M3 12h18M3 18h18" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<!-- Occupation group filter pills -->
		{#if occGroupPills.length > 1}
			<div class="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Filter by occupation group">
				<button
					class={chip({ active: occGroupFilter === null })}
					onclick={() => (occGroupFilter = null)}
					aria-pressed={occGroupFilter === null}
				>
					All groups
				</button>
				{#each occGroupPills as gp (gp.key)}
					<button
						class={chip({ active: occGroupFilter === gp.key })}
						onclick={() => (occGroupFilter = occGroupFilter === gp.key ? null : gp.key)}
						aria-pressed={occGroupFilter === gp.key}
					>
						{gp.label}
						<span class="ml-0.5 opacity-60">{gp.count}</span>
					</button>
				{/each}
			</div>
		{/if}

		{#if occViewMode === 'table'}
			<!-- Sortable table -->
			<div class={card({ padding: 'none' })}>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b text-left text-xs text-muted-foreground">
								<th scope="col" class="w-8 px-3 py-2.5 font-medium">#</th>
								<th scope="col" class="px-3 py-2.5 font-medium">
									<button
										class="hover:text-foreground transition-colors"
										onclick={() => toggleSort('title')}
									>
										Occupation{sortIndicator('title')}
									</button>
								</th>
								<th scope="col" class="px-3 py-2.5 font-medium text-right whitespace-nowrap">
									<button
										class="hover:text-foreground transition-colors"
										onclick={() => toggleSort('net_risk')}
									>
										Net Risk{sortIndicator('net_risk')}
									</button>
								</th>
								<th scope="col" class="px-3 py-2.5 font-medium text-right whitespace-nowrap">
									<button
										class="hover:text-foreground transition-colors"
										onclick={() => toggleSort('exposure')}
									>
										Exposure{sortIndicator('exposure')}
									</button>
								</th>
								<th scope="col" class="px-3 py-2.5 font-medium text-right whitespace-nowrap">
									<button
										class="hover:text-foreground transition-colors"
										onclick={() => toggleSort('bottleneck')}
									>
										Bottleneck{sortIndicator('bottleneck')}
									</button>
								</th>
								<th scope="col" class="px-3 py-2.5 font-medium text-right whitespace-nowrap">
									<button
										class="hover:text-foreground transition-colors"
										onclick={() => toggleSort('wage')}
									>
										Wage{sortIndicator('wage')}
									</button>
								</th>
								<th scope="col" class="px-3 py-2.5 font-medium">Risk</th>
								<th scope="col" class="px-3 py-2.5 font-medium">Impact</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredOccupations as occ, i (occ.ssoc)}
								<tr
									class="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors"
								>
									<td
										class="px-3 py-2 font-mono tabular-nums text-muted-foreground text-xs relative"
									>
										<span
											class="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
											style="background-color: {riskColorScale(occ.net_risk)}"
											aria-hidden="true"
										></span>
										{i + 1}
									</td>
									<td class="px-3 py-2">
										<a
											href="/occupation/{occ.ssoc}"
											class="text-xs text-foreground hover:text-primary hover:underline underline-offset-2 decoration-primary/30 font-medium"
										>
											{occ.title}
										</a>
										<span class="ml-1 text-xs text-text-tertiary font-mono tabular-nums"
											>{occ.ssoc}</span
										>
									</td>
									<td
										class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary"
									>
										{(occ.net_risk * 100).toFixed(0)}%
									</td>
									<td
										class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary"
									>
										{(occ.exposure * 100).toFixed(0)}%
									</td>
									<td
										class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary"
									>
										{(occ.bottleneck * 100).toFixed(0)}%
									</td>
									<td
										class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary"
									>
										{occ.gross_wage_median
											? `SGD ${occ.gross_wage_median.toLocaleString()}`
											: '\u2014'}
									</td>
									<td class="px-3 py-2">
										<span class="inline-flex items-center gap-1.5 whitespace-nowrap">
											<span
												class="inline-block h-2 w-2 rounded-full"
												style="background-color: {riskColorScale(occ.net_risk)}"
											></span>
											<span class="text-xs text-text-secondary"
												>{riskBandLabels[occ.risk_band]}</span
											>
										</span>
									</td>
									<td class="px-3 py-2">
										<span class={cn(impactBadge({ type: occ.impact_type }), 'text-xs px-1.5 py-0')}>
											{impactTypeLabels[occ.impact_type]}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else}
			<!-- Card grid -->
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredOccupations as occ (occ.ssoc)}
					<a
						href="/occupation/{occ.ssoc}"
						class={cn(card({ padding: 'sm', hover: true }), 'group block')}
					>
						<div class="flex items-start justify-between gap-2 mb-1.5">
							<h3
								class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight"
							>
								{occ.title}
							</h3>
							<span class={cn(riskBadge({ band: occ.risk_band }), 'shrink-0 text-xs')}>
								{(occ.net_risk * 100).toFixed(0)}%
							</span>
						</div>
						<p class="text-xs text-muted-foreground mb-2">
							{occ.major_group}
							{#if occ.gross_wage_median}
								&middot; SGD {occ.gross_wage_median.toLocaleString()}/mo
							{/if}
						</p>
						<div class="flex items-center gap-1.5">
							<span class={cn(impactBadge({ type: occ.impact_type }), 'text-xs px-1.5 py-0')}>
								{impactTypeLabels[occ.impact_type]}
							</span>
							<span class="ml-auto text-xs text-text-tertiary font-mono tabular-nums">
								{occ.ssoc}
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		{#if filteredOccupations.length === 0}
			<div class={cn(card({ padding: 'md', variant: 'subtle' }), 'mt-4 text-center')}>
				<p class="text-sm text-muted-foreground">No occupations match your search.</p>
				<button
					class="mt-2 text-xs text-primary hover:underline"
					onclick={() => {
						searchQuery = '';
						occGroupFilter = null;
					}}
				>
					Clear filters
				</button>
			</div>
		{/if}
	</section>
</main>
