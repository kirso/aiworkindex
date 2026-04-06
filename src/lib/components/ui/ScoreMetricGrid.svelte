<script lang="ts">
	import { card } from '$lib/design-system';
	import { cn } from '$lib/utils';

	export type ScoreMetric = {
		label: string;
		value: string;
		note?: string;
	};

	interface Props {
		metrics: ScoreMetric[];
		class?: string;
	}

	let { metrics, class: className = '' }: Props = $props();
</script>

<div
	class={cn(
		'grid gap-3',
		metrics.length >= 4 ? 'md:grid-cols-4' : metrics.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2',
		className
	)}
>
	{#each metrics as metric (metric.label)}
		<div class={card({ padding: 'sm' })}>
			<p class="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
			<p class="mt-1 text-2xl font-semibold text-foreground">{metric.value}</p>
			{#if metric.note}
				<p class="mt-1 text-sm text-muted-foreground">{metric.note}</p>
			{/if}
		</div>
	{/each}
</div>
