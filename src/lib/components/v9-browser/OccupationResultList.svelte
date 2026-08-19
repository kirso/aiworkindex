<script lang="ts">
	import type { V9BrowserItem } from '$lib/data/v9-browser';

	type Detail = 'wage' | 'demand' | 'dispersion' | 'mapping' | 'category' | 'none';

	interface Props {
		items: V9BrowserItem[];
		detail?: Detail;
		showRank?: boolean;
		emptyMessage?: string;
	}

	let {
		items,
		detail = 'wage',
		showRank = true,
		emptyMessage = 'No occupations match this view.'
	}: Props = $props();

	function formatPercentile(value: number | null): string {
		if (value == null) return 'Not ranked';
		return `Percentile ${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
	}

	function formatWage(value: number | null): string {
		return value == null ? 'Wage not published' : `SGD ${value.toLocaleString()}/month`;
	}

	function formatDescendingMidrank(item: V9BrowserItem): string {
		if (item.pressurePosition == null || item.pressurePopulation == null) return '';
		const descendingMidrank = item.pressurePopulation + 1 - item.pressurePosition;
		return `#${descendingMidrank.toFixed(descendingMidrank % 1 === 0 ? 0 : 1)}`;
	}

	function mappingLabel(item: V9BrowserItem): string {
		switch (item.mappingQuality) {
			case 'one_to_one':
				return 'One-to-one official mapping';
			case 'one_to_many':
				return 'One-to-many official mapping';
			case 'partial':
				return 'Partial official mapping';
			case 'unmatched':
				return 'No usable mapping';
		}
	}

	function detailValue(item: V9BrowserItem): string {
		switch (detail) {
			case 'wage':
				return formatWage(item.wageMedian);
			case 'demand':
				return item.demandSignalCount === 0
					? 'No named signal'
					: `${item.demandSignalCount} named signal${item.demandSignalCount === 1 ? '' : 's'}`;
			case 'dispersion':
				return item.taskDispersion == null
					? 'Not available'
					: `${(item.taskDispersion * 100).toFixed(1)}/100`;
			case 'mapping':
				return mappingLabel(item);
			case 'category':
				return item.officialCategory;
			case 'none':
				return '';
		}
	}

	function detailLabel(item: V9BrowserItem): string {
		switch (detail) {
			case 'wage':
				return item.wageMedian == null
					? 'Direct wage evidence unknown'
					: 'Direct gross wage median';
			case 'demand':
				return item.demandSignalCount === 0
					? 'Not evidence of weak demand'
					: 'Direct MOM list evidence';
			case 'dispersion':
				return 'ILO task-score standard deviation';
			case 'mapping': {
				const width = item.mappedScoreRangeWidth;
				return width == null
					? 'Pressure range unknown'
					: `Mapped score range ${(width * 100).toFixed(1)}/100`;
			}
			case 'category':
				return 'Official ILO category';
			case 'none':
				return '';
		}
	}
</script>

{#if items.length === 0}
	<div class="border border-dashed border-border bg-card px-4 py-8 text-center">
		<p class="text-sm text-muted-foreground">{emptyMessage}</p>
	</div>
{:else}
	<ol class="divide-y divide-border border border-border bg-card">
		{#each items as item (item.code)}
			<li class="min-w-0">
				<a
					href="/occupation/{item.code}"
					class="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-3 px-3 py-3 no-underline transition-colors hover:bg-accent sm:grid-cols-[2rem_minmax(0,1fr)_10rem_12rem] sm:items-center sm:px-4"
				>
					<span class="font-mono text-xs tabular-nums text-muted-foreground">
						{showRank ? formatDescendingMidrank(item) : ''}
					</span>

					<div class="min-w-0">
						<p class="break-words text-sm font-semibold leading-snug text-foreground">
							{item.title}
						</p>
						<p class="mt-1 break-words text-xs text-muted-foreground">
							SSOC {item.code} · {item.officialCategory}
						</p>
					</div>

					<div class="col-start-2 min-w-0 sm:col-start-auto">
						<p class="font-mono text-sm font-semibold tabular-nums text-foreground">
							{formatPercentile(item.pressureRank)}
						</p>
						<p class="text-xs text-muted-foreground">AI work pressure</p>
					</div>

					{#if detail !== 'none'}
						<div class="col-start-2 min-w-0 sm:col-start-auto">
							<p class="break-words font-mono text-sm font-semibold tabular-nums text-foreground">
								{detailValue(item)}
							</p>
							<p class="break-words text-xs text-muted-foreground">{detailLabel(item)}</p>
						</div>
					{/if}
				</a>
			</li>
		{/each}
	</ol>
{/if}
