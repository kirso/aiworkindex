<script lang="ts">
	import v5Roadmap from '$lib/data/v5-roadmap.json';
	import v5Sidecars from '$lib/data/v5-sidecars.json';
	import {
		pageLayout,
		card,
		sectionLabel,
		microLabel,
		title as titleStyle
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	function sidecarStatusLabel(status: string) {
		return status.replaceAll('_', ' ');
	}
</script>

<Seo
	title="V5 Roadmap"
	description="Archived roadmap for the V5 research program that preceded the current V7 two-axis release."
	path="/reports/v5-roadmap"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'V5 Roadmap' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>V5 Roadmap</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">{v5Roadmap.summary}</p>
		<p class="mt-1 text-sm text-muted-foreground">
			V5 is no longer the live model. This page is preserved as the archived roadmap for the V5
			research program that fed into the later V6 release.
		</p>
	</div>

	{#if v5Roadmap.experimental_model_status}
		<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4')}>
			<p class="text-sm font-semibold text-foreground">The V5 comparison trail is preserved.</p>
			<p class="mt-1 text-sm text-muted-foreground">
				The roadmap no longer stops at sidecars. A combined experimental model remains available
				with structural validation
				{v5Roadmap.experimental_model_status.structural_validation_result}
				and realized-risk validation
				{v5Roadmap.experimental_model_status.realized_validation_result}.
			</p>
			<a
				href="/reports/v5-experimental"
				class="mt-3 inline-block text-xs text-primary hover:underline"
			>
				Open V5 model note →
			</a>
		</div>
	{/if}

	<div class="mt-6 grid gap-3 md:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Current live</p>
			<p class="mt-1 text-lg font-bold text-foreground">{v5Roadmap.current_live_version}</p>
			<p class="text-xs text-muted-foreground">the live version when this roadmap was authored</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Retained V4.3 baseline</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{v5Roadmap.v43_handoff.validation_result}
			</p>
			<p class="text-xs text-muted-foreground">shadow validation gates that cleared</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Task-native coverage</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{v5Roadmap.v43_handoff.task_native_count}
			</p>
			<p class="text-xs text-muted-foreground">
				occupations carried into the retained pre-V6 baseline
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Status</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{v5Roadmap.status.replaceAll('_', ' ')}
			</p>
			<p class="text-xs text-muted-foreground">next major scientific release</p>
		</div>
	</div>

	<section class="mt-8">
		<p class={sectionLabel()}>Published Sidecars</p>
		<div class="mt-3 grid gap-4 lg:grid-cols-2">
			{#each Object.entries(v5Sidecars.sidecars) as [key, sidecar]}
				<div class={card({ padding: 'md' })}>
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm font-semibold text-foreground">
							{v5Roadmap.workstreams.find(workstream => workstream.key === key)?.label ??
								key.replaceAll('_', ' ')}
						</p>
						<span
							class="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary"
						>
							{sidecarStatusLabel(sidecar.status)}
						</span>
					</div>
					<p class="mt-2 text-sm text-muted-foreground">
						{#if key === 'augmentation_heterogeneity'}
							Workflow-sensitive augmentation priors published separately from the live score.
						{:else if key === 'empirical_mobility'}
							Hybrid mobility sidecar blending observed priors, destination quality, wage
							preservation, and training ease.
						{:else if key === 'posterior_uncertainty'}
							Source-calibrated latent measurement sidecar built on persisted exposure-source
							percentiles.
						{:else}
							Conservative realized-risk proxy published alongside structural and near-term risk.
						{/if}
					</p>
					<a
						href={'/data/' + sidecar.artifact}
						download
						class="mt-3 inline-block text-xs text-primary hover:underline"
					>
						Download {sidecar.artifact}
					</a>
				</div>
			{/each}
		</div>
	</section>

	{#if v5Roadmap.experimental_model_status}
		<section class="mt-8">
			<p class={sectionLabel()}>Integrated Candidate</p>
			<div class={card({ padding: 'md' })}>
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-sm font-semibold text-foreground">V5 Model Note</p>
						<p class="mt-1 text-sm text-muted-foreground">
							The integrated V5 model is no longer live. This note preserves the final promotion
							comparison against the retained V4.3 baseline and the published V5 adjunct layers for
							auditability under V6.
						</p>
					</div>
					<a href="/reports/v5-experimental" class="text-xs text-primary hover:underline">
						Open report →
					</a>
				</div>
				<div class="mt-4 grid gap-3 md:grid-cols-4">
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Status</p>
						<p class="mt-1 text-sm font-semibold text-foreground">
							{v5Roadmap.experimental_model_status.status.replaceAll('_', ' ')}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Structural validation</p>
						<p class="mt-1 text-sm font-semibold text-foreground">
							{v5Roadmap.experimental_model_status.structural_validation_result}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Realized validation</p>
						<p class="mt-1 text-sm font-semibold text-foreground">
							{v5Roadmap.experimental_model_status.realized_validation_result}
						</p>
					</div>
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class={microLabel()}>Transition band flips</p>
						<p class="mt-1 text-sm font-semibold text-foreground">
							{v5Roadmap.experimental_model_status.transition_band_flip_count}
						</p>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<section class="mt-8">
		<p class={sectionLabel()}>Release Thesis</p>
		<div class={cn(card({ padding: 'md' }), 'mt-3')}>
			<p class="text-sm text-muted-foreground">{v5Roadmap.release_thesis}</p>
			<div class="mt-4 space-y-2 rounded-lg border border-border/60 bg-background/70 px-3 py-3">
				<p class="font-mono text-xs text-muted-foreground">
					effective_coverage = {v5Roadmap.formula_family.effective_coverage}
				</p>
				<p class="font-mono text-xs text-muted-foreground">
					automation_pressure = {v5Roadmap.formula_family.automation_pressure}
				</p>
				<p class="font-mono text-xs text-muted-foreground">
					augmentation_upside = {v5Roadmap.formula_family.augmentation_upside}
				</p>
				<p class="font-mono text-xs text-muted-foreground">
					realized_risk_proxy = {v5Roadmap.formula_family.realized_risk_proxy}
				</p>
			</div>
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Workstreams</p>
		<div class="mt-3 grid gap-4 lg:grid-cols-2">
			{#each v5Roadmap.workstreams as workstream (workstream.key)}
				<div class={card({ padding: 'md' })}>
					<p class="text-sm font-semibold text-foreground">{workstream.label}</p>
					<p class="mt-2 text-sm text-muted-foreground">{workstream.goal}</p>
					<div class="mt-4">
						<p class="text-xs font-semibold text-foreground">Deliverables</p>
						<ul class="mt-2 space-y-1 text-sm text-muted-foreground">
							{#each workstream.deliverables as item}
								<li>{item}</li>
							{/each}
						</ul>
					</div>
					<div class="mt-4">
						<p class="text-xs font-semibold text-foreground">Research</p>
						<ul class="mt-2 space-y-1 text-sm text-muted-foreground">
							{#each workstream.research as item}
								<li>
									<a
										href={item.url}
										target="_blank"
										rel="noopener noreferrer"
										class="text-primary hover:underline"
									>
										{item.title}
									</a>
									<span class="text-xs text-muted-foreground"> ({item.year})</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="mt-8">
		<p class={sectionLabel()}>Promotion Discipline</p>
		<div class={card({ padding: 'md' })}>
			<ul class="space-y-2 text-sm text-muted-foreground">
				{#each v5Roadmap.promotion_gates as item}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	</section>
</main>
