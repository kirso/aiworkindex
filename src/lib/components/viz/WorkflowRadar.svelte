<script lang="ts">
	import type { WorkflowOverlay } from '$lib/data/workflow-overlay';

	interface Props {
		dimensions: WorkflowOverlay;
		size?: number;
	}

	let { dimensions }: Props = $props();

	const labels: Record<keyof WorkflowOverlay, string> = {
		creative_generation: 'Creative generation',
		real_time_coordination: 'Real-time coordination',
		ambiguity_tolerance: 'Ambiguity tolerance',
		institutional_knowledge: 'Institutional knowledge',
		relationship_intensity: 'Relationship intensity',
		regulatory_weight: 'Regulatory weight',
		physical_presence: 'Physical presence',
		tool_velocity: 'Tool velocity'
	};

	const orderedKeys: Array<keyof WorkflowOverlay> = [
		'creative_generation',
		'ambiguity_tolerance',
		'institutional_knowledge',
		'relationship_intensity',
		'regulatory_weight',
		'physical_presence',
		'real_time_coordination',
		'tool_velocity'
	];
</script>

<div
	class="w-full space-y-2"
	role="img"
	aria-label="General workflow profile with eight dimensions scored from 0 to 100"
>
	{#each orderedKeys as key}
		{@const value = dimensions[key] ?? 0}
		<div class="grid grid-cols-[minmax(112px,1fr)_minmax(96px,1.5fr)_38px] items-center gap-2">
			<span class="text-[11px] leading-tight text-text-secondary sm:text-xs">{labels[key]}</span>
			<div class="h-2 overflow-hidden rounded-sm bg-muted">
				<div
					class="h-full rounded-sm bg-primary"
					style:width={`${Math.max(2, value * 100)}%`}
				></div>
			</div>
			<span class="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
				{Math.round(value * 100)}
			</span>
		</div>
	{/each}
	<p class="pt-1 text-xs leading-relaxed text-muted-foreground">
		General role profile on a 0–100 scale. These are modelling inputs, not measurements of an
		individual job or worker.
	</p>
</div>
