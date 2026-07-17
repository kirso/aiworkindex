<script lang="ts">
	import type { Occupation, RiskBand } from '$lib/data';
	import { riskBandLabels } from '$lib/data';
	import { likelyPathwayLabels } from '$lib/data/v8-display';
	import * as Table from '$lib/components/ui/table/index.js';
	import { card, riskColorScale } from '$lib/design-system';

	interface Column {
		key: string;
		label: string;
		format?: (occ: Occupation) => string;
		align?: 'left' | 'right';
	}

	let {
		occupations,
		columns,
		highlight
	}: {
		occupations: Occupation[];
		columns: Column[];
		highlight?: (occ: Occupation) => string | null;
	} = $props();

	const riskDotColor: Record<RiskBand, string> = {
		very_low: 'bg-risk-very-low',
		low: 'bg-risk-low',
		moderate: 'bg-risk-moderate',
		high: 'bg-risk-high',
		very_high: 'bg-risk-very-high'
	};

	function cellValue(occupation: Occupation, column: Column): unknown {
		return column.format
			? column.format(occupation)
			: (occupation as unknown as Record<string, unknown>)[column.key];
	}
</script>

<div class={card({ padding: 'none' })}>
	<div class="divide-y divide-border md:hidden" aria-label="Occupation ranking">
		{#each occupations as occupation, index (occupation.ssoc)}
			<article class={`p-4 ${highlight?.(occupation) ?? ''}`}>
				<div class="flex items-start gap-3">
					<span class="mt-0.5 w-6 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
						{index + 1}
					</span>
					<div class="min-w-0 flex-1">
						<a
							href={((occupation as any).linkHref as string | undefined) ??
								`/occupation/${occupation.ssoc}`}
							class="text-sm font-semibold leading-snug text-foreground hover:text-primary"
						>
							{occupation.title}
						</a>
						<p class="mt-0.5 font-mono text-[10px] text-text-tertiary">SSOC {occupation.ssoc}</p>
					</div>
					<span class="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
						{occupation.v8.ai_exposure_rank.points}/100
					</span>
				</div>

				<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 pl-9">
					{#each columns as column}
						<div class="min-w-0">
							<dt class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
								{column.label}
							</dt>
							<dd class="mt-0.5 break-words font-mono text-xs tabular-nums text-text-secondary">
								{cellValue(occupation, column)}
							</dd>
						</div>
					{/each}
					<div>
						<dt class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
							Exposure band
						</dt>
						<dd class="mt-0.5 text-xs text-text-secondary">
							{riskBandLabels[occupation.v8.ai_exposure_rank.band]}
						</dd>
					</div>
					<div>
						<dt class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
							Likely job pathway
						</dt>
						<dd class="mt-0.5 text-xs text-text-secondary">
							{likelyPathwayLabels[occupation.v8.likely_pathway]}
						</dd>
					</div>
				</dl>
			</article>
		{/each}
	</div>

	<div class="hidden md:block" role="region" aria-label="Occupation ranking table">
		<Table.Root class="table-fixed">
			<Table.Header>
				<Table.Row>
					<Table.Head scope="col" class="w-10 text-xs uppercase tracking-wider">#</Table.Head>
					<Table.Head scope="col" class="w-[28%] text-xs uppercase tracking-wider">
						Occupation
					</Table.Head>
					{#each columns as column, columnIndex}
						<Table.Head
							scope="col"
							class="break-words text-[10px] uppercase tracking-wide {columnIndex >= 3
								? 'hidden lg:table-cell'
								: ''} {column.align === 'right' ? 'text-right' : ''}"
						>
							{column.label}
						</Table.Head>
					{/each}
					<Table.Head scope="col" class="hidden text-[10px] uppercase tracking-wide lg:table-cell">
						Exposure band
					</Table.Head>
					<Table.Head scope="col" class="hidden text-[10px] uppercase tracking-wide lg:table-cell">
						Likely job pathway
					</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each occupations as occupation, index (occupation.ssoc)}
					<Table.Row class={highlight?.(occupation) ?? ''}>
						<Table.Cell class="relative font-mono text-xs tabular-nums text-muted-foreground">
							<span
								class="absolute bottom-1 left-0 top-1 w-[3px] rounded-full"
								style:background-color={riskColorScale(occupation.net_risk)}
								aria-hidden="true"
							></span>
							{index + 1}
						</Table.Cell>
						<Table.Cell class="align-top">
							<a
								href={((occupation as any).linkHref as string | undefined) ??
									`/occupation/${occupation.ssoc}`}
								class="break-words text-xs leading-snug text-foreground underline-offset-2 decoration-primary/30 hover:text-primary hover:underline"
							>
								{occupation.title}
							</a>
							<span class="ml-1 font-mono text-[10px] tabular-nums text-text-tertiary">
								{occupation.ssoc}
							</span>
						</Table.Cell>
						{#each columns as column, columnIndex}
							<Table.Cell
								class="break-words align-top font-mono text-xs tabular-nums text-text-secondary {columnIndex >=
								3
									? 'hidden lg:table-cell'
									: ''} {column.align === 'right' ? 'text-right' : ''}"
							>
								{cellValue(occupation, column)}
							</Table.Cell>
						{/each}
						<Table.Cell class="hidden align-top lg:table-cell">
							<span class="inline-flex items-center gap-1.5">
								<span
									class={`inline-block h-2 w-2 shrink-0 rounded-full ${riskDotColor[occupation.v8.ai_exposure_rank.band]}`}
								></span>
								<span class="text-xs text-text-secondary">
									{riskBandLabels[occupation.v8.ai_exposure_rank.band]}
								</span>
							</span>
						</Table.Cell>
						<Table.Cell
							class="hidden break-words align-top text-xs text-text-secondary lg:table-cell"
						>
							{likelyPathwayLabels[occupation.v8.likely_pathway]}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
