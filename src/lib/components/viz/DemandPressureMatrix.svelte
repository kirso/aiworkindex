<script lang="ts">
	import {
		demandContextLabels,
		demandContextOrder,
		demandForDisplay,
		v8BandLabels,
		v8BandOrder
	} from '$lib/data/v8-display';
	import type { DemandContext, V8Band } from '$lib/data/v8-contract';

	type MatrixRow = {
		risk_band?: V8Band;
		demandContext?: string | null;
		v8?: { ai_exposure_rank: { band: V8Band }; market_context: { demand: DemandContext } };
	};

	let {
		occupations,
		surfaceLabel = 'Singapore occupations'
	}: {
		occupations: MatrixRow[];
		surfaceLabel?: string;
	} = $props();

	let rows = $derived(
		demandContextOrder.map(demand => ({
			demand,
			counts: v8BandOrder.map(
				band =>
					occupations.filter(occupation => {
						const occupationBand = occupation.v8?.ai_exposure_rank.band ?? occupation.risk_band;
						const occupationDemand = demandForDisplay(
							occupation.v8?.market_context.demand ?? occupation.demandContext
						);
						return occupationBand === band && occupationDemand === demand;
					}).length
			)
		}))
	);

	let maximumCount = $derived(Math.max(1, ...rows.flatMap(row => row.counts)));

	function cellOpacity(count: number): number {
		if (count === 0) return 0;
		return 0.16 + (count / maximumCount) * 0.74;
	}
</script>

<figure class="min-w-0" aria-labelledby="exposure-demand-caption">
	<div
		class="grid grid-cols-[minmax(76px,1.25fr)_repeat(5,minmax(34px,1fr))] gap-1 sm:grid-cols-[minmax(150px,1.5fr)_repeat(5,minmax(60px,1fr))] sm:gap-1.5"
		role="img"
		aria-label="{surfaceLabel}: occupation counts by AI exposure band and current demand context"
	>
		<div></div>
		{#each v8BandOrder as band}
			<div
				class="pb-1 text-center text-[9px] font-medium leading-tight text-muted-foreground sm:text-xs"
			>
				<span class="sm:hidden">{v8BandLabels[band].replace('Very ', 'V. ')}</span>
				<span class="hidden sm:inline">{v8BandLabels[band]}</span>
			</div>
		{/each}

		{#each rows as row}
			<div
				class="flex items-center pr-1 text-[10px] font-medium leading-tight text-text-secondary sm:pr-2 sm:text-xs"
			>
				{demandContextLabels[row.demand]}
			</div>
			{#each row.counts as count, index}
				<div
					class="flex min-h-11 items-center justify-center rounded-sm border border-border/60 font-mono text-xs font-semibold tabular-nums text-foreground sm:min-h-14 sm:text-sm"
					class:bg-muted={count === 0}
					style:background-color={count > 0 ? 'var(--color-primary)' : undefined}
					style:opacity={count > 0 ? cellOpacity(count) : 1}
					title="{count} occupations: {v8BandLabels[
						v8BandOrder[index]!
					]} AI exposure, {demandContextLabels[row.demand].toLowerCase()}"
				>
					{count}
				</div>
			{/each}
		{/each}
	</div>
	<figcaption
		id="exposure-demand-caption"
		class="mt-3 text-xs leading-relaxed text-muted-foreground"
	>
		Counts combine the relative AI Exposure Rank with separately reported, official-derived current
		demand context. Demand does not change the exposure rank.
	</figcaption>
</figure>
