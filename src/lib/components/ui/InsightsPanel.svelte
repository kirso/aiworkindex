<script lang="ts">
	import type { Occupation, RiskBand } from '$lib/data';
	import { impactTypeColors, impactTypeLabels, riskBandColors } from '$lib/data';

	let { occupations }: { occupations: Occupation[] } = $props();

	const bandOrder: RiskBand[] = ['very_low', 'low', 'moderate', 'high', 'very_high'];
	type ImpactType = 'at_risk' | 'ai_leveraged' | 'stable' | 'mixed';
	const impactOrder: ImpactType[] = ['at_risk', 'ai_leveraged', 'stable', 'mixed'];

	const bandShortLabels: Record<RiskBand, string> = {
		very_low: 'V.Low',
		low: 'Low',
		moderate: 'Mod.',
		high: 'High',
		very_high: 'V.High'
	};

	const impactShortLabels: Record<ImpactType, string> = {
		at_risk: 'At Risk',
		ai_leveraged: 'Leveraged',
		stable: 'Stable',
		mixed: 'Mixed'
	};

	const OFFICIAL_TOTAL_WORKERS_K = 2376.4;

	let medianPay = $derived.by(() => {
		if (occupations.length === 0) return 0;
		const sorted = occupations.map((o) => o.gross_wage_median).sort((a, b) => a - b);
		return sorted[Math.floor(sorted.length / 2)];
	});

	let highRiskCount = $derived(
		occupations.filter((o) => o.risk_band === 'high' || o.risk_band === 'very_high').length
	);

	let highConfidenceCount = $derived(
		occupations.filter((o) => o.confidence.level === 'high').length
	);

	let demandFlaggedCount = $derived(
		occupations.filter((o) => o.evidence.sol_match || o.evidence.jobs_in_demand_match).length
	);

	let observedCalibratedCount = $derived(
		occupations.filter((o) => o.evidence.anthropic_calibrated).length
	);

	let bandCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const occupation of occupations) {
			counts[occupation.risk_band] = (counts[occupation.risk_band] ?? 0) + 1;
		}
		return counts;
	});

	let maxBandCount = $derived(Math.max(...bandOrder.map((band) => bandCounts[band] ?? 0), 1));

	let impactCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const occupation of occupations) {
			counts[occupation.impact_type] = (counts[occupation.impact_type] ?? 0) + 1;
		}
		return counts;
	});

	let maxImpactCount = $derived(Math.max(...impactOrder.map((type) => impactCounts[type] ?? 0), 1));

	let topHighRisk = $derived(
		[...occupations].sort((a, b) => b.net_risk - a.net_risk).slice(0, 5)
	);

	let topLowRisk = $derived(
		[...occupations].sort((a, b) => a.net_risk - b.net_risk).slice(0, 5)
	);

	let theoryVsPractice = $derived(
		[...occupations]
			.filter((o) => o.evidence.anthropic_gap !== null)
			.sort((a, b) => Math.abs(b.evidence.anthropic_gap ?? 0) - Math.abs(a.evidence.anthropic_gap ?? 0))
			.slice(0, 5)
	);

	function gapPoints(value: number | null): string {
		if (value === null) return 'n/a';
		const points = (value * 100).toFixed(0);
		return `${value > 0 ? '+' : ''}${points} pts`;
	}
</script>

