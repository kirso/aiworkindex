<script lang="ts">
	import type { Occupation } from '$lib/data';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';

	let {
		occupation = null,
		x = 0,
		y = 0,
		visible = false
	}: {
		occupation: Occupation | null;
		x: number;
		y: number;
		visible: boolean;
	} = $props();
</script>

{#if visible && occupation}
	<div
		class="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg"
		style="left: {x + 12}px; top: {y - 12}px;"
	>
		<p class="text-sm font-semibold text-gray-900">{occupation.title}</p>
		<p class="mt-0.5 text-xs text-gray-500">{occupation.major_group}</p>
		<div class="mt-1.5 flex items-center gap-2">
			<span
				class="rounded px-1.5 py-0.5 text-xs font-medium text-white"
				style="background-color: {riskBandColors[occupation.risk_band]};"
			>
				{riskBandLabels[occupation.risk_band]}
			</span>
			<span
				class="rounded px-1.5 py-0.5 text-xs font-medium text-white"
				style="background-color: {impactTypeColors[occupation.impact_type]};"
			>
				{impactTypeLabels[occupation.impact_type]}
			</span>
			<span class="text-xs font-medium text-gray-700">
				Net Risk: {(occupation.net_risk * 100).toFixed(0)}%
			</span>
		</div>
		<div class="mt-1 flex gap-3 text-xs text-gray-600">
			<span>Exposure: {(occupation.exposure * 100).toFixed(0)}%</span>
			<span>Bottleneck: {(occupation.bottleneck * 100).toFixed(0)}%</span>
		</div>
		<p class="mt-1 text-xs text-gray-600">
			Median wage: SGD {occupation.gross_wage_median.toLocaleString()}
		</p>
	</div>
{/if}
