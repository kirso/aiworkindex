<script lang="ts">
	import type { Occupation } from '$lib/data';
	import { riskBandLabels, riskBandColors } from '$lib/data';

	let { occupation }: { occupation: Occupation } = $props();
</script>

<a
	href="/occupation/{occupation.ssoc}"
	class="flex items-center justify-between rounded-md border border-gray-100 bg-white px-3 py-2 transition-colors hover:bg-gray-50"
>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium text-gray-900">{occupation.title}</p>
		<p class="mt-0.5 text-xs text-gray-500">
			Median: SGD {occupation.gross_wage_median.toLocaleString()}
		</p>
	</div>
	<div class="ml-3 flex flex-col items-end gap-1">
		<span
			class="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
			style="background-color: {riskBandColors[occupation.risk_band]};"
		>
			{riskBandLabels[occupation.risk_band]}
		</span>
		<span class="text-[10px] tabular-nums text-gray-400">
			Risk: {(occupation.net_risk * 100).toFixed(0)}%
		</span>
		<span class="text-[10px] text-gray-400">
			Confidence: {occupation.confidence.level}
		</span>
	</div>
</a>
