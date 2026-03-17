<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import * as d3Hierarchy from 'd3-hierarchy';
	import type { HierarchyRectangularNode } from 'd3-hierarchy';
	import * as d3Scale from 'd3-scale';
	import type { Occupation } from '$lib/data';
	import { majorGroups, majorGroupByKey, riskBandLabels, riskBandColors } from '$lib/data';
	import Tooltip from './Tooltip.svelte';

	// Treemap nodes get x0/y0/x1/y1 added at runtime by d3 treemap layout.
	// We also attach custom data properties (count, avgRisk, occupation) to hierarchy node data.
	// Use type assertions when accessing these properties on the nodes.

	let { occupations }: { occupations: Occupation[] } = $props();

	let containerEl: HTMLDivElement | undefined = $state();
	let width = $state(800);
	let height = $state(600);

	// Zoom state: null = overview of all groups, string = zoomed into a group
	let zoomedGroup: string | null = $state(null);

	// Tooltip state
	let tooltipOccupation: Occupation | null = $state(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipVisible = $state(false);

	// Color scale: major group key -> color (for group backgrounds)
	const colorByGroup = new Map<string, string>(
		majorGroups.map((g) => [g.key, g.color])
	);

	// Risk color scale: green → amber → orange → rose (continuous)
	const riskColorScale = d3Scale.scaleLinear<string>()
		.domain([0, 0.15, 0.35, 0.60])
		.range(['#10b981', '#f59e0b', '#f97316', '#f43f5e'])
		.clamp(true);

	// Group occupations by major_group
	let groupedOccupations = $derived.by(() => {
		const groups = new Map<string, Occupation[]>();
		for (const o of occupations) {
			const list = groups.get(o.major_group) ?? [];
			list.push(o);
			groups.set(o.major_group, list);
		}
		return groups;
	});

	// Compute average net_risk per group
	let groupAvgRisk = $derived.by(() => {
		const avgs = new Map<string, number>();
		for (const [key, occs] of groupedOccupations) {
			const sum = occs.reduce((s, o) => s + o.net_risk, 0);
			avgs.set(key, sum / occs.length);
		}
		return avgs;
	});

	// Compute total employment per group (for sizing in overview mode)
	let groupEmployment = $derived.by(() => {
		const emp = new Map<string, number>();
		for (const [key, occs] of groupedOccupations) {
			emp.set(key, occs[0]?.group_employment_thousands ?? occs.length);
		}
		return emp;
	});

	// OVERVIEW MODE: hierarchy of just groups (depth 1 = groups as leaves)
	let overviewHierarchyData = $derived.by(() => {
		return {
			name: 'root',
			children: Array.from(groupedOccupations.entries()).map(([groupKey, occs]) => ({
				name: groupKey,
				value: groupEmployment.get(groupKey) ?? 1,
				count: occs.length,
				avgRisk: groupAvgRisk.get(groupKey) ?? 0
			}))
		};
	});

	let overviewRoot = $derived.by(() => {
		const root = d3Hierarchy
			.hierarchy(overviewHierarchyData)
			.sum((d: any) => d.value ?? 0)
			.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));

		d3Hierarchy
			.treemap<any>()
			.size([width, height])
			.paddingOuter(3)
			.paddingInner(3)
			.round(true)
			.tile(d3Hierarchy.treemapSquarify)(root);

		return root;
	});

	let overviewNodes = $derived(
		(overviewRoot.children ?? []) as HierarchyRectangularNode<any>[]
	);

	// ZOOMED MODE: hierarchy of occupations within the selected group
	let zoomedHierarchyData = $derived.by(() => {
		if (!zoomedGroup) return null;
		const occs = groupedOccupations.get(zoomedGroup) ?? [];
		return {
			name: zoomedGroup,
			children: occs.map((o) => ({
				name: o.title,
				value: Math.max(o.gross_wage_median, 1),
				occupation: o
			}))
		};
	});

	let zoomedRoot = $derived.by(() => {
		if (!zoomedHierarchyData) return null;
		const root = d3Hierarchy
			.hierarchy(zoomedHierarchyData)
			.sum((d: any) => d.value ?? 0)
			.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));

		d3Hierarchy
			.treemap<any>()
			.size([width, height])
			.paddingOuter(4)
			.paddingInner(2)
			.round(true)
			.tile(d3Hierarchy.treemapSquarify)(root);

		return root;
	});

	let zoomedLeaves = $derived(
		(zoomedRoot?.leaves() ?? []) as HierarchyRectangularNode<any>[]
	);

	// ResizeObserver
	$effect(() => {
		if (!browser || !containerEl) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const rect = entry.contentRect;
				width = rect.width;
				const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
				height = Math.max(500, Math.min(rect.width * 0.7, viewportH * 0.75, 900));
			}
		});

		observer.observe(containerEl);

		return () => observer.disconnect();
	});

	function handleMouseMoveOcc(e: MouseEvent, occ: Occupation) {
		tooltipOccupation = occ;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
		tooltipVisible = true;
	}

	function handleMouseLeave() {
		tooltipVisible = false;
		tooltipOccupation = null;
	}

	function handleClickGroup(groupKey: string) {
		zoomedGroup = groupKey;
	}

	function handleClickOcc(occ: Occupation) {
		goto('/occupation/' + occ.ssoc);
	}

	function handleBack() {
		zoomedGroup = null;
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

	function shouldShowGroupLabel(d: any): boolean {
		return cellWidth(d) >= 60 && cellHeight(d) >= 30;
	}

	function truncateLabel(text: string, maxWidth: number): string {
		const charWidth = 6;
		const maxChars = Math.floor((maxWidth - 8) / charWidth);
		if (text.length <= maxChars) return text;
		return text.slice(0, Math.max(0, maxChars - 1)) + '\u2026';
	}

	function groupLabel(key: string): string {
		const g = majorGroupByKey.get(key);
		return g?.label ?? key;
	}

	let fadeDuration = $derived(prefersReducedMotion.current ? 0 : 200);
</script>

<div bind:this={containerEl} class="relative w-full">
	{#if zoomedGroup}
		<button
			onclick={handleBack}
			class="mb-2 inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
		>
			<span aria-hidden="true">&larr;</span> Back to all groups
		</button>
		<p class="mb-2 text-sm text-gray-500">
			{groupLabel(zoomedGroup)} &mdash; {groupedOccupations.get(zoomedGroup)?.length ?? 0} occupations. Click a cell to view details.
		</p>
	{:else}
		<p class="mb-2 text-sm text-gray-500">
			Click a group to explore its occupations.
		</p>
	{/if}

	{#if browser}
		{#if !zoomedGroup}
			<!-- OVERVIEW: Major group rectangles -->
			<div in:fade={{ duration: fadeDuration }}>
			<svg {width} {height} class="block" role="img" aria-label="Treemap showing 9 major occupation groups in Singapore, sized by total employment. Click a group to zoom in.">
				{#each overviewNodes as node (node.data.name)}
					{@const nw = cellWidth(node)}
					{@const nh = cellHeight(node)}
					{@const groupColor = colorByGroup.get(node.data.name) ?? '#ccc'}
					{@const avgRisk = node.data.avgRisk ?? 0}
					<rect
						x={node.x0}
						y={node.y0}
						width={nw}
						height={nh}
						fill={riskColorScale(avgRisk)}
						opacity="0.85"
						rx="3"
						class="cursor-pointer transition-opacity duration-150 hover:opacity-100"
						role="button"
						tabindex="0"
						aria-label="{groupLabel(node.data.name)}: {node.data.count} occupations, average net risk {(avgRisk * 100).toFixed(0)}%"
						onclick={() => handleClickGroup(node.data.name)}
						onkeydown={(e) => {
							if (e.key === 'Enter') handleClickGroup(node.data.name);
						}}
					>
						<title>{groupLabel(node.data.name)}: {node.data.count} occupations</title>
					</rect>

					{#if shouldShowGroupLabel(node)}
						<text
							x={node.x0 + nw / 2}
							y={node.y0 + nh / 2 - 6}
							text-anchor="middle"
							class="pointer-events-none fill-white text-xs font-semibold"
							style="text-shadow: 0 1px 3px rgba(0,0,0,0.6);"
						>
							{truncateLabel(groupLabel(node.data.name), nw - 12)}
						</text>
						<text
							x={node.x0 + nw / 2}
							y={node.y0 + nh / 2 + 10}
							text-anchor="middle"
							class="pointer-events-none fill-white/80 text-[10px]"
							style="text-shadow: 0 1px 3px rgba(0,0,0,0.6);"
						>
							({node.data.count})
						</text>
					{/if}
				{/each}
			</svg>
			</div>
		{:else}
			<!-- ZOOMED: Occupations within the selected group -->
			<div in:fade={{ duration: fadeDuration }}>
			<svg {width} {height} class="block" role="img" aria-label="Treemap showing occupations in {groupLabel(zoomedGroup)}, sized by median wage and shaded by net AI displacement risk">
				{#each zoomedLeaves as leaf (leaf.data.occupation?.ssoc ?? leaf.data.name)}
					{@const occ = leaf.data.occupation as Occupation}
					{@const lw = cellWidth(leaf)}
					{@const lh = cellHeight(leaf)}
					<rect
						x={leaf.x0}
						y={leaf.y0}
						width={lw}
						height={lh}
						fill={riskColorScale(occ.net_risk)}
						opacity="0.85"
						rx="1"
						class="cursor-pointer transition-opacity duration-150 hover:opacity-100"
						role="button"
						tabindex="0"
						aria-label="{occ.title}: Net Risk {(occ.net_risk * 100).toFixed(0)}%, {riskBandLabels[occ.risk_band]}, median wage SGD {occ.gross_wage_median.toLocaleString()}"
						onmousemove={(e) => handleMouseMoveOcc(e, occ)}
						onmouseleave={handleMouseLeave}
						onclick={() => handleClickOcc(occ)}
						onkeydown={(e) => {
							if (e.key === 'Enter') handleClickOcc(occ);
						}}
					>
						<title>{occ.title} — Net Risk: {(occ.net_risk * 100).toFixed(0)}% ({riskBandLabels[occ.risk_band]})</title>
					</rect>

					{#if shouldShowLabel(leaf)}
						<text
							x={leaf.x0 + 3}
							y={leaf.y0 + 13}
							class="pointer-events-none fill-white text-[10px]"
							style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);"
						>
							{truncateLabel(occ.title, lw)}
						</text>
					{/if}
				{/each}
			</svg>
			</div>
		{/if}

		<!-- Screen reader summary -->
		<div class="sr-only">
			{#if zoomedGroup}
				Showing {zoomedLeaves.length} occupations in {groupLabel(zoomedGroup)}. Use keyboard Tab to navigate between cells and Enter to view details.
			{:else}
				Treemap showing {overviewNodes.length} major occupation groups. Use Tab to navigate and Enter to zoom into a group.
			{/if}
		</div>
	{:else}
		<div class="flex h-96 items-center justify-center bg-gray-50 text-gray-400">
			Loading visualization...
		</div>
	{/if}
</div>

<!-- Color Legend -->
<div class="mt-3 flex items-center gap-2">
	<span class="text-[10px] text-gray-500">Very Low</span>
	<div class="h-2.5 flex-1 rounded-full" style="background: linear-gradient(to right, #10b981, #f59e0b, #f97316, #f43f5e);"></div>
	<span class="text-[10px] text-gray-500">Very High Risk</span>
</div>

<Tooltip
	occupation={tooltipOccupation}
	x={tooltipX}
	y={tooltipY}
	visible={tooltipVisible}
/>
