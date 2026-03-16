<script lang="ts">
	import RadarChart from '$lib/components/viz/RadarChart.svelte';
	import {
		riskBandLabels,
		riskBandColors,
		majorGroupByKey,
		impactTypeLabels,
		impactTypeColors,
		augmentationBandLabels,
		occupations as allOccupations
	} from '$lib/data';

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

	// Employment formatting
	function formatEmployment(thousands: number): string {
		if (thousands >= 1) return `~${thousands.toFixed(1)}K jobs`;
		return `~${Math.round(thousands * 1000)} jobs`;
	}

	function formatEmploymentLong(thousands: number): string {
		if (thousands >= 1) return `Estimated ~${(thousands * 1000).toLocaleString()} jobs in Singapore`;
		return `Estimated ~${Math.round(thousands * 1000)} jobs in Singapore`;
	}

	// Helpers for plain-English summary
	function levelLabel(value: number): string {
		if (value > 0.66) return 'high';
		if (value >= 0.33) return 'moderate';
		return 'low';
	}

	function bottleneckInterpretation(bottleneck: number): string {
		if (bottleneck > 0.66) return 'judgment, creativity, and interpersonal skills';
		if (bottleneck >= 0.33) return 'specialized judgment and interpersonal skills';
		return 'routine task patterns with few unique human dependencies';
	}

	function momentumLabel(momentum: number): string {
		if (momentum > 0.6) return 'growing';
		if (momentum >= 0.4) return 'stable';
		return 'declining';
	}

	function momentumVerb(momentum: number): string {
		if (momentum > 0.6) return 'supports';
		if (momentum >= 0.4) return "doesn't significantly change";
		return 'weakens';
	}

	// Count of occupations with same impact_type
	let impactTypeCount = $derived(
		allOccupations.filter((o) => o.impact_type === occ.impact_type).length
	);

	// Plain-English summary sentence 1
	let summaryText = $derived.by(() => {
		const title = occ.title;
		const exposureLevel = levelLabel(occ.exposure);
		const bottleneckLevel = levelLabel(occ.bottleneck);
		const bottleneckDesc = bottleneckInterpretation(occ.bottleneck);

		switch (occ.impact_type) {
			case 'ai_leveraged':
				return `AI is likely to enhance productivity in this role rather than replace it. ${title} has ${exposureLevel} AI exposure, but strong human bottlenecks \u2014 like ${bottleneckDesc} \u2014 mean AI augments rather than substitutes. This is one of ${impactTypeCount} \u2018AI Leveraged\u2019 occupations in Singapore.`;
			case 'at_risk':
				return `This role faces significant AI displacement pressure. ${title} has ${exposureLevel} exposure to AI capabilities with relatively ${bottleneckLevel === 'low' ? 'weak' : 'few'} human bottlenecks to slow adoption. Workers in this field should consider developing skills that AI cannot easily replicate.`;
			case 'stable':
				return `AI is unlikely to significantly disrupt this role in the near term. ${title} has ${exposureLevel} AI exposure, meaning current AI capabilities have limited overlap with the core tasks. The occupation remains relatively stable.`;
			case 'mixed':
				return `This role shows conflicting AI signals \u2014 high exposure but also strong human dependencies. ${title} could see both displacement of some tasks and augmentation of others. The net outcome depends on how organizations choose to adopt AI.`;
			default:
				return '';
		}
	});

	// Plain-English summary sentence 2 (market context)
	let marketContext = $derived.by(() => {
		const groupLabel = group?.label ?? occ.major_group;
		const momentum = momentumLabel(occ.market.market_momentum);
		const verb = momentumVerb(occ.market.market_momentum);
		return `The ${groupLabel} sector in Singapore has seen ${momentum} employment trends, which ${verb} the outlook.`;
	});
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
				<p class="mt-0.5 text-sm text-gray-500">
					{formatEmploymentLong(occ.employment_thousands)}
				</p>
				<div class="mt-2 flex flex-wrap items-center gap-2">
					<span
						class="rounded-full px-3 py-1 text-sm font-semibold text-white"
						style="background-color: {riskBandColors[occ.risk_band]};"
					>
						{riskBandLabels[occ.risk_band]} Risk
					</span>
					<span
						class="rounded-full px-3 py-1 text-sm font-semibold text-white"
						style="background-color: {impactTypeColors[occ.impact_type]};"
					>
						{impactTypeLabels[occ.impact_type]}
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

	<!-- What This Means -->
	<div class="mb-6 rounded-lg border border-gray-200 bg-blue-50/50 p-5">
		<h2 class="mb-2 text-sm font-semibold text-gray-700">What This Means</h2>
		<p class="text-sm leading-relaxed text-gray-700">{summaryText}</p>
		<p class="mt-2 text-sm leading-relaxed text-gray-600">{marketContext}</p>
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
					<span class="font-mono text-sm">&times;</span>
				</div>
				<div class="flex items-center justify-between rounded bg-green-50 px-3 py-2">
					<span class="font-medium text-green-700">(1 - Bottleneck)</span>
					<span class="font-semibold tabular-nums text-green-700">{((1 - occ.bottleneck) * 100).toFixed(0)}%</span>
				</div>
				<div class="flex items-center justify-center text-gray-400">
					<span class="font-mono text-sm">&times;</span>
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
				<!-- Augmentation Potential -->
				<div class="mt-2 border-t border-gray-100 pt-3">
					<div class="mb-1 flex items-center justify-between text-sm">
						<span class="font-medium text-indigo-700">Augmentation Potential</span>
						<span class="text-xs font-medium text-indigo-600">{augmentationBandLabels[occ.augmentation_band]}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full"
							style="width: {Math.min(occ.augmentation * 100, 100)}%; background: linear-gradient(to right, #818cf8, #6366f1);"
						></div>
					</div>
					<div class="mt-0.5 text-right text-xs tabular-nums text-indigo-600">{(occ.augmentation * 100).toFixed(0)}%</div>
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
