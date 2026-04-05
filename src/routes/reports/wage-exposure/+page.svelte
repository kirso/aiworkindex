<script lang="ts">
	import { pageLayout, card, sectionLabel, caption, display, riskBadge } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';
	import { countryConfigs } from '$lib/data/country-config';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();
	const sgCurrency = countryConfigs.sg.currency ?? 'SGD';

	let headlineNumber = $derived(`${sgCurrency} ${(data.highRiskAnnualWages / 1e9).toFixed(1)} Billion`);
	let topGroup = $derived(data.groupBreakdown[0]);

	function formatWagesBillions(wages: number): string {
		return `${sgCurrency} ${(wages / 1e9).toFixed(1)}B`;
	}

	function formatWagesMillions(wages: number): string {
		if (wages >= 1e9) return `${sgCurrency} ${(wages / 1e9).toFixed(1)}B`;
		return `${sgCurrency} ${(wages / 1e6).toFixed(0)}M`;
	}

	let articleJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: `${sgCurrency} ${(data.highRiskAnnualWages / 1e9).toFixed(1)} Billion in Live-Market Wages Face High AI Structural Pressure`,
			author: { '@type': 'Person', name: SITE.author, url: SITE.authorUrl },
			publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
			datePublished: DATA_VINTAGE.last_updated,
			dateModified: DATA_VINTAGE.last_updated,
			description: `Wage-pool analysis for ${data.highRiskCount} occupations with high structural AI pressure in the current live reference market.`,
			mainEntityOfPage: { '@type': 'WebPage', '@id': SITE.url + '/reports/wage-exposure' }
		})}<\/script>`
	);

	let faqJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: "How large is the wage pool in the high-pressure occupations?",
					acceptedAnswer: {
						'@type': 'Answer',
						text: `${headlineNumber} is the estimated annual wage pool inside occupations with high structural AI pressure in the AI Work Index. It is a wage-pool estimate, not a forecast of wages lost.`
					}
				},
				{
					'@type': 'Question',
					name: 'Which sectors contain the largest wage pools under structural AI pressure?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: topGroup
							? `${topGroup.label} contains the largest wage pool at ${formatWagesBillions(topGroup.wages)}, covering ${topGroup.count} high-pressure occupations with an average net risk of ${(topGroup.avgRisk * 100).toFixed(0)}%.`
							: 'See the full breakdown on the AI Work Index wage exposure report.'
					}
				}
			]
		})}<\/script>`
	);
</script>

