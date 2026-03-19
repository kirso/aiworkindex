<script lang="ts">
	import type { LabourClusterMonitor } from '$lib/data';
	import { card, overallSignalTone, directionTone } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { monitor }: { monitor: LabourClusterMonitor } = $props();

	let trendDirection = $derived(
		monitor.vacancy.trend_4q_pct > 0 ? 'up' : monitor.vacancy.trend_4q_pct < 0 ? 'down' : 'flat'
	);
	let trendLabel = $derived(trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→');
	let trendColor = $derived(directionTone(trendDirection));

	let hiringLabel = $derived.by(() => {
		if (!monitor.hiring) return null;
		if (monitor.hiring.net_pressure > 0.1) return 'Recruitment exceeds resignation';
		if (monitor.hiring.net_pressure < -0.1) return 'Resignation exceeds recruitment';
		return 'Recruitment ≈ resignation';
	});

	let overallColor = $derived(overallSignalTone(monitor.overall));

	// Sparkline from annual rates
	let sparklinePoints = $derived.by(() => {
		const rates = monitor.vacancy.annual_rates;
		if (!rates || rates.length < 2) return '';
		const maxRate = Math.max(...rates.map(r => r.rate));
		const minRate = Math.min(...rates.map(r => r.rate));
		const range = maxRate - minRate || 1;
		const w = 80;
		const h = 24;
		return rates
			.map((r, i) => {
				const x = (i / (rates.length - 1)) * w;
				const y = h - ((r.rate - minRate) / range) * h;
				return `${x},${y}`;
			})
			.join(' ');
	});
</script>

<div class={cn(card({ padding: 'md' }), 'mb-6')}>
	<div class="flex items-center justify-between mb-3">
		<h2 class="text-sm font-semibold text-foreground">Labour Market</h2>
		<Badge variant="outline" class={overallColor}>
			{monitor.overall === 'strong'
				? 'Strong'
				: monitor.overall === 'moderate'
					? 'Moderate'
					: monitor.overall === 'weak'
						? 'Weak'
						: 'Watch'}
		</Badge>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<!-- Vacancy rate + sparkline -->
		<div class="flex items-start justify-between">
			<div>
				<p class="text-xs text-muted-foreground">{monitor.cluster_label}</p>
				<div class="mt-1 flex items-baseline gap-1.5">
					<span class="text-xl font-bold tabular-nums text-foreground"
						>{monitor.vacancy.latest_rate}%</span
					>
					<span class="text-sm {trendColor} font-semibold tabular-nums">
						{trendLabel}
						{Math.abs(monitor.vacancy.trend_4q_pct).toFixed(1)}% YoY
					</span>
				</div>
				<p class="mt-0.5 text-xs text-muted-foreground">
					Vacancy rate · {monitor.vacancy.latest_quarter}
				</p>
			</div>
			<!-- Mini sparkline -->
			{#if sparklinePoints}
				<div class="shrink-0 mt-1">
					<svg width="80" height="24" class="text-muted-foreground/50">
						<polyline
							points={sparklinePoints}
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<div
						class="flex justify-between text-xs text-muted-foreground/40 tabular-nums"
						style="width: 80px;"
					>
						<span>{monitor.vacancy.annual_rates?.[0]?.year}</span>
						<span
							>{monitor.vacancy.annual_rates?.[monitor.vacancy.annual_rates.length - 1]?.year}</span
						>
					</div>
				</div>
			{/if}
		</div>

		<!-- Hiring signal -->
		<div>
			{#if hiringLabel}
				<p class="text-xs text-muted-foreground">Hiring</p>
				<p class="mt-1 text-sm font-medium text-foreground">{hiringLabel}</p>
				<p class="text-xs text-muted-foreground tabular-nums">
					{monitor.hiring?.recruitment_rate}% recruit · {monitor.hiring?.resignation_rate}% resign
				</p>
			{/if}
		</div>

		<!-- Retrenchment -->
		{#if monitor.retrenchment}
			<div>
				<p class="text-xs text-muted-foreground">Retrenchment</p>
				<p class="mt-1 text-sm font-medium text-foreground">
					{#if monitor.retrenchment.incidence_per_1000}
						{monitor.retrenchment.incidence_per_1000} per 1,000 employees
					{:else}
						{monitor.retrenchment.latest_count.toLocaleString()} in {monitor.retrenchment
							.latest_quarter}
					{/if}
				</p>
				<p class="text-xs text-muted-foreground">
					{monitor.retrenchment.incidence_per_1000 && monitor.retrenchment.incidence_per_1000 < 2
						? 'Low'
						: monitor.retrenchment.incidence_per_1000 && monitor.retrenchment.incidence_per_1000 < 5
							? 'Moderate'
							: 'Elevated'}
				</p>
			</div>
		{/if}

		<!-- Re-entry -->
		{#if monitor.re_entry}
			<div>
				<p class="text-xs text-muted-foreground">Re-employment</p>
				<p class="mt-1 text-sm font-medium text-foreground">
					{monitor.re_entry.rate_12m}% within 12 months
				</p>
				<p class="text-xs text-muted-foreground">{monitor.re_entry.rate_6m}% within 6 months</p>
			</div>
		{/if}
	</div>

	<p class="mt-3 text-xs text-muted-foreground/60 italic">
		Cluster-level data — same for all occupations in the {monitor.cluster_label} group. Per-occupation
		labour data is not publicly available from MOM.
		<a
			href="https://stats.mom.gov.sg/iMAS_PdfLibrary/mrsd-Labour-Market-Report-3Q-2025.pdf"
			target="_blank"
			rel="noopener noreferrer"
			class="text-primary hover:underline not-italic">Source: Labour Market Report Q3 2025</a
		>
	</p>
</div>
