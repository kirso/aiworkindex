<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { occupations, riskBandLabels } from '$lib/data';
	import { countryConfigs } from '$lib/data/country-config';
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

	const countryMenuOrder = ['global', 'sg', 'us', 'uk', 'ca'] as const;
	const countryMenuLinks = countryMenuOrder.map(code => countryConfigs[code]);

	function selectOccupation(ssoc: string) {
		open = false;
		query = '';
		goto(`/sg/occupation/${ssoc}`);
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

<!-- Desktop trigger -->
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
<!-- Mobile trigger -->
<button
	class="sm:hidden flex items-center justify-center rounded-lg p-1.5 text-header-muted hover:bg-header-active-bg hover:text-header-text transition-colors"
	onclick={() => (open = true)}
	aria-label="Search"
>
	<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
	</svg>
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
			<Command.Group heading="Go to">
				<Command.Item onSelect={() => selectPage('/global')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg
					>
					Global baseline
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle
							cx="9"
							cy="7"
							r="4"
						/><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg
					>
					Home
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/compare')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></svg
					>
					Compare countries
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/roles')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle
							cx="9"
							cy="7"
							r="4"
						/><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg
					>
					Browse Jobs & Roles
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
				{#each countryMenuLinks as country (country.code)}
					{#if country.code !== 'global'}
						<Command.Item onSelect={() => selectPage(country.routePrefix)}>
							<svg
								class="mr-2 h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<circle cx="12" cy="12" r="9" />
								<path d="M12 3a15 15 0 0 1 0 18" />
								<path d="M3 12h18" />
							</svg>
							{country.displayName}
						</Command.Item>
					{/if}
				{/each}
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
				<Command.Item onSelect={() => selectPage('/calculator')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><rect x="4" y="2" width="16" height="20" rx="2" /><line
							x1="8"
							y1="6"
							x2="16"
							y2="6"
						/><line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" /><line
							x1="8"
							y1="14"
							x2="10"
							y2="14"
						/><line x1="14" y1="14" x2="16" y2="14" /><line x1="8" y1="18" x2="16" y2="18" /></svg
					>
					Calculator
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/explore')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg
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
				<Command.Item onSelect={() => selectPage('/reports')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline
							points="14 2 14 8 20 8"
						/></svg
					>
					Reports
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/data')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><ellipse cx="12" cy="5" rx="9" ry="3" /><path
							d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"
						/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg
					>
					Data
				</Command.Item>
				<Command.Item onSelect={() => selectPage('/about')}>
					<svg
						class="mr-2 h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line
							x1="12"
							y1="8"
							x2="12.01"
							y2="8"
						/></svg
					>
					About
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

		<!-- Country occupations -->
		{#if results.occupations.length > 0}
			<Command.Group heading="Country Occupations">
				{#each results.occupations as occ (occ.ssoc)}
					<Command.Item value="occ-{occ.ssoc}" onSelect={() => selectOccupation(occ.ssoc)}>
						<div class="flex w-full items-center justify-between">
							<div class="min-w-0 flex-1">
								<span class="truncate">{occ.title}</span>
								<span class="ml-2 text-xs text-muted-foreground font-mono tabular-nums"
									>SSOC {occ.ssoc}</span
								>
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