<Seo
	title="Wage Pool Under Structural Pressure — {sgCurrency} {(data.highRiskAnnualWages / 1e9).toFixed(1)}B"
	description="Wage-pool analysis for occupations with high structural AI pressure in the current live reference market. {data.highRiskCount} occupations covering about {data.highRiskEmployment.toFixed(
		0
	)}K Est. workers."
	path="/reports/wage-exposure"
	type="article"
	jsonLd={[articleJsonLd, faqJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'Wage Exposure' }
		]}
	/>

	<!-- Hero -->
	<section class="mt-2">
		<p class={cn(sectionLabel(), 'mb-2')}>Wage Exposure Analysis</p>
		<p class={display({ size: 'xl' })}>{headlineNumber}</p>
		<p class="mt-2 text-base text-muted-foreground">
			Est. annual wage pool inside high-pressure occupations
		</p>
		<div class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground tabular-nums">
			<span>
				<strong class="text-foreground">{data.highRiskCount}</strong> occupations ({(
					(data.highRiskCount / data.totalCount) *
					100
				).toFixed(0)}% of {data.totalCount})
			</span>
			<span>
				<strong class="text-foreground">{data.highRiskEmployment.toFixed(0)}K</strong> Est. workers
				({((data.highRiskEmployment / data.totalEmployment) * 100).toFixed(0)}%)
			</span>
			<span>
				<strong class="text-foreground"
					>{((data.highRiskAnnualWages / data.totalAnnualWages) * 100).toFixed(0)}%</strong
				> of total wages
			</span>
		</div>
	<p class="mt-2 text-xs text-text-secondary italic">
		Employment figures here use a BLS-weighted proxy anchored to local employment totals. This
		is a wage-pool estimate, not a forecast of wages lost or jobs eliminated.
	</p>
	</section>

	<!-- Disclaimer -->
	<div class={cn(card({ variant: 'inset', padding: 'md' }), 'mt-6')}>
		<p class="text-xs text-muted-foreground leading-relaxed">
			These figures represent structural AI pressure, not predicted job losses. Employment counts
			are proxy-weighted rather than official per-occupation headcounts. The model measures one side
			of the equation &mdash; displacement potential without reinstatement effects.
		</p>
	</div>

	<!-- Breakdown by Sector -->
	<section class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Breakdown by Sector</p>
		<div class={card({ padding: 'none' })}>
			<div class="overflow-x-auto">
				<table class="w-full text-sm table-fixed">
					<colgroup>
						<col />
						<col class="w-24" />
						<col class="w-24" />
						<col class="w-32" />
						<col class="w-20" />
					</colgroup>
					<thead>
						<tr class="border-b text-left text-xs text-muted-foreground">
							<th class="px-3 py-2.5 font-medium">Group</th>
							<th class="px-3 py-2.5 font-medium text-right">Occupations</th>
							<th class="px-3 py-2.5 font-medium text-right">Workers (K)</th>
							<th class="px-3 py-2.5 font-medium text-right">Wage Pool</th>
							<th class="px-3 py-2.5 font-medium text-right">Avg Risk</th>
						</tr>
					</thead>
					<tbody>
						{#each data.groupBreakdown as group (group.key)}
							<tr class="border-b border-border/50 last:border-0">
								<td class="px-3 py-2.5 text-foreground truncate">{group.label}</td>
								<td class="px-3 py-2.5 text-right tabular-nums">{group.count}</td>
								<td class="px-3 py-2.5 text-right tabular-nums">{group.employment.toFixed(1)}</td>
								<td class="px-3 py-2.5 text-right tabular-nums font-medium"
									>{formatWagesMillions(group.wages)}</td
								>
								<td class="px-3 py-2.5 text-right tabular-nums"
									>{(group.avgRisk * 100).toFixed(0)}%</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<!-- Top 15 Individual Wage Exposure -->
	<section class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Top 15 — Highest Risk-Weighted Annual Wage per Worker</p>
		<div class={card({ padding: 'none' })}>
			<div class="overflow-x-auto">
				<table class="w-full text-sm table-fixed">
					<colgroup>
						<col class="w-10" />
						<col />
						<col class="w-28" />
						<col class="w-24" />
						<col class="w-36" />
					</colgroup>
					<thead>
						<tr class="border-b text-left text-xs text-muted-foreground">
							<th class="px-3 py-2.5 font-medium">#</th>
							<th class="px-3 py-2.5 font-medium">Title</th>
							<th class="px-3 py-2.5 font-medium text-right">Wage</th>
							<th class="px-3 py-2.5 font-medium text-right">Risk</th>
							<th class="px-3 py-2.5 font-medium text-right">Annual Exposure</th>
						</tr>
					</thead>
					<tbody>
						{#each data.topIndividual as occ, i (occ.ssoc)}
							<tr class="border-b border-border/50 last:border-0">
								<td class="px-3 py-2.5 tabular-nums text-muted-foreground">{i + 1}</td>
								<td class="px-3 py-2.5 truncate">
									<a href="/sg/occupation/{occ.ssoc}" class="text-foreground hover:text-primary">
										{occ.title}
									</a>
								</td>
								<td class="px-3 py-2.5 text-right tabular-nums">
									{sgCurrency} {occ.gross_wage_median.toLocaleString()}
								</td>
								<td class="px-3 py-2.5 text-right">
									<span class={riskBadge({ band: occ.risk_band })}>
										{(occ.net_risk * 100).toFixed(0)}%
									</span>
								</td>
								<td class="px-3 py-2.5 text-right tabular-nums font-medium">
									{sgCurrency} {(occ.gross_wage_median * 12 * occ.net_risk).toLocaleString(undefined, {
										maximumFractionDigits: 0
									})}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<!-- Methodology Note -->
	<section class="mt-8">
		<p class={cn(sectionLabel(), 'mb-2')}>Methodology</p>
		<p class={cn(caption(), 'leading-relaxed')}>
			Est. annual wage pool = median gross monthly wage &times; 12 &times; proxy employment. High+
			risk defined as net_risk &ge; 0.30. Source data: official local wages {DATA_VINTAGE.wages},
			local employment totals plus BLS-weighted proxy distribution. Scoring {DATA_VINTAGE.model_version}.
			<a href="/methodology" class="text-primary hover:underline">Full methodology</a> &middot;
			<a href="/data" class="text-primary hover:underline">Download data</a>
		</p>
	</section>
</main>