<div class="space-y-5 text-sm">
	<div>
		<h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Overview</h3>
		<div class="mt-2 grid grid-cols-2 gap-2">
				<div class="rounded-lg bg-secondary px-3 py-2">
					<p class="text-[10px] text-muted-foreground">SG Workforce</p>
					<p class="text-base font-bold tabular-nums text-foreground">
						{(OFFICIAL_TOTAL_WORKERS_K / 1000).toFixed(2)}M
					</p>
				</div>
			<div class="rounded-lg bg-secondary px-3 py-2">
				<p class="text-[10px] text-muted-foreground">Occupations</p>
				<p class="text-base font-bold tabular-nums text-foreground">{occupations.length}</p>
			</div>
			<div class="rounded-lg bg-secondary px-3 py-2">
				<p class="text-[10px] text-muted-foreground">Median Pay</p>
				<p class="text-base font-bold tabular-nums text-foreground">SGD {medianPay.toLocaleString()}</p>
			</div>
			<div class="rounded-lg bg-secondary px-3 py-2">
				<p class="text-[10px] text-muted-foreground">High+ Risk</p>
				<p class="text-base font-bold tabular-nums text-risk-very-high">{highRiskCount}</p>
			</div>
			<div class="rounded-lg bg-secondary px-3 py-2">
				<p class="text-[10px] text-muted-foreground">High Est. Confidence</p>
				<p class="text-base font-bold tabular-nums text-foreground">{highConfidenceCount}</p>
			</div>
			<div class="rounded-lg bg-secondary px-3 py-2">
				<p class="text-[10px] text-muted-foreground">Demand Flagged</p>
				<p class="text-base font-bold tabular-nums text-emerald-700">{demandFlaggedCount}</p>
			</div>
			<div class="rounded-lg bg-secondary px-3 py-2">
				<p class="text-[10px] text-muted-foreground">Observed AI Usage</p>
				<p class="text-base font-bold tabular-nums text-blue-700">{observedCalibratedCount}</p>
			</div>
		</div>
	</div>

	<div>
		<h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Risk Score Distribution</h3>
		<div class="mt-2 space-y-1">
			{#each bandOrder as band (band)}
				{@const count = bandCounts[band] ?? 0}
				<div class="flex items-center gap-1.5">
					<span class="w-10 shrink-0 text-right text-[10px] text-muted-foreground">{bandShortLabels[band]}</span>
					<div class="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full"
							style="width: {(count / maxBandCount) * 100}%; background-color: {riskBandColors[band]};"
						></div>
					</div>
					<span class="w-6 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">{count}</span>
				</div>
			{/each}
		</div>
	</div>

	<div>
		<h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impact Type</h3>
		<div class="mt-2 space-y-1">
			{#each impactOrder as type (type)}
				{@const count = impactCounts[type] ?? 0}
				<div class="flex items-center gap-1.5">
					<span class="w-14 shrink-0 text-right text-[10px] text-muted-foreground">{impactShortLabels[type]}</span>
					<div class="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full"
							style="width: {(count / maxImpactCount) * 100}%; background-color: {impactTypeColors[type]};"
						></div>
					</div>
					<span class="w-6 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">{count}</span>
				</div>
			{/each}
		</div>
	</div>

	<div>
		<h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Highest Risk</h3>
		<ol class="mt-2 space-y-1">
			{#each topHighRisk as occ, i (occ.ssoc)}
				<li class="flex items-start gap-1.5">
					<span class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[9px] font-bold text-rose-600">{i + 1}</span>
					<a href="/occupation/{occ.ssoc}" class="text-xs leading-tight text-foreground hover:text-ring hover:underline">
						{occ.title}
						<span class="ml-1 tabular-nums text-muted-foreground">{(occ.net_risk * 100).toFixed(0)}%</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>

	<div>
		<h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Most Resilient</h3>
		<ol class="mt-2 space-y-1">
			{#each topLowRisk as occ, i (occ.ssoc)}
				<li class="flex items-start gap-1.5">
					<span class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-bold text-emerald-600">{i + 1}</span>
					<a href="/occupation/{occ.ssoc}" class="text-xs leading-tight text-foreground hover:text-ring hover:underline">
						{occ.title}
						<span class="ml-1 tabular-nums text-muted-foreground">{(occ.net_risk * 100).toFixed(0)}%</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>

	<div>
		<h3 class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Observed AI Usage Gap</h3>
		<ol class="mt-2 space-y-1">
			{#each theoryVsPractice as occ, i (occ.ssoc)}
				<li class="flex items-start gap-1.5">
					<span class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-primary">{i + 1}</span>
					<a href="/occupation/{occ.ssoc}" class="text-xs leading-tight text-foreground hover:text-ring hover:underline">
						{occ.title}
						<span class="ml-1 tabular-nums text-muted-foreground">{gapPoints(occ.evidence.anthropic_gap)}</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>
</div>
