<script lang="ts">
	import type { V9PressureBin } from '$lib/data/v9-home';
	import ChartFrame from './ChartFrame.svelte';

	interface Props {
		bins: V9PressureBin[];
		rankedTotal: number;
		unrankedTotal: number;
	}

	let { bins, rankedTotal, unrankedTotal }: Props = $props();
	let maxCount = $derived(Math.max(1, ...bins.map(bin => bin.count)));
</script>

<ChartFrame
	id="pressure-distribution"
	title="Where occupation records sit in the pressure ranking"
	subtitle="{rankedTotal.toLocaleString()} scored SSOC 2024 occupations, grouped into ten percentile intervals."
	source="ILO 2025 generative-AI task-exposure evidence mapped to SSOC 2024. V9 release, 19 August 2026."
	note="Percentiles show relative position among scored occupation records. The bars do not represent workers or a probability of job loss. {unrankedTotal} occupations remain outside the ranking."
>
	<div
		class="grid h-48 grid-cols-10 items-end gap-1 border-b border-l border-border px-2 pt-4 sm:gap-2 sm:px-4"
	>
		{#each bins as bin (bin.start)}
			<div class="flex h-full min-w-0 flex-col justify-end">
				<div class="mb-1 text-center font-mono text-[10px] font-medium text-foreground sm:text-xs">
					{bin.count}
				</div>
				<div
					class="w-full bg-pressure-80 transition-colors hover:bg-pressure-100"
					style:height="{Math.max(2, (bin.count / maxCount) * 100)}%"
					aria-label="Pressure percentile {bin.label}: {bin.count} occupations"
				></div>
			</div>
		{/each}
	</div>
	<div
		class="mt-2 grid grid-cols-10 gap-1 px-2 font-mono text-[9px] text-muted-foreground sm:gap-2 sm:px-4 sm:text-[10px]"
	>
		{#each bins as bin (bin.start)}
			<span class="text-center">{bin.start}</span>
		{/each}
	</div>
	<div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
		<span>Lower relative pressure</span>
		<span>Higher relative pressure</span>
	</div>
</ChartFrame>
