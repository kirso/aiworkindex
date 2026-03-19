<script lang="ts">
	import type { Occupation } from '$lib/data';
	import { cn } from '$lib/utils';

	let { occupation }: { occupation: Occupation } = $props();

	function pressureColor(v: number) {
		return v >= 0.5
			? 'bg-risk-very-high'
			: v >= 0.3
				? 'bg-risk-high'
				: v >= 0.15
					? 'bg-risk-moderate'
					: 'bg-risk-very-low';
	}

	function confidenceColor(v: number) {
		return v >= 0.7 ? 'bg-risk-very-low' : v >= 0.4 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	function mobilityColor(v: number) {
		return v >= 0.6 ? 'bg-risk-very-low' : v >= 0.3 ? 'bg-risk-moderate' : 'bg-risk-high';
	}

	let pressure = $derived(occupation.net_risk);
	let market = $derived(occupation.market.market_resilience);
	let confidence = $derived(occupation.confidence.score);
	let humanMoat = $derived(Math.min(occupation.bottleneck, 1));
</script>

<div class="flex items-center gap-3">
	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between mb-0.5">
			<span class="text-[10px] text-muted-foreground">Pressure</span>
			<span class="text-[10px] font-mono text-foreground/70">{(pressure * 100).toFixed(0)}%</span>
		</div>
		<div class="h-1 w-full rounded-full bg-muted-foreground/10">
			<div
				class={cn('h-1 rounded-full transition-all duration-300', pressureColor(pressure))}
				style="width: {Math.max(pressure * 100, 5)}%;"
			></div>
		</div>
	</div>

	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between mb-0.5">
			<span class="text-[10px] text-muted-foreground">Market</span>
			<span class="text-[10px] font-mono text-foreground/70">{(market * 100).toFixed(0)}%</span>
		</div>
		<div class="h-1 w-full rounded-full bg-muted-foreground/10">
			<div
				class={cn(
					'h-1 rounded-full transition-all duration-300',
					market >= 0.6 ? 'bg-risk-very-low' : market >= 0.35 ? 'bg-risk-moderate' : 'bg-risk-high'
				)}
				style="width: {Math.max(market * 100, 5)}%;"
			></div>
		</div>
	</div>

	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between mb-0.5">
			<span class="text-[10px] text-muted-foreground">Confidence</span>
			<span class="text-[10px] font-mono text-foreground/70">{(confidence * 100).toFixed(0)}%</span>
		</div>
		<div class="h-1 w-full rounded-full bg-muted-foreground/10">
			<div
				class={cn('h-1 rounded-full transition-all duration-300', confidenceColor(confidence))}
				style="width: {Math.max(confidence * 100, 5)}%;"
			></div>
		</div>
	</div>

	<div class="flex-1 min-w-0">
		<div class="flex items-center justify-between mb-0.5">
			<span class="text-[10px] text-muted-foreground">Human Moat</span>
			<span class="text-[10px] font-mono text-foreground/70"
				>{humanMoat >= 0.6 ? 'High' : humanMoat >= 0.3 ? 'Medium' : 'Low'}</span
			>
		</div>
		<div class="h-1 w-full rounded-full bg-muted-foreground/10">
			<div
				class={cn('h-1 rounded-full transition-all duration-300', mobilityColor(humanMoat))}
				style="width: {Math.max(humanMoat * 100, 5)}%;"
			></div>
		</div>
	</div>
</div>
