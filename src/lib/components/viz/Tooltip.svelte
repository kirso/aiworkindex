<script lang="ts">
	import type { Occupation } from '$lib/data';
	import { categoryLabels, categoryColors } from '$lib/data';

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
				style="background-color: {categoryColors[occupation.scores.category]};"
			>
				{categoryLabels[occupation.scores.category]}
			</span>
			<span class="text-xs text-gray-600">
				C-AIOE: {occupation.scores.c_aioe.toFixed(2)}
			</span>
		</div>
		<div class="mt-1 flex gap-3 text-xs text-gray-600">
			<span>AIOE: {occupation.scores.aioe.toFixed(2)}</span>
			<span>Theta: {occupation.scores.theta.toFixed(2)}</span>
		</div>
		<p class="mt-1 text-xs text-gray-600">
			Median wage: ${occupation.gross_wage_median.toLocaleString()}
		</p>
	</div>
{/if}
