<script lang="ts">
	import type { Occupation, RiskBand, ImpactType } from '$lib/data';
	import { riskBandLabels, impactTypeLabels } from '$lib/data';
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

	const impactDotColor: Record<ImpactType, string> = {
		ai_leveraged: 'bg-impact-leveraged',
		at_risk: 'bg-impact-at-risk',
		stable: 'bg-impact-stable',
		mixed: 'bg-impact-mixed'
	};
</script>

<div class={card({ padding: 'none' })}>
	<div class="overflow-x-auto">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head scope="col" class="w-10 text-xs uppercase tracking-wider">#</Table.Head>
					<Table.Head scope="col" class="text-xs uppercase tracking-wider">Occupation</Table.Head>
					{#each columns as col}
						<Table.Head
							scope="col"
							class="text-xs uppercase tracking-wider whitespace-nowrap {col.align === 'right'
								? 'text-right'
								: ''}"
						>
							{col.label}
						</Table.Head>
					{/each}
					<Table.Head scope="col" class="text-xs uppercase tracking-wider">Risk</Table.Head>
					<Table.Head scope="col" class="text-xs uppercase tracking-wider">Impact</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each occupations as occ, i (occ.ssoc)}
					{@const highlightClass = highlight?.(occ)}
					<Table.Row class={highlightClass ?? ''}>
						<Table.Cell class="font-mono tabular-nums text-muted-foreground text-xs relative">
							<span
								class="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
								style="background-color: {riskColorScale(occ.net_risk)}"
								aria-hidden="true"
							></span>
							{i + 1}
						</Table.Cell>
						<Table.Cell>
							<a
								href="/sg/occupation/{occ.ssoc}"
								class="text-xs text-foreground hover:text-primary hover:underline underline-offset-2 decoration-primary/30"
							>
								{occ.title}
							</a>
							<span class="ml-1 text-xs text-text-tertiary font-mono tabular-nums">{occ.ssoc}</span>
						</Table.Cell>
						{#each columns as col}
							<Table.Cell
								class="font-mono tabular-nums text-xs {col.align === 'right'
									? 'text-right'
									: ''} text-text-secondary"
							>
								{col.format
									? col.format(occ)
									: (occ as unknown as Record<string, unknown>)[col.key]}
							</Table.Cell>
						{/each}
						<Table.Cell>
							<span class="inline-flex items-center gap-1.5 whitespace-nowrap">
								<span class="inline-block h-2 w-2 rounded-full {riskDotColor[occ.risk_band]}"
								></span>
								<span class="text-xs text-text-secondary">{riskBandLabels[occ.risk_band]}</span>
							</span>
						</Table.Cell>
						<Table.Cell>
							<span class="inline-flex items-center gap-1.5 whitespace-nowrap">
								<span class="inline-block h-2 w-2 rounded-full {impactDotColor[occ.impact_type]}"
								></span>
								<span class="text-xs text-text-secondary">{impactTypeLabels[occ.impact_type]}</span>
							</span>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>
