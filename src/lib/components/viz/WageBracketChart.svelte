<script lang="ts">
	import { browser } from '$app/environment';
	import type { Occupation } from '$lib/data';
	import { riskColorScale } from '$lib/design-system';

	let { occupations }: { occupations: Occupation[] } = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let chartWidth = $state(400);

	$effect(() => {
		if (!browser || !containerEl) return;
		const observer = new ResizeObserver(entries => {
			chartWidth = entries[0]!.contentRect.width;
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	const brackets = [
		{ label: '< 2K', min: 0, max: 2000 },
		{ label: '2-4K', min: 2000, max: 4000 },
		{ label: '4-6K', min: 4000, max: 6000 },
		{ label: '6-10K', min: 6000, max: 10000 },
		{ label: '10K+', min: 10000, max: Infinity }
	];

	let bracketData = $derived.by(() => {
		return brackets.map(bracket => {
			const occs = occupations.filter(
				o => o.gross_wage_median >= bracket.min && o.gross_wage_median < bracket.max
			);
			const avgRisk = occs.length > 0 ? occs.reduce((s, o) => s + o.net_risk, 0) / occs.length : 0;
			return {
				label: bracket.label,
				count: occs.length,
				avgRisk
			};
		});
	});

	let maxRisk = $derived(Math.max(...bracketData.map(b => b.avgRisk), 0.01));

	const chartHeight = 220;
	const marginLeft = 55;
	const marginBottom = 40;
	const marginTop = 10;
	const marginRight = 80;
	let plotWidth = $derived(chartWidth - marginLeft - marginRight);
	const plotHeight = chartHeight - marginBottom - marginTop;
</script>

<div bind:this={containerEl}>
	{#if browser}
		<svg
			viewBox="0 0 {chartWidth} {chartHeight}"
			class="block w-full"
			role="img"
			aria-label="Average occupation risk by wage bracket across {occupations.length} occupations"
		>
			<!-- Bars with labels -->
			{#each bracketData as bracket, i}
				{@const slotHeight = plotHeight / bracketData.length}
				{@const gap = 4}
				{@const barHeight = slotHeight - gap * 2}
				{@const barY = marginTop + i * slotHeight + gap}
				{@const centerY = marginTop + i * slotHeight + slotHeight / 2}
				{@const barWidth = Math.max((bracket.avgRisk / maxRisk) * plotWidth, 2)}
				<text
					x={marginLeft - 8}
					y={centerY}
					text-anchor="end"
					class="fill-muted-foreground text-xs tabular-nums font-medium"
					dominant-baseline="central">{bracket.label}</text
				>
				<rect
					x={marginLeft}
					y={barY}
					width={barWidth}
					height={barHeight}
					fill={riskColorScale(bracket.avgRisk)}
					opacity="0.85"
					rx="2"
				>
					<title
						>{bracket.label}: avg risk {(bracket.avgRisk * 100).toFixed(1)}% ({bracket.count} occupations)</title
					>
				</rect>
				<text
					x={marginLeft + barWidth + 6}
					y={centerY}
					class="fill-muted-foreground text-xs tabular-nums"
					dominant-baseline="central"
				>
					{(bracket.avgRisk * 100).toFixed(0)}% ({bracket.count})
				</text>
			{/each}

			<!-- Axis label (item 9) -->
			<text
				x={marginLeft + plotWidth / 2}
				y={chartHeight - 4}
				text-anchor="middle"
				class="fill-muted-foreground text-xs">Average risk score by salary range</text
			>
		</svg>
	{/if}
</div>
