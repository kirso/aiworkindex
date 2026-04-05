<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import * as d3Scale from 'd3-scale';
	import { impactTypeColors } from '$lib/data';
	import Tooltip from './Tooltip.svelte';

	type MatrixRow = {
		title: string;
		net_risk?: number;
		structuralPressure?: number;
		demandStrength?: number;
		market?: { market_resilience: number };
		evidence?: {
			sol_match?: 'exact' | 'prefix' | false;
			jobs_in_demand_match?: 'exact' | 'prefix' | false;
		};
		impact_type?: keyof typeof impactTypeColors;
		risk_band?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
		linkHref?: string | null;
		ssoc?: string;
		localCode?: string;
	};

	type QuadrantLabel = { label: string; x: number; y: number };

	let {
		occupations,
		surfaceLabel = 'selected surface',
		xAxisLabel = 'Structural AI Pressure',
		yAxisLabel = 'Demand Signal Strength',
		quadrantLabels = [
			{ label: 'Low risk, high demand', x: 0.1, y: 0.85 },
			{ label: 'Low risk, low demand', x: 0.1, y: 0.15 },
			{ label: 'High risk, high demand', x: 0.55, y: 0.85 },
			{ label: 'High risk, low demand', x: 0.55, y: 0.15 }
		] as QuadrantLabel[]
	}: {
		occupations: MatrixRow[];
		surfaceLabel?: string;
		xAxisLabel?: string;
		yAxisLabel?: string;
		quadrantLabels?: QuadrantLabel[];
	} = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let width = $state(800);
	let height = $state(500);

	const margin = { top: 30, right: 30, bottom: 50, left: 55 };

	let tooltipOccupation: MatrixRow | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipVisible = $state(false);

	let plotWidth = $derived(Math.max(0, width - margin.left - margin.right));
	let plotHeight = $derived(Math.max(0, height - margin.top - margin.bottom));
	let xDomainMax = $derived.by(() => {
		const maxRisk = occupations.reduce((max, occupation) => Math.max(max, riskValue(occupation)), 0);
		return Math.max(0.7, Math.ceil(maxRisk * 10) / 10);
	});
	let xTicks = $derived.by(() => {
		const steps = 5;
		return Array.from({ length: steps }, (_, index) => (xDomainMax / (steps - 1)) * index);
	});

	// X = structural risk (net_risk), Y = demand signal strength
	let xScale = $derived(d3Scale.scaleLinear().domain([0, xDomainMax]).range([0, plotWidth]));
	let yScale = $derived(d3Scale.scaleLinear().domain([0, 1]).range([plotHeight, 0]));

	const dotRadius = 4.5;
	const crosshairX = 0.25;
	const crosshairY = 0.4;

	$effect(() => {
		if (!browser || !containerEl) return;
		const observer = new ResizeObserver(entries => {
			for (const entry of entries) {
				const rect = entry.contentRect;
				width = Math.max(100, rect.width);
				height = Math.max(350, Math.min(rect.width * 0.55, 500));
			}
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	function demandStrength(occ: MatrixRow): number {
		if (typeof occ.demandStrength === 'number') return occ.demandStrength;
		// Base: market_resilience (0.12–0.92, good spread)
		let s = (occ.market?.market_resilience ?? 0) * 0.7;
		// SOL/JiD boost on top
		if (occ.evidence?.sol_match === 'exact') s += 0.2;
		else if (occ.evidence?.sol_match === 'prefix') s += 0.12;
		if (occ.evidence?.jobs_in_demand_match === 'exact') s += 0.15;
		else if (occ.evidence?.jobs_in_demand_match === 'prefix') s += 0.08;
		return Math.min(s, 1);
	}

	function dotColor(occ: MatrixRow): string {
		return occ.impact_type ? impactTypeColors[occ.impact_type] ?? '#999' : '#999';
	}

	function handleMouseMove(e: MouseEvent, occ: MatrixRow) {
		tooltipOccupation = occ;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
		tooltipVisible = true;
	}

	function handleMouseLeave() {
		tooltipVisible = false;
		tooltipOccupation = null;
	}

	function handleClick(occ: MatrixRow) {
		const href = occ.linkHref ?? (occ.ssoc ? `/occupation/${occ.ssoc}` : null);
		if (href) goto(href);
	}

	function riskValue(occ: MatrixRow): number {
		return occ.net_risk ?? occ.structuralPressure ?? 0;
	}

	const quadrantColors = {
		safe: 'var(--color-risk-very-low-subtle)',
		safeQuiet: 'var(--color-impact-leveraged-subtle)',
		paradox: 'var(--color-risk-moderate-subtle)',
		pressure: 'var(--color-risk-very-high-subtle)'
	} as const;
</script>

<div bind:this={containerEl} class="relative w-full">
	{#if browser}
		<svg
			{width}
			{height}
			class="block"
			role="img"
			aria-label="{surfaceLabel} demand vs pressure matrix for {occupations.length} occupations"
		>
			<g transform="translate({margin.left},{margin.top})">
				<!-- Quadrant fills -->
				<rect
					x={0}
					y={0}
					width={xScale(crosshairX)}
					height={yScale(crosshairY)}
					fill={quadrantColors.safe}
					opacity="0.4"
				/>
				<rect
					x={xScale(crosshairX)}
					y={0}
					width={plotWidth - xScale(crosshairX)}
					height={yScale(crosshairY)}
					fill={quadrantColors.paradox}
					opacity="0.4"
				/>
				<rect
					x={0}
					y={yScale(crosshairY)}
					width={xScale(crosshairX)}
					height={plotHeight - yScale(crosshairY)}
					fill={quadrantColors.safeQuiet}
					opacity="0.4"
				/>
				<rect
					x={xScale(crosshairX)}
					y={yScale(crosshairY)}
					width={plotWidth - xScale(crosshairX)}
					height={plotHeight - yScale(crosshairY)}
					fill={quadrantColors.pressure}
					opacity="0.4"
				/>

				<!-- Crosshair -->
				<line
					x1={xScale(crosshairX)}
					y1={0}
					x2={xScale(crosshairX)}
					y2={plotHeight}
					stroke="var(--muted-foreground)"
					stroke-width="1"
					stroke-dasharray="4,3"
					opacity="0.4"
				/>
				<line
					x1={0}
					y1={yScale(crosshairY)}
					x2={plotWidth}
					y2={yScale(crosshairY)}
					stroke="var(--muted-foreground)"
					stroke-width="1"
					stroke-dasharray="4,3"
					opacity="0.4"
				/>

				<!-- Quadrant labels -->
				{#each quadrantLabels as ql}
					<text
						x={xScale(ql.x)}
						y={yScale(ql.y)}
						text-anchor="middle"
						class="fill-muted-foreground text-xs font-medium"
						style="pointer-events: none;"
					>
						{ql.label}
					</text>
				{/each}

				<!-- Dots -->
				{#each occupations as occ (occ.ssoc ?? occ.localCode ?? occ.title)}
					{@const ds = demandStrength(occ)}
					{@const href = occ.linkHref ?? (occ.ssoc ? `/occupation/${occ.ssoc}` : null)}
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<circle
						cx={xScale(Math.max(0, Math.min(xDomainMax, riskValue(occ))))}
						cy={yScale(Math.max(0, Math.min(1, ds)))}
						r={dotRadius}
						fill={dotColor(occ)}
						opacity="0.65"
						class={href ? 'cursor-pointer' : ''}
						role={href ? 'button' : undefined}
						tabindex={href ? 0 : undefined}
						onmousemove={e => handleMouseMove(e, occ)}
						onmouseleave={handleMouseLeave}
						onclick={() => handleClick(occ)}
						onkeydown={e => {
							if (href && (e.key === 'Enter' || e.key === ' ')) {
								e.preventDefault();
								handleClick(occ);
							}
						}}
					/>
				{/each}

				<!-- X axis -->
				<line x1={0} y1={plotHeight} x2={plotWidth} y2={plotHeight} stroke="var(--border)" />
				{#each xTicks as tick}
					<text
						x={xScale(tick)}
						y={plotHeight + 18}
						text-anchor="middle"
						class="fill-muted-foreground text-xs"
					>
						{(tick * 100).toFixed(0)}%
					</text>
				{/each}
				<text
					x={plotWidth / 2}
					y={plotHeight + 38}
					text-anchor="middle"
					class="fill-muted-foreground text-xs font-medium"
				>
					{xAxisLabel}
				</text>

				<!-- Y axis -->
				<line x1={0} y1={0} x2={0} y2={plotHeight} stroke="var(--border)" />
				{#each [0, 0.25, 0.5, 0.75, 1] as tick}
					<text x={-8} y={yScale(tick) + 4} text-anchor="end" class="fill-muted-foreground text-xs">
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
					{yAxisLabel}
				</text>
			</g>
		</svg>

		<!-- Legend -->
		<div
			class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-4"
		>
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-3 w-3 shrink-0 rounded-full"
					style="background: {impactTypeColors.ai_leveraged};"
				></span>
				<span>Augmented</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-3 w-3 shrink-0 rounded-full"
					style="background: {impactTypeColors.at_risk};"
				></span>
				<span>At Risk</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-3 w-3 shrink-0 rounded-full"
					style="background: {impactTypeColors.mixed};"
				></span>
				<span>Mixed</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-3 w-3 shrink-0 rounded-full"
					style="background: {impactTypeColors.stable};"
				></span>
				<span>Stable</span>
			</div>
		</div>
	{:else}
		<div class="flex h-80 items-center justify-center bg-muted text-muted-foreground">
			Loading chart...
		</div>
	{/if}
</div>

<Tooltip occupation={tooltipOccupation} x={tooltipX} y={tooltipY} visible={tooltipVisible} />
