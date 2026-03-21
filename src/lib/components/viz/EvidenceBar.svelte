<script lang="ts">
	import { pill, microLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let {
		sourceCount = 0,
		sourceKeys = [],
		agreement = null,
		signalConflict = false
	}: {
		sourceCount?: number;
		sourceKeys?: string[];
		agreement?: string | null;
		signalConflict?: boolean;
	} = $props();

	const allSources = [
		{ key: 'aioe', label: 'Felten AIOE' },
		{ key: 'anthropic', label: 'Anthropic' },
		{ key: 'eloundou', label: 'Eloundou' },
		{ key: 'ilo', label: 'ILO 2025' }
	] as const;

	let agreementLabel = $derived.by(() => {
		if (!agreement) return null;
		switch (agreement) {
			case 'consensus_high':
				return 'Sources agree: high';
			case 'consensus_low':
				return 'Sources agree: low';
			case 'aligned_mid':
				return 'Sources aligned';
			case 'divergent':
				return 'Sources diverge';
			case 'insufficient_data':
				return 'Limited data';
			default:
				return null;
		}
	});

	let agreementTone = $derived.by(() => {
		if (!agreement) return 'muted' as const;
		switch (agreement) {
			case 'consensus_high':
			case 'consensus_low':
			case 'aligned_mid':
				return 'positive' as const;
			case 'divergent':
				return 'warning' as const;
			case 'insufficient_data':
				return 'danger' as const;
			default:
				return 'muted' as const;
		}
	});
</script>

<div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
	<span class={microLabel()}> Evidence </span>
	<div class="flex items-center gap-1.5" title="{sourceCount} of 4 exposure sources matched">
		{#each allSources as source}
			{@const active = sourceKeys.includes(source.key)}
			<div
				class={cn(
					'h-2.5 w-2.5 rounded-full transition-colors',
					active ? 'bg-primary' : 'bg-muted-foreground/20'
				)}
				title={source.label + (active ? ' ✓' : ' —')}
			></div>
		{/each}
	</div>
	<span class="text-xs text-muted-foreground">{sourceCount}/4 sources</span>
	{#if agreementLabel}
		<span class={pill({ size: 'sm', tone: agreementTone })}>
			{agreementLabel}
		</span>
	{/if}
	{#if signalConflict}
		<span class={pill({ size: 'sm', tone: 'danger' })} title="Conflicting signals detected">
			Contested
		</span>
	{/if}
</div>
