<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import {
		riskBandLabels,
		riskBandColors,
		impactTypeLabels,
		impactTypeColors,
		augmentationBandLabels,
		occupationsBySSoc
	} from '$lib/data';
	import type { Occupation } from '$lib/data';
	import { title as titleStyle, card, riskBadge, impactBadge } from '$lib/design-system';

	let { data } = $props();

	let allOccupations = $derived(data.allOccupations);

	// Parse selected occupations from URL query params (client-side)
	let selected: Occupation[] = $derived.by(() => {
		if (!browser) return [];
		const jobsParam = $page.url.searchParams.get('jobs') ?? '';
		return jobsParam
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.map((code) => occupationsBySSoc.get(code))
			.filter((o): o is Occupation => o !== undefined);
	});

	let searchQuery = $state('');
	let showSearch = $state(false);
	let copied = $state(false);

	// Search results
	let searchResults = $derived.by(() => {
		if (!searchQuery.trim()) return [];
		const q = searchQuery.trim().toLowerCase();
		const selectedSsocs = new Set(selected.map((o) => o.ssoc));
		return allOccupations
			.filter((o) => !selectedSsocs.has(o.ssoc) && o.title.toLowerCase().includes(q))
			.slice(0, 8);
	});

	function navigateTo(ssocs: string[]) {
		const codes = ssocs.join(',');
		const url = codes ? `/compare?jobs=${codes}` : '/compare';
		goto(url, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function addOccupation(occ: Occupation) {
		if (selected.length >= 3) return;
		searchQuery = '';
		showSearch = false;
		navigateTo([...selected.map((o) => o.ssoc), occ.ssoc]);
	}

	function removeOccupation(ssoc: string) {
		navigateTo(selected.filter((o) => o.ssoc !== ssoc).map((o) => o.ssoc));
	}

	function shareUrl() {
		if (!browser) return;
		navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function pct(v: number): string {
		return (v * 100).toFixed(0) + '%';
	}

	function formatWage(v: number): string {
		return 'SGD ' + v.toLocaleString();
	}

	// Score bar color
	function barColor(value: number, invert = false): string {
		const v = invert ? 1 - value : value;
		if (v > 0.66) return '#ef4444';
		if (v > 0.33) return '#f59e0b';
		return '#22c55e';
	}

	// Metrics for comparison table
	const metrics: { key: string; label: string; format: (o: Occupation) => string }[] = [
		{ key: 'net_risk', label: 'Net Risk', format: (o) => `${pct(o.net_risk)} ${riskBandLabels[o.risk_band]}` },
		{ key: 'exposure', label: 'Exposure', format: (o) => pct(o.exposure) },
		{ key: 'bottleneck', label: 'Human Bottleneck', format: (o) => pct(o.bottleneck) },
		{ key: 'market_resilience', label: 'Market Resilience', format: (o) => o.market.market_resilience.toFixed(2) },
		{ key: 'market_modifier', label: 'Market Modifier', format: (o) => o.market.market_modifier.toFixed(2) },
		{ key: 'augmentation', label: 'Augmentation', format: (o) => `${pct(o.augmentation)} ${augmentationBandLabels[o.augmentation_band]}` },
		{ key: 'impact_type', label: 'Impact Type', format: (o) => impactTypeLabels[o.impact_type] },
		{ key: 'wage', label: 'Median Wage', format: (o) => formatWage(o.gross_wage_median) },
		{ key: 'confidence', label: 'Confidence', format: (o) => `${o.confidence.level.charAt(0).toUpperCase() + o.confidence.level.slice(1)} (${(o.confidence.score * 100).toFixed(0)}%)` }
	];
</script>

<svelte:head>
	<title>Compare Occupations — SG AI Occupation Index</title>
	<meta name="description" content="Compare AI displacement risk across Singapore occupations side by side." />
</svelte:head>

<main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
	<!-- Breadcrumb -->
	<nav class="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
		<a href="/" class="hover:text-foreground/80">Home</a>
		<span class="mx-1">/</span>
		<span class="text-foreground">Compare</span>
	</nav>

	<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class={titleStyle({ size: 'page' })}>Compare Occupations</h1>
			<p class="mt-1 text-sm text-muted-foreground">Side-by-side AI risk comparison (up to 3 occupations)</p>
		</div>
		{#if selected.length > 0}
			<button
				type="button"
				onclick={shareUrl}
				class="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-muted"
			>
				{copied ? 'Copied!' : 'Share this comparison'}
			</button>
		{/if}
	</div>

	<!-- Search to add occupations -->
	{#if selected.length < 3}
		<div class="relative mb-6">
			<div class="flex gap-2">
				<input
					type="text"
					placeholder="Search occupations to compare..."
					bind:value={searchQuery}
					onfocus={() => (showSearch = true)}
					class="w-full max-w-md rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
				/>
			</div>
			{#if showSearch && searchResults.length > 0}
				<div class="absolute z-10 mt-1 w-full max-w-md rounded-md border border-border bg-card shadow-lg">
					{#each searchResults as result (result.ssoc)}
						<button
							type="button"
							class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
							onclick={() => addOccupation(result)}
						>
							<span class="truncate text-foreground/80">{result.title}</span>
							<div class="ml-2 flex shrink-0 items-center gap-2">
								<span class={riskBadge({ band: result.risk_band })}>
									{riskBandLabels[result.risk_band]}
								</span>
								<span class="text-xs text-muted-foreground">SSOC {result.ssoc}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if selected.length === 0}
		<div class={card({ padding: 'lg' }) + ' text-center'}>
			<p class="text-muted-foreground">Search above to add occupations for comparison.</p>
			<p class="mt-2 text-sm text-muted-foreground">
				You can also link directly: <code class="rounded bg-muted px-1 text-xs">/compare?jobs=25121,41320</code>
			</p>
		</div>
	{:else}
		<!-- Side-by-side columns -->
		<div class="mb-8 grid gap-4" style="grid-template-columns: repeat({selected.length}, minmax(0, 1fr));">
			{#each selected as occ (occ.ssoc)}
				<div class={card({ padding: 'sm' })}>
					<div class="mb-3 flex items-start justify-between">
						<div>
							<a href="/occupation/{occ.ssoc}" class="font-semibold text-foreground hover:text-primary">
								{occ.title}
							</a>
							<p class="text-xs text-muted-foreground">SSOC {occ.ssoc}</p>
						</div>
						<button
							type="button"
							onclick={() => removeOccupation(occ.ssoc)}
							class="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
							aria-label="Remove {occ.title}"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</button>
					</div>

					<!-- Risk band badge -->
					<div class="mb-4 flex flex-wrap items-center gap-2">
						<span class={riskBadge({ band: occ.risk_band })}>
							{riskBandLabels[occ.risk_band]} Risk
						</span>
						<span class={impactBadge({ type: occ.impact_type })}>
							{impactTypeLabels[occ.impact_type]}
						</span>
					</div>

					<!-- Score bars -->
					<div class="space-y-3">
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Net Risk</span>
								<span class="font-medium tabular-nums">{pct(occ.net_risk)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.net_risk * 100, 100)}%; background-color: {riskBandColors[occ.risk_band]};"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Exposure</span>
								<span class="font-medium tabular-nums">{pct(occ.exposure)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.exposure * 100, 100)}%; background-color: {barColor(occ.exposure)};"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Human Bottleneck</span>
								<span class="font-medium tabular-nums">{pct(occ.bottleneck)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.bottleneck * 100, 100)}%; background-color: {barColor(occ.bottleneck, true)};"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Market Resilience</span>
								<span class="font-medium tabular-nums">{occ.market.market_resilience.toFixed(2)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-blue-400"
									style="width: {Math.min(occ.market.market_resilience * 100, 100)}%;"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Augmentation</span>
								<span class="font-medium tabular-nums">{pct(occ.augmentation)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.augmentation * 100, 100)}%; background-color: var(--primary);"
								></div>
							</div>
						</div>
					</div>

					<!-- Wage -->
					<div class="mt-4 border-t border-border/50 pt-3">
						<div class="flex items-center justify-between text-xs">
							<span class="text-muted-foreground">Median Wage</span>
							<span class="font-semibold text-foreground">{formatWage(occ.gross_wage_median)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Comparison table -->
		<div class={card() + ' overflow-x-auto'}>
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border bg-muted">
						<th class="px-4 py-3 font-medium text-foreground/80">Metric</th>
						{#each selected as occ (occ.ssoc)}
							<th class="px-4 py-3 font-medium text-foreground/80">{occ.title}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each metrics as metric, i (metric.key)}
						<tr class="{i % 2 === 0 ? 'bg-card' : 'bg-muted'} border-b border-border/50">
							<td class="px-4 py-2.5 font-medium text-muted-foreground">{metric.label}</td>
							{#each selected as occ (occ.ssoc)}
								<td class="px-4 py-2.5 tabular-nums text-foreground">{metric.format(occ)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>
