<script lang="ts">
	import { contextToneClass } from '$lib/data/detail-display';
	import { cn } from '$lib/utils';

	export interface ContextItemGridItem {
		key: string;
		label: string;
		value: string;
		description: string;
		tone: 'neutral' | 'support' | 'protective' | 'pressure';
	}

	let {
		title,
		items
	}: {
		title: string;
		items: ContextItemGridItem[];
	} = $props();
</script>

{#if items.length > 0}
	<div>
		<p class="text-xs font-semibold text-foreground">{title}</p>
		<div class="mt-3 grid gap-3 sm:grid-cols-2">
			{#each items as item (item.key)}
				<div>
					<div class="flex items-center gap-2">
						<p class={cn('text-xs font-semibold', contextToneClass(item.tone))}>{item.label}</p>
						<span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
							{item.value}
						</span>
					</div>
					<p class="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
				</div>
			{/each}
		</div>
	</div>
{/if}
