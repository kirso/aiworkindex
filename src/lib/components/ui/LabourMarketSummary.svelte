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
		<h2 class="text-sm font-semibold text-foreground mb-4">Singapore Labour Market · Q4 2025</h2>

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
			Job vacancies rose from 69,600 in Sep 2025 to 77,700 in Dec 2025, lifting the
			vacancy-to-unemployed ratio from 1.50 to 1.58. Unemployment stayed at 2.0% in Dec 2025, and
			retrenchments remained low at 3,690 in Q4 2025 (1.5 per 1,000 employees).
		</p>
		<p class="mt-1 text-xs text-muted-foreground">
			Source: <a
				href="https://stats.mom.gov.sg/Pages/Labour-Market-Report-4Q-2025.aspx"
				target="_blank"
				rel="noopener noreferrer"
				class="underline hover:text-text-secondary">Labour Market Report Q4 2025</a
			>, MOM.
			<a href="/reports" class="ml-1 underline hover:text-text-secondary">Full report →</a>
		</p>
	</div>
</div>
