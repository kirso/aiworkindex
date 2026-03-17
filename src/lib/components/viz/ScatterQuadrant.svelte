<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import * as d3Scale from 'd3-scale';
	import type { Occupation } from '$lib/data';
	import { majorGroupByKey } from '$lib/data';
	import Tooltip from './Tooltip.svelte';

	let { occupations }: { occupations: Occupation[] } = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let width = $state(800);
	let height = $state(500);

	const margin = { top: 30, right: 30, bottom: 50, left: 55 };

	let tooltipOccupation: Occupation | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipVisible = $state(false);

	let plotWidth = $derived(width - margin.left - margin.right);
	let plotHeight = $derived(height - margin.top - margin.bottom);

	// Exposure and bottleneck are already 0-1 percentile ranks
	let xScale = $derived(d3Scale.scaleLinear().domain([0, 1]).range([0, plotWidth]));
	let yScale = $derived(d3Scale.scaleLinear().domain([0, 1]).range([plotHeight, 0]));

	const dotRadius = 4.5;

	// Crosshair at the median (0.5 percentile)
	const crosshairX = 0.5;
	const crosshairY = 0.5;

	// ResizeObserver
	$effect(() => {
		if (!browser || !containerEl) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const rect = entry.contentRect;
				width = rect.width;
				height = Math.max(350, Math.min(rect.width * 0.55, 500));
			}
		});

		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	function groupColor(groupKey: string): string {
		return majorGroupByKey.get(groupKey)?.color ?? '#999';
	}

	function handleMouseMove(e: MouseEvent, occ: Occupation) {
		tooltipOccupation = occ;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
		tooltipVisible = true;
	}

	function handleMouseLeave() {
		tooltipVisible = false;
		tooltipOccupation = null;
	}

	function handleClick(occ: Occupation) {
		goto('/occupation/' + occ.ssoc);
	}

	// Quadrant labels (item 17: plain English)
	const quadrantLabels = [
		{ label: 'Resilient', x: 0.15, y: 0.85 },
		{ label: 'Unaffected', x: 0.15, y: 0.15 },
		{ label: 'AI Augmented', x: 0.85, y: 0.85 },
		{ label: 'At Risk', x: 0.85, y: 0.15 }
	];
</script>

<div bind:this={containerEl} class="relative w-full">
	{#if browser}
		<svg {width} {height} class="block" role="img" aria-label="Scatter plot of AI Exposure vs Human Skills Required for {occupations.length} occupations, divided into four quadrants: AI Augmented, At Risk, Resilient, and Unaffected">
			<g transform="translate({margin.left},{margin.top})">
				<!-- Quadrant background fills (item 19: muted token-compatible) -->
				<rect x={0} y={0} width={xScale(crosshairX)} height={yScale(crosshairY)} fill="oklch(0.96 0.02 155)" opacity="0.4" />
				<rect x={xScale(crosshairX)} y={0} width={plotWidth - xScale(crosshairX)} height={yScale(crosshairY)} fill="oklch(0.96 0.02 85)" opacity="0.4" />
				<rect x={0} y={yScale(crosshairY)} width={xScale(crosshairX)} height={plotHeight - yScale(crosshairY)} fill="oklch(0.97 0.01 265)" opacity="0.4" />
				<rect x={xScale(crosshairX)} y={yScale(crosshairY)} width={plotWidth - xScale(crosshairX)} height={plotHeight - yScale(crosshairY)} fill="oklch(0.96 0.02 20)" opacity="0.4" />

				<!-- Crosshair lines -->
				<line
					x1={xScale(crosshairX)} y1={0}
					x2={xScale(crosshairX)} y2={plotHeight}
					stroke="var(--muted-foreground)" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"
				/>
				<line
					x1={0} y1={yScale(crosshairY)}
					x2={plotWidth} y2={yScale(crosshairY)}
					stroke="var(--muted-foreground)" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"
				/>

				<!-- Quadrant labels -->
				{#each quadrantLabels as ql}
					<text
						x={xScale(ql.x)}
						y={yScale(ql.y)}
						text-anchor="middle"
						class="fill-muted-foreground text-[11px] font-medium"
						style="pointer-events: none;"
					>
						{ql.label}
					</text>
				{/each}

				<!-- Dots -->
				{#each occupations as occ (occ.ssoc)}
					<circle
						cx={xScale(occ.exposure)}
						cy={yScale(occ.bottleneck)}
						r={dotRadius}
						fill={groupColor(occ.major_group)}
						opacity="0.65"
						class="scatter-dot cursor-pointer"
						role="button"
						tabindex="0"
						onmousemove={(e) => handleMouseMove(e, occ)}
						onmouseleave={handleMouseLeave}
						onclick={() => handleClick(occ)}
						onkeydown={(e) => { if (e.key === 'Enter') handleClick(occ); }}
					/>
				{/each}

				<!-- X axis -->
				<line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="var(--border)" />
				{#each [0, 0.25, 0.5, 0.75, 1] as tick}
					<text
						x={xScale(tick)}
						y={plotHeight + 18}
						text-anchor="middle"
						class="fill-muted-foreground text-[10px]"
					>
						{tick.toFixed(2)}
					</text>
				{/each}
				<text
					x={plotWidth / 2}
					y={plotHeight + 38}
					text-anchor="middle"
					class="fill-muted-foreground text-xs font-medium"
				>
					AI Exposure
				</text>

				<!-- Y axis -->
				<line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" />
				{#each [0, 0.25, 0.5, 0.75, 1] as tick}
					<text
						x={-8}
						y={yScale(tick) + 4}
						text-anchor="end"
						class="fill-muted-foreground text-[10px]"
					>
						{tick.toFixed(2)}
					</text>
				{/each}
				<text
					x={-(plotHeight / 2)}
					y={-40}
					text-anchor="middle"
					transform="rotate(-90)"
					class="fill-muted-foreground text-xs font-medium"
				>
					Human Skills Required
				</text>
			</g>
		</svg>

		<!-- Quadrant legend (item 18) -->
		<div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground sm:grid-cols-4">
			<div><span class="inline-block h-2 w-2 rounded-sm" style="background: oklch(0.96 0.02 155);"></span> <span class="font-medium">Resilient</span> — Low exposure, high human skills</div>
			<div><span class="inline-block h-2 w-2 rounded-sm" style="background: oklch(0.96 0.02 85);"></span> <span class="font-medium">AI Augmented</span> — High exposure, high human skills</div>
			<div><span class="inline-block h-2 w-2 rounded-sm" style="background: oklch(0.97 0.01 265);"></span> <span class="font-medium">Unaffected</span> — Low exposure, low human skills</div>
			<div><span class="inline-block h-2 w-2 rounded-sm" style="background: oklch(0.96 0.02 20);"></span> <span class="font-medium">At Risk</span> — High exposure, low human skills</div>
		</div>
	{:else}
		<div class="flex h-80 items-center justify-center bg-muted text-muted-foreground">
			Loading scatter plot...
		</div>
	{/if}
</div>

<Tooltip
	occupation={tooltipOccupation}
	x={tooltipX}
	y={tooltipY}
	visible={tooltipVisible}
/>
