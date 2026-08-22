<script lang="ts">
	import {
		demandContextLabels,
		exposureSourceLabels,
		formatRank,
		likelyPathwayLabels
	} from '$lib/data/v8-display';
	import type { V8OccupationProjection } from '$lib/data/v8-contract';

	type SourceKey = keyof typeof exposureSourceLabels;

	type EvidenceProfileSubject = {
		exposure: number;
		bottleneck: number;
		net_risk: number;
		market: { market_resilience: number };
		evidence: {
			exposure_source_pctiles?: Partial<Record<SourceKey, number>>;
			exposure_source_weights?: Partial<Record<SourceKey, number>>;
			anthropic_calibrated?: boolean;
		};
		v8?: V8OccupationProjection;
	};

	let { occupation }: { occupation: EvidenceProfileSubject } = $props();

	let sources = $derived(
		(
			Object.entries(occupation.evidence.exposure_source_pctiles ?? {}) as Array<
				[SourceKey, number]
			>
		).map(([key, value]) => ({
			key,
			label: exposureSourceLabels[key],
			value,
			weight: occupation.evidence.exposure_source_weights?.[key] ?? null
		}))
	);
</script>

<div class="space-y-4" role="img" aria-label="Evidence used to describe AI exposure">
	{#if occupation.v8 && sources.length > 0}
		<div class="space-y-3">
			{#each sources as source}
				<div>
					<div class="mb-1 flex items-center justify-between gap-3 text-xs">
						<span class="font-medium text-foreground">{source.label}</span>
						<span class="font-mono tabular-nums text-text-secondary">
							{formatRank(source.value * 100)}{#if source.weight !== null}
								<span class="ml-1 text-muted-foreground">
									({Math.round(source.weight * 100)}% weight)
								</span>
							{/if}
						</span>
					</div>
					<div class="h-2.5 overflow-hidden rounded-sm bg-muted">
						<div
							class="h-full rounded-sm bg-primary"
							style:width={`${Math.max(2, source.value * 100)}%`}
						></div>
					</div>
				</div>
			{/each}
		</div>

		<div class="border-t border-border pt-3">
			<div class="flex items-baseline justify-between gap-3">
				<span class="text-sm font-semibold text-foreground">Combined AI Exposure Rank</span>
				<span class="font-mono text-base font-bold tabular-nums text-foreground">
					{formatRank(occupation.v8.ai_exposure_rank.points)}
				</span>
			</div>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
				The source percentiles are combined using the displayed reliability weights, then ranked
				against all 562 Singapore occupations. This is not a percentage of tasks and not a job-loss
				probability.
			</p>
		</div>

		<div class="grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
			<div class="rounded-sm bg-muted px-3 py-2">
				<p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
					Likely job pathway
				</p>
				<p class="mt-1 text-xs font-medium text-foreground">
					{likelyPathwayLabels[occupation.v8.likely_pathway]}
				</p>
			</div>
			<div class="rounded-sm bg-muted px-3 py-2">
				<p class="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
					Current demand context
				</p>
				<p class="mt-1 text-xs font-medium text-foreground">
					{demandContextLabels[occupation.v8.market_context.demand]}
				</p>
			</div>
		</div>
		<p class="text-xs leading-relaxed text-muted-foreground">
			Pathway and demand are reported beside the exposure rank. Current demand does not change the
			rank.
		</p>
	{:else}
		<div class="space-y-3">
			{#each [{ label: 'Component-derived AI exposure', value: occupation.exposure }, { label: 'Human-context input', value: occupation.bottleneck }, { label: 'Related-occupation demand input', value: occupation.market.market_resilience }] as input}
				<div>
					<div class="mb-1 flex justify-between gap-3 text-xs">
						<span class="font-medium text-foreground">{input.label}</span>
						<span class="font-mono tabular-nums text-text-secondary">
							{Math.round(input.value * 100)}/100
						</span>
					</div>
					<div class="h-2.5 overflow-hidden rounded-sm bg-muted">
						<div
							class="h-full rounded-sm bg-primary"
							style:width={`${Math.max(2, input.value * 100)}%`}
						></div>
					</div>
				</div>
			{/each}
		</div>
		<div class="flex items-baseline justify-between gap-3 border-t border-border pt-3">
			<span class="text-sm font-semibold text-foreground">Estimated role exposure score</span>
			<span class="font-mono text-base font-bold tabular-nums text-foreground">
				{formatRank(occupation.net_risk * 100)}
			</span>
		</div>
		<p class="text-xs leading-relaxed text-muted-foreground">
			This role-level estimate is synthesized from related occupations and a general workflow
			profile. It is not a percentile rank, a measured task share, or a job-loss probability.
		</p>
	{/if}
</div>
