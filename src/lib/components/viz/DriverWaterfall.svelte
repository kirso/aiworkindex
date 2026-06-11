<script lang="ts">
	type WaterfallSubject = {
		exposure: number;
		bottleneck: number;
		net_risk: number;
		market: {
			market_resilience: number;
		};
		evidence: {
			anthropic_calibrated: boolean;
			anthropic_gap: number | null;
			sol_match: 'exact' | 'prefix' | false;
			jobs_in_demand_match: 'exact' | 'prefix' | false;
		};
	};

	let { occupation }: { occupation: WaterfallSubject } = $props();

	// Decompose net_risk into driver contributions
	// net_risk = exposure * (1 - bottleneck) * market_modifier
	// We show what pushes risk UP and what pulls it DOWN

	interface Driver {
		label: string;
		value: number;
		direction: 'up' | 'down';
		color: string;
		description: string;
	}

	let drivers = $derived.by((): Driver[] => {
		const occ = occupation;
		const items: Driver[] = [];

		// AI exposure pushes risk UP
		items.push({
			label: 'AI Capability Overlap',
			value: occ.exposure,
			direction: 'up',
			color: 'var(--color-risk-very-high)',
			description: `${(occ.exposure * 100).toFixed(0)}% of tasks overlap with current AI`
		});

		// Bottleneck pulls risk DOWN (inverted: higher bottleneck = more protection)
		items.push({
			label: 'Human Coordination',
			value: occ.bottleneck,
			direction: 'down',
			color: 'var(--color-risk-very-low)',
			description: `${(occ.bottleneck * 100).toFixed(0)}% human advantage from judgment & presence`
		});

		// Market resilience pulls risk DOWN
		items.push({
			label: 'Local Hiring Demand',
			value: occ.market.market_resilience,
			direction: 'down',
			color: 'var(--color-risk-very-low)',
			description: `${(occ.market.market_resilience * 100).toFixed(0)}% demand buffer from the local labour market`
		});

		// Anthropic observed usage: can push either way
		if (occ.evidence.anthropic_calibrated && occ.evidence.anthropic_gap !== null) {
			const gap = occ.evidence.anthropic_gap;
			items.push({
				label: 'Observed AI Adoption',
				value: Math.abs(gap),
				direction: gap > 0 ? 'up' : 'down',
				color: gap > 0 ? 'var(--color-risk-very-high)' : 'var(--color-risk-very-low)',
				description:
					gap > 0
						? `AI usage ${(Math.abs(gap) * 100).toFixed(0)}pp above theoretical exposure`
						: `AI usage ${(Math.abs(gap) * 100).toFixed(0)}pp below theoretical exposure`
			});
		}

		// Demand signals pull DOWN
		if (occ.evidence.sol_match || occ.evidence.jobs_in_demand_match) {
			const signals = [];
			if (occ.evidence.sol_match) signals.push('Shortage Occupation List');
			if (occ.evidence.jobs_in_demand_match) signals.push('Jobs in Demand');
			items.push({
				label: 'Official Demand Signals',
				value: 0.15,
				direction: 'down',
				color: 'var(--color-risk-very-low)',
				description: `On the ${signals.join(' & ')} list — government recognises hiring need`
			});
		}

		return items;
	});

	// Bar chart dimensions
	const maxBarWidth = 100; // percentage
	let maxValue = $derived(Math.max(...drivers.map(d => d.value), 0.1));
</script>

<div
	class="space-y-2.5"
	role="img"
	aria-label="Score breakdown: factors driving AI displacement risk up and down"
>
	{#each drivers as driver}
		{@const widthPct = (driver.value / maxValue) * maxBarWidth}
		<div>
			<div class="mb-1 flex items-center justify-between">
				<span class="text-xs font-medium text-foreground">{driver.label}</span>
				<span
					class="flex items-center gap-1 text-xs font-mono tabular-nums {driver.direction === 'up'
						? 'text-risk-very-high'
						: 'text-risk-very-low'}"
				>
					{#if driver.direction === 'up'}
						<svg
							class="h-3 w-3"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7" /></svg
						>
						Increases risk
					{:else}
						<svg
							class="h-3 w-3"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7" /></svg
						>
						Reduces risk
					{/if}
				</span>
			</div>
			<div class="relative h-5 w-full overflow-hidden rounded bg-muted">
				<div
					class="absolute inset-y-0 rounded transition-all duration-500"
					style="width: {Math.max(
						widthPct,
						3
					)}%; background-color: {driver.color}; opacity: 0.7; {driver.direction === 'up'
						? 'left: 0'
						: 'right: 0'};"
				></div>
			</div>
			<p class="mt-0.5 text-xs text-muted-foreground">{driver.description}</p>
		</div>
	{/each}

	<p class="text-xs text-text-secondary italic mt-1">
		These factors interact with each other — the final score is not a simple sum of these bars.
	</p>

	<!-- Net result -->
	<div class="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
		<span class="text-sm font-semibold text-foreground">AI Displacement Pressure</span>
		<span class="text-sm font-bold font-mono tabular-nums text-foreground">
			{(occupation.net_risk * 100).toFixed(0)}%
		</span>
	</div>
</div>
