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
	<nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/" class="hover:text-gray-700">Home</a>
		<span class="mx-1">/</span>
		<span class="text-gray-900">Compare</span>
	</nav>

	<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-xl font-bold text-gray-900 sm:text-2xl">Compare Occupations</h1>
			<p class="mt-1 text-sm text-gray-500">Side-by-side AI risk comparison (up to 3 occupations)</p>
		</div>
		{#if selected.length > 0}
			<button
				type="button"
				onclick={shareUrl}
				class="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
					class="w-full max-w-md rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
				/>
			</div>
			{#if showSearch && searchResults.length > 0}
				<div class="absolute z-10 mt-1 w-full max-w-md rounded-md border border-gray-200 bg-white shadow-lg">
					{#each searchResults as result (result.ssoc)}
						<button
							type="button"
							class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
							onclick={() => addOccupation(result)}
						>
							<span class="truncate text-gray-700">{result.title}</span>
							<div class="ml-2 flex shrink-0 items-center gap-2">
								<span
									class="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
									style="background-color: {riskBandColors[result.risk_band]};"
								>
									{riskBandLabels[result.risk_band]}
								</span>
								<span class="text-xs text-gray-400">SSOC {result.ssoc}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if selected.length === 0}
		<div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
			<p class="text-gray-500">Search above to add occupations for comparison.</p>
			<p class="mt-2 text-sm text-gray-400">
				You can also link directly: <code class="rounded bg-gray-100 px-1 text-xs">/compare?jobs=25121,41320</code>
			</p>
		</div>
	{:else}
		<!-- Side-by-side columns -->
		<div class="mb-8 grid gap-4" style="grid-template-columns: repeat({selected.length}, minmax(0, 1fr));">
			{#each selected as occ (occ.ssoc)}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<div class="mb-3 flex items-start justify-between">
						<div>
							<a href="/occupation/{occ.ssoc}" class="font-semibold text-gray-900 hover:text-blue-600">
								{occ.title}
							</a>
							<p class="text-xs text-gray-500">SSOC {occ.ssoc}</p>
						</div>
						<button
							type="button"
							onclick={() => removeOccupation(occ.ssoc)}
							class="ml-2 shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							aria-label="Remove {occ.title}"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</button>
					</div>

					<!-- Risk band badge -->
					<div class="mb-4 flex flex-wrap items-center gap-2">
						<span
							class="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
							style="background-color: {riskBandColors[occ.risk_band]};"
						>
							{riskBandLabels[occ.risk_band]} Risk
						</span>
						<span
							class="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
							style="background-color: {impactTypeColors[occ.impact_type]};"
						>
							{impactTypeLabels[occ.impact_type]}
						</span>
					</div>

					<!-- Score bars -->
					<div class="space-y-3">
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-gray-600">Net Risk</span>
								<span class="font-medium tabular-nums">{pct(occ.net_risk)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.net_risk * 100, 100)}%; background-color: {riskBandColors[occ.risk_band]};"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-gray-600">Exposure</span>
								<span class="font-medium tabular-nums">{pct(occ.exposure)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.exposure * 100, 100)}%; background-color: {barColor(occ.exposure)};"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-gray-600">Human Bottleneck</span>
								<span class="font-medium tabular-nums">{pct(occ.bottleneck)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.bottleneck * 100, 100)}%; background-color: {barColor(occ.bottleneck, true)};"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-gray-600">Market Resilience</span>
								<span class="font-medium tabular-nums">{occ.market.market_resilience.toFixed(2)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full bg-blue-400"
									style="width: {Math.min(occ.market.market_resilience * 100, 100)}%;"
								></div>
							</div>
						</div>

						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-gray-600">Augmentation</span>
								<span class="font-medium tabular-nums">{pct(occ.augmentation)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(occ.augmentation * 100, 100)}%; background: linear-gradient(to right, #818cf8, #6366f1);"
								></div>
							</div>
						</div>
					</div>

					<!-- Wage -->
					<div class="mt-4 border-t border-gray-100 pt-3">
						<div class="flex items-center justify-between text-xs">
							<span class="text-gray-600">Median Wage</span>
							<span class="font-semibold text-gray-900">{formatWage(occ.gross_wage_median)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Comparison table -->
		<div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200 bg-gray-50">
						<th class="px-4 py-3 font-medium text-gray-700">Metric</th>
						{#each selected as occ (occ.ssoc)}
							<th class="px-4 py-3 font-medium text-gray-700">{occ.title}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each metrics as metric, i (metric.key)}
						<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100">
							<td class="px-4 py-2.5 font-medium text-gray-600">{metric.label}</td>
							{#each selected as occ (occ.ssoc)}
								<td class="px-4 py-2.5 tabular-nums text-gray-900">{metric.format(occ)}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>
