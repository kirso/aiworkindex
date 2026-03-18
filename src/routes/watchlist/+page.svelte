<script lang="ts">
	import { browser } from '$app/environment';
	import { occupationsBySSoc, riskBandLabels, impactTypeLabels } from '$lib/data';
	import {
		title as titleStyle,
		riskBadge,
		impactBadge,
		card,
		sectionLabel
	} from '$lib/design-system';
	import { pageLayout } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import type { Occupation } from '$lib/data';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';

	const STORAGE_KEY = 'aiworkindex-watchlist';
	const TIMESTAMP_KEY = 'aiworkindex-watchlist-saved-at';

	let savedSsocs = $state<string[]>([]);
	let savedTimestamp = $state<string | null>(null);
	let savedOccupations = $derived<Occupation[]>(
		savedSsocs
			.map(ssoc => occupationsBySSoc.get(ssoc))
			.filter((o): o is Occupation => o !== undefined)
	);

	$effect(() => {
		if (!browser) return;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) savedSsocs = JSON.parse(stored);
			savedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
		} catch {
			savedSsocs = [];
		}
	});

	// Save timestamp whenever watchlist changes
	$effect(() => {
		if (!browser || savedSsocs.length === 0) return;
		const now = new Date().toISOString().split('T')[0]!;
		localStorage.setItem(TIMESTAMP_KEY, now);
		savedTimestamp = now;
	});

	function removeFromWatchlist(ssoc: string) {
		savedSsocs = savedSsocs.filter(s => s !== ssoc);
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSsocs));
		}
	}

	function clearAll() {
		savedSsocs = [];
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}
</script>

<svelte:head>
	<title>Watchlist — SG AI Occupation Index</title>
	<meta
		name="description"
		content="Your saved occupations. Track AI displacement risk for the roles you care about."
	/>
</svelte:head>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Watchlist' }]} />

	<div class="flex items-start justify-between">
		<div>
			<h1 class={titleStyle({ size: 'page' })}>Your Watchlist</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Saved occupations are stored locally in your browser. Nothing is sent to any server.
			</p>
		</div>
		{#if savedOccupations.length > 0}
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

	{#if savedOccupations.length === 0}
		<div class={cn(card({ padding: 'lg' }), 'mt-8 text-center')}>
			<svg
				class="mx-auto h-12 w-12 text-muted-foreground/30"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
			</svg>
			<h2 class="mt-4 text-base font-semibold text-foreground">No saved occupations yet</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Browse occupations and click the bookmark icon to save them here.
			</p>
			<div class="mt-4 flex justify-center gap-3">
				<Button href="/">Explore occupations</Button>
				<Button variant="outline" href="/rankings">View rankings</Button>
			</div>
		</div>
	{:else}
		<p class={cn(sectionLabel(), 'mt-6 mb-3')}>Saved Occupations</p>
		<div class="space-y-3">
			{#each savedOccupations as occ (occ.ssoc)}
				<div class={card({ padding: 'md' })}>
					<div class="flex items-start justify-between gap-4">
						<a href="/occupation/{occ.ssoc}" class="flex-1">
							<div class="flex items-center gap-2">
								<h2 class="text-sm font-semibold text-foreground hover:text-primary">
									{occ.title}
								</h2>
								<Badge variant="outline" class="text-xs tabular-nums">{occ.ssoc}</Badge>
							</div>
							<div class="mt-2 flex flex-wrap items-center gap-2">
								<span class={cn(riskBadge({ band: occ.risk_band }), 'text-xs')}>
									{riskBandLabels[occ.risk_band]} — {(occ.net_risk * 100).toFixed(0)}%
								</span>
								<span class={cn(impactBadge({ type: occ.impact_type }), 'text-xs')}>
									{impactTypeLabels[occ.impact_type]}
								</span>
								<span class="text-xs tabular-nums text-muted-foreground">
									SGD {occ.gross_wage_median.toLocaleString()}/mo
								</span>
							</div>
							<Separator class="my-2" />
							<div class="grid grid-cols-3 gap-3 text-xs">
								<div>
									<span class="text-muted-foreground">Exposure</span>
									<span class="ml-1 font-medium tabular-nums text-foreground"
										>{(occ.exposure * 100).toFixed(0)}%</span
									>
								</div>
								<div>
									<span class="text-muted-foreground">Bottleneck</span>
									<span class="ml-1 font-medium tabular-nums text-foreground"
										>{(occ.bottleneck * 100).toFixed(0)}%</span
									>
								</div>
								<div>
									<span class="text-muted-foreground">Market</span>
									<span class="ml-1 font-medium tabular-nums text-foreground"
										>{(occ.market.market_resilience * 100).toFixed(0)}%</span
									>
								</div>
							</div>
						</a>
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={() => removeFromWatchlist(occ.ssoc)}
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
				{savedOccupations.length} occupation{savedOccupations.length === 1 ? '' : 's'} saved.
				{#if savedTimestamp}
					<span class="ml-1">Last updated: {savedTimestamp}</span>
				{/if}
			</p>
			<p class="text-xs italic">Quarterly delta: no prior snapshot data available yet</p>
		</div>
	{/if}
</main>
