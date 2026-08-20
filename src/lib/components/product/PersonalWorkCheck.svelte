<script lang="ts">
	import { browser } from '$app/environment';
	import { trackProductEvent } from '$lib/analytics';
	import { Button } from '$lib/components/ui/button/index.js';
	import { caption, sectionLabel, title } from '$lib/design-system';
	import {
		buildPersonalWorkGuidance,
		defaultPersonalWorkAnswers,
		parsePersonalWorkAnswers,
		workActivities,
		type AiUse,
		type ErrorImpact,
		type PersonalWorkAnswers,
		type ReviewResponsibility,
		type WorkActivity
	} from '$lib/personal-work-check';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	let { entityId, entityTitle }: { entityId: string; entityTitle: string } = $props();

	let storageKey = $derived(`aiworkindex-personal-work-check:v1:${entityId}`);
	let answers = $state<PersonalWorkAnswers>(structuredClone(defaultPersonalWorkAnswers));
	let hydrated = $state(false);
	let showPlan = $state(false);
	let startedTracked = $state(false);
	let guidance = $derived(buildPersonalWorkGuidance(answers));

	onMount(() => {
		answers = parsePersonalWorkAnswers(localStorage.getItem(storageKey));
		showPlan = answers.activities.length > 0;
		hydrated = true;
	});

	$effect(() => {
		if (!browser || !hydrated) return;
		localStorage.setItem(storageKey, JSON.stringify(answers));
	});

	function toggleActivity(activity: WorkActivity) {
		if (!startedTracked) {
			trackProductEvent('personal_check_started', {
				entity_kind: entityId.startsWith('role:') ? 'role' : 'occupation',
				context: 'checker'
			});
			startedTracked = true;
		}
		answers.activities = answers.activities.includes(activity)
			? answers.activities.filter(value => value !== activity)
			: [...answers.activities, activity];
	}

	function buildPlan() {
		showPlan = true;
		trackProductEvent('personal_check_completed', {
			entity_kind: entityId.startsWith('role:') ? 'role' : 'occupation',
			context: 'checker'
		});
	}

	function reset() {
		answers = structuredClone(defaultPersonalWorkAnswers);
		showPlan = false;
		if (browser) localStorage.removeItem(storageKey);
	}

	const aiUseOptions: Array<{ value: AiUse; label: string; detail: string }> = [
		{ value: 'not_yet', label: 'Not yet', detail: 'AI is not part of my normal workflow.' },
		{
			value: 'sometimes',
			label: 'Sometimes',
			detail: 'I use it for selected tasks or experiments.'
		},
		{ value: 'often', label: 'Often', detail: 'It is part of several regular tasks.' }
	];
	const impactOptions: Array<{ value: ErrorImpact; label: string; detail: string }> = [
		{ value: 'limited', label: 'Limited', detail: 'An error is easy to spot and reverse.' },
		{ value: 'material', label: 'Material', detail: 'An error costs time, money or trust.' },
		{
			value: 'serious',
			label: 'Serious',
			detail: 'An error can harm people, rights or major decisions.'
		}
	];
	const responsibilityOptions: Array<{
		value: ReviewResponsibility;
		label: string;
		detail: string;
	}> = [
		{ value: 'support', label: 'I support', detail: 'Someone else checks and owns the result.' },
		{ value: 'shared', label: 'Shared', detail: 'A team checks and owns the result.' },
		{ value: 'final', label: 'I sign off', detail: 'I carry final responsibility for the result.' }
	];
</script>

