<script lang="ts">
	import { impactTypeLabels } from '$lib/data';
	import type { ScoredRole } from '$lib/data/synthetic-roles';
	import {
		card,
		riskBadge,
		impactBadge,
		pageLayout,
		title as titleStyle,
		caption
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state<string | null>(null);

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
</script>

<Seo title={pageTitle} description={pageDescription} path="/roles" />

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Modern Roles' }]} />

	<div class="mb-8">
		<h1 class={titleStyle({ size: 'page' })}>Modern Roles</h1>
		<p class={cn(caption(), 'mt-1')}>
			{totalCount} roles scored as weighted blends of official SSOC occupations. These capture jobs that
			don't map cleanly to a single government classification.
		</p>
	</div>

	<!-- Search + filters -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
				class="w-full rounded-md border border-border bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>
		<p class="text-xs text-muted-foreground shrink-0">
			{roleCount} of {totalCount} roles
		</p>
	</div>

	<!-- Category pills -->
	<div class="mb-6 flex flex-wrap gap-1.5">
		<button
			class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedCategory === null
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:text-foreground'}"
			onclick={() => (selectedCategory = null)}
		>
			All
		</button>
		{#each data.roleCategories as cat}
			{@const count = (data.byCategory[cat.key] as ScoredRole[] | undefined)?.length ?? 0}
			{#if count > 0}
				<button
					class="rounded-full px-3 py-1 text-xs font-medium transition-colors {selectedCategory ===
					cat.key
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-muted-foreground hover:text-foreground'}"
					onclick={() => (selectedCategory = selectedCategory === cat.key ? null : cat.key)}
				>
					{cat.label}
					<span class="ml-0.5 opacity-60">{count}</span>
				</button>
			{/if}
		{/each}
	</div>

	<!-- Role grid -->
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each filteredRoles as role (role.slug)}
			<a
				href="/role/{role.slug}"
				class={cn(card({ padding: 'md' }), 'group hover:border-primary/30 transition-colors block')}
			>
				<div class="flex items-start justify-between gap-2 mb-2">
					<h3
						class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors"
					>
						{role.title}
					</h3>
					<span class={cn(riskBadge({ band: role.risk_band }), 'shrink-0 text-[10px]')}>
						{(role.net_risk * 100).toFixed(0)}%
					</span>
				</div>
				<p class="text-xs text-muted-foreground line-clamp-2 mb-2">{role.description}</p>
				<div class="flex items-center gap-1.5">
					<span class={cn(impactBadge({ type: role.impact_type }), 'text-[10px] px-1.5 py-0')}>
						{impactTypeLabels[role.impact_type]}
					</span>
					{#if role.estimate_type === 'gig'}
						<span
							class="rounded-full bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
						>
							Gig
						</span>
					{:else if role.estimate_type === 'founder'}
						<span
							class="rounded-full bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
						>
							Founder
						</span>
					{/if}
					<span class="ml-auto text-[10px] text-muted-foreground">
						{role.components.length} components
					</span>
				</div>
			</a>
		{/each}
	</div>

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
