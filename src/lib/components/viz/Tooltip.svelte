<script lang="ts">
	import type { Occupation, ImpactType } from '$lib/data';
	import { riskBandLabels, riskBandColors, impactTypeLabels, impactTypeColors, majorGroupByKey } from '$lib/data';

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

	const impactSummaries: Record<ImpactType, string> = {
		ai_leveraged: 'AI amplifies productivity in this role — humans remain essential.',
		at_risk: 'High exposure with low human bottleneck — vulnerable to automation.',
		stable: 'Low AI exposure — this occupation is largely unaffected for now.',
		mixed: 'Moderate signals across dimensions — outcome depends on adoption patterns.'
	};

	function groupLabel(key: string): string {
		return majorGroupByKey.get(key)?.label ?? key;
	}
</script>

{#if visible && occupation}
	<div
		class="pointer-events-none fixed z-50 w-64 rounded-xl border border-border bg-card p-4 shadow-xl"
		style="left: {x + 16}px; top: {y - 16}px;"
	>
		<!-- Title -->
		<p class="text-sm font-bold leading-snug text-foreground">{occupation.title}</p>
		<!-- Group -->
		<p class="mt-0.5 text-xs text-muted-foreground">{groupLabel(occupation.major_group)}</p>

		<!-- Risk badge -->
		<div class="mt-2 flex items-center gap-1.5">
			<span
				class="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
				style="background-color: {riskBandColors[occupation.risk_band]};"
			>
				{riskBandLabels[occupation.risk_band]} Risk &middot; {(occupation.net_risk * 100).toFixed(0)}%
			</span>
		</div>

		<!-- Wage -->
		<div class="mt-2">
			<p class="text-xs text-muted-foreground">Median Wage: <span class="font-semibold text-foreground">SGD {occupation.gross_wage_median.toLocaleString()}</span></p>
		</div>

		<!-- Impact summary -->
		<p class="mt-2 text-[11px] leading-relaxed text-muted-foreground italic">
			{impactSummaries[occupation.impact_type]}
		</p>

		<!-- CTA hint -->
		<p class="mt-2 text-center text-[10px] font-medium text-primary">Click to view full details</p>
	</div>
{/if}
