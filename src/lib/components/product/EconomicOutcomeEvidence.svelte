<script lang="ts">
	import { badge, sectionLabel } from '$lib/design-system';
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

{#if context.group}
	<section class="mt-10" aria-labelledby="economic-evidence-heading">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class={sectionLabel()}>Singapore employment context</p>
				<h2 id="economic-evidence-heading" class="mt-1 text-2xl font-bold tracking-tight">
					What is happening in the broader job group
				</h2>
			</div>
			<span class={badge({ variant: 'outline' })}>Broad-group data</span>
		</div>

		<div class="mt-4 border border-border bg-card">
			<div class="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
				<div class="bg-card p-4">
					<p class="text-xs text-muted-foreground">Employed residents · 2025</p>
					<p class="mt-1 font-mono text-xl font-semibold tabular-nums">
						{context.group.employmentLatestThousands == null
							? 'Unavailable'
							: `${context.group.employmentLatestThousands.toLocaleString()}K`}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class="text-xs text-muted-foreground">Change from 2024</p>
					<p class="mt-1 font-mono text-xl font-semibold tabular-nums">
						{signedPercent(context.group.employmentYearOverYearPct)}
					</p>
				</div>
				<div class="bg-card p-4">
					<p class="text-xs text-muted-foreground">Workers aged 15–29</p>
					<p class="mt-1 font-mono text-xl font-semibold tabular-nums">
						{share(context.group.youngWorkerShare)}
					</p>
				</div>
				<div class="bg-card p-4">
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

			<div
				class="grid gap-5 border-t border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"
			>
				<div>
					<h3 class="text-sm font-semibold text-foreground">{context.group.title}</h3>
					{#if context.group.labourSummary}
						<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
							{context.group.labourSummary}
						</p>
					{/if}
					<p class="mt-2 text-xs leading-relaxed text-muted-foreground">
						Employment can move with demand, prices, investment, hiring and worker adjustment as
						well as technology. This broad group is context for the occupation, not its forecast.
					</p>
				</div>
				{#if context.group.topIndustries.length > 0}
					<div>
						<p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Largest industries in 2025
						</p>
						<ul class="mt-2 space-y-2 text-xs text-foreground">
							{#each context.group.topIndustries.slice(0, 4) as industry (industry.key)}
								<li
									class="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-b-0"
								>
									<span>{industry.label}</span>
									<span class="font-mono tabular-nums"
										>{(industry.share_2025 * 100).toFixed(1)}%</span
									>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>

		<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a href="/reports/labour-observatory" class="font-medium text-primary underline">
				Explore the labour observatory
			</a>
			<a href="/methodology#economic-evidence" class="font-medium text-primary underline">
				How these measures differ
			</a>
		</div>
	</section>
{/if}
