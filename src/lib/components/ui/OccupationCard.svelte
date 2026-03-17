<script lang="ts">
	import type { Occupation } from '$lib/data';
	import { riskBandLabels, riskBandColors } from '$lib/data';
	import { riskBadge, card } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { occupation }: { occupation: Occupation } = $props();
</script>

<a
	href="/occupation/{occupation.ssoc}"
	class={cn(card({ padding: 'sm', hover: true }), 'flex items-center justify-between')}
>
	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium text-foreground">{occupation.title}</p>
		<p class="mt-0.5 text-xs text-muted-foreground">
			Median: SGD {occupation.gross_wage_median.toLocaleString()}
		</p>
	</div>
	<div class="ml-3 flex flex-col items-end gap-1">
		<span class={riskBadge({ band: occupation.risk_band })}>
			{riskBandLabels[occupation.risk_band]}
		</span>
		<span class="text-xs tabular-nums text-muted-foreground">
			Risk: {(occupation.net_risk * 100).toFixed(0)}%
		</span>
		<span class="text-xs text-muted-foreground">
			Confidence: {occupation.confidence.level}
		</span>
	</div>
</a>