<section class="mt-10 border-t-2 border-foreground pt-7" aria-labelledby="personal-work-title">
	<div class="max-w-3xl">
		<p class={sectionLabel()}>Your work, on this device</p>
		<h2 id="personal-work-title" class={title({ size: 'section' })}>
			Turn the occupation result into a practical plan
		</h2>
		<p class="mt-3 text-base leading-relaxed text-text-secondary">
			A job title cannot describe how you spend every day. Choose the work that matters in your
			version of <strong>{entityTitle}</strong>. Your answers stay in this browser and never change
			the published occupation rank.
		</p>
	</div>

	<form class="mt-6 space-y-7" onsubmit={event => event.preventDefault()}>
		<fieldset>
			<legend class="text-base font-bold">1. Where does a meaningful share of your time go?</legend>
			<p class={cn(caption(), 'mt-1')}>Choose every activity that is part of your real work.</p>
			<div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each workActivities as activity (activity.id)}
					<button
						type="button"
						class="min-h-24 border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {answers.activities.includes(
							activity.id
						)
							? 'border-primary bg-primary/8'
							: 'border-border bg-card hover:border-foreground hover:bg-surface-subtle'}"
						onclick={() => toggleActivity(activity.id)}
						aria-pressed={answers.activities.includes(activity.id)}
					>
						<span class="flex items-start gap-2">
							<span
								class="mt-0.5 grid size-5 shrink-0 place-items-center border {answers.activities.includes(
									activity.id
								)
									? 'border-primary bg-primary text-primary-foreground'
									: 'border-input bg-background'}"
								aria-hidden="true"
							>
								{#if answers.activities.includes(activity.id)}✓{/if}
							</span>
							<span>
								<strong class="block text-sm">{activity.label}</strong>
								<span class="mt-1 block text-xs leading-relaxed text-muted-foreground"
									>{activity.description}</span
								>
							</span>
						</span>
					</button>
				{/each}
			</div>
		</fieldset>

		<div class="grid gap-6 lg:grid-cols-3">
			<fieldset>
				<legend class="text-sm font-bold">2. How often do you use AI?</legend>
				<div class="mt-2 space-y-2">
					{#each aiUseOptions as option (option.value)}
						<label
							class="flex min-h-16 cursor-pointer gap-3 border border-border bg-card p-3 hover:border-foreground"
						>
							<input type="radio" name="ai-use" value={option.value} bind:group={answers.aiUse} />
							<span>
								<strong class="block text-sm">{option.label}</strong>
								<span class="block text-xs leading-relaxed text-muted-foreground"
									>{option.detail}</span
								>
							</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<fieldset>
				<legend class="text-sm font-bold">3. What happens if the work is wrong?</legend>
				<div class="mt-2 space-y-2">
					{#each impactOptions as option (option.value)}
						<label
							class="flex min-h-16 cursor-pointer gap-3 border border-border bg-card p-3 hover:border-foreground"
						>
							<input
								type="radio"
								name="error-impact"
								value={option.value}
								bind:group={answers.errorImpact}
							/>
							<span>
								<strong class="block text-sm">{option.label}</strong>
								<span class="block text-xs leading-relaxed text-muted-foreground"
									>{option.detail}</span
								>
							</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<fieldset>
				<legend class="text-sm font-bold">4. Who owns the final result?</legend>
				<div class="mt-2 space-y-2">
					{#each responsibilityOptions as option (option.value)}
						<label
							class="flex min-h-16 cursor-pointer gap-3 border border-border bg-card p-3 hover:border-foreground"
						>
							<input
								type="radio"
								name="responsibility"
								value={option.value}
								bind:group={answers.reviewResponsibility}
							/>
							<span>
								<strong class="block text-sm">{option.label}</strong>
								<span class="block text-xs leading-relaxed text-muted-foreground"
									>{option.detail}</span
								>
							</span>
						</label>
					{/each}
				</div>
			</fieldset>
		</div>

		<div class="flex flex-wrap items-center gap-3 border-t border-border pt-5">
			<Button type="button" size="lg" disabled={answers.activities.length === 0} onclick={buildPlan}
				>Build my work plan</Button
			>
			<Button type="button" variant="ghost" onclick={reset}>Clear my answers</Button>
			{#if answers.activities.length === 0}
				<p class="text-xs text-muted-foreground">Choose at least one activity to continue.</p>
			{:else}
				<p class="text-xs text-muted-foreground">
					{answers.activities.length} work {answers.activities.length === 1 ? 'area' : 'areas'} selected
				</p>
			{/if}
		</div>
	</form>

	{#if showPlan && answers.activities.length > 0}
		<div class="mt-9 border-t-2 border-foreground pt-7" aria-live="polite">
			<div class="max-w-3xl">
				<p class={sectionLabel()}>Personal work plan</p>
				<h3 class={title({ size: 'section' })}>Six useful next moves</h3>
				<p class="mt-2 text-sm leading-relaxed text-text-secondary">
					This plan combines your answers with reviewed editorial guidance. It is a set of questions
					and experiments, not a forecast or training prescription.
				</p>
			</div>

			<div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each guidance as group (group.id)}
					<section class="action-card min-w-0 border bg-card p-4" data-action={group.id}>
						<p class="text-xs font-bold uppercase tracking-wide text-[var(--action)]">
							{group.label}
						</p>
						<p class="mt-1 text-sm leading-relaxed text-text-secondary">{group.intro}</p>
						<ul class="mt-4 space-y-4">
							{#each group.items as recommendation (`${recommendation.title}:${recommendation.detail}`)}
								<li>
									<p class="text-sm font-bold">{recommendation.title}</p>
									<p class="mt-1 text-xs leading-relaxed text-text-secondary">
										{recommendation.detail}
									</p>
									<p class="mt-2 font-mono text-xs text-muted-foreground">
										{recommendation.basis}
									</p>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.action-card {
		border-color: color-mix(in srgb, var(--action) 42%, var(--border));
		border-top-width: 4px;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--action) 7%, var(--card)) 0,
			var(--card) 7rem
		);
	}

	.action-card[data-action='try'] {
		--action: var(--color-action-try, #2457d6);
	}

	.action-card[data-action='verify'] {
		--action: var(--color-action-verify, #80510d);
	}

	.action-card[data-action='human'] {
		--action: var(--color-action-human-led, #684a93);
	}

	.action-card[data-action='strengthen'] {
		--action: var(--color-action-strengthen, #256a5d);
	}

	.action-card[data-action='ask'] {
		--action: var(--color-action-monitor, #55524a);
	}

	.action-card[data-action='monitor'] {
		--action: var(--color-action-monitor, #55524a);
	}
</style>
