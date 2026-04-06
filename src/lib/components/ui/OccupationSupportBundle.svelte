<script lang="ts">
	import { card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import SignalProfileGrid from '$lib/components/viz/SignalProfileGrid.svelte';
	import ContextItemGrid, { type ContextItemGridItem } from '$lib/components/ui/ContextItemGrid.svelte';
	import type { UnitedStatesOccupationSupport } from '$lib/data/countries/us/support';

	let { support } = $props<{ support: UnitedStatesOccupationSupport }>();

	type SupportSignalItem = {
		label: string;
		value: string;
		barValue: number;
		barClass: string;
		note?: string;
	};

	const signalBarClass = (value: number) =>
		value >= 0.66 ? 'bg-impact-leveraged' : value >= 0.33 ? 'bg-risk-moderate' : 'bg-risk-high';

	const formatPct = (value: number | null, digits = 0) =>
		value == null ? '—' : `${(value * 100).toFixed(digits)}%`;

	function averageTopWorkContextValue(items: UnitedStatesOccupationSupport['topWorkContext']): number {
		if (items.length === 0) return 0;
		return items.reduce((sum: number, item) => sum + item.value, 0) / items.length;
	}

	function countHotTechnologies(items: UnitedStatesOccupationSupport['topTechnologies']): number {
		return items.filter((entry: UnitedStatesOccupationSupport['topTechnologies'][number]) => entry.hot).length;
	}

	function countInDemandTechnologies(items: UnitedStatesOccupationSupport['topTechnologies']): number {
		return items.filter((entry: UnitedStatesOccupationSupport['topTechnologies'][number]) => entry.inDemand).length;
	}

	let supportSignals = $derived<SupportSignalItem[]>([
		{
			label: 'Task coverage',
			value: formatPct(support.taskPrimitives.matched_task_weight_share),
			barValue: support.taskPrimitives.matched_task_weight_share ?? 0,
			barClass: signalBarClass(support.taskPrimitives.matched_task_weight_share ?? 0),
			note: 'Weighted task overlap from O*NET statements and Anthropic penetration'
		},
		{
			label: 'Tech density',
			value: `${support.topTechnologies.length}/6`,
			barValue: Math.min(support.topTechnologies.length / 6, 1),
			barClass: signalBarClass(Math.min(support.topTechnologies.length / 6, 1)),
			note: 'Hot and in-demand tools from O*NET technology skills'
		},
		{
			label: 'Work context',
			value:
				support.topWorkContext.length > 0
					? `${averageTopWorkContextValue(support.topWorkContext).toFixed(1)}/5`
					: '—',
			barValue:
				support.topWorkContext.length > 0
					? Math.min(averageTopWorkContextValue(support.topWorkContext) / 5, 1)
					: 0,
			barClass: signalBarClass(
				support.topWorkContext.length > 0 ? Math.min(averageTopWorkContextValue(support.topWorkContext) / 5, 1) : 0
			),
			note: 'O*NET context intensity from the strongest context signals'
		},
		{
			label: 'Preparation',
			value: support.jobZone != null ? `${support.jobZone}/5` : '—',
			barValue: support.jobZone != null ? support.jobZone / 5 : 0,
			barClass: signalBarClass(support.jobZone != null ? support.jobZone / 5 : 0),
			note: 'Job Zone preparation requirement from O*NET'
		}
	]);

	let supportSnapshot = $derived<ContextItemGridItem[]>([
		{
			key: 'job-zone',
			label: 'Job zone',
			value: support.jobZone != null ? `${support.jobZone}` : 'n/a',
			description: support.jobZoneSummary ?? 'No preparation summary published.',
			tone: support.jobZone != null && support.jobZone >= 4 ? 'pressure' : 'neutral'
		},
		{
			key: 'task-coverage',
			label: 'Task coverage',
			value: formatPct(support.taskPrimitives.matched_task_weight_share),
			description:
				support.taskPrimitives.task_effective_coverage != null
					? `${formatPct(support.taskPrimitives.task_effective_coverage)} effective coverage`
					: 'Task primitive coverage is not published.',
			tone: support.taskPrimitives.matched_task_weight_share != null ? 'support' : 'neutral'
		},
		{
			key: 'top-tech',
			label: 'Tech signals',
			value: `${support.topTechnologies.length}`,
			description:
				support.topTechnologies.length > 0
					? `${countHotTechnologies(support.topTechnologies)} hot · ${countInDemandTechnologies(support.topTechnologies)} in demand`
					: 'No technology context published.',
			tone: support.topTechnologies.length > 0 ? 'support' : 'neutral'
		},
		{
			key: 'median-age',
			label: 'Median age',
			value: support.ageProfile.medianAge != null ? support.ageProfile.medianAge.toFixed(1) : 'n/a',
			description:
				support.ageProfile.totalEmployment != null
					? `${support.ageProfile.totalEmployment.toLocaleString()}K employed`
					: 'No CPS age profile published.',
			tone: support.ageProfile.medianAge != null ? 'protective' : 'neutral'
		}
	]);

	let supportSourceFamilies = $derived([
		{ key: 'onet-desc', label: 'Occupation Data', active: Boolean(support.occupationDescription) },
		{ key: 'onet-job-zone', label: 'Job Zones', active: support.jobZone != null },
		{ key: 'onet-tasks', label: 'Task Ratings', active: support.taskPrimitives.matched_task_weight_share != null },
		{ key: 'onet-tech', label: 'Tech Skills', active: support.topTechnologies.length > 0 },
		{ key: 'onet-context', label: 'Work Context', active: support.topWorkContext.length > 0 },
		{ key: 'cps-age', label: 'CPS Age Table', active: support.ageProfile.medianAge != null }
	] as const);

	let supportSourceCount = $derived(supportSourceFamilies.filter(source => source.active).length);
</script>

<section class="mt-8">
	<p class={sectionLabel()}>Evidence bundle</p>
	<div class="mt-3 space-y-4">
		<SignalProfileGrid items={supportSignals} columns={4} />

		<div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3">
			<span class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
				Support sources
			</span>
			<div
				class="flex items-center gap-1.5"
				title={`${supportSourceCount} of ${supportSourceFamilies.length} support inputs present`}
			>
				{#each supportSourceFamilies as source}
					<div
						class={cn(
							'h-2.5 w-2.5 rounded-full transition-colors',
							source.active ? 'bg-primary' : 'bg-muted-foreground/20'
						)}
						title={source.label + (source.active ? ' ✓' : ' —')}
					></div>
				{/each}
			</div>
			<span class="text-xs text-muted-foreground">
				{supportSourceCount}/{supportSourceFamilies.length} source families
			</span>
			<span class="text-xs text-muted-foreground">Updated from {support.sourceVintage}</span>
		</div>

		<ContextItemGrid title="Support snapshot" items={supportSnapshot} />

		<div class="grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Occupation profile</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{support.occupationDescription ?? 'No O*NET description published.'}
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					{#if support.jobZoneLabel}
						Job Zone {support.jobZone} · {support.jobZoneLabel}
					{:else}
						No job zone published.
					{/if}
				</p>
				{#if support.jobZoneSummary}
					<p class="mt-2 text-sm text-muted-foreground">{support.jobZoneSummary}</p>
				{/if}
			</div>

			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Task primitives</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{#if support.taskPrimitives.matched_task_weight_share != null}
						Matched task weight share: {(support.taskPrimitives.matched_task_weight_share * 100).toFixed(0)}%
						· Effective coverage: {(support.taskPrimitives.task_effective_coverage! * 100).toFixed(0)}%
					{:else}
						Task primitive coverage is not published for this occupation.
					{/if}
				</p>
				{#if support.taskPrimitives.task_exposure_concentration != null}
					<p class="mt-2 text-sm text-muted-foreground">
						Concentration: {(support.taskPrimitives.task_exposure_concentration * 100).toFixed(0)}%
					</p>
				{/if}
			</div>
		</div>

		<div class="grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Tasks and tools</p>
				{#if support.topTasks.length > 0}
					<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
						{#each support.topTasks as task, index (task.task)}
							<li>
								<span class="font-medium text-foreground">{index + 1}.</span>
								{task.task}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-muted-foreground">No task context published.</p>
				{/if}
				{#if support.topTechnologies.length > 0}
					<div class="mt-4 flex flex-wrap gap-2">
						{#each support.topTechnologies as technology (technology.name)}
							<span class={cn('rounded-full bg-muted px-2.5 py-1 text-xs text-foreground')}>
								{technology.name}
								{#if technology.hot}
									· hot
								{/if}
								{#if technology.inDemand}
									· in demand
								{/if}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Work context</p>
				{#if support.topWorkContext.length > 0}
					<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
						{#each support.topWorkContext as item (item.label)}
							<li>{item.label}: {item.value.toFixed(1)}/5</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-muted-foreground">No work-context data published.</p>
				{/if}
				<p class="mt-4 text-sm font-semibold text-foreground">Worker profile</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{#if support.ageProfile.medianAge != null}
						Median age: {support.ageProfile.medianAge.toFixed(1)}
					{:else}
						No CPS age profile published.
					{/if}
				</p>
				{#if support.ageProfile.totalEmployment != null}
					<p class="mt-2 text-sm text-muted-foreground">
						Total employed: {support.ageProfile.totalEmployment.toLocaleString()}K
						· Under 25: {(support.ageProfile.under25Share! * 100).toFixed(0)}%
						· 25 to 54: {(support.ageProfile.primeAgeShare! * 100).toFixed(0)}%
						· 55+: {(support.ageProfile.olderShare! * 100).toFixed(0)}%
					</p>
				{/if}
			</div>
		</div>

		<div class="grid gap-3 lg:grid-cols-2">
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Support note</p>
				<p class="mt-1 text-sm text-muted-foreground">{support.note}</p>
			</div>
			<div class={card({ padding: 'sm' })}>
				<p class="text-sm font-semibold text-foreground">Source vintage</p>
				<p class="mt-1 text-sm text-muted-foreground">{support.sourceVintage}</p>
			</div>
		</div>
	</div>
</section>
