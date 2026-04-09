<script lang="ts">
	import { browser } from '$app/environment';
	import type { Occupation } from '$lib/data';
	import { cn } from '$lib/utils';

	let { occupations }: { occupations: Occupation[] } = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let width = $state(700);

	let marginLeft = $derived(width < 640 ? 120 : 180);
	let marginRight = $derived(width < 640 ? 28 : 40);
	let rowHeight = $derived(width < 640 ? 24 : 28);

	let plotWidth = $derived(width - marginLeft - marginRight);

	$effect(() => {
		if (!containerEl) return;
		const observer = new ResizeObserver(entries => {
			for (const entry of entries) {
				width = entry.contentRect.width;
			}
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	// Compute display data — each occupation needs exposure (theory) and anthropic observed
	let rows = $derived.by(() => {
		return occupations
			.filter(o => o.evidence.anthropic_calibrated && o.evidence.anthropic_gap !== null)
			.map(o => {
				const gap = o.evidence.anthropic_gap ?? 0;
				const theory = o.raw.aioe;
				const observed = theory + gap;
				return {
					occ: o,
					theory: Math.max(0, Math.min(1, theory)),
					observed: Math.max(0, Math.min(1, observed)),
					gap,
					aboveTheory: gap > 0
				};
			})
			.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
			.slice(0, width < 640 ? 14 : 25);
	});

	let svgHeight = $derived(20 + rows.length * rowHeight + 30);

	function xPos(val: number): number {
		return (val / 1) * plotWidth;
	}
</script>

<div bind:this={containerEl} class="relative w-full">
	{#if browser && rows.length > 0}
		<svg {width} height={svgHeight} class="block">
			<g transform="translate({marginLeft},20)">
				<!-- Grid lines -->
				{#each [0, 0.25, 0.5, 0.75, 1] as tick}
					<line
						x1={xPos(tick)}
						y1={0}
						x2={xPos(tick)}
						y2={rows.length * rowHeight}
						stroke="var(--border)"
						stroke-dasharray="2,3"
						opacity="0.4"
					/>
					<text
						x={xPos(tick)}
						y={rows.length * rowHeight + 18}
						text-anchor="middle"
						class="fill-muted-foreground text-xs"
					>
						{(tick * 100).toFixed(0)}%
					</text>
				{/each}

				<!-- Rows -->
				{#each rows as row, i (row.occ.ssoc)}
					{@const y = i * rowHeight + rowHeight / 2}
					{@const minX = Math.min(xPos(row.theory), xPos(row.observed))}
					{@const maxX = Math.max(xPos(row.theory), xPos(row.observed))}

					<!-- Connecting line -->
					<line
						x1={minX}
						y1={y}
						x2={maxX}
						y2={y}
						stroke={row.aboveTheory ? 'var(--color-risk-very-high)' : 'var(--color-risk-very-low)'}
						stroke-width="2"
						opacity="0.6"
					/>

					<!-- Theory dot (hollow) -->
					<circle
						cx={xPos(row.theory)}
						cy={y}
						r="4"
						fill="none"
						stroke="var(--muted-foreground)"
						stroke-width="1.5"
					/>

					<!-- Observed dot (filled) -->
					<circle
						cx={xPos(row.observed)}
						cy={y}
						r="4"
						fill={row.aboveTheory ? 'var(--color-risk-very-high)' : 'var(--color-risk-very-low)'}
					/>

					<!-- Label -->
					<a href="/occupation/{row.occ.ssoc}">
						<text
							x={-8}
							y={y + 4}
							text-anchor="end"
							class="fill-foreground text-xs hover:fill-primary cursor-pointer"
						>
							{row.occ.title.length > 28
								? row.occ.title.slice(0, width < 640 ? 18 : 26) + '…'
								: row.occ.title}
						</text>
					</a>

					<!-- Gap label -->
					<text
						x={maxX + 6}
						y={y + 4}
						class={cn(
							'text-xs font-mono',
							row.aboveTheory ? 'fill-risk-very-high' : 'fill-risk-very-low'
						)}
					>
						{row.aboveTheory ? '+' : ''}{Math.round(row.gap * 100)}
					</text>
				{/each}
			</g>
		</svg>

		<!-- Legend -->
		<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-3 w-3 rounded-full border-2 border-muted-foreground bg-transparent"
				></span>
				<span>Theoretical (AIOE)</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-full bg-risk-very-high"></span>
				<span>Observed above theory</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="inline-block h-3 w-3 rounded-full bg-risk-very-low"></span>
				<span>Observed below theory</span>
			</div>
		</div>
	{:else if browser}
		<div class="flex h-40 items-center justify-center text-sm text-muted-foreground">
			No occupations with both theoretical and observed exposure data.
		</div>
	{:else}
		<div class="flex h-80 items-center justify-center bg-muted text-muted-foreground">
			Loading chart...
		</div>
	{/if}
</div>
