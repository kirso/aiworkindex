<script lang="ts">
	import type { Occupation, RiskBand } from '$lib/data';
	import { riskBandLabels, riskBandColors } from '$lib/data';

	let { occupations }: { occupations: Occupation[] } = $props();

	let totalWorkers = $derived(
		occupations.reduce((sum, o) => sum + o.employment_thousands * 1000, 0)
	);

	const bandOrder: RiskBand[] = ['very_low', 'low', 'moderate', 'high', 'very_high'];

	let bandCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const o of occupations) {
			counts[o.risk_band] = (counts[o.risk_band] ?? 0) + 1;
		}
		return counts;
	});

	function pct(band: string): string {
		const count = bandCounts[band] ?? 0;
		return ((count / occupations.length) * 100).toFixed(0);
	}
</script>

<div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-gray-50 px-4 py-3 text-sm">
	<div>
		<span class="text-gray-500">Total Workers:</span>
		<span class="ml-1 font-semibold text-gray-900">
			{(totalWorkers / 1000).toFixed(0)}K
		</span>
	</div>
	<div>
		<span class="text-gray-500">Occupations:</span>
		<span class="ml-1 font-semibold text-gray-900">{occupations.length}</span>
	</div>
	<div class="hidden h-4 w-px bg-gray-300 sm:block"></div>
	{#each bandOrder as band}
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
