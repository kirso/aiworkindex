<script lang="ts">
	import { impactTypeLabels, riskBandLabels } from '$lib/data';
	import type { ScoredRole } from '$lib/data/synthetic-roles';
	import {
		card,
		riskBadge,
		impactBadge,
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

	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);
	let viewMode = $state<'cards' | 'table'>('cards');

	let filteredRoles = $derived.by(() => {
		let roles = data.scoredRoles as ScoredRole[];

		if (selectedCategory) {
			const categoryRoles = data.byCategory[selectedCategory] as ScoredRole[] | undefined;
			roles = categoryRoles ?? [];
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			roles = roles.filter(
				r =>
					r.title.toLowerCase().includes(q) ||
					r.description.toLowerCase().includes(q) ||
					r.tags.some(t => t.toLowerCase().includes(q))
			);
		}

		return roles.sort((a, b) => b.net_risk - a.net_risk);
	});

	let roleCount = $derived(filteredRoles.length);
	let totalCount = $derived((data.scoredRoles as ScoredRole[]).length);

	let pageTitle = $derived(`Modern Roles — AI Risk | ${SITE.name}`);
	let pageDescription = $derived(
		`Browse ${totalCount} modern tech and professional roles scored for AI displacement risk. Filter by category, search by title.`
	);

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Modern Roles Scored for AI Displacement Risk',
			description: `${totalCount} modern tech and professional roles scored as weighted blends of official SSOC occupations`,
			numberOfItems: totalCount,
			itemListElement: (data.scoredRoles as ScoredRole[])
				.sort((a, b) => b.net_risk - a.net_risk)
				.slice(0, 10)
				.map((role, i) => ({
					'@type': 'ListItem',
					position: i + 1,
					name: role.title,
					url: SITE.url + '/role/' + role.slug
				}))
		})}<\/script>`
	);
</script>

<Seo title={pageTitle} description={pageDescription} path="/roles" />

{@html itemListJsonLd}

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Modern Roles' }]} />

	<div class="mb-8">
		<h1 class={titleStyle({ size: 'page' })}>Modern Roles</h1>
		<p class={cn(caption(), 'mt-1')}>
			{totalCount} roles scored as weighted blends of official SSOC occupations. These capture jobs that
			don't map cleanly to a single government classification.
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
				placeholder="Search roles..."
				bind:value={searchQuery}
				aria-label="Search roles by title, description, or tag"
				class={cn(formInput(), 'pl-9')}
			/>
		</div>
		<div class="flex items-center gap-2">
			<p class="text-xs text-muted-foreground shrink-0">
				{roleCount} of {totalCount}
			</p>
			<div class="flex items-center rounded-md border border-border">
				<button
					class="px-2 py-1 text-xs {viewMode === 'cards'
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:text-foreground'} rounded-l-md transition-colors"
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
				<button
					class="px-2 py-1 text-xs {viewMode === 'table'
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:text-foreground'} rounded-r-md transition-colors"
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
			</div>
		</div>
	</div>

	<!-- Category pills -->
	<div class="mb-6 flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
		<button
			class={chip({ active: selectedCategory === null })}
			onclick={() => (selectedCategory = null)}
			aria-pressed={selectedCategory === null}
		>
			All
		</button>
		{#each data.roleCategories as cat}
			{@const count = (data.byCategory[cat.key] as ScoredRole[] | undefined)?.length ?? 0}
			{#if count > 0}
				<button
					class={chip({ active: selectedCategory === cat.key })}
					onclick={() => (selectedCategory = selectedCategory === cat.key ? null : cat.key)}
					aria-pressed={selectedCategory === cat.key}
				>
					{cat.label}
					<span class="ml-0.5 opacity-60">{count}</span>
				</button>
			{/if}
		{/each}
	</div>

	{#if viewMode === 'cards'}
		<!-- Card grid -->
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredRoles as role (role.slug)}
				<a
					href="/role/{role.slug}"
					class={cn(
						card({ padding: 'md' }),
						'group hover:border-primary/30 transition-colors block'
					)}
				>
					<div class="flex items-start justify-between gap-2 mb-2">
						<h3
							class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors"
						>
							{role.title}
						</h3>
						<span class={cn(riskBadge({ band: role.risk_band }), 'shrink-0 text-xs')}>
							{(role.net_risk * 100).toFixed(0)}%
						</span>
					</div>
					<p class="text-xs text-muted-foreground line-clamp-2 mb-2">{role.description}</p>
					<div class="flex items-center gap-1.5">
						<span class={cn(impactBadge({ type: role.impact_type }), 'text-xs px-1.5 py-0')}>
							{impactTypeLabels[role.impact_type]}
						</span>
						{#if role.estimate_type === 'gig'}
							<span class={pill({ size: 'sm', tone: 'muted' })}>Gig</span>
						{:else if role.estimate_type === 'founder'}
							<span class={pill({ size: 'sm', tone: 'muted' })}>Founder</span>
						{/if}
						<span class="ml-auto text-xs text-muted-foreground">
							{role.components.length} components
						</span>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- Table view -->
		<div class={card({ padding: 'none' })}>
			<div class="overflow-x-auto">
				<table class="w-full text-sm table-fixed">
					<colgroup>
						<col />
						<col class="w-20" />
						<col class="w-24" />
						<col class="w-20" />
						<col class="w-16" />
					</colgroup>
					<thead>
						<tr class="border-b text-left text-xs text-muted-foreground">
							<th class="px-3 py-2.5 font-medium">Role</th>
							<th class="px-3 py-2.5 font-medium text-right">Risk</th>
							<th class="px-3 py-2.5 font-medium">Impact</th>
							<th class="px-3 py-2.5 font-medium">Band</th>
							<th class="px-3 py-2.5 font-medium text-right">Parts</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredRoles as role (role.slug)}
							<tr
								class="border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors"
							>
								<td class="px-3 py-2 truncate">
									<a
										href="/role/{role.slug}"
										class="text-foreground hover:text-primary font-medium"
									>
										{role.title}
									</a>
								</td>
								<td class="px-3 py-2 text-right">
									<span class={cn(riskBadge({ band: role.risk_band }), 'text-xs')}>
										{(role.net_risk * 100).toFixed(0)}%
									</span>
								</td>
								<td class="px-3 py-2">
									<span class={cn(impactBadge({ type: role.impact_type }), 'text-xs px-1.5 py-0')}>
										{impactTypeLabels[role.impact_type]}
									</span>
								</td>
								<td class="px-3 py-2 text-xs text-muted-foreground">
									{riskBandLabels[role.risk_band]}
								</td>
								<td class="px-3 py-2 text-right text-xs tabular-nums text-muted-foreground">
									{role.components.length}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	{#if filteredRoles.length === 0}
		<div class={cn(card({ padding: 'lg' }), 'text-center')}>
			<p class="text-sm text-muted-foreground">No roles match your search.</p>
			<button
				class="mt-2 text-xs text-primary hover:underline"
				onclick={() => {
					searchQuery = '';
					selectedCategory = null;
				}}
			>
				Clear filters
			</button>
		</div>
	{/if}
</main>
