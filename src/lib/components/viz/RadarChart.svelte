<script lang="ts">
	import type { Occupation, RiskBand } from '$lib/data';
	import { riskBandLabels, riskBandColors } from '$lib/data';
	import { Progress } from '$lib/components/ui/progress';

	let {
		occupation
	}: {
		occupation: Occupation;
	} = $props();

	const bars: Array<{ key: 'exposure' | 'bottleneck' | 'market_resilience'; label: string; indicatorClass: string; indicatorStyle: string }> = [
		{ key: 'exposure', label: 'AI Task Overlap (Exposure)', indicatorClass: '', indicatorStyle: 'background: linear-gradient(to right, #fca5a5, #ef4444)' },
		{ key: 'bottleneck', label: 'Human Advantage (Bottleneck)', indicatorClass: '', indicatorStyle: 'background: linear-gradient(to right, #86efac, #22c55e)' },
		{ key: 'market_resilience', label: 'Singapore Demand Buffer (Market Resilience)', indicatorClass: '', indicatorStyle: 'background: linear-gradient(to right, #93c5fd, #3b82f6)' }
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
				<Progress value={value * 100} max={100} class="h-3 bg-muted" indicatorClass={bar.indicatorClass} indicatorStyle={bar.indicatorStyle} />
			</div>
		{/each}
	</div>

	<!-- Net Risk result -->
	<div class="mt-5 rounded-lg border border-border bg-muted p-4 text-center">
		<p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">AI Risk Score (Net Displacement Risk)</p>
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
