<script lang="ts">
	import { browser } from '$app/environment';
	import type { Occupation } from '$lib/data';
	import * as d3Scale from 'd3-scale';

	let { occupations }: { occupations: Occupation[] } = $props();

	const brackets = [
		{ label: '< 2K', min: 0, max: 2000 },
		{ label: '2-4K', min: 2000, max: 4000 },
		{ label: '4-6K', min: 4000, max: 6000 },
		{ label: '6-10K', min: 6000, max: 10000 },
		{ label: '10K+', min: 10000, max: Infinity }
	];

	let bracketData = $derived.by(() => {
		return brackets.map((bracket) => {
			const occs = occupations.filter(
				(o) => o.gross_wage_median >= bracket.min && o.gross_wage_median < bracket.max
			);
			const avgRisk =
				occs.length > 0 ? occs.reduce((s, o) => s + o.net_risk, 0) / occs.length : 0;
			return {
				label: bracket.label,
				count: occs.length,
				avgRisk
			};
		});
	});

	let maxRisk = $derived(Math.max(...bracketData.map((b) => b.avgRisk), 0.01));

	const riskColorScale = d3Scale
		.scaleLinear<string>()
		.domain([0, 0.15, 0.35, 0.6])
		.range(['#10b981', '#f59e0b', '#f97316', '#f43f5e'])
		.clamp(true);

	const chartWidth = 400;
	const chartHeight = 180;
	const marginLeft = 50;
	const marginBottom = 30;
	const marginTop = 10;
	const marginRight = 10;
	const plotWidth = chartWidth - marginLeft - marginRight;
	const plotHeight = chartHeight - marginBottom - marginTop;
</script>

{#if browser}
	<svg viewBox="0 0 {chartWidth} {chartHeight}" class="block w-full" role="img" aria-label="Average occupation risk by wage bracket across {occupations.length} occupations">
		<!-- Y axis labels -->
		{#each bracketData as bracket, i}
			{@const barHeight = plotHeight / bracketData.length - 4}
			{@const y = marginTop + i * (plotHeight / bracketData.length) + 2}
			<text x={marginLeft - 6} y={y + barHeight / 2} text-anchor="end" class="fill-gray-500 text-[10px]" dominant-baseline="middle">{bracket.label}</text>
			<rect
				x={marginLeft}
				{y}
				width={Math.max((bracket.avgRisk / maxRisk) * plotWidth, 2)}
				height={barHeight}
				fill={riskColorScale(bracket.avgRisk)}
				opacity="0.85"
				rx="2"
			>
				<title>{bracket.label}: avg risk {(bracket.avgRisk * 100).toFixed(1)}% ({bracket.count} occupations)</title>
			</rect>
			<text
				x={marginLeft + Math.max((bracket.avgRisk / maxRisk) * plotWidth, 2) + 4}
				y={y + barHeight / 2}
				class="fill-gray-600 text-[9px]"
				dominant-baseline="middle"
			>
				{(bracket.avgRisk * 100).toFixed(0)}% ({bracket.count})
			</text>
		{/each}

		<!-- Axis label -->
		<text x={marginLeft + plotWidth / 2} y={chartHeight - 4} text-anchor="middle" class="fill-gray-500 text-[10px]">Avg Occupation Risk (not worker-weighted)</text>
	</svg>
{/if}
