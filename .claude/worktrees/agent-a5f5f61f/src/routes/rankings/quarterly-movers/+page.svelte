<script lang="ts">
	import { title as titleStyle, card, sectionLabel, badge, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import QuarterlyMoversDumbbell from '$lib/components/viz/QuarterlyMoversDumbbell.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();
	let report = $derived(data.report);
</script>

<Seo
	title="Quarterly Movers"
	description="Frozen snapshot-to-snapshot changes in Singapore occupation risk scores, band movers, and demand shifts."
	path="/rankings/quarterly-movers"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Quarterly Movers' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Quarterly Movers</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Frozen snapshot-to-snapshot changes in structural risk. These are real scoring deltas — not
		monitor fluctuations or outlook shifts.
	</p>

	<div class="mt-6 grid gap-3 md:grid-cols-3">
		<div class={card({ padding: 'md' })}>
			<p class={caption({ weight: 'semibold' })}>Current snapshot</p>
			<p class="mt-2 font-mono text-lg text-foreground">{report.current_snapshot}</p>
			<p class="text-xs text-muted-foreground">
				generated {new Date(report.generated_at).toLocaleDateString('en-SG', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})}
			</p>
		</div>
		<div class={card({ padding: 'md' })}>
			<p class={caption({ weight: 'semibold' })}>Previous snapshot</p>
			<p class="mt-2 font-mono text-lg text-foreground">
				{report.previous_snapshot ?? 'Baseline only'}
			</p>
			<p class="text-xs text-muted-foreground">frozen comparison anchor</p>
		</div>
		<div class={card({ padding: 'md' })}>
			<p class={caption({ weight: 'semibold' })}>Band movers</p>
			<p class="mt-2 font-mono text-lg text-foreground">
				{report.summary?.band_mover_count ?? report.band_movers.length}
			</p>
			<p class="text-xs text-muted-foreground">occupations that changed risk band</p>
		</div>
	</div>

	{#if report.previous_snapshot}
		<section class="mt-8">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Top Risers</h2>
			<div class={card({ padding: 'md' })}>
				<p class="mb-4 text-sm text-muted-foreground">
					Occupations with the largest increase in structural pressure since the previous frozen
					snapshot.
				</p>
				{#if data.risers.length > 0}
					<QuarterlyMoversDumbbell items={data.risers.slice(0, 10)} direction="rising" />
				{:else}
					<p class="text-sm text-muted-foreground">
						No upward movers in the current comparison set.
					</p>
				{/if}
			</div>
		</section>

		<section class="mt-6">
			<h2 class={cn(sectionLabel(), 'mb-3')}>Top Fallers</h2>
			<div class={card({ padding: 'md' })}>
				<p class="mb-4 text-sm text-muted-foreground">
					Occupations with the largest improvement in structural pressure since the previous
					snapshot.
				</p>
				{#if data.fallers.length > 0}
					<QuarterlyMoversDumbbell items={data.fallers.slice(0, 10)} direction="falling" />
				{:else}
					<p class="text-sm text-muted-foreground">
						No downward movers in the current comparison set.
					</p>
				{/if}
			</div>
		</section>

		<section class="mt-6 grid gap-4 lg:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<div class="flex items-center gap-2">
					<h2 class="text-base font-semibold text-foreground">Band Changes</h2>
					<span class={badge({ variant: 'outline' })}>{report.band_movers.length}</span>
				</div>
				<div class="mt-4 space-y-2">
					{#if report.band_movers.length > 0}
						{#each report.band_movers.slice(0, 12) as mover}
							<a
								href={`/occupation/${mover.ssoc}`}
								class="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted"
							>
								<div>
									<p class="text-sm text-foreground">{mover.title}</p>
									<p class="text-xs text-muted-foreground">
										{mover.from_band} → {mover.to_band}
									</p>
								</div>
								<p
									class={`font-mono text-xs ${mover.risk_delta > 0 ? 'text-risk-high' : 'text-risk-very-low'}`}
								>
									{mover.risk_delta > 0 ? '+' : ''}{(mover.risk_delta * 100).toFixed(1)} pts
								</p>
							</a>
						{/each}
					{:else}
						<p class="text-sm text-muted-foreground">
							No occupations changed risk bands in this snapshot pair.
						</p>
					{/if}
				</div>
			</div>

			<div class={card({ padding: 'md' })}>
				<div class="flex items-center gap-2">
					<h2 class="text-base font-semibold text-foreground">Demand Changes</h2>
					<span class={badge({ variant: 'outline' })}>
						{report.demand_changes.new_sol.length + report.demand_changes.new_jid.length}
					</span>
				</div>
				<div class="mt-4 space-y-3 text-sm">
					<div>
						<p class="font-medium text-foreground">New official demand entries</p>
						<p class="mt-1 text-muted-foreground">
							{#if report.demand_changes.new_sol.length + report.demand_changes.new_jid.length > 0}
								{[...report.demand_changes.new_sol, ...report.demand_changes.new_jid]
									.slice(0, 6)
									.join(' · ')}
							{:else}
								No new shortage / in-demand matches in this snapshot pair.
							{/if}
						</p>
					</div>
					<div>
						<p class="font-medium text-foreground">Removed demand entries</p>
						<p class="mt-1 text-muted-foreground">
							{#if report.demand_changes.removed_sol.length + report.demand_changes.removed_jid.length > 0}
								{[...report.demand_changes.removed_sol, ...report.demand_changes.removed_jid]
									.slice(0, 6)
									.join(' · ')}
							{:else}
								No removals from shortage / in-demand lists in this snapshot pair.
							{/if}
						</p>
					</div>
				</div>
			</div>
		</section>
	{:else}
		<div class={cn(card({ padding: 'md' }), 'mt-8 text-center')}>
			<h2 class="text-base font-semibold text-foreground">Baseline Captured</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				The quarterly snapshot infrastructure is live, but only one frozen scoring snapshot is
				available so far. This page will automatically switch to real deltas once the next snapshot
				is generated.
			</p>
		</div>
	{/if}
	<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
		<span>More:</span>
		<a
			href="/rankings/highest-risk"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Highest Risk</a
		>
		<a
			href="/rankings/ai-leveraged"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Augmented</a
		>
		<a
			href="/rankings/safest-high-paying"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Safest High-Paying</a
		>
		<a
			href="/rankings/best-transitions"
			class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Transitions</a
		>
		<a href="/rankings" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent"
			>All Rankings</a
		>
	</div>
</main>
