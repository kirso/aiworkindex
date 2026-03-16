<script lang="ts">
	import RadarChart from '$lib/components/viz/RadarChart.svelte';
	import { categoryLabels, categoryColors, majorGroupByKey } from '$lib/data';

	let { data } = $props();
	let occ = $derived(data.occupation);
	let group = $derived(majorGroupByKey.get(occ.major_group));

	// Wage bar computations
	let maxWage = $derived(Math.max(occ.gross_wage_75th * 1.15, 15000));
	let wageLeftPct = $derived((occ.gross_wage_25th / maxWage) * 100);
	let wageRightPct = $derived((occ.gross_wage_75th / maxWage) * 100);
	let wageMedianPct = $derived((occ.gross_wage_median / maxWage) * 100);
</script>

<svelte:head>
	<title>{occ.title} — AI Impact Score | SG AI Occupation Index</title>
	<meta
		name="description"
		content="{occ.title} (SSOC {occ.ssoc}): Technical AI exposure {occ.scores.c_aioe.toFixed(2)}, categorized as {categoryLabels[occ.scores.category]}. Median wage SGD {occ.gross_wage_median.toLocaleString()}."
	/>
	<meta property="og:title" content="{occ.title} — AI Impact Score | SG AI Occupation Index" />
	<meta property="og:description" content="Technical exposure: {occ.scores.c_aioe.toFixed(2)} ({categoryLabels[occ.scores.category]}). Median wage SGD {occ.gross_wage_median.toLocaleString()}." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/occupation/{occ.ssoc}" />
	<meta name="twitter:title" content="{occ.title} — AI Impact Score" />
	<meta name="twitter:description" content="Technical exposure: {occ.scores.c_aioe.toFixed(2)} ({categoryLabels[occ.scores.category]})" />
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
		}
	})}</script>`}
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
	<!-- Breadcrumb -->
	<nav class="mb-4 text-sm text-gray-500">
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
			</div>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Score Card -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">Technical AI Exposure</h2>

			<div class="mb-4 flex items-center gap-2">
				<span
					class="rounded px-2 py-1 text-sm font-semibold text-white"
					style="background-color: {categoryColors[occ.scores.category]};"
				>
					{categoryLabels[occ.scores.category]}
				</span>
			</div>

			<div class="space-y-3">
				<div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">AI Exposure (AIOE)</span>
						<span class="font-medium text-gray-900">{occ.scores.aioe.toFixed(2)}</span>
					</div>
					<div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full bg-blue-500"
							style="width: {occ.scores.aioe * 100}%;"
						></div>
					</div>
				</div>

				<div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Complementarity (Theta)</span>
						<span class="font-medium text-gray-900">{occ.scores.theta.toFixed(2)}</span>
					</div>
					<div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full bg-emerald-500"
							style="width: {occ.scores.theta * 100}%;"
						></div>
					</div>
				</div>

				<div>
					<div class="flex justify-between text-sm">
						<span class="text-gray-600">Combined Exposure (C-AIOE)</span>
						<span class="font-medium text-gray-900">{occ.scores.c_aioe.toFixed(2)}</span>
					</div>
					<div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full bg-red-400"
							style="width: {occ.scores.c_aioe * 100}%;"
						></div>
					</div>
				</div>
			</div>

			<div class="mt-4 rounded border border-blue-100 bg-blue-50 px-3 py-2">
				<p class="text-[11px] text-blue-700">
					This page shows technical AI exposure (Stage 1). Market resilience and net displacement risk
					will be added in v1.1.
				</p>
			</div>

			<p class="mt-3 text-xs text-gray-400">
				<a href="/methodology" class="underline hover:text-gray-600">About this scoring</a>
			</p>
		</div>

		<!-- Radar Chart -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">Score Profile</h2>
			<div class="flex justify-center">
				<RadarChart occupation={occ} groupAverage={data.groupAverage} />
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
					<span>25th: ${occ.gross_wage_25th.toLocaleString()}</span>
					<span class="font-medium text-gray-900">Median: ${occ.gross_wage_median.toLocaleString()}</span>
					<span>75th: ${occ.gross_wage_75th.toLocaleString()}</span>
				</div>
			</div>
		</div>

		<!-- Similar Occupations -->
		<div class="rounded-lg border border-gray-200 bg-white p-5">
			<h2 class="mb-3 text-sm font-semibold text-gray-700">Similar Occupations</h2>
			<div class="space-y-2">
				{#each data.similar as sim (sim.ssoc)}
					<a
						href="/occupation/{sim.ssoc}"
						class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
					>
						<span class="truncate text-gray-700">{sim.title}</span>
						<span
							class="ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
							style="background-color: {categoryColors[sim.scores.category]};"
						>
							{sim.scores.c_aioe.toFixed(2)}
						</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
</main>
