<script lang="ts">
	import type { Occupation, RiskBand, ImpactType } from '$lib/data';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';

	let { occupations }: { occupations: Occupation[] } = $props();

	const bandOrder: RiskBand[] = ['very_low', 'low', 'moderate', 'high', 'very_high'];
	const impactOrder: ImpactType[] = ['at_risk', 'ai_leveraged', 'stable', 'mixed'];

	// Official MOM total workforce figure (thousands)
	const OFFICIAL_TOTAL_WORKERS_K = 2376.4;

	let totalWorkers = $derived(OFFICIAL_TOTAL_WORKERS_K * 1000);

	let avgExposure = $derived.by(() => {
		if (occupations.length === 0) return 0;
		const sum = occupations.reduce((s, o) => s + o.exposure, 0);
		return sum / occupations.length;
	});

	let bandCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const o of occupations) {
			counts[o.risk_band] = (counts[o.risk_band] ?? 0) + 1;
		}
		return counts;
	});

	let maxBandCount = $derived(
		Math.max(...bandOrder.map((b) => bandCounts[b] ?? 0), 1)
	);

	let impactCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const o of occupations) {
			counts[o.impact_type] = (counts[o.impact_type] ?? 0) + 1;
		}
		return counts;
	});

	let maxImpactCount = $derived(
		Math.max(...impactOrder.map((t) => impactCounts[t] ?? 0), 1)
	);

	let highRiskCount = $derived(
		occupations.filter((o) => o.risk_band === 'high' || o.risk_band === 'very_high').length
	);

	let topHighRisk = $derived(
		[...occupations]
			.sort((a, b) => b.net_risk - a.net_risk)
			.slice(0, 5)
	);

	let topLowRisk = $derived(
		[...occupations]
			.sort((a, b) => a.net_risk - b.net_risk)
			.slice(0, 5)
	);

	function formatWages(value: number): string {
		if (value >= 1_000_000) return 'SGD ' + (value / 1_000_000).toFixed(1) + 'M';
		if (value >= 1_000) return 'SGD ' + (value / 1_000).toFixed(0) + 'K';
		return 'SGD ' + value.toFixed(0);
	}

	function pct(count: number): string {
		if (occupations.length === 0) return '0';
		return ((count / occupations.length) * 100).toFixed(0);
	}
</script>

<div class="space-y-5 text-sm">
	<!-- Headline stats -->
	<div>
		<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">Overview</h3>
		<div class="mt-2 grid grid-cols-2 gap-3">
			<div class="rounded-lg bg-gray-50 px-3 py-2">
				<p class="text-[10px] font-medium text-gray-400">Total Workers</p>
				<p class="text-lg font-bold tabular-nums text-gray-900">{(totalWorkers / 1000).toFixed(0)}K</p>
			</div>
			<div class="rounded-lg bg-gray-50 px-3 py-2">
				<p class="text-[10px] font-medium text-gray-400">Occupations</p>
				<p class="text-lg font-bold tabular-nums text-gray-900">{occupations.length}</p>
			</div>
			<div class="rounded-lg bg-gray-50 px-3 py-2">
				<p class="text-[10px] font-medium text-gray-400">Avg Exposure</p>
				<p class="text-lg font-bold tabular-nums text-gray-900">{(avgExposure * 100).toFixed(0)}%</p>
			</div>
			<div class="rounded-lg bg-gray-50 px-3 py-2">
				<p class="text-[10px] font-medium text-gray-400">High/Very High Risk</p>
				<p class="text-lg font-bold tabular-nums text-rose-600">{highRiskCount} occupations</p>
			</div>
		</div>
	</div>

	<!-- Risk band distribution -->
	<div>
		<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">Risk Distribution</h3>
		<div class="mt-2 space-y-1.5">
			{#each bandOrder as band (band)}
				{@const count = bandCounts[band] ?? 0}
				<div class="flex items-center gap-2">
					<span class="w-14 text-right text-[10px] font-medium text-gray-500 truncate">{riskBandLabels[band]}</span>
					<div class="h-3.5 flex-1 overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full transition-all duration-300"
							style="width: {(count / maxBandCount) * 100}%; background-color: {riskBandColors[band]};"
						></div>
					</div>
					<span class="w-12 text-[10px] tabular-nums text-gray-500">{count} <span class="text-gray-300">({pct(count)}%)</span></span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Impact type distribution -->
	<div>
		<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">Impact Type</h3>
		<div class="mt-2 space-y-1.5">
			{#each impactOrder as type (type)}
				{@const count = impactCounts[type] ?? 0}
				<div class="flex items-center gap-2">
					<span class="w-14 text-right text-[10px] font-medium text-gray-500 truncate">{impactTypeLabels[type]}</span>
					<div class="h-3.5 flex-1 overflow-hidden rounded-full bg-gray-100">
						<div
							class="h-full rounded-full transition-all duration-300"
							style="width: {(count / maxImpactCount) * 100}%; background-color: {impactTypeColors[type]};"
						></div>
					</div>
					<span class="w-12 text-[10px] tabular-nums text-gray-500">{count} <span class="text-gray-300">({pct(count)}%)</span></span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Top 5 highest risk -->
	<div>
		<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">Highest Risk</h3>
		<ol class="mt-2 space-y-1">
			{#each topHighRisk as occ, i (occ.ssoc)}
				<li class="flex items-start gap-1.5">
					<span class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[9px] font-bold text-rose-600">{i + 1}</span>
					<a href="/occupation/{occ.ssoc}" class="text-xs leading-tight text-gray-700 hover:text-indigo-600 hover:underline">
						{occ.title}
						<span class="ml-1 tabular-nums text-gray-400">{(occ.net_risk * 100).toFixed(0)}%</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>

	<!-- Top 5 lowest risk -->
	<div>
		<h3 class="text-xs font-semibold uppercase tracking-wide text-gray-400">Most Resilient</h3>
		<ol class="mt-2 space-y-1">
			{#each topLowRisk as occ, i (occ.ssoc)}
				<li class="flex items-start gap-1.5">
					<span class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-600">{i + 1}</span>
					<a href="/occupation/{occ.ssoc}" class="text-xs leading-tight text-gray-700 hover:text-indigo-600 hover:underline">
						{occ.title}
						<span class="ml-1 tabular-nums text-gray-400">{(occ.net_risk * 100).toFixed(0)}%</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>
</div>
