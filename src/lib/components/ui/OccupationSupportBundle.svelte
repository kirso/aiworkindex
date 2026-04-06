<script lang="ts">
	import { card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import type { UnitedStatesOccupationSupport } from '$lib/data/countries/us/support';

	let { support } = $props<{ support: UnitedStatesOccupationSupport }>();
</script>

<section class="mt-8">
	<p class={sectionLabel()}>Evidence bundle</p>
	<div class="mt-3 grid gap-3 lg:grid-cols-2">
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

	<div class="mt-3 grid gap-3 lg:grid-cols-2">
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

	<div class="mt-3 grid gap-3 lg:grid-cols-2">
		<div class={card({ padding: 'sm' })}>
			<p class="text-sm font-semibold text-foreground">Support note</p>
			<p class="mt-1 text-sm text-muted-foreground">{support.note}</p>
		</div>
		<div class={card({ padding: 'sm' })}>
			<p class="text-sm font-semibold text-foreground">Source vintage</p>
			<p class="mt-1 text-sm text-muted-foreground">{support.sourceVintage}</p>
		</div>
	</div>
</section>
