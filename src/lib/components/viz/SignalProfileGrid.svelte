<script lang="ts">
	import { card, microLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';

	export interface SignalProfileItem {
		label: string;
		value: string;
		barValue: number;
		barClass: string;
		valueClass?: string;
		note?: string;
	}

	let {
		items,
		columns = 4
	}: {
		items: SignalProfileItem[];
		columns?: 2 | 3 | 4;
	} = $props();

	let gridClass = $derived(
		columns === 2
			? 'md:grid-cols-2'
			: columns === 3
				? 'md:grid-cols-2 xl:grid-cols-3'
				: 'md:grid-cols-2 xl:grid-cols-4'
	);
</script>

<div class={cn('grid gap-3', gridClass)}>
	{#each items as item (item.label)}
		<div
			class={cn(card({ padding: 'sm', variant: 'metric' }), 'min-w-0')}
			role="meter"
			aria-label={item.label}
			aria-valuenow={Math.round(item.barValue * 100)}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<div class="flex items-center justify-between gap-3">
				<span class={microLabel()}>
					{item.label}
				</span>
				<span
					class={cn(
						'text-sm font-semibold font-mono tabular-nums text-foreground',
						item.valueClass ?? 'font-mono'
					)}
				>
					{item.value}
				</span>
			</div>
			<div class="mt-2 h-1.5 w-full rounded-full bg-muted-foreground/10" aria-hidden="true">
				<div
					class={cn('h-1.5 rounded-full transition-all duration-300', item.barClass)}
					style="width: {Math.max(Math.min(item.barValue * 100, 100), 5)}%;"
				></div>
			</div>
			{#if item.note}
				<p class="mt-2 text-xs text-muted-foreground">{item.note}</p>
			{/if}
		</div>
	{/each}
</div>
