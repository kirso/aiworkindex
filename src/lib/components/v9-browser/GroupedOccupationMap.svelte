<script lang="ts">
	import { goto } from '$app/navigation';
	import { spokenMajorGroupTitle } from '$lib/data/v9-display';
	import {
		capabilityColorScale,
		capabilityLabelFill,
		pressureColorScale,
		pressureLabelFill
	} from '$lib/design-system';
	import type { V9MapItem } from '$lib/data/v9-home';
	import * as d3Hierarchy from 'd3-hierarchy';
	import type { HierarchyRectangularNode } from 'd3-hierarchy';

	interface Props {
		items: V9MapItem[];
		totalCount?: number;
		exploreHref?: string;
	}

	type RootDatum = { kind: 'root'; children: GroupDatum[] };
	type GroupDatum = { kind: 'group'; code: string; label: string; children: OccupationDatum[] };
	type OccupationDatum = { kind: 'occupation'; item: V9MapItem };
	type MapDatum = RootDatum | GroupDatum | OccupationDatum;

	let { items, totalCount = 1001, exploreHref = '/explore' }: Props = $props();

	let containerEl = $state<HTMLButtonElement>();
	let containerWidth = $state(0);
	let zoomedGroup = $state<string | null>(null);
	let keyboardIndex = $state(0);
	let hoveredCode = $state<string | null>(null);
	let mode = $state<'pressure' | 'capability'>('pressure');
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	let chartHeight = $derived(
		containerWidth < 640 ? 420 : Math.min(640, Math.max(480, Math.round(containerWidth * 0.48)))
	);

	let grouped = $derived.by(() => {
		const byGroup = new Map<string, V9MapItem[]>();
		for (const item of items) {
			const groupItems = byGroup.get(item.majorGroupCode) ?? [];
			groupItems.push(item);
			byGroup.set(item.majorGroupCode, groupItems);
		}
		return Array.from(byGroup.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([code, groupItems]) => ({
				kind: 'group' as const,
				code,
				label: spokenMajorGroupTitle(code, groupItems[0]?.majorGroupTitle),
				children: groupItems
					.slice()
					.sort((a, b) => a.spokenTitle.localeCompare(b.spokenTitle))
					.map(item => ({ kind: 'occupation' as const, item }))
			}));
	});

	let visibleGroups = $derived(
		zoomedGroup ? grouped.filter(group => group.code === zoomedGroup) : grouped
	);

	let layoutRoot = $derived.by(() => {
		if (containerWidth <= 0 || visibleGroups.length === 0) return null;
		const data: RootDatum = { kind: 'root', children: visibleGroups };
		const root = d3Hierarchy
			.hierarchy<MapDatum>(data, datum => {
				if (datum.kind === 'root') return datum.children;
				if (datum.kind === 'group') return zoomedGroup ? datum.children : undefined;
				return undefined;
			})
			.sum(datum => {
				if (datum.kind === 'occupation') return 1;
				if (datum.kind === 'group' && !zoomedGroup) return datum.children.length;
				return 0;
			});

		d3Hierarchy
			.treemap<MapDatum>()
			.size([containerWidth, chartHeight])
			.paddingOuter(3)
			.paddingInner(zoomedGroup ? 1.5 : 4)
			.round(true)
			.tile(d3Hierarchy.treemapSquarify)(root);

		return root;
	});

	let overviewNodes = $derived(
		(layoutRoot?.children ?? []).filter(node => node.data.kind === 'group') as Array<
			HierarchyRectangularNode<GroupDatum>
		>
	);
	let leaves = $derived(
		(layoutRoot?.leaves() ?? []).filter(node => node.data.kind === 'occupation') as Array<
			HierarchyRectangularNode<OccupationDatum>
		>
	);
	let zoomedItems = $derived(
		zoomedGroup
			? (grouped.find(group => group.code === zoomedGroup)?.children.map(child => child.item) ?? [])
			: []
	);
	let hoveredItem = $derived(items.find(item => item.code === hoveredCode) ?? null);

	function itemValue(item: V9MapItem): number | null {
		return mode === 'pressure' ? item.pressureRank : item.capabilityProximity;
	}

	function medianValue(groupItems: OccupationDatum[]): number | null {
		const ranks = groupItems
			.map(child => itemValue(child.item))
			.filter((rank): rank is number => rank != null)
			.sort((a, b) => a - b);
		if (ranks.length === 0) return null;
		const midpoint = Math.floor(ranks.length / 2);
		return ranks.length % 2 === 0
			? ((ranks[midpoint - 1] ?? 0) + (ranks[midpoint] ?? 0)) / 2
			: (ranks[midpoint] ?? 0);
	}

	$effect(() => {
		if (!containerEl) return;
		const observer = new ResizeObserver(entries => {
			containerWidth = Math.max(280, Math.floor(entries[0]?.contentRect.width ?? 0));
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (leaves.length === 0) {
			keyboardIndex = 0;
			return;
		}
		if (keyboardIndex >= leaves.length) keyboardIndex = leaves.length - 1;
	});

	function cellWidth(node: { x0: number; x1: number }): number {
		return Math.max(0, node.x1 - node.x0);
	}

	function cellHeight(node: { y0: number; y1: number }): number {
		return Math.max(0, node.y1 - node.y0);
	}

	function truncateLabel(text: string, maxWidth: number, charWidth = 7): string {
		const maxChars = Math.floor((maxWidth - 10) / charWidth);
		if (maxChars <= 1) return '';
		if (text.length <= maxChars) return text;
		return `${text.slice(0, Math.max(0, maxChars - 1))}\u2026`;
	}

	function showTooltip(event: PointerEvent, item: V9MapItem): void {
		if (!containerEl || event.pointerType === 'touch') return;
		const bounds = containerEl.getBoundingClientRect();
		hoveredCode = item.code;
		tooltipX = Math.max(8, Math.min(event.clientX - bounds.left + 12, bounds.width - 240));
		tooltipY = Math.max(8, Math.min(event.clientY - bounds.top + 12, bounds.height - 96));
	}

	function groupFromTarget(target: EventTarget | null): string | null {
		if (!(target instanceof Element)) return null;
		return target.closest('[data-group-code]')?.getAttribute('data-group-code') ?? null;
	}

	function itemFromTarget(target: EventTarget | null): V9MapItem | null {
		if (!(target instanceof Element)) return null;
		const code = target.closest('[data-occupation-code]')?.getAttribute('data-occupation-code');
		return code ? (items.find(item => item.code === code) ?? null) : null;
	}

	function handlePointerMove(event: PointerEvent): void {
		if (!zoomedGroup) {
			hoveredCode = null;
			return;
		}
		const item = itemFromTarget(event.target);
		if (item) showTooltip(event, item);
		else hoveredCode = null;
	}

	function handleClick(event: MouseEvent): void {
		if (!zoomedGroup) {
			const groupCode = groupFromTarget(event.target);
			if (groupCode) zoomedGroup = groupCode;
			return;
		}
		const item = itemFromTarget(event.target) ?? leaves[keyboardIndex]?.data.item ?? null;
		if (item) void goto(`/occupation/${item.code}`);
	}

	function handleKeyboard(event: KeyboardEvent): void {
		if (!zoomedGroup) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				const group = grouped[keyboardIndex] ?? grouped[0];
				if (group) zoomedGroup = group.code;
			} else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
				event.preventDefault();
				keyboardIndex = (keyboardIndex + 1) % Math.max(grouped.length, 1);
			} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
				event.preventDefault();
				keyboardIndex = (keyboardIndex - 1 + grouped.length) % Math.max(grouped.length, 1);
			}
			return;
		}

		if (event.key === 'Escape' || event.key === 'Backspace') {
			event.preventDefault();
			zoomedGroup = null;
			keyboardIndex = 0;
			return;
		}
		if (leaves.length === 0) return;
		let next = keyboardIndex;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next += 1;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next -= 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = leaves.length - 1;
		else if (event.key === 'Enter') {
			event.preventDefault();
			const item = leaves[keyboardIndex]?.data.item;
			if (item) void goto(`/occupation/${item.code}`);
			return;
		} else return;

		event.preventDefault();
		keyboardIndex = (next + leaves.length) % leaves.length;
	}

	function mapColor(value: number | null): string {
		if (value == null) return 'url(#grouped-map-unranked)';
		return mode === 'pressure' ? pressureColorScale(value) : capabilityColorScale(value);
	}

	function labelFill(value: number | null): string {
		return mode === 'pressure' ? pressureLabelFill(value) : capabilityLabelFill(value);
	}

	function valueText(value: number | null): string {
		if (value == null) return mode === 'pressure' ? 'Not ranked' : 'No profile';
		const display = mode === 'pressure' ? value : value * 100;
		return `${display.toFixed(display % 1 === 0 ? 0 : 1)}/100`;
	}
