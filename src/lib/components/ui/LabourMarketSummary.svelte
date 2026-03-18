<script lang="ts">
	import type { LabourClusterMonitor } from '$lib/data';
	import { overallSignalTone, directionTone, card } from '$lib/design-system';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { clusters }: { clusters: LabourClusterMonitor[] } = $props();

	function overallBadgeClass(overall: string): string {
		return overallSignalTone(overall);
	}

	function overallLabel(overall: string): string {
		switch (overall) {
			case 'strong':
				return 'Strong';
			case 'moderate':
				return 'Moderate';
			case 'weak':
				return 'Weak';
			default:
				return 'Watch';
		}
	}

	// Short cluster names for compact display
	function shortName(label: string): string {
		if (label.includes('Professional')) return 'PMET';
		if (label.includes('Clerical')) return 'Clerical & Service';
		return 'Production & Transport';
	}
</script>

<div>
	<div class="mx-auto max-w-3xl">
		<h2 class="text-sm font-semibold text-foreground mb-4">
			Singapore Labour Market · Q4 2025 (Advance)
		</h2>

		<div class="grid gap-3 sm:grid-cols-3 mb-4">
			{#each clusters as cluster}
				<div class={card({ padding: 'sm' })}>
					<div class="flex items-center justify-between mb-1.5">
						<p class="text-xs font-medium text-foreground">{shortName(cluster.cluster_label)}</p>
						<Badge variant="outline" class="{overallBadgeClass(cluster.overall)} text-xs">
							{overallLabel(cluster.overall)}
						</Badge>
					</div>
					<div class="flex items-baseline gap-1.5">
						<span class="text-lg font-bold tabular-nums text-foreground"
							>{cluster.vacancy.latest_rate}%</span
						>
						<span
							class="text-xs tabular-nums {directionTone(
								cluster.vacancy.trend_4q_pct > 0
									? 'up'
									: cluster.vacancy.trend_4q_pct < 0
										? 'down'
										: 'flat'
							)}"
						>
							{cluster.vacancy.trend_4q_pct > 0
								? '↑'
								: cluster.vacancy.trend_4q_pct < 0
									? '↓'
									: '→'}{Math.abs(cluster.vacancy.trend_4q_pct).toFixed(1)}%
						</span>
					</div>
					<p class="text-xs text-muted-foreground">Vacancy rate</p>
					{#if cluster.hiring}
						<p class="mt-1 text-xs text-muted-foreground">
							Recruit {cluster.hiring.recruitment_rate}% · Resign {cluster.hiring.resignation_rate}%
						</p>
					{/if}
				</div>
			{/each}
		</div>

		<p class="text-xs text-muted-foreground leading-relaxed">
			Employment grew by 19,600 in Q4 2025, bringing full-year growth to 57,300 (vs 44,500 in 2024).
			Unemployment steady at 2.0% (Dec 2025). Retrenchments fell to 1.5 per 1,000 employees (3,600
			in Q4). Full-year retrenchments: 14,400 (6.2 per 1,000).
		</p>
		<p class="mt-1 text-xs text-muted-foreground">
			Source: <a
				href="https://www.mom.gov.sg/newsroom/press-releases/2026/0129-labour-market-advance-release-fourth-quarter-2025"
				target="_blank"
				rel="noopener noreferrer"
				class="underline hover:text-foreground/80">Labour Market Advance Release Q4 2025</a
			>, MOM. Vacancy data by occupation group pending full Q4 2025 report.
			<a href="/reports" class="ml-1 underline hover:text-foreground/80">Full report →</a>
		</p>
	</div>
</div>
