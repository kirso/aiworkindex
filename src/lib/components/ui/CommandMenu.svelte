<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { occupations, riskBandLabels } from '$lib/data';
	import { searchOccupationsAndRoles } from '$lib/utils/search';
	import { riskBadge } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let open = $state(false);
	let query = $state('');

	// Keyboard shortcut
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}

	let results = $derived(searchOccupationsAndRoles(query, occupations));

	function selectOccupation(ssoc: string) {
		open = false;
		query = '';
		goto(`/occupation/${ssoc}`);
	}

	function selectRole(slug: string) {
		open = false;
		query = '';
		goto(`/role/${slug}`);
	}

	function selectPage(href: string) {
		open = false;
		query = '';
		goto(href);
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<!-- Trigger hint in header -->
<button
	class="hidden sm:flex items-center gap-2 rounded-lg border border-header-active-bg bg-header-active-bg/30 px-3 py-1.5 text-xs text-header-muted hover:bg-header-active-bg hover:text-header-text transition-colors"
	onclick={() => (open = true)}
>
	<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
	</svg>
	<span>Search</span>
	<kbd
		class="ml-2 rounded border border-header-active-bg bg-header-bg px-1.5 py-0.5 text-xs font-mono text-header-muted"
		>⌘K</kbd
	>
</button>

<Command.Dialog bind:open shouldFilter={false}>
	<Command.Input placeholder="Search occupations, roles, or pages..." bind:value={query} />
	<Command.List>
		<Command.Empty>
			<div class="py-4 text-center">
				<p class="text-sm text-muted-foreground">No results for "{query}"</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Try a job title like "nurse", "accountant", or "developer"
				</p>
			</div>
		</Command.Empty>

		<!-- Quick navigation (always visible when no query) -->
		{#if !query.trim()}
			<Command.Group heading="Navigate">
				<Command.Item onSelect={() => selectPage('/')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg
					>
					Home
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/explore')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg
					>
					Explore All Occupations
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/rankings')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4" /></svg
					>
					Rankings
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/compare')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><rect x="3" y="3" width="18" height="18" rx="2" /><line
							x1="12"
							y1="3"
							x2="12"
							y2="21"
						/></svg
					>
					Compare
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/watchlist')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg
					>
					Watchlist
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/methodology')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path
							d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
						/></svg
					>
					Methodology
				</Command.Item>
			</Command.Group>
		{/if}

		<!-- Estimated Modern Roles -->
		{#if results.roles.length > 0}
			<Command.Group heading="Modern Roles (Estimated)">
				{#each results.roles as role (role.slug)}
					<Command.Item value="role-{role.slug}" onSelect={() => selectRole(role.slug)}>
						<div class="flex w-full items-center justify-between">
							<span>{role.title}</span>
							<Badge
								variant="outline"
								class="ml-2 bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border text-xs"
								>Estimate</Badge
							>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}

		<!-- Official Occupations -->
		{#if results.occupations.length > 0}
			<Command.Group heading="Official Occupations">
				{#each results.occupations as occ (occ.ssoc)}
					<Command.Item value="occ-{occ.ssoc}" onSelect={() => selectOccupation(occ.ssoc)}>
						<div class="flex w-full items-center justify-between">
							<div class="min-w-0 flex-1">
								<span class="truncate">{occ.title}</span>
								<span class="ml-2 text-xs text-muted-foreground tabular-nums">SSOC {occ.ssoc}</span>
							</div>
							<span class={cn(riskBadge({ band: occ.risk_band }), 'ml-2 shrink-0 text-xs')}>
								{riskBandLabels[occ.risk_band]}
							</span>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
