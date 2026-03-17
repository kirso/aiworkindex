<script lang="ts">
	import type { Occupation, RiskBand } from '$lib/data';
	import { riskBandLabels, riskBandColors } from '$lib/data';

	let {
		occupation
	}: {
		occupation: Occupation;
	} = $props();

	const bars = [
		{ key: 'exposure' as const, label: 'Exposure', colorFrom: '#fca5a5', colorTo: '#ef4444' },
		{ key: 'bottleneck' as const, label: 'Bottleneck', colorFrom: '#86efac', colorTo: '#22c55e' },
		{ key: 'market_resilience' as const, label: 'Market Resilience', colorFrom: '#93c5fd', colorTo: '#3b82f6' }
	];

	function getValue(key: string): number {
		if (key === 'exposure') return occupation.exposure;
		if (key === 'bottleneck') return occupation.bottleneck;
		if (key === 'market_resilience') return occupation.market.market_resilience;
		return 0;
	}
</script>

<div class="w-full min-w-[300px]">
	<!-- Score bars -->
	<div class="space-y-3">
		{#each bars as bar}
			{@const value = getValue(bar.key)}
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="font-medium text-foreground/80">{bar.label}</span>
					<span class="tabular-nums text-muted-foreground">{(value * 100).toFixed(0)}%</span>
				</div>
				<div class="h-3 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-label="{bar.label}: {(value * 100).toFixed(0)}%" aria-valuenow={value * 100} aria-valuemin={0} aria-valuemax={100}>
					<div
						class="h-full rounded-full transition-all duration-300"
						style="width: {value * 100}%; background: linear-gradient(to right, {bar.colorFrom}, {bar.colorTo});"
					></div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Net Risk result -->
	<div class="mt-5 rounded-lg border border-border bg-muted p-4 text-center">
		<p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Net Displacement Risk</p>
		<div class="flex items-center justify-center gap-3">
			<span class="text-3xl font-bold tabular-nums text-foreground">
				{(occupation.net_risk * 100).toFixed(0)}%
			</span>
			<span
				class="rounded-full px-3 py-1 text-sm font-semibold text-white"
				style="background-color: {riskBandColors[occupation.risk_band]};"
			>
				{riskBandLabels[occupation.risk_band]}
			</span>
		</div>
	</div>
</div>
