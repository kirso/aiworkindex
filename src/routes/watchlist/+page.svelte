<script lang="ts">
	import { browser } from '$app/environment';
	import { occupationsBySSoc, riskBandLabels, impactTypeLabels } from '$lib/data';
	import { computeRoleScores, syntheticRoles, type ScoredRole } from '$lib/data/synthetic-roles';
	import {
		title as titleStyle,
		riskBadge,
		impactBadge,
		card,
		sectionLabel
	} from '$lib/design-system';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { pageLayout } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import type { Occupation } from '$lib/data';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import {
		WATCHLIST_KEY,
		WATCHLIST_TIMESTAMP_KEY,
		type WatchlistEntry,
		parseStoredWatchlist,
		serializeWatchlist
	} from '$lib/watchlist';
	import { countryConfigs } from '$lib/data/country-config';

	type SavedItem =
		| { kind: 'occupation'; entry: WatchlistEntry; occupation: Occupation }
		| { kind: 'role'; entry: WatchlistEntry; role: ScoredRole };

	const scoredRolesBySlug = new Map(
		syntheticRoles.map(role => [role.slug, computeRoleScores(role, occupationsBySSoc)])
	);

	let savedEntries = $state<WatchlistEntry[]>([]);
	let savedTimestamp = $state<string | null>(null);
	let savedItems = $derived<SavedItem[]>(
		savedEntries
			.map(entry => {
				if (entry.kind === 'occupation') {
					const occupation = occupationsBySSoc.get(entry.id);
					return occupation ? { kind: 'occupation' as const, entry, occupation } : null;
				}
				const role = scoredRolesBySlug.get(entry.id);
				return role ? { kind: 'role' as const, entry, role } : null;
			})
			.filter((item): item is SavedItem => item !== null)
	);

	$effect(() => {
		if (!browser) return;
		try {
			savedEntries = parseStoredWatchlist(localStorage.getItem(WATCHLIST_KEY));
			savedTimestamp = localStorage.getItem(WATCHLIST_TIMESTAMP_KEY);
		} catch {
			savedEntries = [];
		}
	});

	// Save timestamp whenever watchlist changes
	$effect(() => {
		if (!browser) return;
		if (savedEntries.length === 0) {
			localStorage.removeItem(WATCHLIST_TIMESTAMP_KEY);
			savedTimestamp = null;
			return;
		}
		const now = new Date().toISOString().split('T')[0]!;
		localStorage.setItem(WATCHLIST_TIMESTAMP_KEY, now);
		savedTimestamp = now;
	});

	function removeFromWatchlist(entry: WatchlistEntry) {
		savedEntries = savedEntries.filter(
			saved => !(saved.kind === entry.kind && saved.id === entry.id)
		);
		if (browser) {
			localStorage.setItem(WATCHLIST_KEY, serializeWatchlist(savedEntries));
		}
	}

	function clearAll() {
		savedEntries = [];
		if (browser) {
			localStorage.removeItem(WATCHLIST_KEY);
			localStorage.removeItem(WATCHLIST_TIMESTAMP_KEY);
		}
	}
</script>

