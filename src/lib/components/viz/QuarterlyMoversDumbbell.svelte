<script lang="ts">
	import { scaleLinear } from 'd3-scale';
	import { format } from 'd3-format';

	interface MoverItem {
		title: string;
		old_risk: number;
		new_risk: number;
		delta: number;
	}

	let {
		items,
		direction
	}: {
		items: MoverItem[];
		direction: 'rising' | 'falling';
	} = $props();

	const pct = format('.0%');
	const x = scaleLinear().domain([0, 0.7]).range([0, 100]);

	function dotColor(item: MoverItem) {
		return item.delta > 0 ? 'var(--color-risk-high)' : 'var(--color-risk-very-low)';
	}
</script>

<div class="space-y-3">
	{#each items as item}
		<div class="grid gap-2 md:grid-cols-[minmax(0,220px)_1fr_72px] md:items-center">
			<div>
				<p class="text-sm font-medium text-foreground">{item.title}</p>
				<p class="text-[11px] text-muted-foreground">
					{pct(item.old_risk)} → {pct(item.new_risk)}
				</p>
			</div>
			<div class="relative h-6">
				<div class="absolute top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-border"></div>
				<div
					class="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
					style={`left:${Math.min(x(item.old_risk), x(item.new_risk))}%; width:${Math.abs(x(item.new_risk) - x(item.old_risk))}%; background:${dotColor(item)};`}
				></div>
				<div
					class="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-muted-foreground"
					style={`left:${x(item.old_risk)}%;`}
					title={`Previous: ${pct(item.old_risk)}`}
				></div>
				<div
					class="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background"
					style={`left:${x(item.new_risk)}%; background:${dotColor(item)};`}
					title={`Current: ${pct(item.new_risk)}`}
				></div>
			</div>
			<p
				class={`text-right font-mono text-sm ${direction === 'rising' ? 'text-risk-high' : 'text-risk-very-low'}`}
			>
				{item.delta > 0 ? '+' : ''}{pct(item.delta)}
			</p>
		</div>
	{/each}
</div>
