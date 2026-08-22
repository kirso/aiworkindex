<script lang="ts">
	import { v8BandLabels } from '$lib/data/v8-display';
	import type { V8Band } from '$lib/data/v8-contract';

	type DemandMatch = 'exact' | 'prefix' | false;
	type PlotRow = {
		title: string;
		ssoc: string;
		v8: { ai_exposure_rank: { points: number; band: V8Band } };
		evidence: { sol_match: DemandMatch; jobs_in_demand_match: DemandMatch };
	};

	let { occupations }: { occupations: PlotRow[] } = $props();

	let sorted = $derived(
		[...occupations].sort((a, b) => b.v8.ai_exposure_rank.points - a.v8.ai_exposure_rank.points)
	);
	let solCount = $derived(occupations.filter(row => row.evidence.sol_match !== false).length);
	let jidCount = $derived(
		occupations.filter(row => row.evidence.jobs_in_demand_match !== false).length
	);
	let bothCount = $derived(
		occupations.filter(
			row => row.evidence.sol_match !== false && row.evidence.jobs_in_demand_match !== false
		).length
	);

	const ticks = [60, 70, 80, 90, 100];

	function source(row: PlotRow): 'sol' | 'jid' | 'both' {
		if (row.evidence.sol_match !== false && row.evidence.jobs_in_demand_match !== false) {
			return 'both';
		}
		return row.evidence.sol_match !== false ? 'sol' : 'jid';
	}

	function sourceLabel(row: PlotRow): string {
		const value = source(row);
		if (value === 'both') return 'Shortage Occupation List and Jobs in Demand';
		return value === 'sol' ? 'Shortage Occupation List' : 'Jobs in Demand';
	}

	function position(points: number): number {
		return Math.max(0, Math.min(100, ((points - 60) / 40) * 100));
	}
</script>

<figure aria-labelledby="high-demand-exposure-title">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h2 id="high-demand-exposure-title" class="text-sm font-semibold text-foreground">
				AI exposure among occupations currently in demand
			</h2>
			<p class="mt-1 text-xs text-muted-foreground">
				{occupations.length} unique occupations · V8 AI Exposure Rank, 60–100
			</p>
		</div>
		<div
			class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
			aria-label="Demand evidence legend"
		>
			<span class="inline-flex items-center gap-1.5"
				><span class="marker marker-sol"></span>SOL</span
			>
			<span class="inline-flex items-center gap-1.5"
				><span class="marker marker-jid"></span>Jobs in Demand</span
			>
			<span class="inline-flex items-center gap-1.5"
				><span class="marker marker-both"></span>Both</span
			>
		</div>
	</div>

	<div class="mt-4 grid grid-cols-3 gap-2" aria-label="Demand evidence counts">
		<div class="rounded-sm border border-border bg-muted/40 px-3 py-2">
			<p class="font-mono text-lg font-semibold text-foreground">{solCount}</p>
			<p class="text-[11px] leading-tight text-muted-foreground">SOL matches</p>
		</div>
		<div class="rounded-sm border border-border bg-muted/40 px-3 py-2">
			<p class="font-mono text-lg font-semibold text-foreground">{jidCount}</p>
			<p class="text-[11px] leading-tight text-muted-foreground">Jobs in Demand</p>
		</div>
		<div class="rounded-sm border border-border bg-muted/40 px-3 py-2">
			<p class="font-mono text-lg font-semibold text-foreground">{bothCount}</p>
			<p class="text-[11px] leading-tight text-muted-foreground">On both lists</p>
		</div>
	</div>

	<div class="mt-5 space-y-2">
		<div
			class="hidden grid-cols-[minmax(180px,1.4fr)_minmax(260px,2fr)_44px] items-end gap-4 sm:grid"
		>
			<div></div>
			<div class="relative h-5 font-mono text-[10px] text-muted-foreground">
				{#each ticks as tick}
					<span class="absolute -translate-x-1/2" style:left={`${position(tick)}%`}>{tick}</span>
				{/each}
			</div>
			<div class="text-right text-[10px] text-muted-foreground">Rank</div>
		</div>

		{#each sorted as occupation (occupation.ssoc)}
			<a
				href={`/occupation/${occupation.ssoc}`}
				class="group grid gap-1 rounded-sm px-1 py-1.5 no-underline transition-colors hover:bg-muted/60 sm:grid-cols-[minmax(180px,1.4fr)_minmax(260px,2fr)_44px] sm:items-center sm:gap-4"
				title={`${occupation.title}: ${occupation.v8.ai_exposure_rank.points}/100 AI Exposure Rank; demand evidence: ${sourceLabel(occupation)}`}
			>
				<div class="flex min-w-0 items-baseline justify-between gap-3 sm:block">
					<span class="truncate text-xs font-medium text-foreground group-hover:text-primary"
						>{occupation.title}</span
					>
					<span class="shrink-0 font-mono text-xs font-semibold tabular-nums sm:hidden"
						>{occupation.v8.ai_exposure_rank.points}</span
					>
				</div>
				<div class="relative h-5" aria-hidden="true">
					<div class="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"></div>
					{#each ticks as tick}
						<div
							class="absolute top-0 h-full w-px bg-border/60"
							style:left={`${position(tick)}%`}
						></div>
					{/each}
					<span
						class="marker absolute top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_2px_var(--color-background)]"
						class:marker-sol={source(occupation) === 'sol'}
						class:marker-jid={source(occupation) === 'jid'}
						class:marker-both={source(occupation) === 'both'}
						style:left={`${position(occupation.v8.ai_exposure_rank.points)}%`}
					></span>
				</div>
				<div class="hidden text-right sm:block">
					<span class="font-mono text-xs font-semibold tabular-nums text-foreground"
						>{occupation.v8.ai_exposure_rank.points}</span
					>
					<span class="sr-only"
						>, {v8BandLabels[occupation.v8.ai_exposure_rank.band]}, {sourceLabel(occupation)}</span
					>
				</div>
			</a>
		{/each}
	</div>

	<figcaption class="mt-4 text-xs leading-relaxed text-muted-foreground">
		Each dot is one occupation. Position shows its relative AI Exposure Rank; marker shape shows why
		current demand is classified as strong. Counts overlap because three occupations match both
		lists. SOL and Jobs in Demand mappings can be exact or occupation-family matches; every
		occupation shown has at least one exact official-list match.
	</figcaption>
</figure>

<style>
	.marker {
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
		border: 1.5px solid var(--color-primary);
		background: var(--color-background);
	}

	.marker-sol {
		border-radius: 9999px;
		background: var(--color-primary);
	}

	.marker-jid {
		transform: rotate(45deg);
		border-color: var(--color-warning, #9a7200);
		background: var(--color-warning, #9a7200);
	}

	.marker-both {
		border-radius: 2px;
		border-color: var(--color-primary);
		background: var(--color-warning, #9a7200);
	}

	.marker-jid.absolute {
		transform: translate(-50%, -50%) rotate(45deg);
	}
</style>
