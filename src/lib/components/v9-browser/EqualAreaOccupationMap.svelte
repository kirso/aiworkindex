<script lang="ts">
	import { goto } from '$app/navigation';
	import { pressureColorScale } from '$lib/design-system';
	import type { V9BrowserItem } from '$lib/data/v9-browser';
	import * as d3Hierarchy from 'd3-hierarchy';
	import type { HierarchyRectangularNode } from 'd3-hierarchy';
	import ChartFrame from './ChartFrame.svelte';

	interface Props {
		items: V9BrowserItem[];
		totalCount?: number;
		selectedCode?: string | null;
	}

	type RootDatum = { kind: 'root'; children: GroupDatum[] };
	type GroupDatum = {
		kind: 'group';
		code: string;
		label: string;
		children: OccupationDatum[];
	};
	type OccupationDatum = { kind: 'occupation'; item: V9BrowserItem };
	type MapDatum = RootDatum | GroupDatum | OccupationDatum;

	let { items, totalCount = 1001, selectedCode = $bindable(null) }: Props = $props();

	let containerEl = $state<HTMLButtonElement>();
	let containerWidth = $state(0);
	let keyboardIndex = $state(0);
	let hoveredCode = $state<string | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const shortGroupLabels: Record<string, string> = {
		'1': 'Leaders & managers',
		'2': 'Professionals',
		'3': 'Associate professionals',
		'4': 'Clerical support',
		'5': 'Services & sales',
		'6': 'Agriculture & fishery',
		'7': 'Crafts & trades',
		'8': 'Plant & machine operators',
		'9': 'Cleaners & labourers'
	};

	let chartHeight = $derived(
		containerWidth < 640 ? 520 : Math.min(720, Math.max(540, Math.round(containerWidth * 0.58)))
	);
	let grouped = $derived.by(() => {
		const byGroup = new Map<string, V9BrowserItem[]>();
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
				label: shortGroupLabels[code] ?? groupItems[0]?.majorGroupTitle ?? `Group ${code}`,
				children: groupItems
					.slice()
					.sort((a, b) => a.code.localeCompare(b.code))
					.map(item => ({ kind: 'occupation' as const, item }))
			}));
	});

	let layoutRoot = $derived.by(() => {
		if (containerWidth <= 0 || items.length === 0) return null;
		const data: RootDatum = { kind: 'root', children: grouped };
		const root = d3Hierarchy
			.hierarchy<MapDatum>(data, datum => {
				if (datum.kind === 'root' || datum.kind === 'group') return datum.children;
				return undefined;
			})
			.sum(datum => (datum.kind === 'occupation' ? 1 : 0));

		d3Hierarchy
			.treemap<MapDatum>()
			.size([containerWidth, chartHeight])
			.paddingOuter(2)
			.paddingInner(1)
			.paddingTop(node => (node.depth === 1 ? (containerWidth < 640 ? 23 : 29) : 0))
			.round(true)
			.tile(d3Hierarchy.treemapSquarify)(root);

		return root;
	});

	let groupNodes = $derived(
		(layoutRoot?.children ?? []) as Array<HierarchyRectangularNode<MapDatum>>
	);
	let leaves = $derived(
		(layoutRoot?.leaves() ?? []).filter(node => node.data.kind === 'occupation') as Array<
			HierarchyRectangularNode<OccupationDatum>
		>
	);
	let selectedItem = $derived(items.find(item => item.code === selectedCode) ?? null);
	let hoveredItem = $derived(items.find(item => item.code === hoveredCode) ?? null);
	let rankedCount = $derived(items.filter(item => item.pressureRank != null).length);
	let unrankedCount = $derived(items.length - rankedCount);

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
		const selectedIndex = selectedCode
			? leaves.findIndex(node => node.data.item.code === selectedCode)
			: -1;
		if (selectedIndex >= 0) keyboardIndex = selectedIndex;
		else if (keyboardIndex >= leaves.length) keyboardIndex = leaves.length - 1;
	});

	function pressureLabel(item: V9BrowserItem): string {
		if (item.pressureRank == null) return 'Pressure not ranked';
		return `Pressure percentile ${item.pressureRank.toFixed(item.pressureRank % 1 === 0 ? 0 : 1)}`;
	}

	function wageLabel(item: V9BrowserItem): string {
		return item.wageMedian == null
			? 'Direct wage not published'
			: `SGD ${item.wageMedian.toLocaleString()} gross monthly median`;
	}

	function demandLabel(item: V9BrowserItem): string {
		return item.demandSignalCount > 0
			? `${item.demandSignalCount} named demand signal${item.demandSignalCount === 1 ? '' : 's'}`
			: 'No named demand signal; demand is unknown';
	}

	function select(item: V9BrowserItem): void {
		selectedCode = item.code;
		const index = leaves.findIndex(node => node.data.item.code === item.code);
		if (index >= 0) keyboardIndex = index;
	}

	function showTooltip(event: PointerEvent, item: V9BrowserItem): void {
		if (!containerEl || event.pointerType === 'touch') return;
		const bounds = containerEl.getBoundingClientRect();
		hoveredCode = item.code;
		tooltipX = Math.max(8, Math.min(event.clientX - bounds.left + 12, bounds.width - 252));
		tooltipY = Math.max(8, Math.min(event.clientY - bounds.top + 12, bounds.height - 138));
	}

	function itemFromTarget(target: EventTarget | null): V9BrowserItem | null {
		if (!(target instanceof Element)) return null;
		const code = target.closest('[data-occupation-code]')?.getAttribute('data-occupation-code');
		return code ? (items.find(item => item.code === code) ?? null) : null;
	}

	function handlePointerMove(event: PointerEvent): void {
		const item = itemFromTarget(event.target);
		if (item) showTooltip(event, item);
		else hoveredCode = null;
	}

	function handleClick(event: MouseEvent): void {
		const item = itemFromTarget(event.target) ?? leaves[keyboardIndex]?.data.item ?? null;
		if (item) void goto(`/occupation/${item.code}`);
	}

	function handleKeyboard(event: KeyboardEvent): void {
		if (leaves.length === 0) return;
		let next = keyboardIndex;
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next += 1;
		else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next -= 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = leaves.length - 1;
		else if (event.key === 'Enter' && selectedItem) {
			event.preventDefault();
			void goto(`/occupation/${selectedItem.code}`);
			return;
		} else return;

		event.preventDefault();
		keyboardIndex = (next + leaves.length) % leaves.length;
		const item = leaves[keyboardIndex]?.data.item;
		if (item) select(item);
	}

	function groupLabel(node: HierarchyRectangularNode<MapDatum>): string {
		if (node.data.kind !== 'group') return '';
		return `${node.data.code} ${node.data.label}`;
	}

	function groupCount(node: HierarchyRectangularNode<MapDatum>): number {
		return node.data.kind === 'group' ? node.data.children.length : 0;
	}
