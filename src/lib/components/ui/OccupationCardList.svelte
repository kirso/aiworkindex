<script lang="ts">
	import type { Occupation } from '$lib/data';
	import { majorGroups, majorGroupByKey, occupationsByGroup } from '$lib/data';
	import OccupationCard from './OccupationCard.svelte';

	let { occupations }: { occupations: Occupation[] } = $props();

	// Group the provided occupations, sort within each group by net_risk descending
	let grouped = $derived.by(() => {
		const map = new Map<string, Occupation[]>();
		for (const o of occupations) {
			const list = map.get(o.major_group) ?? [];
			list.push(o);
			map.set(o.major_group, list);
		}
		return majorGroups
			.filter((g) => map.has(g.key))
			.map((g) => ({
				group: g,
				occupations: map.get(g.key)!.sort((a, b) => b.net_risk - a.net_risk)
			}));
	});

	let expandedGroups = $state(new Set<string>());

	function toggleGroup(key: string) {
		const next = new Set(expandedGroups);
		if (next.has(key)) {
			next.delete(key);
		} else {
			next.add(key);
		}
		expandedGroups = next;
	}
</script>

<div class="space-y-2">
	{#each grouped as { group, occupations: groupOccs } (group.key)}
		<div class="rounded-lg border border-gray-200 bg-white">
			<button
				type="button"
				class="flex w-full items-center justify-between px-4 py-3 text-left"
				onclick={() => toggleGroup(group.key)}
			>
				<div class="flex items-center gap-2">
					<span
						class="inline-block h-3 w-3 rounded-sm"
						style="background-color: {group.color};"
					></span>
					<span class="text-sm font-semibold text-gray-900">{group.label}</span>
					<span class="text-xs text-gray-400">({groupOccs.length})</span>
				</div>
				<svg
					class="h-4 w-4 text-gray-400 transition-transform {expandedGroups.has(group.key) ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if expandedGroups.has(group.key)}
				<div class="space-y-1 px-3 pb-3">
					{#each groupOccs as occ (occ.ssoc)}
						<OccupationCard occupation={occ} />
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
