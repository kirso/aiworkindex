<script lang="ts">
	import { title as titleStyle, riskBadge, card } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'Best AI Career Transitions',
			description:
				'Top high-risk occupations with the most feasible transition paths to lower-risk alternatives in Singapore',
			numberOfItems: data.transitions.length,
			itemListElement: data.transitions.slice(0, 10).map((t, i: number) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: t.from.title,
				url: SITE.url + '/occupation/' + t.from.ssoc
			}))
		})}<\/script>`
	);

	const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'What career transitions reduce AI displacement risk?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'The best transitions move workers from high-risk roles to adjacent occupations with lower AI exposure while leveraging similar skills. Transition feasibility is scored by skill overlap and risk reduction.'
				}
			},
			{
				'@type': 'Question',
				name: 'How are career transition scores calculated?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Transition scores combine skill similarity between occupations with the net risk reduction achieved by moving. Higher scores mean more feasible moves with larger risk improvements.'
				}
			}
		]
	})}<\/script>`;
</script>

	<Seo
		title="Best Career Transitions From High-Risk AI Jobs"
		description="High-risk occupations with the highest transition scores to lower-risk alternatives in Singapore."
		path="/rankings/best-transitions"
		jsonLd={[itemListJsonLd, faqJsonLd]}
	/>

<main class={pageLayout({ width: 'content' })}>
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
<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
		<span>More:</span>
		<a href="/rankings/highest-risk" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Highest Risk</a>
		<a href="/rankings/ai-leveraged" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Augmented</a>
		<a href="/rankings/safest-high-paying" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Safest High-Paying</a>
		<a href="/rankings/best-transitions" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">Transitions</a>
		<a href="/rankings" class="rounded-full border border-border px-2 py-0.5 hover:bg-accent">All Rankings</a>
	</div>
</main>
