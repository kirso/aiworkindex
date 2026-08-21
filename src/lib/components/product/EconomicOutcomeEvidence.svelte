<script lang="ts">
	import { badge, card, sectionLabel } from '$lib/design-system';
	import type { V9EconomicOccupationView } from '$lib/data/v9-economic-observatory';

	let { context }: { context: V9EconomicOccupationView } = $props();

	function signedPercent(value: number | null): string {
		if (value == null) return 'Unavailable';
		return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	}

	function share(value: number | null): string {
		return value == null ? 'Unavailable' : `${(value * 100).toFixed(1)}%`;
	}
</script>

<section class="mt-10" aria-labelledby="economic-evidence-heading">
	<div class="max-w-3xl">
		<p class={sectionLabel()}>Employment outcomes</p>
		<h2 id="economic-evidence-heading" class="mt-2 text-2xl font-semibold tracking-tight">
			What could change the result for workers?
		</h2>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			Task pressure measures technical overlap. Hiring and wages also depend on adoption, demand,
			prices, new work, firm decisions and worker adjustment. V9 keeps those mechanisms separate.
		</p>
	</div>

	<div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		<div class={card({ padding: 'md', accent: 'primary' })}>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h3 class="font-semibold text-foreground">Task substitution</h3>
				<span
					class={badge({ variant: context.coverage.pressure === 'ranked' ? 'info' : 'outline' })}
				>
					{context.coverage.pressure === 'ranked' ? 'Partly measured' : 'Unranked'}
				</span>
			</div>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				V9 measures mapped task overlap, not whether an employer can remove the whole job or its
				human review.
			</p>
		</div>

		<div class={card({ padding: 'md' })}>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h3 class="font-semibold text-foreground">Demand expansion</h3>
				<span class={badge({ variant: 'outline' })}>Unknown</span>
			</div>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				No occupation-specific price, output or demand-elasticity series is available. V9 therefore
				does not claim a rebound effect.
			</p>
		</div>

		<div class={card({ padding: 'md' })}>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h3 class="font-semibold text-foreground">New work</h3>
				<span class={badge({ variant: 'outline' })}>Unknown</span>
			</div>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Singapore publishes aggregate evidence that some firms created AI roles, but not a
				comparable new-task series for this occupation.
			</p>
		</div>

		<div class={card({ padding: 'md' })}>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h3 class="font-semibold text-foreground">Employer adoption</h3>
				<span class={badge({ variant: 'warning' })}>Broad context</span>
			</div>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				MOM reports adoption by firm size and selected sectors. It does not publish detailed
				adoption for this occupation.
			</p>
		</div>

		<div class={card({ padding: 'md' })}>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h3 class="font-semibold text-foreground">Current market evidence</h3>
				<span class={badge({ variant: context.coverage.direct_wage ? 'success' : 'outline' })}>
					{context.coverage.direct_wage ? 'Direct pay row' : 'Partial'}
				</span>
			</div>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				{context.coverage.named_demand_sources > 0
					? `${context.coverage.named_demand_sources} reviewed demand-source ${context.coverage.named_demand_sources === 1 ? 'match is' : 'matches are'} available.`
					: 'The selected demand lists contain no reviewed match; that is unknown demand, not low demand.'}
			</p>
		</div>

		<div class={card({ padding: 'md' })}>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h3 class="font-semibold text-foreground">AI employment effect</h3>
				<span class={badge({ variant: 'outline' })}>Not identified</span>
			</div>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				There is no adoption-linked comparison group for this occupation, so V9 publishes no
				contraction, expansion or job-loss estimate.
			</p>
		</div>
	</div>

	{#if context.group}
		<div class="mt-6 border border-border bg-card p-5 sm:p-6">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class={sectionLabel()}>Broader occupation-group context</p>
					<h3 class="mt-2 text-lg font-semibold text-foreground">{context.group.title}</h3>
				</div>
				<span
					class={badge({
						variant: context.group.employmentLatestThousands == null ? 'outline' : 'info'
					})}
				>
					{context.group.employmentLatestThousands == null
						? 'No separate group row'
						: 'Broad-group data'}
				</span>
			</div>

			{#if context.group.employmentLatestThousands != null}
				<div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<div>
						<p class="text-xs text-muted-foreground">Employed residents · 2025</p>
						<p class="mt-1 font-mono text-xl font-semibold tabular-nums">
							{context.group.employmentLatestThousands.toLocaleString()}K
						</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">Change from 2024</p>
						<p class="mt-1 font-mono text-xl font-semibold tabular-nums">
							{signedPercent(context.group.employmentYearOverYearPct)}
						</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">Workers aged 15–29</p>
						<p class="mt-1 font-mono text-xl font-semibold tabular-nums">
							{share(context.group.youngWorkerShare)}
						</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">Broad vacancy rate</p>
						<p class="mt-1 font-mono text-xl font-semibold tabular-nums">
							{context.group.vacancyRate == null
								? 'Unavailable'
								: `${context.group.vacancyRate.toFixed(1)}%`}
						</p>
						{#if context.group.vacancyPeriod}
							<p class="mt-1 text-xs text-muted-foreground">{context.group.vacancyPeriod}</p>
						{/if}
					</div>
				</div>
				<div class="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
					<div>
						<p class="text-xs text-muted-foreground">Women in the broad group</p>
						<p class="mt-1 font-mono text-lg font-semibold tabular-nums">
							{share(context.group.femaleShare)}
						</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">Self-employed</p>
						<p class="mt-1 font-mono text-lg font-semibold tabular-nums">
							{share(context.group.selfEmployedShare)}
						</p>
					</div>
					<div>
						<p class="text-xs text-muted-foreground">Part-time</p>
						<p class="mt-1 font-mono text-lg font-semibold tabular-nums">
							{share(context.group.partTimeShare)}
						</p>
					</div>
				</div>

				{#if context.group.topIndustries.length > 0}
					<div class="mt-5 border-t border-border pt-4">
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Largest industries for this broad group in 2025
						</p>
						<div class="mt-2 flex flex-wrap gap-2">
							{#each context.group.topIndustries.slice(0, 5) as industry (industry.key)}
								<span class="border border-border px-2 py-1 text-xs text-foreground">
									{industry.label} · {(industry.share_2025 * 100).toFixed(1)}%
								</span>
							{/each}
						</div>
					</div>
				{/if}
			{:else}
				<p class="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
					The retained official source has no separate observation for this major group. The wider
					labour cluster is not used as a replacement.
				</p>
			{/if}

			{#if context.group.labourSummary}
				<p
					class="mt-5 max-w-4xl border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground"
				>
					{context.group.labourSummary}
				</p>
			{/if}
			<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
				Broad-group observations describe a mixed set of occupations. They provide context, not a
				measurement for this specific job and not evidence that AI caused the change.
			</p>
		</div>
	{/if}

	<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
		<a href="/reports/labour-observatory" class="font-medium text-primary underline">
			See the full Singapore labour observatory
		</a>
		<a href="/methodology#economic-evidence" class="font-medium text-primary underline">
			How economic evidence is handled
		</a>
	</div>
</section>
