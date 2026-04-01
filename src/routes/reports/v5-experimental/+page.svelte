<script lang="ts">
	import v5ExperimentalValidation from '$lib/data/v5-experimental-validation.json';
	import {
		pageLayout,
		card,
		sectionLabel,
		microLabel,
		title as titleStyle
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const structuralPasses = [
		v5ExperimentalValidation.structural_validation.bls_spearman_rho.pass,
		v5ExperimentalValidation.structural_validation.occupation_family_spearman_rho.pass
	].filter(Boolean).length;
	const realizedPasses = v5ExperimentalValidation.summary.realized_pass_count ?? 0;
	const realizedScorableChecks =
		v5ExperimentalValidation.summary.realized_scorable_check_count ?? 0;
	const isLiveV5 = v5ExperimentalValidation.status === 'promoted_live';
</script>

<Seo
	title={isLiveV5 ? 'V5 Model Note' : 'V5 Experimental Model'}
	description={isLiveV5
		? 'Audit note for the former live V5 structural release, preserving the final comparison against the retained V4.3 baseline and the published transition-adjusted and realized-risk layers.'
		: 'Integrated V5 experimental candidate combining posterior exposure, task-mode proxies, concentration-driven fragility, augmentation heterogeneity, empirical mobility, and archetype-capped realized-risk calibration.'}
	path="/reports/v5-experimental"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: isLiveV5 ? 'V5 Model Note' : 'V5 Experimental' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>
		{isLiveV5 ? 'V5 Model Note' : 'V5 Experimental Model'}
	</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">
			{v5ExperimentalValidation.readiness.summary}
		</p>
		<p class="mt-1 text-sm text-muted-foreground">
			{#if isLiveV5}
				This page now preserves the final V5 promotion comparison after the V6 rollout. The planning
				rationale and next-step calibration work stay on the
			{:else}
				This report is results-oriented: it shows what the integrated V5 candidate currently does.
				The planning rationale and workstream framing stay on the
			{/if}
			<a href="/reports/v5-roadmap" class="text-primary hover:underline">V5 roadmap</a>.
		</p>
	</div>

	<div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Status</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{isLiveV5 ? 'Archived live note' : 'Experimental only'}
			</p>
			<p class="text-xs text-muted-foreground">
				{isLiveV5
					? 'published as the retained V5 promotion artifact with V4.3 comparison'
					: 'not live in occupations'}
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Structural validation</p>
			<p class="mt-1 text-lg font-bold text-foreground">{structuralPasses}/2</p>
			<p class="text-xs text-muted-foreground">
				BLS and family checks versus {v5ExperimentalValidation.comparison_baseline_version}
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Realized validation</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{realizedPasses}/{realizedScorableChecks}
			</p>
			<p class="text-xs text-muted-foreground">
				scorable short-run checks retained in the audit trail
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Task-mode blended</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{v5ExperimentalValidation.summary.task_mode_blended_count}
			</p>
			<p class="text-xs text-muted-foreground">occupations with mode-aware exposure blend</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Median fragility</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{v5ExperimentalValidation.summary.median_demand_fragility}
			</p>
			<p class="text-xs text-muted-foreground">concentration-weighted task fragility</p>
		</div>
	</div>

	<section class="mt-8">
		<p class={sectionLabel()}>What Is Integrated</p>
		<div class="mt-3 grid gap-4 lg:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<div class="flex items-center gap-2">
					<p class="text-sm font-semibold text-foreground">Structural layer</p>
					<Badge variant="outline">Latent posterior + task mode</Badge>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					Source-calibrated latent exposure stays the anchor, while task-mode proxies derived from
					weighted O*NET tasks adjust the exposure layer where the task evidence is strong enough.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<div class="flex items-center gap-2">
					<p class="text-sm font-semibold text-foreground">Concentration layer</p>
					<Badge variant="outline">Fragility + reallocation</Badge>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					Hampole-style concentration now enters as demand fragility and reallocation capacity. A
					few highly exposed core duties are treated differently from diffuse exposure spread across
					many smaller tasks.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<div class="flex items-center gap-2">
					<p class="text-sm font-semibold text-foreground">Adaptation layer</p>
					<Badge variant="outline">Augmentation + hybrid mobility</Badge>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					Heterogeneous augmentation and hybrid mobility become a bounded adaptation buffer,
					creating a transition-adjusted risk view rather than directly overwriting structural risk.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<div class="flex items-center gap-2">
					<p class="text-sm font-semibold text-foreground">Realized-risk layer</p>
					<Badge variant="outline">Short run</Badge>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					The realized-risk proxy remains conservative and separate, reflecting archetype-specific
					short-run caps, adoption timing, postings resistance, and offset room rather than raw
					structural overlap.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<div class="flex items-center gap-2">
					<p class="text-sm font-semibold text-foreground">Governance</p>
					<Badge variant="outline">{isLiveV5 ? 'Promoted live' : 'Experimental only'}</Badge>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{#if isLiveV5}
						The former live V5 release remains auditable because the retained V4.3 baseline,
						sidecars, and promotion-comparison artifacts are still published separately.
					{:else}
						This candidate is auditable because the sidecars remain published separately. Any future
						promotion still needs an explicit release decision.
					{/if}
				</p>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Validation Snapshot</p>
		<div class="mt-3 grid gap-4 lg:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<p class="text-sm font-semibold text-foreground">Structural checks</p>
				<div class="mt-3 space-y-3">
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>BLS rho</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							live {v5ExperimentalValidation.structural_validation.bls_spearman_rho.live} → experimental
							{v5ExperimentalValidation.structural_validation.bls_spearman_rho.experimental}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Family rho</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							live {v5ExperimentalValidation.structural_validation.occupation_family_spearman_rho
								.live}
							→ experimental
							{v5ExperimentalValidation.structural_validation.occupation_family_spearman_rho
								.experimental}
						</p>
					</div>
				</div>
			</div>

			<div class={card({ padding: 'md' })}>
				<p class="text-sm font-semibold text-foreground">Realized-risk checks</p>
				<div class="mt-3 space-y-3">
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Vacancy trend rho</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{v5ExperimentalValidation.realized_validation.vacancy_trend_rho.experimental}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Hiring-net rho</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{v5ExperimentalValidation.realized_validation.hiring_net_pressure_rho.experimental}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{v5ExperimentalValidation.realized_validation.hiring_net_pressure_rho.scorable
								? 'Scorable, but still only a coarse 3-cluster diagnostic'
								: 'Not scorable with current signal variance'}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Retrenchment rho</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{v5ExperimentalValidation.realized_validation.retrenchment_incidence_rho.experimental}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{v5ExperimentalValidation.realized_validation.retrenchment_incidence_rho.scorable
								? 'Scorable'
								: 'Current cluster series is too flat to score honestly'}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Employer-pressure rho</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{v5ExperimentalValidation.realized_validation.employer_pressure_rho.experimental}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							positive coherence across archetypes, sample
							{v5ExperimentalValidation.realized_validation.employer_pressure_rho.sample_size}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Postings-support rho</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{v5ExperimentalValidation.realized_validation.postings_support_rho.experimental}
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							negative coherence against direct occupation-level postings support, sample
							{v5ExperimentalValidation.realized_validation.postings_support_rho.sample_size}
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Profile Mix</p>
		<div class="mt-3 grid gap-3 md:grid-cols-5">
			{#each Object.entries(v5ExperimentalValidation.summary.profile_counts) as [profile, count]}
				<div class={card({ padding: 'sm', variant: 'metric' })}>
					<p class={microLabel()}>{profile.replaceAll('_', ' ')}</p>
					<p class="mt-1 text-lg font-bold text-foreground">{count}</p>
					<p class="text-xs text-muted-foreground">occupations</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Largest Changes</p>
		<div class="mt-3 grid gap-4 lg:grid-cols-3">
			<div class={card({ padding: 'md' })}>
				<p class="text-sm font-semibold text-foreground">Structural risers</p>
				<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
					{#each v5ExperimentalValidation.top_changes.structural_risers as row}
						<li>{row.title} <span class="text-foreground">({row.value})</span></li>
					{/each}
				</ul>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-sm font-semibold text-foreground">Transition fallers</p>
				<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
					{#each v5ExperimentalValidation.top_changes.transition_fallers as row}
						<li>{row.title} <span class="text-foreground">({row.value})</span></li>
					{/each}
				</ul>
			</div>
			<div class={card({ padding: 'md' })}>
				<p class="text-sm font-semibold text-foreground">Highest realized risk</p>
				<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
					{#each v5ExperimentalValidation.top_changes.highest_realized_risk as row}
						<li>{row.title} <span class="text-foreground">({row.value})</span></li>
					{/each}
				</ul>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Downloads</p>
		<div class="mt-3 flex flex-wrap gap-3 text-sm">
			<a href="/data/v5-experimental-model.json" download class="text-primary hover:underline">
				Download model JSON
			</a>
			<a href="/data/v5-experimental-validation.json" download class="text-primary hover:underline">
				Download validation JSON
			</a>
		</div>
	</section>
</main>
