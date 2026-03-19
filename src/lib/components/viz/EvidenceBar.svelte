<script lang="ts">
	import { card } from '$lib/design-system';
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

	let agreementColor = $derived.by(() => {
		if (!agreement) return 'text-muted-foreground';
		switch (agreement) {
			case 'consensus_high':
			case 'consensus_low':
			case 'aligned_mid':
				return 'text-risk-very-low';
			case 'divergent':
				return 'text-risk-moderate';
			case 'insufficient_data':
				return 'text-risk-high';
			default:
				return 'text-muted-foreground';
		}
	});
</script>

<div
	class={cn(
		card({ padding: 'sm', variant: 'inset' }),
		'flex flex-wrap items-center gap-x-3 gap-y-2'
	)}
>
	<span class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
		Evidence
	</span>
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
	<span class="text-[10px] text-muted-foreground">{sourceCount}/4 sources</span>
	{#if agreementLabel}
		<span class="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium {agreementColor}">
			{agreementLabel}
		</span>
	{/if}
	{#if signalConflict}
		<span
			class="rounded-full bg-risk-high/10 px-2 py-0.5 text-[10px] font-medium text-risk-high"
			title="Conflicting signals detected"
		>
			Contested
		</span>
	{/if}
</div>
