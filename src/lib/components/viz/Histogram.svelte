<script lang="ts">
	import { browser } from '$app/environment';
	import type { Occupation } from '$lib/data';
	import * as d3Scale from 'd3-scale';

	let { occupations }: { occupations: Occupation[] } = $props();

	const binSize = 0.05;
	const maxRisk = 0.80;
	const bins = Array.from({ length: Math.ceil(maxRisk / binSize) }, (_, i) => {
		const lower = i * binSize;
		const upper = lower + binSize;
		return {
			lower,
			upper,
			label: `${(lower * 100).toFixed(0)}%`,
			count: 0
		};
	});

	let binData = $derived.by(() => {
		const b = bins.map((bin) => ({ ...bin, count: 0 }));
		for (const occ of occupations) {
			const idx = Math.min(Math.floor(occ.net_risk / binSize), b.length - 1);
			if (idx >= 0 && idx < b.length) b[idx].count++;
		}
		return b;
	});

	let maxCount = $derived(Math.max(...binData.map((b) => b.count), 1));

	const riskColorScale = d3Scale
		.scaleLinear<string>()
		.domain([0, 0.15, 0.35, 0.6])
		.range(['#10b981', '#f59e0b', '#f97316', '#f43f5e'])
		.clamp(true);

	const chartWidth = 600;
	const chartHeight = 200;
	const marginLeft = 40;
	const marginBottom = 30;
	const marginTop = 10;
	const plotWidth = chartWidth - marginLeft;
	const plotHeight = chartHeight - marginBottom - marginTop;
</script>

{#if browser}
	<svg viewBox="0 0 {chartWidth} {chartHeight}" class="block w-full" role="img" aria-label="Histogram of net displacement risk across {occupations.length} occupations">
		<!-- Y axis -->
		<line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={marginTop + plotHeight} stroke="#e5e7eb" />
		{#each [0, Math.round(maxCount / 2), maxCount] as tick}
			{@const y = marginTop + plotHeight - (tick / maxCount) * plotHeight}
			<text x={marginLeft - 6} {y} text-anchor="end" class="fill-gray-400 text-[10px]" dominant-baseline="middle">{tick}</text>
			<line x1={marginLeft} y1={y} x2={chartWidth} y2={y} stroke="#f3f4f6" />
		{/each}

		<!-- Bars -->
		{#each binData as bin, i}
			{@const barWidth = plotWidth / binData.length - 2}
			{@const barHeight = (bin.count / maxCount) * plotHeight}
			{@const x = marginLeft + i * (plotWidth / binData.length) + 1}
			{@const y = marginTop + plotHeight - barHeight}
			{@const midpoint = (bin.lower + bin.upper) / 2}
			<rect
				{x}
				{y}
				width={barWidth}
				height={barHeight}
				fill={riskColorScale(midpoint)}
				opacity="0.85"
				rx="1"
			>
				<title>{bin.label}-{((bin.upper) * 100).toFixed(0)}%: {bin.count} occupations</title>
			</rect>
		{/each}

		<!-- X axis labels -->
		{#each binData as bin, i}
			{#if i % 2 === 0}
				{@const x = marginLeft + i * (plotWidth / binData.length) + (plotWidth / binData.length) / 2}
				<text x={x} y={chartHeight - 8} text-anchor="middle" class="fill-gray-400 text-[9px]">{bin.label}</text>
			{/if}
		{/each}

		<!-- Axis label -->
		<text x={chartWidth / 2} y={chartHeight - 0} text-anchor="middle" class="fill-gray-500 text-[10px]">Net Displacement Risk</text>
	</svg>
{/if}
