<script lang="ts">
	import { riskBandLabels } from '$lib/data';
	import {
		card,
		riskBadge,
		pageLayout,
		title as titleStyle,
		body,
		caption,
		mono,
		pill,
		section,
		sectionLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { SITE, DATA_VINTAGE } from '$lib/data/scoring-constants';

	let { data } = $props();
	let group = $derived(data.group);
	let occs = $derived(data.occupations);
	let stats = $derived(data.stats);
	let allGroups = $derived(data.allGroups);

	let highestRisk = $derived(occs.slice(0, 5));
	let lowestRisk = $derived([...occs].sort((a, b) => a.net_risk - b.net_risk).slice(0, 5));

	let pageTitle = $derived(`${group.label} — AI Risk by Occupation Group | ${SITE.name}`);
	let pageDescription = $derived(
		`AI displacement risk for ${stats.count} ${group.label} occupations in Singapore. Average risk: ${Math.round(stats.avgRisk * 100)}%. Median wage: SGD ${Math.round(stats.medianWage).toLocaleString()}/month.`
	);

	let breadcrumbJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{
					'@type': 'ListItem',
					position: 1,
					name: 'Home',
					item: SITE.url + '/'
				},
				{
					'@type': 'ListItem',
					position: 2,
					name: 'Occupation Groups',
					item: SITE.url + '/groups'
				},
				{
					'@type': 'ListItem',
					position: 3,
					name: group.label,
					item: SITE.url + '/group/' + group.slug
				}
			]
		})}<\/script>`
	);

	let faqJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: `How will AI affect ${group.label} jobs in Singapore?`,
					acceptedAnswer: {
						'@type': 'Answer',
						text: `There are ${stats.count} ${group.label} occupations scored in Singapore. The average AI displacement risk is ${Math.round(stats.avgRisk * 100)}%, with ${stats.bandCounts.very_high + stats.bandCounts.high} occupations at High or Very High risk and ${stats.bandCounts.very_low + stats.bandCounts.low} at Low or Very Low risk. Median gross wage: SGD ${Math.round(stats.medianWage).toLocaleString()}/month.`
					}
				},
				{
					'@type': 'Question',
					name: `What are the highest AI risk ${group.label.toLowerCase()} occupations?`,
					acceptedAnswer: {
						'@type': 'Answer',
						text: `The highest-risk ${group.label} occupations are: ${highestRisk.map((o) => `${o.title} (${Math.round(o.net_risk * 100)}%)`).join(', ')}.`
					}
				}
			]
		})}<\/script>`
	);
</script>

<Seo
	title={pageTitle}
	description={pageDescription}
	path="/group/{group.slug}"
	jsonLd={[breadcrumbJsonLd, faqJsonLd]}
/>

