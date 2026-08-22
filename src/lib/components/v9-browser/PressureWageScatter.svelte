<script lang="ts">
	import { goto } from '$app/navigation';
	import { pressureColorScale } from '$lib/design-system';
	import ChartFrame from './ChartFrame.svelte';

	interface ScatterItem {
		code: string;
		title: string;
		pressureRank: number | null;
		wageMedian: number | null;
		demandSignalCount: number;
	}

	interface Props {
		items: ScatterItem[];
		title?: string;
		selectedCode?: string | null;
	}

	let {
		items,
		title = 'AI task pressure and direct monthly wages',
		selectedCode = $bindable(null)
	}: Props = $props();

	let containerEl = $state<HTMLButtonElement>();
	let containerWidth = $state(0);
	let hoveredCode = $state<string | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let keyboardIndex = $state(0);

	let plotted = $derived(
		items
			.filter(
				(item): item is ScatterItem & { pressureRank: number; wageMedian: number } =>
					item.pressureRank != null && item.wageMedian != null
			)
			.sort(
				(a, b) =>
					a.pressureRank - b.pressureRank ||
					a.wageMedian - b.wageMedian ||
					a.title.localeCompare(b.title)
			)
	);
	let chartWidth = $derived(Math.max(300, containerWidth));
	let chartHeight = $derived(containerWidth < 640 ? 390 : 455);
	let margin = $derived(
		containerWidth < 640
			? { top: 18, right: 12, bottom: 56, left: 52 }
			: { top: 22, right: 20, bottom: 62, left: 72 }
	);
	let plotWidth = $derived(chartWidth - margin.left - margin.right);
	let plotHeight = $derived(chartHeight - margin.top - margin.bottom);
	let maxWage = $derived(
		Math.max(5000, Math.ceil(Math.max(...plotted.map(item => item.wageMedian), 0) / 5000) * 5000)
	);
	let yTicks = $derived(Array.from({ length: maxWage / 5000 + 1 }, (_, index) => index * 5000));
	let xTicks = $derived(containerWidth < 640 ? [0, 50, 100] : [0, 25, 50, 75, 100]);
	let namedDemandCount = $derived(plotted.filter(item => item.demandSignalCount > 0).length);
	let selectedItem = $derived(plotted.find(item => item.code === selectedCode) ?? null);
	let hoveredItem = $derived(plotted.find(item => item.code === hoveredCode) ?? null);

	$effect(() => {
		if (!containerEl) return;
		const observer = new ResizeObserver(entries => {
			containerWidth = Math.max(300, Math.floor(entries[0]?.contentRect.width ?? 0));
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (plotted.length === 0) {
			keyboardIndex = 0;
			return;
		}
		const selectedIndex = selectedCode ? plotted.findIndex(item => item.code === selectedCode) : -1;
		if (selectedIndex >= 0) keyboardIndex = selectedIndex;
		else if (keyboardIndex >= plotted.length) keyboardIndex = plotted.length - 1;
	});

	function x(value: number): number {
		return margin.left + (value / 100) * plotWidth;
	}

	function y(value: number): number {
		return margin.top + plotHeight - (value / maxWage) * plotHeight;
	}

	function wage(value: number): string {
		return `SGD ${value.toLocaleString()}/month`;
	}

	function pressure(value: number): string {
		return `pressure percentile ${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
	}

	function diamondPath(cx: number, cy: number, radius: number): string {
		return `M ${cx} ${cy - radius} L ${cx + radius} ${cy} L ${cx} ${cy + radius} L ${cx - radius} ${cy} Z`;
	}

	function select(item: ScatterItem & { pressureRank: number; wageMedian: number }): void {
		selectedCode = item.code;
		const index = plotted.findIndex(candidate => candidate.code === item.code);
		if (index >= 0) keyboardIndex = index;
	}

	function showTooltip(
		event: PointerEvent,
		item: ScatterItem & { pressureRank: number; wageMedian: number }
	): void {
		if (!containerEl || event.pointerType === 'touch') return;
		const bounds = containerEl.getBoundingClientRect();
		hoveredCode = item.code;
		tooltipX = Math.max(8, Math.min(event.clientX - bounds.left + 12, bounds.width - 228));
		tooltipY = Math.max(8, Math.min(event.clientY - bounds.top + 12, bounds.height - 112));
	}

	function itemFromTarget(
		target: EventTarget | null
	): (ScatterItem & { pressureRank: number; wageMedian: number }) | null {
		if (!(target instanceof Element)) return null;
		const code = target.closest('[data-occupation-code]')?.getAttribute('data-occupation-code');
		return code ? (plotted.find(item => item.code === code) ?? null) : null;
	}

	function handlePointerMove(event: PointerEvent): void {
		const item = itemFromTarget(event.target);
		if (item) showTooltip(event, item);
		else hoveredCode = null;
	}

	function handleClick(event: MouseEvent): void {
		const item = itemFromTarget(event.target) ?? plotted[keyboardIndex] ?? null;
		if (item) void goto(`/occupation/${item.code}`);
	}

	function handleKeyboard(event: KeyboardEvent): void {
		if (plotted.length === 0) return;
		let next = keyboardIndex;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next += 1;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next -= 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = plotted.length - 1;
		else if (event.key === 'Enter' && selectedItem) {
			event.preventDefault();
			void goto(`/occupation/${selectedItem.code}`);
			return;
		} else return;

		event.preventDefault();
		keyboardIndex = (next + plotted.length) % plotted.length;
		const item = plotted[keyboardIndex];
		if (item) select(item);
	}
</script>

<ChartFrame
	id="pressure-wage-scatter"
	{title}
	subtitle="{plotted.length.toLocaleString()} filtered SSOC 2024 occupations with both a V9 pressure rank and a direct MOM June 2025 gross monthly wage row. Diamonds mark occupations also named in a selected MOM demand source."
	source="AI Work Index V9 pressure percentiles and direct MOM Occupational Wages 2025 rows (June 2025 reference period)."
	note="Wages are direct June 2025 MOM occupation rows. Missing wages are omitted, not treated as zero. Named-demand diamonds only identify matches in selected lists. The chart shows association and supplies no causal or job-loss estimate."
>
	<div class="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
		<div class="flex flex-wrap items-center gap-4">
			<span class="inline-flex items-center gap-1.5">
				<span class="pressure-legend h-2.5 w-16 border border-border" aria-hidden="true"></span>
				Colour = pressure percentile
			</span>
			<span class="inline-flex items-center gap-1.5">
				<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"
					><path
						d="M 6 0.75 L 11.25 6 L 6 11.25 L 0.75 6 Z"
						fill="var(--color-chart-3)"
						stroke="var(--color-foreground)"
						stroke-width="0.8"
					></path></svg
				>
				Named demand evidence
			</span>
		</div>
		<p>
			<span class="font-mono font-medium text-foreground">{namedDemandCount}</span> plotted occupations
			have a named signal
		</p>
	</div>

	{#if plotted.length === 0}
		<div
			class="rounded-lg border border-dashed border-border bg-surface-subtle px-4 py-12 text-center"
		>
			<p class="text-sm text-muted-foreground">
				No occupation in this filtered view has both direct wage and pressure evidence.
			</p>
		</div>
	{:else}
		<button
			type="button"
			bind:this={containerEl}
			class="relative block min-h-[24.375rem] w-full overflow-hidden rounded-lg border-0 bg-surface-subtle p-0 text-left outline-none"
			aria-label="Scatter plot. Select a point to open its occupation. Use arrow keys to move and Enter to open."
			onclick={handleClick}
			onkeydown={handleKeyboard}
			onpointermove={handlePointerMove}
			onpointerleave={() => (hoveredCode = null)}
		>
			{#if containerWidth > 0}
				<svg
					width={chartWidth}
					height={chartHeight}
					viewBox="0 0 {chartWidth} {chartHeight}"
					class="block max-w-full"
					role="img"
					aria-label="Scatter plot of AI work pressure percentile against gross monthly wage for {plotted.length} occupations"
				>
					{#each yTicks as tick (tick)}
						<line
							x1={margin.left}
							x2={chartWidth - margin.right}
							y1={y(tick)}
							y2={y(tick)}
							stroke="var(--color-border)"
							stroke-width="1"
						></line>
						<text
							x={margin.left - 8}
							y={y(tick) + 4}
							text-anchor="end"
							font-size="12"
							fill="var(--color-muted-foreground)"
						>
							{tick === 0 ? '0' : `${tick / 1000}k`}
						</text>
					{/each}

					{#each xTicks as tick (tick)}
						<line
							x1={x(tick)}
							x2={x(tick)}
							y1={margin.top}
							y2={chartHeight - margin.bottom}
							stroke="var(--color-border)"
							stroke-width="1"
						></line>
						<text
							x={x(tick)}
							y={chartHeight - margin.bottom + 20}
							text-anchor="middle"
							font-size="12"
							fill="var(--color-muted-foreground)"
						>
							{tick}
						</text>
					{/each}

					<line
						x1={margin.left}
						x2={chartWidth - margin.right}
						y1={chartHeight - margin.bottom}
						y2={chartHeight - margin.bottom}
						stroke="var(--color-foreground)"
						stroke-width="1.25"
					></line>
					<line
						x1={margin.left}
						x2={margin.left}
						y1={margin.top}
						y2={chartHeight - margin.bottom}
						stroke="var(--color-foreground)"
						stroke-width="1.25"
					></line>

					{#each plotted as item (item.code)}
						{@const selected = item.code === selectedCode}
						{#if item.demandSignalCount > 0}
							<path
								data-occupation-code={item.code}
								d={diamondPath(x(item.pressureRank), y(item.wageMedian), selected ? 7 : 5)}
								fill={pressureColorScale(item.pressureRank)}
								fill-opacity={selected ? 1 : 0.82}
								stroke={selected ? 'var(--color-foreground)' : 'var(--color-card)'}
								stroke-width={selected ? 1.8 : 0.8}
								class="scatter-dot cursor-pointer"
							>
								<title
									>{item.title}; {pressure(item.pressureRank)}; {wage(item.wageMedian)}; named
									demand evidence</title
								>
							</path>
						{:else}
							<circle
								data-occupation-code={item.code}
								cx={x(item.pressureRank)}
								cy={y(item.wageMedian)}
								r={selected ? 6.5 : 4}
								fill={pressureColorScale(item.pressureRank)}
								fill-opacity={selected ? 1 : 0.72}
								stroke={selected ? 'var(--color-foreground)' : 'var(--color-card)'}
								stroke-width={selected ? 1.8 : 0.75}
								class="scatter-dot cursor-pointer"
							>
								<title>{item.title}; {pressure(item.pressureRank)}; {wage(item.wageMedian)}</title>
							</circle>
						{/if}
					{/each}

					<text
						x={margin.left + plotWidth / 2}
						y={chartHeight - 13}
						text-anchor="middle"
						font-size="12"
						font-weight="600"
						fill="var(--color-foreground)"
					>
						AI task-pressure percentile
					</text>
					<text
						transform="translate(15 {margin.top + plotHeight / 2}) rotate(-90)"
						text-anchor="middle"
						font-size="12"
						font-weight="600"
						fill="var(--color-foreground)"
					>
						Gross monthly wage (SGD)
					</text>
				</svg>

				{#if hoveredItem}
					<div
						class="pointer-events-none absolute z-10 w-56 rounded-lg border border-border bg-popover p-3 text-xs shadow-md"
						style="left: {tooltipX}px; top: {tooltipY}px;"
						role="tooltip"
					>
						<p class="font-semibold leading-snug text-foreground">{hoveredItem.title}</p>
						<p class="mt-1 text-text-secondary">{pressure(hoveredItem.pressureRank)}</p>
						<p class="mt-0.5 text-text-secondary">{wage(hoveredItem.wageMedian)}</p>
						{#if hoveredItem.demandSignalCount > 0}
							<p class="mt-0.5 text-text-secondary">
								{hoveredItem.demandSignalCount} named demand signal{hoveredItem.demandSignalCount ===
								1
									? ''
									: 's'}
							</p>
						{/if}
					</div>
				{/if}
			{:else}
				<div
					class="h-[24.375rem] animate-pulse bg-surface-subtle"
					aria-label="Laying out pressure and wage chart"
				></div>
			{/if}
		</button>

		<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
			Select a point to open the occupation. With a keyboard, use arrow keys to move and Enter to
			open. Use the List view for exact lookup.
		</p>
	{/if}
</ChartFrame>
