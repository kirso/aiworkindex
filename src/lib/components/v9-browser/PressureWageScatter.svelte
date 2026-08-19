<script lang="ts">
	interface ScatterItem {
		code: string;
		title: string;
		pressureRank: number | null;
		wageMedian: number | null;
		demandSignalCount: number;
	}

	let {
		items,
		title = 'AI work pressure and direct monthly wages'
	}: { items: ScatterItem[]; title?: string } = $props();

	const width = 860;
	const height = 430;
	const margin = { top: 24, right: 22, bottom: 58, left: 72 };
	const plotWidth = width - margin.left - margin.right;
	const plotHeight = height - margin.top - margin.bottom;

	let plotted = $derived(
		items.filter(
			(item): item is ScatterItem & { pressureRank: number; wageMedian: number } =>
				item.pressureRank != null && item.wageMedian != null
		)
	);
	let maxWage = $derived(
		Math.max(5000, Math.ceil(Math.max(...plotted.map(item => item.wageMedian), 0) / 5000) * 5000)
	);
	let yTicks = $derived(Array.from({ length: maxWage / 5000 + 1 }, (_, index) => index * 5000));
	let minimumWage = $derived(
		plotted.length > 0 ? Math.min(...plotted.map(item => item.wageMedian)) : 0
	);
	let namedDemandCount = $derived(plotted.filter(item => item.demandSignalCount > 0).length);

	function x(value: number): number {
		return margin.left + (value / 100) * plotWidth;
	}

	function y(value: number): number {
		return margin.top + plotHeight - (value / maxWage) * plotHeight;
	}
</script>

<figure class="min-w-0 border border-border bg-card p-3 sm:p-5">
	<div class="mb-3">
		<h3 class="text-sm font-semibold text-foreground">{title}</h3>
		<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
			{plotted.length} SSOC 2024 occupations with both a V9 pressure rank and a direct MOM wage row. Gold
			points were also named in a selected MOM demand source.
		</p>
	</div>

	<div class="grid gap-px bg-border sm:hidden">
		<div class="bg-card p-3">
			<p class="font-mono text-lg font-bold tabular-nums">{plotted.length}</p>
			<p class="text-xs text-muted-foreground">
				occupations with direct wage and pressure evidence
			</p>
		</div>
		<div class="grid grid-cols-2 gap-px bg-border">
			<div class="bg-card p-3">
				<p class="font-mono text-sm font-bold tabular-nums">
					SGD {minimumWage.toLocaleString()}–{Math.max(
						...plotted.map(item => item.wageMedian),
						0
					).toLocaleString()}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">published wage range in the plot</p>
			</div>
			<div class="bg-card p-3">
				<p class="font-mono text-sm font-bold tabular-nums">{namedDemandCount}</p>
				<p class="mt-1 text-xs text-muted-foreground">also named in selected demand sources</p>
			</div>
		</div>
		<p class="bg-card p-3 text-xs leading-relaxed text-muted-foreground">
			The full scatter appears on wider screens. Use the occupation lists below to inspect
			individual records on this device.
		</p>
	</div>

	<svg
		viewBox="0 0 {width} {height}"
		class="hidden h-auto w-full min-w-0 sm:block"
		role="img"
		aria-label="Scatter plot of AI work pressure percentile against gross monthly wage"
	>
		{#each yTicks as tick (tick)}
			<line
				x1={margin.left}
				x2={width - margin.right}
				y1={y(tick)}
				y2={y(tick)}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<text
				x={margin.left - 10}
				y={y(tick) + 4}
				text-anchor="end"
				font-size="11"
				fill="var(--color-muted-foreground)"
			>
				{tick === 0 ? '0' : `${tick / 1000}k`}
			</text>
		{/each}

		{#each [0, 25, 50, 75, 100] as tick (tick)}
			<line
				x1={x(tick)}
				x2={x(tick)}
				y1={margin.top}
				y2={height - margin.bottom}
				stroke="var(--color-border)"
				stroke-width="1"
			/>
			<text
				x={x(tick)}
				y={height - margin.bottom + 20}
				text-anchor="middle"
				font-size="11"
				fill="var(--color-muted-foreground)"
			>
				{tick}
			</text>
		{/each}

		<line
			x1={margin.left}
			x2={width - margin.right}
			y1={height - margin.bottom}
			y2={height - margin.bottom}
			stroke="var(--color-foreground)"
			stroke-width="1.25"
		/>
		<line
			x1={margin.left}
			x2={margin.left}
			y1={margin.top}
			y2={height - margin.bottom}
			stroke="var(--color-foreground)"
			stroke-width="1.25"
		/>

		{#each plotted as item (item.code)}
			<a
				href="/occupation/{item.code}"
				aria-label="{item.title}, pressure percentile {item.pressureRank}, SGD {item.wageMedian} per month"
			>
				<circle
					cx={x(item.pressureRank)}
					cy={y(item.wageMedian)}
					r={item.demandSignalCount > 0 ? 4.5 : 3.5}
					fill={item.demandSignalCount > 0 ? 'var(--color-risk-moderate)' : 'var(--color-primary)'}
					fill-opacity={item.demandSignalCount > 0 ? 0.78 : 0.28}
					stroke={item.demandSignalCount > 0 ? 'var(--color-foreground)' : 'var(--color-primary)'}
					stroke-width={item.demandSignalCount > 0 ? 1.2 : 0.45}
				>
					<title
						>{item.title} — pressure percentile {item.pressureRank}; SGD {item.wageMedian.toLocaleString()}/month</title
					>
				</circle>
			</a>
		{/each}

		<text
			x={margin.left + plotWidth / 2}
			y={height - 12}
			text-anchor="middle"
			font-size="12"
			font-weight="600"
			fill="var(--color-foreground)"
		>
			AI work pressure percentile
		</text>
		<text
			transform="translate(17 {margin.top + plotHeight / 2}) rotate(-90)"
			text-anchor="middle"
			font-size="12"
			font-weight="600"
			fill="var(--color-foreground)"
		>
			Gross monthly wage (SGD)
		</text>
	</svg>

	<figcaption class="mt-2 text-xs leading-relaxed text-muted-foreground">
		Wages are direct June 2025 MOM occupation rows. Missing wages are omitted, not treated as zero.
		Pressure is a within-release percentile derived from ILO 2025 task-exposure evidence through the
		official SSOC–ISCO mapping. It is not a probability of job loss.
	</figcaption>
</figure>
