<script lang="ts">
	import { badge, card, sectionLabel } from '$lib/design-system';
	import type { V9CapabilityDomain, V9CapabilityProfile } from '$lib/data/v9-capability-profiles';

	let { profile }: { profile: V9CapabilityProfile | null; status?: unknown } = $props();

	let domains = $derived(
		profile
			? Object.entries(profile.domains).sort(
					([, a], [, b]) =>
						a.capability_gap.median / a.gap_scale.max - b.capability_gap.median / b.gap_scale.max
				)
			: []
	);
	let firstTestDomain = $derived(
		domains.find(([, domain]) => domain.job_demand.median >= 3)?.[1] ?? domains[0]?.[1] ?? null
	);

	function percentage(value: number, maximum: number): number {
		return Math.max(0, Math.min(100, (value / maximum) * 100));
	}
</script>

{#if profile}
	<section class="mt-10" aria-labelledby="capability-profile-heading">
		<div class="max-w-3xl">
			<p class={sectionLabel()}>What current AI can do</p>
			<h2 id="capability-profile-heading" class="mt-2 text-2xl font-semibold tracking-tight">
				A separate capability view
			</h2>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				OECD evidence compares current AI capabilities with the abilities a mapped occupation needs.
				It complements the ILO task-overlap rank; it does not change that rank.
			</p>
		</div>

		<div class="mt-5 grid gap-px bg-border lg:grid-cols-[18rem_1fr]">
			<div class="bg-primary p-5 text-primary-foreground sm:p-6">
				<p class="font-mono text-xs uppercase tracking-[0.14em] opacity-80">
					Mapped AI capability proximity
				</p>
				<p class="mt-3 font-mono text-5xl font-semibold tabular-nums">
					{(profile.overall.ai_capability_proximity_0_1.median * 100).toFixed(1)}
					<span class="text-xl">/100</span>
				</p>
				<p class="mt-4 text-sm leading-relaxed opacity-90">
					Higher means the OECD rates current AI capabilities as closer to the demands of the mapped
					O*NET occupation. This is not a probability or a Singapore adoption rate.
				</p>
			</div>

			<div class="bg-card p-5 sm:p-6">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="font-semibold text-foreground">Nine capability domains</h3>
					<span class={badge({ variant: 'info' })}>Mapped OECD evidence</span>
				</div>
				<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
					Job demand and remaining capability gap use different source scales. A shorter gap bar
					means AI is closer to the capability level the occupation requires.
				</p>

				<div class="mt-5 space-y-5">
					{#each domains as [key, domain] (key)}
						{@const item = domain as V9CapabilityDomain}
						<div>
							<div class="flex flex-wrap items-baseline justify-between gap-2">
								<p class="text-sm font-semibold text-foreground">{item.label}</p>
								<p class="font-mono text-xs tabular-nums text-muted-foreground">
									Demand {item.job_demand.median.toFixed(2)}/5 · gap {item.capability_gap.median.toFixed(
										2
									)}/{item.gap_scale.max}
								</p>
							</div>
							<div class="mt-2 grid grid-cols-[4.5rem_1fr] items-center gap-x-3 gap-y-1.5">
								<span class="text-[11px] text-muted-foreground">Job demand</span>
								<span class="h-2 bg-surface-subtle" aria-hidden="true">
									<span
										class="block h-full bg-chart-4"
										style="width: {percentage(item.job_demand.median, 5)}%"
									></span>
								</span>
								<span class="text-[11px] text-muted-foreground">Gap left</span>
								<span class="h-2 bg-surface-subtle" aria-hidden="true">
									<span
										class="block h-full bg-chart-3"
										style="width: {percentage(item.capability_gap.median, item.gap_scale.max)}%"
									></span>
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<details class="mt-3 border border-border bg-card">
			<summary class="cursor-pointer px-4 py-3 text-sm font-semibold text-foreground">
				Source and mapping details
			</summary>
			<div class="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground">
				<p>
					This profile uses {profile.mapping.oecd_candidates.length} accepted O*NET {profile.mapping
						.oecd_candidates.length === 1
						? 'occupation'
						: 'occupations'}:
					{profile.mapping.oecd_candidates
						.map(item => `${item.title} (${item.onet_soc_code})`)
						.join(', ')}.
				</p>
				<p class="mt-2">{profile.mapping.version_limitation}</p>
				<p class="mt-2">
					Only exact crosswalk candidates whose detailed title, including any parenthetical
					qualifier, agrees with the official SSOC title are published. Search synonyms, examples
					and looser matches are excluded.
				</p>
			</div>
		</details>
		{#if firstTestDomain}
			<div class="mt-3 grid gap-3 sm:grid-cols-3">
				<div class={card({ padding: 'md', accent: 'primary' })}>
					<h3 class="font-semibold text-foreground">Try one bounded task</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						Start with a low-consequence {firstTestDomain.label.toLowerCase()} task. Compare time, quality
						and review effort with your normal method.
					</p>
				</div>
				<div class={card({ padding: 'md' })}>
					<h3 class="font-semibold text-foreground">Keep the review owner clear</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						A small capability gap does not show reliability, accountability or fit for your
						employer's workflow. Name who checks the result.
					</p>
				</div>
				<div class={card({ padding: 'md' })}>
					<h3 class="font-semibold text-foreground">Recheck as tools change</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						The OECD measure is updateable. Save the occupation and compare a later release instead
						of treating this profile as permanent.
					</p>
				</div>
			</div>
		{/if}
		<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a href="/reports/ai-capabilities" class="font-medium text-primary underline">
				Read the capability report
			</a>
			<a href="/methodology#capability-evidence" class="font-medium text-primary underline">
				How the mapping is controlled
			</a>
		</div>
	</section>
{/if}
