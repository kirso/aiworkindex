<script lang="ts">
	import {
		likelyPathwayColors,
		likelyPathwayDescriptions,
		likelyPathwayLabels,
		likelyPathwayOrder,
		pathwayForDisplay
	} from '$lib/data/v8-display';
	import type { LikelyPathway } from '$lib/data/v8-contract';

	type PathwayRow = {
		likelyPathway?: string | null;
		v8?: { likely_pathway: LikelyPathway };
	};

	let { occupations }: { occupations: PathwayRow[] } = $props();

	let data = $derived(
		likelyPathwayOrder.map(pathway => ({
			pathway,
			count: occupations.filter(
				occupation =>
					pathwayForDisplay(occupation.v8?.likely_pathway ?? occupation.likelyPathway) === pathway
			).length
		}))
	);
	let maximumCount = $derived(Math.max(1, ...data.map(item => item.count)));
</script>

<figure aria-labelledby="pathway-caption">
	<div class="space-y-3">
		{#each data as item}
			<div>
				<div class="mb-1 flex items-baseline justify-between gap-3">
					<span class="text-xs font-medium text-foreground sm:text-sm">
						{likelyPathwayLabels[item.pathway]}
					</span>
					<span class="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">
						{item.count}
					</span>
				</div>
				<div class="h-3 overflow-hidden rounded-sm bg-muted">
					<div
						class="h-full rounded-sm"
						style:width={`${Math.max(2, (item.count / maximumCount) * 100)}%`}
						style:background-color={likelyPathwayColors[item.pathway]}
					></div>
				</div>
				<p class="mt-1 text-[11px] leading-snug text-muted-foreground">
					{likelyPathwayDescriptions[item.pathway]}
				</p>
			</div>
		{/each}
	</div>
	<figcaption
		id="pathway-caption"
		class="mt-4 border-t border-border pt-3 text-xs text-muted-foreground"
	>
		Rule-based interpretations of current exposure, substitution, augmentation, adoption, and demand
		evidence. They are not forecasts that the named outcome will occur.
	</figcaption>
</figure>