</script>

<ChartFrame
	id="occupation-map"
	title="Singapore occupations by AI task pressure"
	subtitle="{items.length.toLocaleString()} of {totalCount.toLocaleString()} official SSOC 2024 occupation records. Every tile has equal weight; colour shows the V9 within-Singapore pressure percentile."
	source="SSOC 2024 occupation registry and ILO 2025 generative-AI task-exposure evidence, mapped through official SSOC–ISCO tables. V9 release, 19 August 2026."
	note="Each equal tile represents one occupation record. Tile area carries no worker count. Unranked occupations stay visible with a hatch and an Unknown label."
>
	<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
			<span><strong class="font-mono text-foreground">1</strong> tile = 1 occupation</span>
			<span><strong class="font-mono text-foreground">{rankedCount}</strong> ranked</span>
			<span><strong class="font-mono text-foreground">{unrankedCount}</strong> unranked</span>
		</div>
		<div
			class="flex min-w-[13rem] items-center gap-2 text-xs text-muted-foreground"
			aria-label="Pressure colour scale from lower to higher relative pressure"
		>
			<span>Lower</span>
			<span class="pressure-legend h-2 flex-1 rounded-sm border border-border" aria-hidden="true"
			></span>
			<span>Higher</span>
			<span class="unranked-hatch ml-1 h-3 w-3 rounded-sm border border-border" aria-hidden="true"
			></span>
			<span>Unranked</span>
		</div>
	</div>

	{#if items.length === 0}
		<div
			class="rounded-lg border border-dashed border-border bg-surface-subtle px-4 py-12 text-center"
		>
			<p class="text-sm text-muted-foreground">
				No occupation matches these filters. Remove one constraint to restore the map.
			</p>
		</div>
	{:else}
		<button
			type="button"
			bind:this={containerEl}
			class="relative block min-h-[32.5rem] w-full overflow-hidden rounded-lg border-0 bg-surface-subtle p-0 text-left outline-none"
			aria-label="Equal-area occupation map. Select a tile to open its occupation. Use arrow keys to move and Enter to open."
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
					aria-label="Map of {items.length} equal-area occupation tiles grouped by SSOC major group and coloured by AI task-pressure percentile"
				>
					<defs>
						<pattern
							id="occupation-map-unranked"
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

					{#each groupNodes as node (node.data.kind === 'group' ? node.data.code : '')}
						{#if node.data.kind === 'group'}
							<rect
								x={node.x0}
								y={node.y0}
								width={Math.max(0, node.x1 - node.x0)}
								height={Math.max(0, node.y1 - node.y0)}
								fill="none"
								stroke="var(--color-border)"
								stroke-width="1"
								rx="5"
							></rect>
							{#if node.x1 - node.x0 > 48}
								<text
									x={node.x0 + 6}
									y={node.y0 + (containerWidth < 640 ? 15 : 18)}
									font-size={containerWidth < 640 ? 10 : 12}
									font-weight="600"
									fill="var(--color-text-secondary)"
								>
									{containerWidth < 640 ? node.data.code : groupLabel(node)} · {groupCount(node)}
								</text>
							{/if}
						{/if}
					{/each}

					{#each leaves as leaf (leaf.data.item.code)}
						{@const item = leaf.data.item}
						{@const selected = item.code === selectedCode}
						<rect
							data-occupation-code={item.code}
							x={leaf.x0}
							y={leaf.y0}
							width={Math.max(0, leaf.x1 - leaf.x0)}
							height={Math.max(0, leaf.y1 - leaf.y0)}
							rx="1.5"
							fill={item.pressureRank == null
								? 'url(#occupation-map-unranked)'
								: pressureColorScale(item.pressureRank)}
							stroke={selected ? 'var(--color-primary)' : 'var(--color-card)'}
							stroke-width={selected ? 3 : 0.75}
							class="cursor-pointer transition-opacity duration-200 hover:opacity-75"
						>
							<title>{item.title}; {pressureLabel(item)}; {wageLabel(item)}</title>
						</rect>
					{/each}
				</svg>

				{#if hoveredItem}
					<div
						class="pointer-events-none absolute z-10 w-60 rounded-lg border border-border bg-popover p-3 text-xs shadow-md"
						style="left: {tooltipX}px; top: {tooltipY}px;"
						role="tooltip"
					>
						<p class="font-semibold leading-snug text-foreground">{hoveredItem.title}</p>
						<p class="mt-1 font-mono text-muted-foreground">SSOC {hoveredItem.code}</p>
						<p class="mt-2 text-text-secondary">{pressureLabel(hoveredItem)}</p>
						<p class="mt-0.5 text-text-secondary">{wageLabel(hoveredItem)}</p>
						<p class="mt-0.5 text-text-secondary">{demandLabel(hoveredItem)}</p>
					</div>
				{/if}
			{:else}
				<div
					class="h-[32.5rem] animate-pulse bg-surface-subtle"
					aria-label="Laying out occupation map"
				></div>
			{/if}
		</button>

		<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
			Select a tile to open the occupation. With a keyboard, use arrow keys to move and Enter to
			open.
		</p>
	{/if}
</ChartFrame>
