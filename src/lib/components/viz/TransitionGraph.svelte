<script lang="ts">
	import type { TransitionScore } from '$lib/data/transition-capacity';
	import { riskBandColors } from '$lib/data';
	import type { RiskBand } from '$lib/data';

	let {
		currentTitle,
		currentRiskBand,
		transitions
	}: {
		currentTitle: string;
		currentRiskBand: RiskBand;
		transitions: TransitionScore[];
	} = $props();

	// Layout constants
	const W = 700;
	const H = 360;
	const centerX = W / 2;
	const centerY = H / 2;
	const nodeRadius = 8;

	// Position targets in a semicircle to the right
	let positioned = $derived.by(() => {
		const count = transitions.length;
		if (count === 0) return [];

		const angleStart = -Math.PI * (80 / 180);
		const angleEnd = Math.PI * (80 / 180);
		const radiusX = 250;
		const radiusY = 150;

		return transitions.map((t, i) => {
			const frac = count === 1 ? 0.5 : i / (count - 1);
			const angle = angleStart + frac * (angleEnd - angleStart);
			const x = centerX + Math.cos(angle) * radiusX;
			const y = centerY + Math.sin(angle) * radiusY;
			return { ...t, x, y };
		});
	});

	function riskBandFromScore(score: number): RiskBand {
		if (score < 0.05) return 'very_low';
		if (score < 0.15) return 'low';
		if (score < 0.25) return 'moderate';
		if (score < 0.35) return 'high';
		return 'very_high';
	}

	function labelColor(label: string): string {
		if (label === 'easy') return 'var(--color-risk-very-low)';
		if (label === 'moderate') return 'var(--color-risk-moderate)';
		if (label === 'stretch') return 'var(--color-risk-high)';
		return 'var(--color-risk-very-high)';
	}

	// Truncate long titles
	function truncate(text: string, max: number): string {
		return text.length > max ? text.substring(0, max - 1) + '\u2026' : text;
	}
</script>

{#if transitions.length === 0}
	<p class="text-sm text-muted-foreground italic">No transition paths computed.</p>
{:else}
	<div class="overflow-x-auto">
		<!-- Desktop: SVG graph -->
		<div class="hidden sm:block">
			<svg
				viewBox="0 0 {W} {H}"
				class="w-full max-w-[700px]"
				role="img"
				aria-label="Transition paths from {currentTitle}"
			>
				<!-- Connection lines -->
				{#each positioned as node}
					<line
						x1={centerX + 60}
						y1={centerY}
						x2={node.x - 10}
						y2={node.y}
						stroke={labelColor(node.label)}
						stroke-width={Math.max(1.5, node.composite * 6)}
						stroke-opacity="0.5"
					/>
				{/each}

				<!-- Center node (current) -->
				<circle
					cx={centerX}
					cy={centerY}
					r={nodeRadius + 4}
					fill={riskBandColors[currentRiskBand]}
					opacity="0.2"
				/>
				<circle cx={centerX} cy={centerY} r={nodeRadius} fill={riskBandColors[currentRiskBand]} />
				<text
					x={centerX - 65}
					y={centerY - 18}
					class="fill-foreground text-xs font-semibold"
					text-anchor="end"
				>
					{truncate(currentTitle, 28)}
				</text>
				<text
					x={centerX - 65}
					y={centerY - 5}
					class="fill-muted-foreground text-xs"
					text-anchor="end"
				>
					Current role
				</text>

				<!-- Target nodes -->
				{#each positioned as node}
					{@const _band = riskBandFromScore(node.composite)}
					<a href="/occupation/{node.to_ssoc}">
						<title>{node.to_title}</title>
						<circle cx={node.x} cy={node.y} r={nodeRadius} fill={labelColor(node.label)} />
						<text x={node.x + 14} y={node.y - 4} class="fill-foreground text-xs font-medium">
							{truncate(node.to_title, 35)}
						</text>
						<text x={node.x + 14} y={node.y + 9} class="fill-muted-foreground text-[9px]">
							{node.label} &middot; {(node.composite * 100).toFixed(0)}%
						</text>
					</a>
				{/each}

				<!-- Legend -->
				<g transform="translate(10, {H - 45})">
					<text class="fill-muted-foreground text-[9px]" y="0"
						>Line thickness = transition score</text
					>
					<g transform="translate(0, 14)">
						{#each [{ l: 'Easy', c: 'var(--color-risk-very-low)' }, { l: 'Moderate', c: 'var(--color-risk-moderate)' }, { l: 'Stretch', c: 'var(--color-risk-high)' }, { l: 'Difficult', c: 'var(--color-risk-very-high)' }] as item, i}
							<circle cx={i * 80 + 6} cy="0" r="4" fill={item.c} />
							<text x={i * 80 + 14} y="4" class="fill-muted-foreground text-[9px]">{item.l}</text>
						{/each}
					</g>
				</g>
			</svg>
		</div>

		<!-- Mobile: stacked list fallback -->
		<div class="sm:hidden space-y-2">
			{#each transitions as t (t.to_ssoc)}
				<a
					href="/occupation/{t.to_ssoc}"
					class="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 hover:bg-muted"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">{t.to_title}</p>
						<p class="text-xs text-muted-foreground capitalize">
							{t.label} transition &middot; {(t.composite * 100).toFixed(0)}% match
						</p>
					</div>
					<div
						class="ml-2 h-2 w-8 shrink-0 rounded-full"
						style="background-color: {labelColor(t.label)}; opacity: {0.4 + t.composite * 0.6};"
					></div>
				</a>
			{/each}
		</div>
	</div>
{/if}
