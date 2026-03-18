<script lang="ts">
	import { pageLayout, card, sectionLabel, caption, display, riskBadge } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import { riskBandLabels } from '$lib/data';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	let { data } = $props();

	let headlineNumber = $derived(`SGD ${(data.highRiskAnnualWages / 1e9).toFixed(1)} Billion`);
	let topGroup = $derived(data.groupBreakdown[0]);

	function formatWagesBillions(wages: number): string {
		return `SGD ${(wages / 1e9).toFixed(1)}B`;
	}

	function formatWagesMillions(wages: number): string {
		if (wages >= 1e9) return `SGD ${(wages / 1e9).toFixed(1)}B`;
		return `SGD ${(wages / 1e6).toFixed(0)}M`;
	}

	let faqJsonLd = $derived(
		`<script type="application/ld+json">${JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'FAQPage',
			mainEntity: [
				{
					'@type': 'Question',
					name: "How much of Singapore's wages are at risk from AI?",
					acceptedAnswer: {
						'@type': 'Answer',
						text: `${headlineNumber} in annual wages sit in high+ AI displacement risk occupations, covering ${data.highRiskCount} of ${data.totalCount} occupations scored by the AI Work Index.`
					}
				},
				{
					'@type': 'Question',
					name: 'Which Singapore sectors face the most AI wage risk?',
					acceptedAnswer: {
						'@type': 'Answer',
						text: topGroup
							? `${topGroup.label} faces the largest wage exposure at ${formatWagesBillions(topGroup.wages)}, covering ${topGroup.count} high-risk occupations with an average net risk of ${(topGroup.avgRisk * 100).toFixed(0)}%.`
							: 'See the full breakdown on the AI Work Index wage exposure report.'
					}
				}
			]
		})}<\/script>`
	);
</script>

<Seo
	title="SGD {(data.highRiskAnnualWages / 1e9).toFixed(1)}B at Risk — Wage Exposure Analysis"
	description="How much of Singapore's wages sit in high AI displacement risk occupations? {data.highRiskCount} occupations covering {data.highRiskEmployment.toFixed(
		0
	)}K workers."
	path="/reports/wage-exposure"
	jsonLd={[faqJsonLd]}
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
			in annual wages sit in high+ risk occupations
		</p>
		<div class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground tabular-nums">
			<span>
				<strong class="text-foreground">{data.highRiskCount}</strong> occupations ({(
					(data.highRiskCount / data.totalCount) *
					100
				).toFixed(0)}% of {data.totalCount})
			</span>
			<span>
				<strong class="text-foreground">{data.highRiskEmployment.toFixed(0)}K</strong> workers ({(
					(data.highRiskEmployment / data.totalEmployment) *
					100
				).toFixed(0)}%)
			</span>
			<span>
				<strong class="text-foreground"
					>{((data.highRiskAnnualWages / data.totalAnnualWages) * 100).toFixed(0)}%</strong
				> of total wages
			</span>
		</div>
	</section>

	<!-- Disclaimer -->
	<div class={cn(card({ variant: 'inset', padding: 'md' }), 'mt-6')}>
		<p class="text-xs text-muted-foreground leading-relaxed">
			These figures represent structural AI displacement pressure, not predicted job losses.
			Employment numbers are group-level estimates. The model measures one side of the equation
			&mdash; displacement potential without reinstatement effects.
		</p>
	</div>

	<!-- Breakdown by Sector -->
	<section class="mt-8">
		<p class={cn(sectionLabel(), 'mb-3')}>Breakdown by Sector</p>
		<div class={card({ padding: 'none' })}>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b text-left text-xs text-muted-foreground">
							<th class="px-4 py-2.5 font-medium">Group</th>
							<th class="px-4 py-2.5 font-medium text-right">Occupations</th>
							<th class="px-4 py-2.5 font-medium text-right">Workers (K)</th>
							<th class="px-4 py-2.5 font-medium text-right">Annual Wages at Risk</th>
							<th class="px-4 py-2.5 font-medium text-right">Avg Risk</th>
						</tr>
					</thead>
					<tbody>
						{#each data.groupBreakdown as group (group.key)}
							<tr class="border-b border-border/50 last:border-0">
								<td class="px-4 py-2.5 text-foreground">{group.label}</td>
								<td class="px-4 py-2.5 text-right tabular-nums">{group.count}</td>
								<td class="px-4 py-2.5 text-right tabular-nums">{group.employment.toFixed(1)}</td>
								<td class="px-4 py-2.5 text-right tabular-nums font-medium"
									>{formatWagesMillions(group.wages)}</td
								>
								<td class="px-4 py-2.5 text-right tabular-nums"
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
		<p class={cn(sectionLabel(), 'mb-3')}>Top 15 — Highest Individual Wage Exposure</p>
		<div class={card({ padding: 'none' })}>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b text-left text-xs text-muted-foreground">
							<th class="px-4 py-2.5 font-medium">#</th>
							<th class="px-4 py-2.5 font-medium">Title</th>
							<th class="px-4 py-2.5 font-medium text-right">Monthly Wage</th>
							<th class="px-4 py-2.5 font-medium text-right">Risk</th>
							<th class="px-4 py-2.5 font-medium text-right">Annual Wage at Risk</th>
						</tr>
					</thead>
					<tbody>
						{#each data.topIndividual as occ, i (occ.ssoc)}
							<tr class="border-b border-border/50 last:border-0">
								<td class="px-4 py-2.5 tabular-nums text-muted-foreground">{i + 1}</td>
								<td class="px-4 py-2.5">
									<a href="/occupation/{occ.ssoc}" class="text-foreground hover:text-primary">
										{occ.title}
									</a>
								</td>
								<td class="px-4 py-2.5 text-right tabular-nums">
									${occ.gross_wage_median.toLocaleString()}
								</td>
								<td class="px-4 py-2.5 text-right">
									<span class={riskBadge({ band: occ.risk_band })}>
										{riskBandLabels[occ.risk_band]}
										{(occ.net_risk * 100).toFixed(0)}%
									</span>
								</td>
								<td class="px-4 py-2.5 text-right tabular-nums font-medium">
									${(occ.gross_wage_median * 12 * occ.net_risk).toLocaleString(undefined, {
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
			Annual wages at risk = median gross monthly wage &times; 12 &times; estimated employment
			(group-level). High+ risk defined as net_risk &ge; 0.30. Source data: MOM wages {DATA_VINTAGE.wages},
			employment 2025. Scoring {DATA_VINTAGE.model_version}.
			<a href="/methodology" class="text-primary hover:underline">Full methodology</a> &middot;
			<a href="/data" class="text-primary hover:underline">Download data</a>
		</p>
	</section>
</main>
