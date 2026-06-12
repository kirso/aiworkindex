<script lang="ts">
	import RankingNavPills from '$lib/components/ui/RankingNavPills.svelte';
	import { title as titleStyle, riskBadge, card } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import { SITE } from '$lib/data/scoring-constants';
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';

	let { data } = $props();

	let itemListJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: 'High AI Risk, Few Exit Paths',
			description:
				'Occupations facing high AI displacement pressure where even the best adjacent career move is a stretch',
			numberOfItems: data.quadrant.length,
			itemListElement: data.quadrant.slice(0, 10).map((entry, i: number) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: entry.from.title,
				url: SITE.url + '/occupation/' + entry.from.ssoc
			}))
		})}<\/script>`
	);

	const faqItems = [
		{
			question: 'Why do exit paths matter as much as AI risk itself?',
			answer:
				'Occupational mobility research (del Rio-Chanona et al. 2021; IMF 2024) finds that whether displacement pressure turns into unemployment or smooth reallocation depends on the transition network around an occupation — two occupations with the same risk score can have very different outcomes depending on their escape routes.'
		},
		{
			question: 'What counts as "few exits"?',
			answer:
				'An occupation lands here when its single best risk-reducing transition falls in the weakest quarter of exit scores among all high-risk occupations. Lateral or higher-risk moves never count as exits, however similar the work. The transition score combines archetype similarity, skill overlap, wage preservation, demand strength, and risk improvement.'
		}
	];

	const faqJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="High AI Risk, Few Exit Paths"
	description="The structurally vulnerable quadrant: occupations with high AI displacement pressure where even the best adjacent career move is a stretch."
	path="/rankings/high-risk-few-exits"
	jsonLd={[itemListJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'High Risk, Few Exits' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>High Risk, Few Exit Paths</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Mobility research finds that displacement pressure only becomes hardship when workers lack
		credible adjacent moves (del Rio-Chanona et al. 2021; IMF 2024). Of {data.highRiskCount} occupations
		above the displacement threshold, these {data.quadrant.length} have the weakest exit options: their
		<em>best risk-reducing</em>
		transition falls in the bottom quarter of exit scores within the high-risk cohort (&le;{(
			data.threshold * 100
		).toFixed(0)}% match). For high-risk occupations with strong escape routes, see
		<a href="/rankings/best-transitions" class="text-primary hover:underline">Best Transitions</a>.
	</p>

	<div class="mt-6 space-y-4">
		{#each data.quadrant as { from, targets } (from.ssoc)}
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
					<p class="mt-2 text-xs text-muted-foreground">Best risk-reducing options:</p>
					<div class="mt-2 grid gap-2 sm:grid-cols-3">
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
					<p class="mt-2 text-xs text-muted-foreground italic">
						No risk-reducing transition paths found.
					</p>
				{/if}
			</div>
		{/each}
	</div>
	<FaqList items={faqItems} />
	<RankingNavPills />
	<PageFooterNav
		links={[
			{ href: '/rankings', label: 'All rankings' },
			{ href: '/rankings/best-transitions', label: 'Best transitions' },
			{ href: '/methodology', label: 'Methodology' }
		]}
	/>
</main>
