<script lang="ts">
	import { impactTypeLabels, riskBandLabels, majorGroups } from '$lib/data';
	import type { Occupation, RiskBand, ImpactType } from '$lib/data';
	import type { ScoredRole } from '$lib/data/synthetic-roles';
	import { roleCategoryMap } from '$lib/data/role-taxonomy';
	import type { RoleCategory } from '$lib/data/role-taxonomy';
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
		formInput
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	// --- State ---
	let searchQuery = $state('');
	let entityFilter = $state<'all' | 'occupations' | 'roles'>('all');
	let groupFilter = $state<string | null>(null);
	let sortKey = $state<'title' | 'net_risk' | 'exposure' | 'bottleneck' | 'wage'>('net_risk');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let viewMode = $state<'table' | 'cards'>('table');

	// --- Unified item type ---
	type CatalogItem = {
		kind: 'occupation' | 'role';
		id: string;
		href: string;
		title: string;
		subtitle: string;
		description: string;
		groupKey: string;
		net_risk: number;
		risk_band: RiskBand;
		impact_type: ImpactType;
		exposure: number;
		bottleneck: number;
		wage: number | null;
		badge: string | null;
		componentCount: number | null;
	};

	// --- Build unified list ---
	let allItems = $derived.by((): CatalogItem[] => {
		const occItems: CatalogItem[] = (data.occupations as Occupation[]).map(o => ({
			kind: 'occupation',
			id: o.ssoc,
			href: `/occupation/${o.ssoc}`,
			title: o.title,
			subtitle: `${o.major_group} · SSOC ${o.ssoc}`,
			description: '',
			groupKey: majorGroups.find(g => g.label === o.major_group)?.key ?? 'other',
			net_risk: o.net_risk,
			risk_band: o.risk_band,
			impact_type: o.impact_type,
			exposure: o.exposure,
			bottleneck: o.bottleneck,
			wage: o.gross_wage_median,
			badge: null,
			componentCount: null
		}));

		const roleItems: CatalogItem[] = (data.scoredRoles as ScoredRole[]).map(r => ({
			kind: 'role',
			id: r.slug,
			href: `/role/${r.slug}`,
			title: r.title,
			subtitle: r.description,
			description: r.description,
			groupKey: roleCategoryMap[r.slug]?.category ?? 'other',
			net_risk: r.net_risk,
			risk_band: r.risk_band,
			impact_type: r.impact_type,
			exposure: r.exposure,
			bottleneck: r.bottleneck,
			wage: null,
			badge: 'Estimate',
			componentCount: r.components.length
		}));

		return [...occItems, ...roleItems];
	});

	// --- Compute group pills based on entity filter ---
	type GroupPill = { key: string; label: string; count: number };

	let groupPills = $derived.by((): GroupPill[] => {
		if (entityFilter === 'occupations') {
			return majorGroups
				.map(g => ({
					key: g.key,
					label: g.label.charAt(0) + g.label.slice(1).toLowerCase(),
					count: allItems.filter(i => i.kind === 'occupation' && i.groupKey === g.key).length
				}))
				.filter(g => g.count > 0);
		}
		if (entityFilter === 'roles') {
			return (data.roleCategories as RoleCategory[])
				.map(c => ({
					key: c.key,
					label: c.label,
					count: allItems.filter(i => i.kind === 'role' && i.groupKey === c.key).length
				}))
				.filter(g => g.count > 0);
		}
		// "All" — show major groups (larger set, more useful for browsing)
		return majorGroups
			.map(g => ({
				key: g.key,
				label: g.label.charAt(0) + g.label.slice(1).toLowerCase(),
				count: allItems.filter(i => i.groupKey === g.key).length
			}))
			.filter(g => g.count > 0);
	});

	// --- Filter + search + sort ---
	let filtered = $derived.by(() => {
		let items = allItems;

		if (entityFilter === 'occupations') items = items.filter(i => i.kind === 'occupation');
		if (entityFilter === 'roles') items = items.filter(i => i.kind === 'role');

		if (groupFilter) items = items.filter(i => i.groupKey === groupFilter);

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			items = items.filter(
				i =>
					i.title.toLowerCase().includes(q) ||
					i.subtitle.toLowerCase().includes(q) ||
					i.id.toLowerCase().includes(q)
			);
		}

		const dir = sortDir === 'desc' ? -1 : 1;
		items = [...items].sort((a, b) => {
			if (sortKey === 'title') return dir * a.title.localeCompare(b.title);
			if (sortKey === 'wage') return dir * ((a.wage ?? 0) - (b.wage ?? 0));
			const aVal = a[sortKey] as number;
			const bVal = b[sortKey] as number;
			return dir * (aVal - bVal);
		});

		return items;
	});

	let filteredCount = $derived(filtered.length);
	let totalCount = $derived(allItems.length);
	let occCount = $derived((data.occupations as Occupation[]).length);
	let roleCount = $derived((data.scoredRoles as ScoredRole[]).length);

	// Reset group filter when entity filter changes
	$effect(() => {
		entityFilter;
		groupFilter = null;
	});

	// --- Sort handler ---
	function toggleSort(key: typeof sortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'desc' ? 'asc' : 'desc';
		} else {
			sortKey = key;
			sortDir = key === 'title' ? 'asc' : 'desc';
		}
	}

	function sortIndicator(key: typeof sortKey): string {
		if (sortKey !== key) return '';
		return sortDir === 'desc' ? ' ↓' : ' ↑';
	}

	let pageTitle = $derived(`All Jobs & Roles — AI Risk | ${SITE.name}`);
	let pageDescription = $derived(
		`Browse ${occCount} official occupations and ${roleCount} modern roles scored for AI displacement risk. Search, filter, and sort by risk, exposure, or wage.`
	);

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Singapore Jobs & Roles Scored for AI Displacement Risk',
			description: `${totalCount} occupations and modern roles scored for structural AI pressure`,
			numberOfItems: totalCount,
			itemListElement: filtered.slice(0, 10).map((item, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: item.title,
				url: SITE.url + item.href
			}))
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
			{occCount} official occupations and {roleCount} modern roles, all scored for AI displacement risk.
			Search by title or SSOC code, filter by type, sort any column.
		</p>
	</div>

	<!-- Search + view toggle -->
	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
		<div class="relative flex-1">
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
				placeholder="Search by title or SSOC code..."
				bind:value={searchQuery}
				aria-label="Search jobs and roles"
				class={cn(formInput(), 'pl-9')}
			/>
		</div>
		<div class="flex items-center gap-2">
			<p class="text-xs text-muted-foreground shrink-0">
				{filteredCount} of {totalCount}
			</p>
			<div class="flex items-center rounded-md border border-border">
				<button
					class="px-2 py-1 text-xs {viewMode === 'table'
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:text-foreground'} rounded-l-md transition-colors"
					onclick={() => (viewMode = 'table')}
					title="Table view"
					aria-label="Table view"
					aria-pressed={viewMode === 'table'}
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
				<button
					class="px-2 py-1 text-xs {viewMode === 'cards'
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:text-foreground'} rounded-r-md transition-colors"
					onclick={() => (viewMode = 'cards')}
					title="Card view"
					aria-label="Card view"
					aria-pressed={viewMode === 'cards'}
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
			</div>
		</div>
	</div>

	<!-- Entity type filter -->
	<div class="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter by type">
		<button
			class={chip({ active: entityFilter === 'all' })}
			onclick={() => (entityFilter = 'all')}
			aria-pressed={entityFilter === 'all'}
		>
			All
			<span class="ml-0.5 opacity-60">{totalCount}</span>
		</button>
		<button
			class={chip({ active: entityFilter === 'occupations' })}
			onclick={() => (entityFilter = entityFilter === 'occupations' ? 'all' : 'occupations')}
			aria-pressed={entityFilter === 'occupations'}
		>
			Official occupations
			<span class="ml-0.5 opacity-60">{occCount}</span>
		</button>
		<button
			class={chip({ active: entityFilter === 'roles' })}
			onclick={() => (entityFilter = entityFilter === 'roles' ? 'all' : 'roles')}
			aria-pressed={entityFilter === 'roles'}
		>
			Modern roles
			<span class="ml-0.5 opacity-60">{roleCount}</span>
		</button>
	</div>

	<!-- Group/category filter pills -->
	{#if groupPills.length > 0}
		<div class="mb-6 flex flex-wrap gap-1.5" role="group" aria-label="Filter by group">
			<button
				class={chip({ active: groupFilter === null })}
				onclick={() => (groupFilter = null)}
				aria-pressed={groupFilter === null}
			>
				All groups
			</button>
			{#each groupPills as gp (gp.key)}
				<button
					class={chip({ active: groupFilter === gp.key })}
					onclick={() => (groupFilter = groupFilter === gp.key ? null : gp.key)}
					aria-pressed={groupFilter === gp.key}
				>
					{gp.label}
					<span class="ml-0.5 opacity-60">{gp.count}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if viewMode === 'table'}
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
									Job{sortIndicator('title')}
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
						{#each filtered as item, i (item.kind + item.id)}
							<tr
								class="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors"
							>
								<td class="px-3 py-2 font-mono tabular-nums text-muted-foreground text-xs relative">
									<span
										class="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
										style="background-color: {riskColorScale(item.net_risk)}"
										aria-hidden="true"
									></span>
									{i + 1}
								</td>
								<td class="px-3 py-2">
									<a
										href={item.href}
										class="text-xs text-foreground hover:text-primary hover:underline underline-offset-2 decoration-primary/30 font-medium"
									>
										{item.title}
									</a>
									{#if item.badge}
										<span class={cn(pill({ size: 'sm', tone: 'muted' }), 'ml-1.5')}>
											{item.badge}
										</span>
									{/if}
									{#if item.kind === 'occupation'}
										<span class="ml-1 text-xs text-text-tertiary font-mono tabular-nums"
											>{item.id}</span
										>
									{/if}
								</td>
								<td class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary">
									{(item.net_risk * 100).toFixed(0)}%
								</td>
								<td class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary">
									{(item.exposure * 100).toFixed(0)}%
								</td>
								<td class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary">
									{(item.bottleneck * 100).toFixed(0)}%
								</td>
								<td class="px-3 py-2 text-right font-mono tabular-nums text-xs text-text-secondary">
									{item.wage ? `SGD ${item.wage.toLocaleString()}` : '—'}
								</td>
								<td class="px-3 py-2">
									<span class="inline-flex items-center gap-1.5 whitespace-nowrap">
										<span
											class="inline-block h-2 w-2 rounded-full"
											style="background-color: {riskColorScale(item.net_risk)}"
										></span>
										<span class="text-xs text-text-secondary">{riskBandLabels[item.risk_band]}</span
										>
									</span>
								</td>
								<td class="px-3 py-2">
									<span class={cn(impactBadge({ type: item.impact_type }), 'text-xs px-1.5 py-0')}>
										{impactTypeLabels[item.impact_type]}
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
			{#each filtered as item (item.kind + item.id)}
				<a
					href={item.href}
					class={cn(
						card({ padding: 'md' }),
						'group hover:border-primary/30 transition-colors block'
					)}
				>
					<div class="flex items-start justify-between gap-2 mb-2">
						<h3
							class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors"
						>
							{item.title}
						</h3>
						<span class={cn(riskBadge({ band: item.risk_band }), 'shrink-0 text-xs')}>
							{(item.net_risk * 100).toFixed(0)}%
						</span>
					</div>
					{#if item.description}
						<p class="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
					{:else}
						<p class="text-xs text-muted-foreground mb-2">
							{item.subtitle}
							{#if item.wage}· SGD {item.wage.toLocaleString()}/mo{/if}
						</p>
					{/if}
					<div class="flex items-center gap-1.5">
						<span class={cn(impactBadge({ type: item.impact_type }), 'text-xs px-1.5 py-0')}>
							{impactTypeLabels[item.impact_type]}
						</span>
						{#if item.badge}
							<span class={pill({ size: 'sm', tone: 'muted' })}>{item.badge}</span>
						{/if}
						{#if item.componentCount}
							<span class="ml-auto text-xs text-muted-foreground">
								{item.componentCount} parts
							</span>
						{/if}
						{#if item.kind === 'occupation'}
							<span class="ml-auto text-xs text-text-tertiary font-mono tabular-nums"
								>{item.id}</span
							>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}

	{#if filtered.length === 0}
		<div class={cn(card({ padding: 'lg' }), 'mt-4 text-center')}>
			<p class="text-sm text-muted-foreground">No results match your search.</p>
			<button
				class="mt-2 text-xs text-primary hover:underline"
				onclick={() => {
					searchQuery = '';
					entityFilter = 'all';
					groupFilter = null;
				}}
			>
				Clear filters
			</button>
		</div>
	{/if}
</main>
