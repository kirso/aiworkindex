<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { Occupation, RiskBand, ImpactType } from '$lib/data';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors } from '$lib/data';

	let { occupations }: { occupations: Occupation[] } = $props();

	// Official MOM total workforce figure (thousands)
	const OFFICIAL_TOTAL_WORKERS_K = 2376.4;

	let totalWorkers = $derived(OFFICIAL_TOTAL_WORKERS_K * 1000);

	const bandOrder: RiskBand[] = ['very_low', 'low', 'moderate', 'high', 'very_high'];
	const impactOrder: ImpactType[] = ['at_risk', 'ai_leveraged', 'stable', 'mixed'];

	let bandCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const o of occupations) {
			counts[o.risk_band] = (counts[o.risk_band] ?? 0) + 1;
		}
		return counts;
	});

	let impactCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const o of occupations) {
			counts[o.impact_type] = (counts[o.impact_type] ?? 0) + 1;
		}
		return counts;
	});

	const tweenedWorkers = Tween.of(() => totalWorkers / 1000, { duration: 400 });
	const tweenedOccupations = Tween.of(() => occupations.length, { duration: 400 });

	function pct(band: string): string {
		const count = bandCounts[band] ?? 0;
		return ((count / occupations.length) * 100).toFixed(0);
	}

	function impactPct(type: string): string {
		const count = impactCounts[type] ?? 0;
		return ((count / occupations.length) * 100).toFixed(0);
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted px-4 py-3 text-sm">
		<div>
			<span class="text-muted-foreground">SG Workforce (MOM):</span>
			<span class="ml-1 font-semibold text-foreground tabular-nums">
				{tweenedWorkers.current.toFixed(0)}K
			</span>
		</div>
		<div>
			<span class="text-muted-foreground">Occupations:</span>
			<span class="ml-1 font-semibold text-foreground tabular-nums">{Math.round(tweenedOccupations.current)}</span>
		</div>
		<div class="hidden h-4 w-px bg-border sm:block"></div>
		{#each bandOrder as band (band)}
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-2.5 w-2.5 rounded-full"
					style="background-color: {riskBandColors[band]};"
				></span>
				<span class="text-muted-foreground">{riskBandLabels[band]}:</span>
				<span class="font-semibold text-foreground">{bandCounts[band] ?? 0}</span>
				<span class="text-muted-foreground">({pct(band)}% of occupations)</span>
			</div>
		{/each}
	</div>
	<div class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-muted px-4 py-3 text-sm">
		<div>
			<span class="text-muted-foreground">Impact Type:</span>
		</div>
		{#each impactOrder as type (type)}
			<div class="flex items-center gap-1.5">
				<span
					class="inline-block h-2.5 w-2.5 rounded-full"
					style="background-color: {impactTypeColors[type]};"
				></span>
				<span class="text-muted-foreground">{impactTypeLabels[type]}:</span>
				<span class="font-semibold text-foreground">{impactCounts[type] ?? 0}</span>
				<span class="text-muted-foreground">({impactPct(type)}%)</span>
			</div>
		{/each}
	</div>
</div>
