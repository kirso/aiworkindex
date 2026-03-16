<script lang="ts">
	import RadarChart from '$lib/components/viz/RadarChart.svelte';
	import { riskBandLabels, riskBandColors, majorGroupByKey } from '$lib/data';

	let { data } = $props();
	let occ = $derived(data.occupation);
	let group = $derived(majorGroupByKey.get(occ.major_group));

	// Wage bar computations
	let maxWage = $derived(Math.max(occ.gross_wage_75th * 1.15, 15000));
	let wageLeftPct = $derived((occ.gross_wage_25th / maxWage) * 100);
	let wageRightPct = $derived((occ.gross_wage_75th / maxWage) * 100);
	let wageMedianPct = $derived((occ.gross_wage_median / maxWage) * 100);

	// Confidence badge color
	function confidenceColor(level: string): string {
		if (level === 'high') return '#16a34a';
		if (level === 'medium') return '#ca8a04';
		return '#dc2626';
	}
</script>

<svelte:head>
	<title>{occ.title} — AI Displacement Risk | SG AI Occupation Index</title>
	<meta
		name="description"
		content="{occ.title} (SSOC {occ.ssoc}): Net displacement risk {(occ.net_risk * 100).toFixed(0)}%, rated {riskBandLabels[occ.risk_band]}. Median wage SGD {occ.gross_wage_median.toLocaleString()}."
	/>
	<meta property="og:title" content="{occ.title} — AI Displacement Risk | SG AI Occupation Index" />
	<meta property="og:description" content="Net risk: {(occ.net_risk * 100).toFixed(0)}% ({riskBandLabels[occ.risk_band]}). Median wage SGD {occ.gross_wage_median.toLocaleString()}." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/occupation/{occ.ssoc}" />
	<meta name="twitter:title" content="{occ.title} — AI Displacement Risk" />
	<meta name="twitter:description" content="Net risk: {(occ.net_risk * 100).toFixed(0)}% ({riskBandLabels[occ.risk_band]})" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Occupation",
		"name": occ.title,
		"occupationalCategory": occ.major_group,
		"estimatedSalary": {
			"@type": "MonetaryAmountDistribution",
			"name": "Gross Monthly Wage",
			"currency": "SGD",
			"median": occ.gross_wage_median,
			"percentile25": occ.gross_wage_25th,
			"percentile75": occ.gross_wage_75th
		},
		"occupationLocation": {
			"@type": "Country",
			"name": "Singapore"
		},
		"additionalProperty": [
			{
				"@type": "PropertyValue",
				"name": "AI Net Displacement Risk",
				"value": occ.net_risk
			},
			{
				"@type": "PropertyValue",
				"name": "Risk Band",
				"value": riskBandLabels[occ.risk_band]
			}
		]
	})}</script>`}
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
	<!-- Breadcrumb -->
	<nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/" class="hover:text-gray-700">Home</a>
		<span class="mx-1">/</span>
		<span class="text-gray-900">{occ.title}</span>
	</nav>

	<!-- Header -->
	<div class="mb-6">
		<div class="flex items-start gap-3">
			{#if group}
				<span
					class="mt-1 inline-block h-3.5 w-3.5 rounded-sm"
					style="background-color: {group.color};"
				></span>
			{/if}
			<div>
				<h1 class="text-xl font-bold text-gray-900 sm:text-2xl">{occ.title}</h1>
				<p class="mt-0.5 text-sm text-gray-500">
					SSOC {occ.ssoc} &middot; {group?.label ?? occ.major_group}
				</p>
				<div class="mt-2 flex flex-wrap items-center gap-2">
					<span
						class="rounded-full px-3 py-1 text-sm font-semibold text-white"
						style="background-color: {riskBandColors[occ.risk_band]};"
					>
						{riskBandLabels[occ.risk_band]} Risk
					</span>
					<span
						class="rounded-full border px-2.5 py-0.5 text-xs font-medium"
						style="color: {confidenceColor(occ.confidence.level)}; border-color: {confidenceColor(occ.confidence.level)};"
					>
						{occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)} Confidence
					</span>
				</div>
			</div>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Score Breakdown -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">Score Breakdown</h2>
			<RadarChart occupation={occ} />
		</div>

		<!-- Net Risk Explanation -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">How Net Risk is Computed</h2>
			<div class="space-y-3 text-sm text-gray-600">
				<div class="flex items-center justify-between rounded bg-red-50 px-3 py-2">
					<span class="font-medium text-red-700">Exposure (percentile)</span>
					<span class="font-semibold tabular-nums text-red-700">{(occ.exposure * 100).toFixed(0)}%</span>
				</div>
				<div class="flex items-center justify-center text-gray-400">
					<span class="text-lg">-</span>
				</div>
				<div class="flex items-center justify-between rounded bg-green-50 px-3 py-2">
					<span class="font-medium text-green-700">Bottleneck (percentile)</span>
					<span class="font-semibold tabular-nums text-green-700">{(occ.bottleneck * 100).toFixed(0)}%</span>
				</div>
				<div class="flex items-center justify-center text-gray-400">
					<span class="text-lg">x</span>
				</div>
				<div class="flex items-center justify-between rounded bg-blue-50 px-3 py-2">
					<span class="font-medium text-blue-700">Market Modifier</span>
					<span class="font-semibold tabular-nums text-blue-700">{occ.market.market_modifier.toFixed(2)}</span>
				</div>
				<div class="flex items-center justify-center text-gray-400">
					<span class="text-lg">=</span>
				</div>
				<div class="flex items-center justify-between rounded px-3 py-2" style="background-color: {riskBandColors[occ.risk_band]}20;">
					<span class="font-semibold text-gray-900">Net Displacement Risk</span>
					<span class="text-lg font-bold tabular-nums text-gray-900">{(occ.net_risk * 100).toFixed(0)}%</span>
				</div>
			</div>
			<p class="mt-3 text-xs text-gray-400">
				<a href="/methodology" class="underline hover:text-gray-600">About this scoring</a>
			</p>
		</div>

		<!-- Market Details -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">Market Signals</h2>
			<div class="space-y-3">
				<div>
					<div class="mb-1 flex items-center justify-between text-sm">
						<span class="text-gray-600">Market Momentum</span>
						<span class="font-medium tabular-nums text-gray-900">{occ.market.market_momentum.toFixed(2)}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full bg-purple-400"
							style="width: {Math.min(occ.market.market_momentum * 100, 100)}%;"
						></div>
					</div>
				</div>
				<div>
					<div class="mb-1 flex items-center justify-between text-sm">
						<span class="text-gray-600">Occupation Scarcity</span>
						<span class="font-medium tabular-nums text-gray-900">{occ.market.occupation_scarcity.toFixed(2)}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full bg-amber-400"
							style="width: {Math.min(occ.market.occupation_scarcity * 100, 100)}%;"
						></div>
					</div>
				</div>
				<div>
					<div class="mb-1 flex items-center justify-between text-sm">
						<span class="text-gray-600">Market Resilience</span>
						<span class="font-medium tabular-nums text-gray-900">{occ.market.market_resilience.toFixed(2)}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full bg-blue-400"
							style="width: {Math.min(occ.market.market_resilience * 100, 100)}%;"
						></div>
					</div>
				</div>
				<div class="border-t border-gray-100 pt-2">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium text-gray-700">Market Modifier</span>
						<span class="font-semibold tabular-nums text-gray-900">{occ.market.market_modifier.toFixed(2)}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Wage Range -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">Gross Monthly Wage (SGD)</h2>
			<div class="relative pt-6 pb-2">
				<div class="relative h-6">
					<!-- Full range background -->
					<div class="absolute inset-y-0 left-0 right-0 rounded bg-gray-100"></div>
					<!-- IQR bar -->
					<div
						class="absolute inset-y-0 rounded bg-blue-200"
						style="left: {wageLeftPct}%; width: {wageRightPct - wageLeftPct}%;"
					></div>
					<!-- Median dot -->
					<div
						class="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
						style="left: {wageMedianPct}%;"
					></div>
				</div>

				<!-- Labels -->
				<div class="mt-2 flex justify-between text-xs text-gray-500">
					<span>25th: SGD {occ.gross_wage_25th.toLocaleString()}</span>
					<span class="font-medium text-gray-900">Median: SGD {occ.gross_wage_median.toLocaleString()}</span>
					<span>75th: SGD {occ.gross_wage_75th.toLocaleString()}</span>
				</div>
			</div>
		</div>

		<!-- Similar Occupations -->
		<div class="rounded-lg border border-gray-200 bg-white p-5 md:col-span-2">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">Similar Occupations (by Net Risk)</h2>
			<div class="space-y-2">
				{#each data.similar as sim (sim.ssoc)}
					<a
						href="/occupation/{sim.ssoc}"
						class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
					>
						<span class="truncate text-gray-700">{sim.title}</span>
						<div class="ml-2 flex shrink-0 items-center gap-2">
							<span
								class="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
								style="background-color: {riskBandColors[sim.risk_band]};"
							>
								{riskBandLabels[sim.risk_band]}
							</span>
							<span class="tabular-nums text-xs text-gray-500">
								{(sim.net_risk * 100).toFixed(0)}%
							</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</div>
</main>
