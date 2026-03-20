<script lang="ts">
	import { browser } from '$app/environment';
	import type { Occupation } from '$lib/data';
	import { riskColorScale } from '$lib/design-system';

	let { occupations }: { occupations: Occupation[] } = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let chartWidth = $state(600);

	$effect(() => {
		if (!browser || !containerEl) return;
		const observer = new ResizeObserver(entries => {
			chartWidth = entries[0]!.contentRect.width;
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	const binSize = 0.05;
	// Data-driven max: round up to nearest 0.05 above the highest score, minimum 0.8
	let maxRisk = $derived.by(() => {
		const dataMax = occupations.reduce((max, o) => Math.max(max, o.net_risk), 0);
		return Math.max(0.8, Math.ceil(dataMax / binSize) * binSize);
	});
	let binData = $derived.by(() => {
		const bins = Array.from({ length: Math.ceil(maxRisk / binSize) }, (_, i) => {
			const lower = i * binSize;
			const upper = lower + binSize;
			return { lower, upper, label: `${(lower * 100).toFixed(0)}%`, count: 0 };
		});
		const b = bins.map(bin => ({ ...bin, count: 0 }));
		for (const occ of occupations) {
			const idx = Math.min(Math.floor(occ.net_risk / binSize), b.length - 1);
			if (idx >= 0 && idx < b.length) b[idx]!.count++;
		}
		return b;
	});

	let maxCount = $derived(Math.max(...binData.map(b => b.count), 1));

	const chartHeight = 220;
	const marginLeft = 40;
	const marginBottom = 40;
	const marginTop = 10;
	let plotWidth = $derived(chartWidth - marginLeft);
	const plotHeight = chartHeight - marginBottom - marginTop;

	// Round Y-axis ticks (item 10)
	let yTicks = $derived.by(() => {
		const max = maxCount;
		if (max <= 25) {
			const ticks = [];
			for (let t = 0; t <= max; t += 5) ticks.push(t);
			if (ticks[ticks.length - 1]! < max) ticks.push(max);
			return ticks;
		}
		const candidates = [0, 25, 50, 75, 100, 125, 150, 175, 200];
		return candidates.filter(t => t <= max * 1.05);
	});
</script>

<div bind:this={containerEl}>
	{#if browser}
		<svg
			viewBox="0 0 {chartWidth} {chartHeight}"
			class="block w-full"
			role="img"
			aria-label="Histogram of net displacement risk across {occupations.length} occupations"
		>
			<!-- Y axis -->
			<line
				x1={marginLeft}
				y1={marginTop}
				x2={marginLeft}
				y2={marginTop + plotHeight}
				stroke="var(--border)"
			/>
			{#each yTicks as tick}
				{@const y = marginTop + plotHeight - (tick / maxCount) * plotHeight}
				<text
					x={marginLeft - 6}
					{y}
					text-anchor="end"
					class="fill-muted-foreground text-xs"
					dominant-baseline="middle">{tick}</text
				>
				<line x1={marginLeft} y1={y} x2={chartWidth} y2={y} stroke="var(--border)" opacity="0.4" />
			{/each}

			<!-- Bars + X axis labels -->
			{#each binData as bin, i}
				{@const slotWidth = plotWidth / binData.length}
				{@const gap = 1}
				{@const barWidth = slotWidth - gap * 2}
				{@const barHeight = (bin.count / maxCount) * plotHeight}
				{@const barX = marginLeft + i * slotWidth + gap}
				{@const barCenterX = marginLeft + i * slotWidth + slotWidth / 2}
				{@const barY = marginTop + plotHeight - barHeight}
				{@const midpoint = (bin.lower + bin.upper) / 2}
				<rect
					x={barX}
					y={barY}
					width={barWidth}
					height={barHeight}
					fill={riskColorScale(midpoint)}
					opacity="0.85"
					rx="1"
				>
					<title>{bin.label}-{(bin.upper * 100).toFixed(0)}%: {bin.count} occupations</title>
				</rect>

				{#if i % 2 === 0}
					<text
						x={barCenterX}
						y={marginTop + plotHeight + 16}
						text-anchor="middle"
						class="fill-muted-foreground text-xs tabular-nums">{bin.label}</text
					>
				{/if}
			{/each}

			<!-- Risk band threshold lines -->
			{#each [{ v: 0.05, label: 'Low' }, { v: 0.15, label: 'Mod' }, { v: 0.3, label: 'High' }, { v: 0.5, label: 'V.High' }] as threshold}
				{@const tx = marginLeft + (threshold.v / maxRisk) * plotWidth}
				<line
					x1={tx}
					y1={marginTop}
					x2={tx}
					y2={marginTop + plotHeight}
					stroke="var(--foreground)"
					stroke-width="1"
					stroke-dasharray="3,3"
					opacity="0.2"
				/>
				<text
					x={tx}
					y={marginTop - 2}
					text-anchor="middle"
					class="fill-muted-foreground"
					style="font-size: 8px;">{threshold.label}</text
				>
			{/each}

			<!-- Axis label -->
			<text
				x={marginLeft + plotWidth / 2}
				y={chartHeight - 6}
				text-anchor="middle"
				class="fill-muted-foreground text-xs">Risk Score</text
			>
		</svg>
	{/if}
</div>
