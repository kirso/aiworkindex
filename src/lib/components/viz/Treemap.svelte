<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import * as d3Hierarchy from 'd3-hierarchy';
	import * as d3Scale from 'd3-scale';
	import type { Occupation } from '$lib/data';
	import { majorGroups, majorGroupByKey, riskBandLabels, riskBandColors } from '$lib/data';
	import Tooltip from './Tooltip.svelte';

	let { occupations }: { occupations: Occupation[] } = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let width = $state(800);
	let height = $state(600);

	// Tooltip state
	let tooltipOccupation: Occupation | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipVisible = $state(false);

	// Color scale: major group key -> color
	const colorByGroup = new Map<string, string>(
		majorGroups.map((g) => [g.key, g.color])
	);

	// Opacity scale: net_risk 0-1 -> opacity 0.35-1.0
	const opacityScale = d3Scale.scaleLinear().domain([0, 1]).range([0.35, 1.0]).clamp(true);

	// Build hierarchy data structure
	let hierarchyData = $derived.by(() => {
		// Group occupations by major_group
		const groups = new Map<string, Occupation[]>();
		for (const o of occupations) {
			const list = groups.get(o.major_group) ?? [];
			list.push(o);
			groups.set(o.major_group, list);
		}

		return {
			name: 'root',
			children: Array.from(groups.entries()).map(([groupKey, occs]) => ({
				name: groupKey,
				children: occs.map((o) => ({
					name: o.title,
					value: Math.max(o.gross_wage_median, 100),
					occupation: o
				}))
			}))
		};
	});

	// Compute treemap layout
	let treemapRoot = $derived.by(() => {
		const root = d3Hierarchy
			.hierarchy(hierarchyData)
			.sum((d: any) => d.value ?? 0)
			.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));

		d3Hierarchy
			.treemap<any>()
			.size([width, height])
			.paddingOuter(3)
			.paddingTop(20)
			.paddingInner(1)
			.round(true)
			.tile(d3Hierarchy.treemapSquarify)(root);

		return root;
	});

	// Extract group nodes (depth 1) and leaf nodes (depth 2)
	let groupNodes = $derived(
		treemapRoot.descendants().filter((d: any) => d.depth === 1)
	);
	let leafNodes = $derived(
		treemapRoot.leaves()
	);

	// ResizeObserver
	$effect(() => {
		if (!browser || !containerEl) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const rect = entry.contentRect;
				width = rect.width;
				// Fill most of viewport: at least 500px, up to 85vh, aspect ratio ~1.6:1
				const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
				height = Math.max(500, Math.min(rect.width * 0.7, viewportH * 0.75, 900));
			}
		});

		observer.observe(containerEl);

		return () => observer.disconnect();
	});

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

	function cellWidth(d: any): number {
		return (d.x1 ?? 0) - (d.x0 ?? 0);
	}

	function cellHeight(d: any): number {
		return (d.y1 ?? 0) - (d.y0 ?? 0);
	}

	function shouldShowLabel(d: any): boolean {
		return cellWidth(d) >= 40 && cellHeight(d) >= 16;
	}

	function truncateLabel(text: string, maxWidth: number): string {
		const charWidth = 6;
		const maxChars = Math.floor((maxWidth - 4) / charWidth);
		if (text.length <= maxChars) return text;
		return text.slice(0, Math.max(0, maxChars - 1)) + '\u2026';
	}

	function groupLabel(key: string): string {
		const g = majorGroupByKey.get(key);
		return g?.label ?? key;
	}
</script>

<div bind:this={containerEl} class="relative w-full">
	{#if browser}
		<svg {width} {height} class="block" role="img" aria-label="Treemap visualization of {occupations.length} Singapore occupations grouped by major occupation group, sized by wage and shaded by net AI displacement risk">
			<!-- Group background rects -->
			{#each groupNodes as group (group.data.name)}
				{@const gw = cellWidth(group)}
				{@const gh = cellHeight(group)}
				<rect
					x={group.x0}
					y={group.y0}
					width={gw}
					height={gh}
					fill={colorByGroup.get(group.data.name) ?? '#ccc'}
					opacity="0.15"
					rx="2"
				/>
				{#if gw > 60}
					<text
						x={group.x0 + 4}
						y={group.y0 + 14}
						class="fill-gray-700 text-[10px] font-semibold"
						style="pointer-events: none;"
					>
						{truncateLabel(groupLabel(group.data.name), gw - 8)}
					</text>
				{/if}
			{/each}

			<!-- Leaf cells -->
			{#each leafNodes as leaf (leaf.data.occupation?.ssoc ?? leaf.data.name)}
				{@const occ = leaf.data.occupation as Occupation}
				{@const lw = cellWidth(leaf)}
				{@const lh = cellHeight(leaf)}
				<rect
					x={leaf.x0}
					y={leaf.y0}
					width={lw}
					height={lh}
					fill={colorByGroup.get(occ.major_group) ?? '#ccc'}
					opacity={opacityScale(occ.net_risk)}
					rx="1"
					class="cursor-pointer transition-opacity duration-150 hover:opacity-100"
					role="button"
					tabindex="0"
					aria-label="{occ.title}: Net Risk {(occ.net_risk * 100).toFixed(0)}%, {riskBandLabels[occ.risk_band]}, median wage SGD {occ.gross_wage_median.toLocaleString()}"
					onmousemove={(e) => handleMouseMove(e, occ)}
					onmouseleave={handleMouseLeave}
					onclick={() => handleClick(occ)}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleClick(occ);
					}}
				>
					<title>{occ.title} — Net Risk: {(occ.net_risk * 100).toFixed(0)}% ({riskBandLabels[occ.risk_band]})</title>
				</rect>

				{#if shouldShowLabel(leaf)}
					<text
						x={leaf.x0 + 2}
						y={leaf.y0 + 12}
						class="pointer-events-none fill-white text-[9px]"
						style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);"
					>
						{truncateLabel(occ.title, lw)}
					</text>
				{/if}
			{/each}
		</svg>
		<!-- Screen reader summary -->
		<div class="sr-only">
			Treemap showing {occupations.length} occupations. Use keyboard Tab to navigate between cells and Enter to view details.
		</div>
	{:else}
		<div class="flex h-96 items-center justify-center bg-gray-50 text-gray-400">
			Loading visualization...
		</div>
	{/if}
</div>

<Tooltip
	occupation={tooltipOccupation}
	x={tooltipX}
	y={tooltipY}
	visible={tooltipVisible}
/>
