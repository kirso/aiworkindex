<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { Occupation, RiskBand, ImpactType } from '$lib/data';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';

	let { occupations }: { occupations: Occupation[] } = $props();

	let totalWorkers = $derived(
		occupations.reduce((sum, o) => sum + o.employment_thousands * 1000, 0)
	);

	const bandOrder: RiskBand[] = ['very_low', 'low', 'moderate', 'high', 'very_high'];
	const impactOrder: ImpactType[] = ['at_risk', 'ai_leveraged', 'stable', 'mixed'];

	let bandCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const o of occupations) {
			counts[o.risk_band] = (counts[o.risk_band] ?? 0) + 1;
		}
		return counts;
	});

	let impactCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const o of occupations) {
			counts[o.impact_type] = (counts[o.impact_type] ?? 0) + 1;
		}
		return counts;
	});

	const tweenedWorkers = Tween.of(() => totalWorkers / 1000, { duration: 400 });
	const tweenedOccupations = Tween.of(() => occupations.length, { duration: 400 });

	function pct(band: string): string {
		const count = bandCounts[band] ?? 0;
		return ((count / occupations.length) * 100).toFixed(0);
	}

	function impactPct(type: string): string {
		const count = impactCounts[type] ?? 0;
		return ((count / occupations.length) * 100).toFixed(0);
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-gray-50 px-4 py-3 text-sm">
		<div>
			<span class="text-gray-500">Total Workers:</span>
			<span class="ml-1 font-semibold text-gray-900 tabular-nums">
				{tweenedWorkers.current.toFixed(0)}K
			</span>
		</div>
		<div>
			<span class="text-gray-500">Occupations:</span>
			<span class="ml-1 font-semibold text-gray-900 tabular-nums">{Math.round(tweenedOccupations.current)}</span>
		</div>
		<div class="hidden h-4 w-px bg-gray-300 sm:block"></div>
		{#each bandOrder as band (band)}
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-2.5 w-2.5 rounded-full"
					style="background-color: {riskBandColors[band]};"
				></span>
				<span class="text-gray-600">{riskBandLabels[band]}:</span>
				<span class="font-semibold text-gray-900">{bandCounts[band] ?? 0}</span>
				<span class="text-gray-400">({pct(band)}%)</span>
			</div>
		{/each}
	</div>
	<div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-gray-50 px-4 py-3 text-sm">
		<div>
			<span class="text-gray-500">Impact Type:</span>
		</div>
		{#each impactOrder as type (type)}
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-2.5 w-2.5 rounded-full"
					style="background-color: {impactTypeColors[type]};"
				></span>
				<span class="text-gray-600">{impactTypeLabels[type]}:</span>
				<span class="font-semibold text-gray-900">{impactCounts[type] ?? 0}</span>
				<span class="text-gray-400">({impactPct(type)}%)</span>
			</div>
		{/each}
	</div>
</div>
