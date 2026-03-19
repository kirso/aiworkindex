<script lang="ts">
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

<div class="flex items-center gap-2">
	<div class="flex items-center gap-1" title="{sourceCount} of 4 exposure sources matched">
		{#each allSources as source}
			{@const active = sourceKeys.includes(source.key)}
			<div
				class={cn(
					'h-2 w-2 rounded-full transition-colors',
					active ? 'bg-primary' : 'bg-muted-foreground/20'
				)}
				title={source.label + (active ? ' ✓' : ' —')}
			></div>
		{/each}
	</div>
	<span class="text-[10px] text-muted-foreground">{sourceCount}/4</span>
	{#if agreementLabel}
		<span class="text-[10px] {agreementColor}">
			{agreementLabel}
		</span>
	{/if}
	{#if signalConflict}
		<span class="text-[10px] font-medium text-risk-high" title="Conflicting signals detected">
			⚠ Contested
		</span>
	{/if}
</div>
