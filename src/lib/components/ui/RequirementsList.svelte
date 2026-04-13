<script lang="ts">
	import { card, caption } from '$lib/design-system';
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

	const toneGroupLabel: Record<RequirementItem['tone'], string> = {
		protective: 'Protects from AI displacement',
		support: 'Supports career resilience',
		pressure: 'Typical background',
		neutral: 'Other characteristics'
	};

	const toneGroupOrder: RequirementItem['tone'][] = ['protective', 'support', 'pressure', 'neutral'];

	let grouped = $derived.by(() => {
		const groups = new Map<RequirementItem['tone'], RequirementItem[]>();
		for (const item of items) {
			const list = groups.get(item.tone) ?? [];
			list.push(item);
			groups.set(item.tone, list);
		}
		return toneGroupOrder
			.filter((tone) => groups.has(tone))
			.map((tone) => ({ tone, label: toneGroupLabel[tone], items: groups.get(tone)! }));
	});

	const toneAccent = (tone: RequirementItem['tone']): string => {
		switch (tone) {
			case 'protective':
				return 'text-risk-very-low';
			case 'support':
				return 'text-primary';
			case 'pressure':
				return 'text-foreground';
			case 'neutral':
				return 'text-muted-foreground';
		}
	};
</script>

<div class={cn(card({ padding: 'sm' }), className)}>
	<p class="text-sm font-semibold text-foreground">Workforce profile</p>
	<p class={cn(caption(), 'mt-1')}>Based on a survey of workers currently in this occupation.</p>
	{#if grouped.length > 0}
		<div class="mt-3 space-y-4">
			{#each grouped as group (`group-${group.tone}`)}
				<div>
					<p class={cn('text-xs font-semibold', toneAccent(group.tone))}>{group.label}</p>
					<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
						{#each group.items as item, index (`req-${item.label}-${index}`)}
							<li class="flex items-center justify-between gap-2">
								<span class="text-foreground">{item.label}</span>
								<span class="font-mono text-xs tabular-nums shrink-0">{item.value} of workers</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{:else}
		<p class="mt-1 text-sm text-muted-foreground">No requirement data available.</p>
	{/if}
</div>
