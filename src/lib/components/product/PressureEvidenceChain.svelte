<script lang="ts">
	import { pressureColorScale, sectionLabel } from '$lib/design-system';

	interface Props {
		ssocCode: string;
		iscoCodes: string[];
		mappedScore: number | null;
		percentile: number | null;
		population: number;
		mappingLabel: string;
	}

	let { ssocCode, iscoCodes, mappedScore, percentile, population, mappingLabel }: Props = $props();

	function score(value: number | null): string {
		return value == null ? 'Not available' : `${(value * 100).toFixed(1)}/100`;
	}

	function rank(value: number | null): string {
		if (value == null) return 'Not ranked';
		return `Percentile ${value.toFixed(value % 1 === 0 ? 0 : 1)}`;
	}
</script>

<section class="mt-8" aria-labelledby="pressure-evidence-chain-heading">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class={sectionLabel()}>Why this result</p>
			<h2 id="pressure-evidence-chain-heading" class="mt-1 text-xl font-bold text-foreground">
				From official occupation to Singapore rank
			</h2>
		</div>
		<a href="/methodology" class="text-xs font-semibold text-primary underline">Full method</a>
	</div>

	<ol class="mt-3 grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
		<li class="min-w-0 bg-card p-4">
			<p class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
				01 · Job
			</p>
			<p class="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
				SSOC {ssocCode}
			</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				Official Singapore occupation
			</p>
		</li>
		<li class="min-w-0 bg-card p-4">
			<p class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
				02 · Mapping
			</p>
			<p class="mt-2 break-words font-mono text-lg font-semibold tabular-nums text-foreground">
				{iscoCodes.length > 0 ? `ISCO ${iscoCodes.join(', ')}` : 'No usable ISCO code'}
			</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{mappingLabel}</p>
		</li>
		<li class="min-w-0 bg-card p-4">
			<p class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
				03 · Task evidence
			</p>
			<p class="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
				{score(mappedScore)}
			</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">Mapped ILO 2025 mean</p>
		</li>
		<li class="min-w-0 bg-card p-4">
			<div class="flex items-center gap-2">
				<span
					class="h-2.5 w-2.5 shrink-0"
					style:background={percentile == null
						? 'var(--color-muted)'
						: pressureColorScale(percentile)}
					aria-hidden="true"
				></span>
				<p class="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
					04 · Comparison
				</p>
			</div>
			<p class="mt-2 font-mono text-lg font-semibold tabular-nums text-foreground">
				{rank(percentile)}
			</p>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				Midrank among {population.toLocaleString()} scored occupations
			</p>
		</li>
	</ol>

	<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
		Pay, demand, capability profiles and personal answers stay outside this calculation.
	</p>
</section>
