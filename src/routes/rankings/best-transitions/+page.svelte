<script lang="ts">
	import { title as titleStyle, riskBadge, card } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';

	let { data } = $props();
</script>

<svelte:head>
	<title>Best Transitions — Rankings | SG AI Jobs</title>
	<meta
		name="description"
		content="High-risk occupations with the highest transition scores to lower-risk alternatives."
	/>
</svelte:head>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Best Transitions' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Best Transition Paths</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		For high-risk occupations, these are the most feasible transitions to lower-risk alternatives.
		Scores combine archetype similarity, skill overlap, wage preservation, demand strength, and risk
		improvement.
	</p>

	<div class="mt-6 space-y-4">
		{#each data.transitions as { from, targets } (from.ssoc)}
			<div class={cn(card({ padding: 'md' }))}>
				<div class="flex items-center justify-between">
					<div>
						<a
							href="/occupation/{from.ssoc}"
							class="text-sm font-semibold text-foreground hover:text-primary"
						>
							{from.title}
						</a>
						<span class="ml-2 text-xs text-muted-foreground">SSOC {from.ssoc}</span>
					</div>
					<span class={cn(riskBadge({ band: from.risk_band }), 'text-xs')}>
						{(from.net_risk * 100).toFixed(0)}% risk
					</span>
				</div>
				{#if targets.length > 0}
					<div class="mt-3 grid gap-2 sm:grid-cols-3">
						{#each targets as t (t.to_ssoc)}
							<a
								href="/occupation/{t.to_ssoc}"
								class="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm hover:bg-muted"
							>
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium text-foreground">{t.to_title}</p>
									<p class="text-xs text-muted-foreground">
										{t.label} &middot; {(t.composite * 100).toFixed(0)}% match
									</p>
								</div>
								<svg
									class="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M5 12h14M12 5l7 7-7 7" />
								</svg>
							</a>
						{/each}
					</div>
				{:else}
					<p class="mt-2 text-xs text-muted-foreground italic">No strong transition paths found.</p>
				{/if}
			</div>
		{/each}
	</div>
</main>