<Seo
	title="Watchlist"
	description="Your saved occupations. Track AI displacement risk for the roles you care about."
	path="/watchlist"
	noindex={true}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Watchlist' }]} />

	<div class="flex items-start justify-between">
		<div>
			<h1 class={titleStyle({ size: 'page' })}>Your Watchlist</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Saved occupations and roles are stored locally in your browser. Nothing is sent to any
				server.
			</p>
		</div>
		{#if savedItems.length > 0}
			<Button
				variant="outline"
				size="sm"
				onclick={clearAll}
				class="text-muted-foreground hover:text-risk-very-high hover:border-risk-very-high/50"
			>
				Clear all
			</Button>
		{/if}
	</div>

	{#if savedItems.length === 0}
		<div class={cn(card({ padding: 'lg' }), 'mt-8 text-center')}>
			<svg
				class="mx-auto h-12 w-12 text-text-ghost"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
			</svg>
			<h2 class="mt-4 text-base font-semibold text-foreground">No saved jobs yet</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Browse occupations or roles and click the bookmark icon to save them here.
			</p>
			<div class="mt-4 flex justify-center gap-3">
				<Button href="/">Find jobs</Button>
				<Button variant="outline" href="/roles">Browse roles</Button>
				<Button variant="outline" href="/rankings">View rankings</Button>
			</div>
		</div>
	{:else}
		<p class={cn(sectionLabel(), 'mt-6 mb-3')}>Saved Jobs</p>
		<div class="space-y-3">
			{#each savedItems as item (`${item.entry.kind}:${item.entry.id}`)}
				<div class={card({ padding: 'md' })}>
					<div class="flex items-start justify-between gap-4">
						{#if item.kind === 'occupation'}
							<a href="/occupation/{item.occupation.ssoc}" class="flex-1">
								<div class="flex items-center gap-2">
									<h2 class="text-sm font-semibold text-foreground hover:text-primary">
										{item.occupation.title}
									</h2>
									<Badge variant="outline" class="text-xs tabular-nums">
										{item.occupation.ssoc}
									</Badge>
								</div>
								<div class="mt-2 flex flex-wrap items-center gap-2">
									<span class={cn(riskBadge({ band: item.occupation.risk_band }), 'text-xs')}>
										{riskBandLabels[item.occupation.risk_band]} — {(
											item.occupation.net_risk * 100
										).toFixed(0)}%
									</span>
									<span class={cn(impactBadge({ type: item.occupation.impact_type }), 'text-xs')}>
										{impactTypeLabels[item.occupation.impact_type]}
									</span>
									<span class="text-xs tabular-nums text-muted-foreground">
										{countryConfigs.sg.currency ?? 'SGD'} {item.occupation.gross_wage_median.toLocaleString()}/mo
									</span>
								</div>
								<Separator class="my-2" />
								<div class="grid grid-cols-3 gap-3 text-xs">
									<div>
										<span class="text-muted-foreground">Exposure</span>
										<span class="ml-1 font-medium tabular-nums text-foreground"
											>{(item.occupation.exposure * 100).toFixed(0)}%</span
										>
									</div>
									<div>
										<span class="text-muted-foreground">Bottleneck</span>
										<span class="ml-1 font-medium tabular-nums text-foreground"
											>{(item.occupation.bottleneck * 100).toFixed(0)}%</span
										>
									</div>
									<div>
										<span class="text-muted-foreground">Market</span>
										<span class="ml-1 font-medium tabular-nums text-foreground"
											>{(item.occupation.market.market_resilience * 100).toFixed(0)}%</span
										>
									</div>
								</div>
							</a>
						{:else}
							<a href="/role/{item.role.slug}" class="flex-1">
								<div class="flex items-center gap-2">
									<h2 class="text-sm font-semibold text-foreground hover:text-primary">
										{item.role.title}
									</h2>
									<Badge variant="outline" class="text-xs">Estimated role</Badge>
								</div>
								<div class="mt-2 flex flex-wrap items-center gap-2">
									<span class={cn(riskBadge({ band: item.role.risk_band }), 'text-xs')}>
										{riskBandLabels[item.role.risk_band]} — {(item.role.net_risk * 100).toFixed(0)}%
									</span>
									<span class={cn(impactBadge({ type: item.role.impact_type }), 'text-xs')}>
										{impactTypeLabels[item.role.impact_type]}
									</span>
									<span class="text-xs text-muted-foreground">
										{item.role.components.length} components
									</span>
								</div>
								<Separator class="my-2" />
								<div class="grid grid-cols-3 gap-3 text-xs">
									<div>
										<span class="text-muted-foreground">Exposure</span>
										<span class="ml-1 font-medium tabular-nums text-foreground"
											>{(item.role.exposure * 100).toFixed(0)}%</span
										>
									</div>
									<div>
										<span class="text-muted-foreground">Bottleneck</span>
										<span class="ml-1 font-medium tabular-nums text-foreground"
											>{(item.role.bottleneck * 100).toFixed(0)}%</span
										>
									</div>
									<div>
										<span class="text-muted-foreground">Market</span>
										<span class="ml-1 font-medium tabular-nums text-foreground"
											>{(item.role.market_resilience * 100).toFixed(0)}%</span
										>
									</div>
								</div>
							</a>
						{/if}
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => removeFromWatchlist(item.entry)}
							class="shrink-0 text-muted-foreground hover:text-risk-very-high"
							aria-label="Remove from watchlist"
						>
							<svg
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</Button>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-4 flex items-center justify-between text-xs text-muted-foreground">
			<p>
				{savedItems.length} saved {savedItems.length === 1 ? 'job' : 'jobs'}.
				{#if savedTimestamp}
					<span class="ml-1">Last updated: {savedTimestamp}</span>
				{/if}
			</p>
		</div>
	{/if}
</main>