<div class={pageLayout()}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Occupation Groups', href: '/groups' },
			{ label: group.label }
		]}
	/>

	<header class="mb-8">
		<h1 class={titleStyle({ size: 'page' })}>{group.label}</h1>
		<p class={cn(body({ size: 'lg', tone: 'subtle' }), 'mt-2 max-w-3xl')}>
			AI displacement risk overview for {stats.count} occupations in the {group.label} group.
			Average risk: {Math.round(stats.avgRisk * 100)}%. Updated {DATA_VINTAGE.last_updated}.
		</p>
	</header>

	<!-- Stats overview -->
	<section class={section()}>
		<h2 class={sectionLabel()}>Group Overview</h2>
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'md' })}>
				<p class={caption()}>Occupations</p>
				<p class={mono({ size: 'lg' })}>{stats.count}</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class={caption()}>Average Risk</p>
				<p class={mono({ size: 'lg' })}>{Math.round(stats.avgRisk * 100)}%</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class={caption()}>Median Wage</p>
				<p class={mono({ size: 'lg' })}>SGD {Math.round(stats.medianWage).toLocaleString()}</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class={caption()}>High/Very High Risk</p>
				<p class={mono({ size: 'lg' })}>{stats.bandCounts.high + stats.bandCounts.very_high}</p>
			</div>
		</div>
	</section>

	<!-- Risk band distribution -->
	<section class={section()}>
		<h2 class={sectionLabel()}>Risk Distribution</h2>
		<div class={card({ padding: 'md' })}>
			<div class="space-y-2">
				{#each (['very_high', 'high', 'moderate', 'low', 'very_low'] as const) as band}
					{@const count = stats.bandCounts[band]}
					{@const pct = stats.count > 0 ? Math.round((count / stats.count) * 100) : 0}
					<div class="flex items-center gap-3">
						<span class={cn(riskBadge({ band }), 'w-24 justify-center text-xs')}>{riskBandLabels[band]}</span>
						<div class="flex-1 h-5 rounded bg-muted overflow-hidden">
							<div class="h-full rounded bg-current opacity-30" style="width: {pct}%"></div>
						</div>
						<span class={cn(mono({ size: 'sm' }), 'w-16 text-right')}>{count} ({pct}%)</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Highest risk -->
	<section class={section()}>
		<h2 class={sectionLabel()}>Highest Risk in {group.label}</h2>
		<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
			{#each highestRisk as occ}
				<a
					href="/occupation/{occ.ssoc}"
					class={cn(card({ padding: 'sm', variant: 'inset' }), 'block hover:bg-accent hover:shadow-sm transition-all group')}
				>
					<p class={cn(body(), 'font-medium text-foreground truncate')}>
						{occ.title}
						<span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
					</p>
					<div class={cn(caption(), 'mt-1 flex items-center gap-2')}>
						<span class={riskBadge({ band: occ.risk_band })}>{Math.round(occ.net_risk * 100)}%</span>
						<span>SGD {occ.gross_wage_median.toLocaleString()}/mo</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- Lowest risk -->
	<section class={section()}>
		<h2 class={sectionLabel()}>Lowest Risk in {group.label}</h2>
		<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
			{#each lowestRisk as occ}
				<a
					href="/occupation/{occ.ssoc}"
					class={cn(card({ padding: 'sm', variant: 'inset' }), 'block hover:bg-accent hover:shadow-sm transition-all group')}
				>
					<p class={cn(body(), 'font-medium text-foreground truncate')}>
						{occ.title}
						<span class="opacity-0 group-hover:opacity-100 transition-opacity text-primary">→</span>
					</p>
					<div class={cn(caption(), 'mt-1 flex items-center gap-2')}>
						<span class={riskBadge({ band: occ.risk_band })}>{Math.round(occ.net_risk * 100)}%</span>
						<span>SGD {occ.gross_wage_median.toLocaleString()}/mo</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- All occupations -->
	<section class={section()}>
		<h2 class={sectionLabel()}>All {stats.count} Occupations</h2>
		<div class={card({ padding: 'md' })}>
			<div class="divide-y divide-border">
				{#each occs as occ}
					<a
						href="/occupation/{occ.ssoc}"
						class="flex items-center justify-between py-2 px-1 hover:bg-accent rounded transition-colors"
					>
						<span class={cn(body(), 'truncate pr-4')}>{occ.title}</span>
						<div class="flex items-center gap-3 shrink-0">
							<span class={mono({ size: 'sm' })}>SGD {occ.gross_wage_median.toLocaleString()}</span>
							<span class={cn(riskBadge({ band: occ.risk_band }), 'text-xs')}>
								{Math.round(occ.net_risk * 100)}%
							</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- Other groups -->
	<section class={section()}>
		<h2 class={sectionLabel()}>Other Occupation Groups</h2>
		<div class="flex flex-wrap gap-2">
			{#each allGroups.filter((g) => g.slug !== group.slug) as g}
				<a href="/group/{g.slug}" class={cn(pill({ tone: 'muted' }), 'hover:bg-accent transition-colors')}>
					{g.label}
				</a>
			{/each}
		</div>
	</section>
</div>
