<script lang="ts">
	import { badge, card, sectionLabel } from '$lib/design-system';
	import type { V9ResearchSignalProfile } from '$lib/data/v9-research-signals';

	interface Sources {
		eloundou: {
			publisher: string;
			publication_title: string;
			publication_url: string;
			publication_date: string;
		};
		anthropic_observed_exposure: {
			publisher: string;
			publication_title: string;
			publication_url: string;
			publication_date: string;
			observation_periods: string[];
		};
	}

	let { profile, sources }: { profile: V9ResearchSignalProfile | null; sources: Sources } =
		$props();

	function percent(value: number): string {
		return `${(value * 100).toFixed(1)}%`;
	}
</script>

{#if profile}
	<section class="mt-10" aria-labelledby="research-signal-heading">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div class="max-w-3xl">
				<p class={sectionLabel()}>Research cross-check</p>
				<h2 id="research-signal-heading" class="mt-1 text-2xl font-bold text-foreground">
					Possible scope versus observed use
				</h2>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					Two US research measures answer different questions. They sit beside the Singapore
					pressure rank and never change it.
				</p>
			</div>
			<span class={badge({ variant: 'info' })}>Reviewed occupation identity</span>
		</div>

		<div class="mt-4 grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<div class="flex items-end justify-between gap-3">
					<div>
						<p class="text-xs font-semibold text-muted-foreground">Theoretical LLM scope</p>
						<p class="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground">
							{percent(profile.eloundou_theoretical_exposure.value_0_1)}
						</p>
					</div>
					<p class="text-right font-mono text-xs tabular-nums text-muted-foreground">
						P{profile.eloundou_theoretical_exposure.within_published_subset_midrank_percentile.toFixed(
							1
						)} of 68
					</p>
				</div>
				<div class="mt-4 h-3 bg-surface-subtle" aria-hidden="true">
					<div
						class="h-full bg-chart-3"
						style="width: {profile.eloundou_theoretical_exposure.value_0_1 * 100}%"
					></div>
				</div>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					Estimated share-equivalent of tasks within reach of an LLM, including tasks that need
					complementary software. It describes technical potential, not employer adoption.
				</p>
			</div>

			<div class={card({ padding: 'md' })}>
				{#if profile.anthropic_observed_exposure}
					<div class="flex items-end justify-between gap-3">
						<div>
							<p class="text-xs font-semibold text-muted-foreground">Observed Claude use</p>
							<p class="mt-1 font-mono text-3xl font-semibold tabular-nums text-foreground">
								{percent(profile.anthropic_observed_exposure.value_0_1)}
							</p>
						</div>
						<p class="text-right font-mono text-xs tabular-nums text-muted-foreground">
							P{profile.anthropic_observed_exposure.within_published_subset_midrank_percentile.toFixed(
								1
							)} of 66
						</p>
					</div>
					<div class="mt-4 h-3 bg-surface-subtle" aria-hidden="true">
						<div
							class="h-full bg-chart-1"
							style="width: {profile.anthropic_observed_exposure.value_0_1 * 100}%"
						></div>
					</div>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						Share-equivalent of feasible work tasks seen in work-related Claude usage, with
						automated use weighted more than assisted use. It is platform evidence, not Singapore
						adoption.
					</p>
				{:else}
					<p class="text-xs font-semibold text-muted-foreground">Observed Claude use</p>
					<p class="mt-2 text-lg font-semibold text-foreground">No matching source row</p>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						The reviewed occupation identity has no exact row in Anthropic's published file. We
						leave the value blank.
					</p>
				{/if}
			</div>
		</div>

		{#if profile.derived_theory_use_gap && profile.anthropic_observed_exposure}
			<div class="mt-3 border border-border bg-surface-subtle px-4 py-3">
				<p class="text-sm leading-relaxed text-foreground">
					<strong>Research gap:</strong>
					{percent(Math.abs(profile.derived_theory_use_gap.value_0_1))} points
					{profile.derived_theory_use_gap.value_0_1 >= 0
						? 'more theoretical scope than observed Claude use'
						: 'more observed Claude use than the earlier theoretical estimate'}. This difference can
					reflect adoption, product fit, user selection and measurement—not future job loss.
				</p>
			</div>
		{/if}

		<details class="mt-3 border border-border bg-card">
			<summary class="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
				Sources and occupation match
			</summary>
			<div class="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground">
				<p>
					This SSOC record was matched to {profile.mapping.onet_title} ({profile.mapping
						.onet_soc_code}) through one reviewed detailed-title identity. Looser and many-to-many
					matches are not published.
				</p>
				<p class="mt-2">
					<a
						href={sources.eloundou.publication_url}
						target="_blank"
						rel="noreferrer"
						class="font-medium text-primary underline"
						>OpenAI / Eloundou et al. ({sources.eloundou.publication_date.slice(0, 4)})</a
					>
					{#if profile.anthropic_observed_exposure}
						·
						<a
							href={sources.anthropic_observed_exposure.publication_url}
							target="_blank"
							rel="noreferrer"
							class="font-medium text-primary underline"
							>Anthropic ({sources.anthropic_observed_exposure.publication_date.slice(0, 4)})</a
						>
					{/if}
				</p>
			</div>
		</details>
	</section>
{/if}
