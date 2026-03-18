<script lang="ts">
	import type { Occupation } from '$lib/data';
	import { riskBandLabels, impactTypeLabels } from '$lib/data';
	import { riskBadge } from '$lib/design-system';

	let {
		occupation = null,
		x = 0,
		y = 0,
		visible = false
	}: {
		occupation: Occupation | null;
		x: number;
		y: number;
		visible: boolean;
	} = $props();
</script>

{#if visible && occupation}
	<div
		class="pointer-events-none fixed z-50 w-56 rounded-lg border border-border bg-card p-3 shadow-lg"
		style="left: {x + 14}px; top: {y - 14}px;"
	>
		<p class="text-sm font-semibold leading-snug text-foreground">{occupation.title}</p>
		<div class="mt-1.5 flex items-center gap-1.5">
			<span class={riskBadge({ band: occupation.risk_band })}>
				{riskBandLabels[occupation.risk_band]}
			</span>
			<span class="text-xs text-muted-foreground"
				>SGD {occupation.gross_wage_median.toLocaleString()}/mo</span
			>
		</div>
		<p class="mt-1.5 text-xs text-muted-foreground">
			{impactTypeLabels[occupation.impact_type]} · Click for details
		</p>
	</div>
{/if}
