<script lang="ts">
	import { pressureColorScale } from '$lib/design-system';
	import type { V9BrowserItem } from '$lib/data/v9-browser';
	import ChartFrame from './ChartFrame.svelte';

	interface Props {
		items: V9BrowserItem[];
		compact?: boolean;
	}

	let { items, compact = false }: Props = $props();

	function percentile(value: number | null): string {
		if (value == null) return 'Not ranked';
		return value.toFixed(value % 1 === 0 ? 0 : 1);
	}

	function position(value: number | null): string {
		return `${Math.max(0, Math.min(100, value ?? 0))}%`;
	}
</script>

<ChartFrame
	id={compact ? 'named-demand-pressure-home' : 'named-demand-pressure'}
	title={compact
		? 'Named demand at different pressure levels'
		: 'Where named-demand occupations sit in the pressure ranking'}
	subtitle="Each line is an SSOC 2024 occupation named through a reviewed match to a selected MOM demand or shortage source."
	source="MOM Jobs in Demand 2025 and the 2026 COMPASS Shortage Occupation List; V9 pressure ranks."
	note="Horizontal position shows the occupation’s pressure percentile. Every marker has the same size: source counts are shown as documentation, not as a demand-strength score. Absence from these selected lists leaves demand unknown."
>
	<div
		class="mb-2 grid grid-cols-[minmax(8rem,0.9fr)_minmax(8rem,1.1fr)_3.25rem] items-end gap-3 border-b border-border pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(12rem,0.9fr)_minmax(12rem,1.1fr)_4.25rem]"
	>
		<span>Occupation</span>
		<span class="flex justify-between font-mono font-normal normal-case tracking-normal">
			<span>0</span><span>Pressure percentile</span><span>100</span>
		</span>
		<span class="text-right">Rank / sources</span>
	</div>

	<ul class={compact ? 'space-y-1.5' : 'grid gap-x-7 gap-y-1.5 xl:grid-cols-2'}>
		{#each items as item (item.code)}
			<li>
				<a
					href="/occupation/{item.code}"
					class="grid min-h-11 grid-cols-[minmax(8rem,0.9fr)_minmax(8rem,1.1fr)_3.25rem] items-center gap-3 border-b border-border/70 py-2 no-underline hover:bg-muted/60 focus-visible:bg-muted sm:grid-cols-[minmax(12rem,0.9fr)_minmax(12rem,1.1fr)_4.25rem]"
				>
					<span class="min-w-0">
						<span class="block truncate text-xs font-semibold text-foreground sm:text-sm">
							{item.title}
						</span>
						<span class="block font-mono text-[10px] text-muted-foreground">SSOC {item.code}</span>
					</span>

					<span class="relative block h-5" aria-hidden="true">
						<span class="absolute inset-x-0 top-1/2 h-px bg-border"></span>
						<span class="absolute bottom-0 left-1/4 top-0 w-px bg-border/60"></span>
						<span class="absolute bottom-0 left-1/2 top-0 w-px bg-border/60"></span>
						<span class="absolute bottom-0 left-3/4 top-0 w-px bg-border/60"></span>
						<span
							class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 border-2 border-card"
							style:left={position(item.pressureRank)}
							style:background={pressureColorScale(item.pressureRank ?? 0)}
						></span>
					</span>

					<span class="text-right">
						<span class="block font-mono text-sm font-semibold tabular-nums text-foreground">
							{percentile(item.pressureRank)}
						</span>
						<span class="block text-[10px] text-muted-foreground">
							{item.demandSignalCount} named
						</span>
					</span>
					<span class="sr-only">
						Pressure percentile {percentile(item.pressureRank)}; {item.demandSignalCount} named source
						{item.demandSignalCount === 1 ? 'match' : 'matches'}.
					</span>
				</a>
			</li>
		{/each}
	</ul>
</ChartFrame>
