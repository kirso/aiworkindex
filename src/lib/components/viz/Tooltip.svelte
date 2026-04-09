<script lang="ts">
	import { riskBandLabels, impactTypeLabels } from '$lib/data';
	import { riskBadge } from '$lib/design-system';
	import { formatCompactCount } from '$lib/data/home-surface';

	type TooltipRow = {
		title: string;
		risk_band?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
		gross_wage_median?: number;
		valueKind?: 'wage' | 'count';
		currency?: string | null;
		impact_type?: 'ai_leveraged' | 'at_risk' | 'stable' | 'mixed';
		linkHref?: string | null;
		ssoc?: string;
	};

	let {
		occupation = null,
		x = 0,
		y = 0,
		visible = false
	}: {
		occupation: TooltipRow | null;
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
			<span class={riskBadge({ band: occupation.risk_band ?? 'moderate' })}>
				{riskBandLabels[occupation.risk_band ?? 'moderate']}
			</span>
			<span class="text-xs text-muted-foreground">
				{#if occupation.valueKind === 'count'}
					{formatCompactCount(occupation.gross_wage_median ?? 0)} source occupations
				{:else}
					{@const cur = occupation.currency ?? 'USD'}
					{cur}
					{occupation.gross_wage_median?.toLocaleString()}{cur === 'SGD' ? '/mo' : '/yr'}
				{/if}
			</span>
		</div>
		<p class="mt-1.5 text-xs text-muted-foreground">
			{occupation.impact_type ? impactTypeLabels[occupation.impact_type] : 'Structural record'}
			{#if occupation.linkHref || occupation.ssoc}
				· Click for details
			{/if}
		</p>
	</div>
{/if}
