<script lang="ts">
	import { riskBandLabels } from '$lib/data';
	import { riskBadge, card } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { formatCompactCount } from '$lib/data/home-surface';

	type CardRow = {
		title: string;
		ssoc?: string;
		linkHref?: string | null;
		gross_wage_median?: number;
		currency?: string | null;
		valueKind?: 'wage' | 'count';
		risk_band?: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
		net_risk?: number;
		confidence?: { level: 'high' | 'medium' | 'low' };
	};

	let { occupation }: { occupation: CardRow } = $props();
</script>

<a
	href={occupation.linkHref ?? (occupation.ssoc ? `/occupation/${occupation.ssoc}` : '/global')}
	class={cn(card({ padding: 'sm', hover: true }), 'flex items-center justify-between')}
>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium text-foreground">{occupation.title}</p>
		<p class="mt-0.5 text-xs text-muted-foreground">
			{#if occupation.valueKind === 'count'}
				{formatCompactCount(occupation.gross_wage_median ?? 0)} mapped occupations
			{:else}
				Median: {occupation.currency ?? 'SGD'} {occupation.gross_wage_median?.toLocaleString()}
			{/if}
		</p>
	</div>
	<div class="ml-3 flex flex-col items-end gap-1">
		<span class={riskBadge({ band: occupation.risk_band ?? 'moderate' })}>
			{riskBandLabels[occupation.risk_band ?? 'moderate']}
		</span>
		<span class="text-xs font-mono tabular-nums text-muted-foreground">
			Risk: {((occupation.net_risk ?? 0) * 100).toFixed(0)}%
		</span>
		<span class="text-xs text-muted-foreground">
			Evidence quality: {occupation.confidence?.level ?? 'n/a'}
		</span>
	</div>
</a>
