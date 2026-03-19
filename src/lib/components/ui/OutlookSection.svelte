<script lang="ts">
	import type { Occupation } from '$lib/data';
	import {
		computeOutlook,
		scenarioPresets,
		seniorityAdjustments,
		outlookStatusLabels,
		outlookStatusColors,
		directionLabels,
		directionColors,
		type ScenarioPreset,
		type ScenarioParams,
		type SeniorityLevel
	} from '$lib/data/forecast-engine';
	import { title as titleStyle, card, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';

	let { occupation }: { occupation: Occupation } = $props();

	let selectedScenario = $state<ScenarioPreset>('base');
	let selectedSeniority = $state<SeniorityLevel>('mid');

	let useCustom = $state(false);
	let adoptionSpeed = $state(1.0);
	let costCutting = $state(0.5);
	let macroBackdrop = $state(0.0);
	let sectorReadiness = $state(0.6);

	let customParams = $derived<ScenarioParams>({
		ai_adoption_speed: adoptionSpeed,
		employer_cost_cutting: costCutting,
		macro_backdrop: macroBackdrop,
		sector_readiness: sectorReadiness,
		seniority: selectedSeniority
	});

	let scenarioParams = $derived<ScenarioParams>(
		useCustom
			? customParams
			: { ...scenarioPresets[selectedScenario].params, seniority: selectedSeniority }
	);

	let outlook = $derived(computeOutlook(occupation, scenarioParams));
	let baseOutlook = $derived(
		computeOutlook(occupation, { ...scenarioPresets.base.params, seniority: selectedSeniority })
	);

	const dimensions = [
		{
			key: 'displacement_pressure',
			label: 'Displacement Pressure',
			tip: 'How much AI pushes toward task replacement'
		},
		{
			key: 'augmentation_upside',
			label: 'Augmentation Upside',
			tip: 'Potential for AI to enhance rather than replace'
		},
		{ key: 'demand_outlook', label: 'Demand Outlook', tip: 'Labour market demand trajectory' },
		{ key: 'wage_pressure', label: 'Wage Pressure', tip: 'Downward pressure on compensation' }
	] as const;
</script>

<section class={cn(card({ padding: 'md' }), 'mb-4')}>
	<div class="flex items-center justify-between mb-3">
		<h2 class={titleStyle({ size: 'section' })}>Outlook</h2>
		<!-- Seniority toggle -->
		<div class="flex items-center gap-1">
			{#each ['junior', 'mid', 'senior'] as const as level}
				<button
					class="rounded-md px-2 py-0.5 text-xs font-medium transition-colors {selectedSeniority ===
					level
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
					onclick={() => (selectedSeniority = level)}
				>
					{seniorityAdjustments[level].label}
				</button>
			{/each}
		</div>
	</div>

	{#if selectedSeniority !== 'mid'}
		<p class={cn(caption(), 'mb-3 italic')}>
			Adjusted for {seniorityAdjustments[selectedSeniority].label.toLowerCase()} level. Entry-level workers
			face higher displacement pressure in AI-exposed roles (Stanford DEL, 2025; Anthropic, 2026).
		</p>
	{/if}

	<Tabs.Root value="direction" class="w-full">
		<Tabs.List class="mb-4 w-full">
			<Tabs.Trigger value="direction" class="flex-1 text-xs">Direction</Tabs.Trigger>
			<Tabs.Trigger value="scenarios" class="flex-1 text-xs">Scenarios</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="direction">
			<div class="rounded-lg border border-border p-4 text-center">
				<p class="text-xs text-muted-foreground">12-Month Direction (Base Case)</p>
				<p class="mt-2 text-2xl font-bold {directionColors[baseOutlook.direction_12m]}">
					{directionLabels[baseOutlook.direction_12m]}
				</p>
			</div>
			<div class="mt-4 grid gap-3 sm:grid-cols-2">
				{#each dimensions as dim}
					{@const status = baseOutlook[dim.key]}
					{@const level =
						status === 'resilient'
							? 0.15
							: status === 'watch'
								? 0.4
								: status === 'under_pressure'
									? 0.7
									: 0.95}
					{@const barColor =
						status === 'resilient'
							? 'bg-risk-very-low'
							: status === 'watch'
								? 'bg-risk-moderate'
								: status === 'under_pressure'
									? 'bg-risk-high'
									: 'bg-risk-very-high'}
					<div class="rounded-lg bg-muted p-3">
						<div class="flex items-center justify-between">
							<p class="text-xs text-muted-foreground">{dim.label}</p>
							<p class="text-xs font-semibold {outlookStatusColors[status]}">
								{outlookStatusLabels[status]}
							</p>
						</div>
						<div class="mt-1.5 h-1.5 w-full rounded-full bg-muted-foreground/10">
							<div
								class="h-1.5 rounded-full transition-all duration-300 {barColor}"
								style="width: {level * 100}%;"
							></div>
						</div>
					</div>
				{/each}
			</div>
			<p class="mt-3 text-xs text-muted-foreground italic">
				Rule-based directional forecast. Not a prediction — illustrative only.
			</p>
		</Tabs.Content>

		<Tabs.Content value="scenarios">
			<div class="flex flex-wrap gap-2 mb-4">
				{#each Object.entries(scenarioPresets) as [key, preset]}
					<button
						class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors {selectedScenario ===
							key && !useCustom
							? 'border-primary bg-primary/10 text-primary'
							: 'border-border text-muted-foreground hover:border-primary/30'}"
						onclick={() => {
							selectedScenario = key as ScenarioPreset;
							useCustom = false;
						}}
					>
						{preset.label}
					</button>
				{/each}
				<button
					class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors {useCustom
						? 'border-primary bg-primary/10 text-primary'
						: 'border-border text-muted-foreground hover:border-primary/30'}"
					onclick={() => (useCustom = true)}
				>
					Custom
				</button>
			</div>

			{#if !useCustom}
				<p class="mb-3 text-xs text-muted-foreground">
					{scenarioPresets[selectedScenario].description}
				</p>
			{:else}
				<div class="mb-4 space-y-4">
					<div>
						<div class="flex justify-between text-xs text-muted-foreground mb-2">
							<span>AI Adoption Speed</span>
							<span class="tabular-nums">{adoptionSpeed.toFixed(1)}x</span>
						</div>
						<Slider bind:value={adoptionSpeed} min={0.3} max={2.5} step={0.1} />
					</div>
					<div>
						<div class="flex justify-between text-xs text-muted-foreground mb-2">
							<span>Employer Cost-Cutting</span>
							<span class="tabular-nums">{(costCutting * 100).toFixed(0)}%</span>
						</div>
						<Slider bind:value={costCutting} min={0} max={1} step={0.05} />
					</div>
					<div>
						<div class="flex justify-between text-xs text-muted-foreground mb-2">
							<span>Macro Backdrop</span>
							<span class="tabular-nums"
								>{macroBackdrop > 0 ? '+' : ''}{macroBackdrop.toFixed(1)}</span
							>
						</div>
						<Slider bind:value={macroBackdrop} min={-1} max={1} step={0.1} />
					</div>
					<div>
						<div class="flex justify-between text-xs text-muted-foreground mb-2">
							<span>Sector Readiness</span>
							<span class="tabular-nums">{(sectorReadiness * 100).toFixed(0)}%</span>
						</div>
						<Slider bind:value={sectorReadiness} min={0} max={1} step={0.05} />
					</div>
				</div>
			{/if}

			<div class="grid gap-3 sm:grid-cols-2">
				{#each dimensions as dim}
					{@const status = outlook[dim.key]}
					<div class="rounded-lg bg-muted p-3">
						<p class="text-xs text-muted-foreground">{dim.label}</p>
						<p class="mt-0.5 text-sm font-semibold {outlookStatusColors[status]}">
							{outlookStatusLabels[status]}
						</p>
					</div>
				{/each}
			</div>

			<div class="mt-3 rounded-lg border border-border p-3">
				<p class="text-xs text-foreground/80">{outlook.summary}</p>
			</div>

			<p class="mt-3 text-xs text-muted-foreground italic">
				Scenarios are illustrative, not predictive. They show how the outlook would shift under
				different assumptions.
			</p>
		</Tabs.Content>
	</Tabs.Root>
</section>