</script>

<figure class="min-w-0 border border-border bg-card" aria-labelledby="grouped-map-title">
	<div
		class="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4 sm:px-5"
	>
		<div class="min-w-0 max-w-3xl">
			<p class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
				Singapore occupations
			</p>
			<h3 id="grouped-map-title" class="mt-1 font-sans text-xl font-bold text-foreground">
				{zoomedGroup
					? `${visibleGroups[0]?.label ?? 'This group'} · named jobs`
					: 'Start with a kind of work'}
			</h3>
			<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
				{zoomedGroup
					? `Each tile is one official occupation. Area is the record count, not workers or pay. ${mode === 'pressure' ? 'Unranked jobs' : 'Jobs without a conservative OECD profile'} are hatched.`
					: `Nine official groups, sized by how many occupations they contain. Colour is median ${mode === 'pressure' ? 'AI task pressure' : 'mapped OECD capability proximity among available profiles'}. Click a group to read the job names.`}
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<div class="flex border border-border bg-card p-1" role="group" aria-label="Map colour">
				<button
					type="button"
					aria-pressed={mode === 'pressure'}
					class="min-h-9 px-3 text-xs font-semibold {mode === 'pressure'
						? 'bg-foreground text-background'
						: 'text-foreground hover:bg-accent'}"
					onclick={() => (mode = 'pressure')}
				>
					Task pressure
				</button>
				<button
					type="button"
					aria-pressed={mode === 'capability'}
					class="min-h-9 px-3 text-xs font-semibold {mode === 'capability'
						? 'bg-primary text-primary-foreground'
						: 'text-foreground hover:bg-accent'}"
					onclick={() => (mode = 'capability')}
				>
					AI capability
				</button>
			</div>
			{#if zoomedGroup}
				<button
					type="button"
					class="min-h-11 border border-foreground bg-card px-3 text-sm font-semibold text-foreground hover:bg-accent"
					onclick={() => {
						zoomedGroup = null;
						keyboardIndex = 0;
					}}
				>
					All groups
				</button>
			{/if}
			<a href={exploreHref} class="text-sm font-semibold text-primary underline">
				Open the full explorer
			</a>
		</div>
	</div>

	<div
		class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground sm:px-5"
	>
		<p>
			<strong class="font-mono text-foreground">{items.length.toLocaleString()}</strong>
			of {totalCount.toLocaleString()} occupations
			{#if zoomedGroup}
				· {zoomedItems.length} in this group
			{/if}
		</p>
		<div
			class="flex min-w-[12rem] items-center gap-2"
			aria-label={mode === 'pressure'
				? 'Lower to higher AI task pressure'
				: 'Lower to higher mapped AI capability proximity'}
		>
			<span>Lower</span>
			<span
				class="h-2 flex-1 border border-border {mode === 'pressure'
					? 'pressure-legend'
					: 'capability-legend'}"
				aria-hidden="true"
			></span>
			<span>Higher</span>
			<span class="unranked-hatch ml-1 h-3 w-3 border border-border" aria-hidden="true"></span>
			<span>{mode === 'pressure' ? 'Unranked' : 'Unavailable'}</span>
		</div>
	</div>

	<button
		type="button"
		bind:this={containerEl}
		class="relative block w-full overflow-hidden bg-surface-subtle p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
		aria-label={zoomedGroup
			? 'Occupation map for this group. Arrow keys move. Enter opens the job. Escape returns to all groups.'
			: 'Occupation group map. Arrow keys move between groups. Enter opens the named jobs in a group.'}
		onclick={handleClick}
		onkeydown={handleKeyboard}
		onpointermove={handlePointerMove}
		onpointerleave={() => (hoveredCode = null)}
	>
		{#if containerWidth > 0 && layoutRoot}
			<svg
				width={containerWidth}
				height={chartHeight}
				viewBox="0 0 {containerWidth} {chartHeight}"
				class="block max-w-full"
				role="img"
				aria-hidden="true"
			>
				<defs>
					<pattern
						id="grouped-map-unranked"
						width="6"
						height="6"
						patternUnits="userSpaceOnUse"
						patternTransform="rotate(45)"
					>
						<rect width="6" height="6" fill="var(--color-pressure-unranked)"></rect>
						<line
							x1="0"
							y1="0"
							x2="0"
							y2="6"
							stroke="var(--color-text-secondary)"
							stroke-width="1.25"
						></line>
					</pattern>
				</defs>

				{#if !zoomedGroup}
					{#each overviewNodes as node (node.data.code)}
						{@const width = cellWidth(node)}
						{@const height = cellHeight(node)}
						{@const median = medianValue(node.data.children)}
						{@const focused = grouped[keyboardIndex]?.code === node.data.code}
						<rect
							data-group-code={node.data.code}
							x={node.x0}
							y={node.y0}
							{width}
							{height}
							fill={mapColor(median)}
							stroke={focused ? 'var(--color-primary)' : 'var(--color-card)'}
							stroke-width={focused ? 3 : 2}
							class="cursor-pointer"
						></rect>
						{#if width >= 48 && height >= 22}
							<text
								x={node.x0 + width / 2}
								y={node.y0 + height / 2 - (height >= 36 ? 6 : 0)}
								text-anchor="middle"
								class="pointer-events-none font-sans text-[12px] font-bold sm:text-[13px]"
								fill={labelFill(median)}
							>
								{truncateLabel(node.data.label, width, 6.6)}
							</text>
							{#if height >= 36}
								<text
									x={node.x0 + width / 2}
									y={node.y0 + height / 2 + 12}
									text-anchor="middle"
									class="pointer-events-none font-mono text-[11px]"
									fill={labelFill(median)}
									opacity="0.9"
								>
									{node.data.children.length} jobs
								</text>
							{/if}
						{/if}
					{/each}
				{:else}
					{#each leaves as leaf, index (leaf.data.item.code)}
						{@const item = leaf.data.item}
						{@const width = cellWidth(leaf)}
						{@const height = cellHeight(leaf)}
						{@const focused = index === keyboardIndex}
						<rect
							data-occupation-code={item.code}
							x={leaf.x0}
							y={leaf.y0}
							{width}
							{height}
							fill={mapColor(itemValue(item))}
							stroke={focused ? 'var(--color-primary)' : 'var(--color-card)'}
							stroke-width={focused ? 2.5 : 0.8}
							class="cursor-pointer"
						></rect>
						{#if width >= 44 && height >= 18}
							<text
								x={leaf.x0 + 5}
								y={leaf.y0 + 14}
								class="pointer-events-none font-sans text-[11px] font-semibold"
								fill={labelFill(itemValue(item))}
							>
								{truncateLabel(item.spokenTitle, width)}
							</text>
						{/if}
					{/each}
				{/if}
			</svg>

			{#if hoveredItem}
				<div
					class="pointer-events-none absolute z-10 w-56 border border-border bg-popover p-3 text-xs shadow-md"
					style="left: {tooltipX}px; top: {tooltipY}px;"
					role="tooltip"
				>
					<p class="font-semibold leading-snug text-foreground">{hoveredItem.spokenTitle}</p>
					<p class="mt-1 font-mono text-muted-foreground">
						SSOC {hoveredItem.code} · {valueText(itemValue(hoveredItem))}
					</p>
				</div>
			{/if}
		{:else}
			<div
				class="h-[26rem] animate-pulse bg-surface-subtle"
				aria-label="Laying out occupation map"
			></div>
		{/if}
	</button>

	{#if zoomedGroup && zoomedItems.length > 0}
		<ul
			class="grid max-h-[22rem] gap-px overflow-y-auto border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
		>
			{#each zoomedItems as item (item.code)}
				<li>
					<a
						href="/occupation/{item.code}"
						class="flex min-h-11 items-center justify-between gap-3 bg-card px-3 py-2.5 no-underline hover:bg-accent"
					>
						<span class="min-w-0 truncate text-sm font-semibold text-foreground"
							>{item.spokenTitle}</span
						>
						<span class="flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums">
							<span
								class="h-2.5 w-6 {itemValue(item) == null
									? 'unranked-hatch border border-border'
									: ''}"
								style={itemValue(item) == null
									? undefined
									: `background: ${mapColor(itemValue(item))}`}
								aria-hidden="true"
							></span>
							{valueText(itemValue(item))}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</figure>
