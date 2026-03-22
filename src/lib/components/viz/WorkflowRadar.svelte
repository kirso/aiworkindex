<script lang="ts">
	import { cn } from '$lib/utils';
	import { caption } from '$lib/design-system';
	import type { WorkflowOverlay } from '$lib/data/workflow-overlay';

	interface Props {
		dimensions: WorkflowOverlay;
		size?: number;
	}

	let { dimensions, size = 200 }: Props = $props();

	let dims = $derived(dimensions as unknown as Record<string, number>);

	const labels: Record<string, string> = {
		creative_generation: 'Creative',
		real_time_coordination: 'Coordination',
		ambiguity_tolerance: 'Ambiguity',
		institutional_knowledge: 'Institutional',
		relationship_intensity: 'Relationships',
		regulatory_weight: 'Regulatory',
		physical_presence: 'Physical',
		tool_velocity: 'Tool Speed'
	};

	const orderedKeys = [
		'creative_generation',
		'ambiguity_tolerance',
		'institutional_knowledge',
		'relationship_intensity',
		'regulatory_weight',
		'physical_presence',
		'real_time_coordination',
		'tool_velocity'
	];

	const pad = 50; // padding for labels outside the radar
	let vbSize = $derived(size + pad * 2);
	let cx = $derived(vbSize / 2);
	let cy = $derived(vbSize / 2);
	let r = $derived(size / 2 - 10);

	function polarToXY(angle: number, radius: number): [number, number] {
		const rad = (angle - 90) * (Math.PI / 180);
		return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
	}

	let points = $derived(
		orderedKeys.map((key, i) => {
			const angle = (360 / orderedKeys.length) * i;
			const value = dims[key] ?? 0;
			return {
				key,
				label: labels[key] ?? key,
				value,
				angle,
				xy: polarToXY(angle, r * value),
				labelXY: polarToXY(angle, r + 22)
			};
		})
	);

	let polygonPoints = $derived(points.map(p => `${p.xy[0]},${p.xy[1]}`).join(' '));
</script>

<div class="flex flex-col items-center gap-2">
	<svg viewBox="0 0 {vbSize} {vbSize}" class="w-full" style:max-width="{vbSize}px" role="img" aria-label="Workflow dimensions radar chart">
		<!-- Grid rings -->
		{#each [0.25, 0.5, 0.75, 1.0] as ring}
			<circle cx={cx} cy={cy} r={r * ring} fill="none" stroke="currentColor" class="text-border" stroke-width="0.5" />
		{/each}

		<!-- Axis lines -->
		{#each points as point}
			{@const [x, y] = polarToXY(point.angle, r)}
			<line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" class="text-border" stroke-width="0.5" />
		{/each}

		<!-- Filled polygon -->
		<polygon points={polygonPoints} fill="currentColor" class="text-foreground/10" stroke="currentColor" stroke-width="1.5" class:text-foreground={true} />

		<!-- Data points -->
		{#each points as point}
			<circle cx={point.xy[0]} cy={point.xy[1]} r="3" fill="currentColor" class="text-foreground" />
		{/each}

		<!-- Labels -->
		{#each points as point}
			<text
				x={point.labelXY[0]}
				y={point.labelXY[1]}
				text-anchor={point.labelXY[0] < cx - 5 ? 'end' : point.labelXY[0] > cx + 5 ? 'start' : 'middle'}
				dominant-baseline={point.labelXY[1] < cy - 5 ? 'auto' : point.labelXY[1] > cy + 5 ? 'hanging' : 'middle'}
				class="fill-muted-foreground text-[11px]"
			>
				{point.label}
			</text>
		{/each}
	</svg>
	<p class={cn(caption(), 'text-center')}>Workflow dimensions (0 = low, 1 = high)</p>
</div>
