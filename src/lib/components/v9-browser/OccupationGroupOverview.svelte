<script lang="ts">
	import { spokenMajorGroupTitle } from '$lib/data/v9-display';
	import type { V9CategorySummary, V9GroupSummary, V9MapItem } from '$lib/data/v9-home';
	import GroupedOccupationMap from './GroupedOccupationMap.svelte';

	interface Props {
		groups: V9GroupSummary[];
		categories?: V9CategorySummary[];
		mapItems: V9MapItem[];
		rankedTotal: number;
		unrankedTotal: number;
	}

	let { groups, mapItems, rankedTotal, unrankedTotal }: Props = $props();
</script>

<div class="space-y-4">
	<GroupedOccupationMap
		items={mapItems}
		totalCount={rankedTotal + unrankedTotal}
		exploreHref="/explore"
	/>

	<ul class="grid gap-px bg-border sm:grid-cols-3 xl:grid-cols-9">
		{#each groups as group (group.code)}
			<li>
				<a
					href="/explore?group={group.code}"
					class="block bg-card px-3 py-3 no-underline transition-colors hover:bg-accent"
				>
					<p class="font-mono text-[11px] text-muted-foreground">{group.code}</p>
					<p class="mt-0.5 text-sm font-bold leading-snug text-foreground">
						{spokenMajorGroupTitle(group.code, group.title)}
					</p>
					<p class="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
						{group.total} jobs
					</p>
				</a>
			</li>
		{/each}
	</ul>
</div>
