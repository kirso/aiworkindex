<script lang="ts">
	import { card } from '$lib/design-system';
	import { cn } from '$lib/utils';

	interface RequirementItem {
		label: string;
		value: string;
		tone: 'support' | 'neutral' | 'pressure' | 'protective';
	}

	interface Props {
		items: RequirementItem[];
		class?: string;
	}

	let { items, class: className }: Props = $props();

	const toneClass = (tone: RequirementItem['tone']): string => {
		switch (tone) {
			case 'pressure':
				return 'bg-risk-moderate';
			case 'protective':
				return 'bg-risk-very-low';
			case 'support':
				return 'bg-primary';
			case 'neutral':
				return 'bg-muted-foreground/30';
		}
	};
</script>

<div class={cn(card({ padding: 'sm' }), className)}>
	<p class="text-sm font-semibold text-foreground">Entry requirements</p>
	<p class="mt-1 text-xs text-muted-foreground">What percentage of workers in this occupation have or need each attribute.</p>
	{#if items.length > 0}
		<ul class="mt-3 space-y-1.5 text-sm text-muted-foreground">
			{#each items as item, index (`req-${item.label}-${index}`)}
				<li class="flex items-center justify-between gap-2">
					<span class="flex items-center gap-2">
						<span
							class={cn('inline-block h-2 w-2 shrink-0 rounded-full', toneClass(item.tone))}
						></span>
						<span class="text-foreground">{item.label}</span>
					</span>
					<span class="font-mono text-xs tabular-nums">{item.value}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-1 text-sm text-muted-foreground">No requirement data available.</p>
	{/if}
</div>
