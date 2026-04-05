<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { Occupation } from '$lib/data';
	import { majorGroups } from '$lib/data';
	import { card } from '$lib/design-system';
	import OccupationCard from './OccupationCard.svelte';

	let { occupations, expandFirst = 0 }: { occupations: Occupation[]; expandFirst?: number } =
		$props();

	let grouped = $derived.by(() => {
		const map = new Map<string, Occupation[]>();
		for (const o of occupations) {
			const list = map.get(o.major_group) ?? [];
			list.push(o);
			map.set(o.major_group, list);
		}
		return majorGroups
			.filter(g => map.has(g.key))
			.map(g => ({
				group: g,
				occupations: map.get(g.key)!.sort((a, b) => b.net_risk - a.net_risk)
			}));
	});

	let expandedGroups = new SvelteSet<string>();

	$effect(() => {
		if (expandFirst > 0 && expandedGroups.size === 0) {
			for (const g of grouped.slice(0, expandFirst)) {
				expandedGroups.add(g.group.key);
			}
		}
	});

	function toggleGroup(key: string) {
		if (expandedGroups.has(key)) {
			expandedGroups.delete(key);
		} else {
			expandedGroups.add(key);
		}
	}
</script>

<div class="space-y-2">
	{#each grouped as { group, occupations: groupOccs } (group.key)}
		<div class={card({ padding: 'none' })}>
			<button
				type="button"
				class="flex w-full items-center justify-between px-4 py-3 text-left"
				onclick={() => toggleGroup(group.key)}
			>
				<div class="flex items-center gap-2">
					<span class="inline-block h-3 w-3 rounded-sm" style="background-color: {group.color};"
					></span>
					<span class="text-sm font-semibold text-foreground">{group.label}</span>
					<span class="text-xs text-muted-foreground">({groupOccs.length})</span>
				</div>
				<svg
					class="h-4 w-4 text-muted-foreground transition-transform {expandedGroups.has(group.key)
						? 'rotate-180'
						: ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			{#if expandedGroups.has(group.key)}
				<div class="space-y-1 px-3 pb-3">
					{#each groupOccs as occ (occ.ssoc ?? (occ as any).localCode ?? (occ as any).canonicalCode ?? occ.title)}
						<OccupationCard occupation={occ} />
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
