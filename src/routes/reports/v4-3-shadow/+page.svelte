<script lang="ts">
	import { experimentalStatusLabel } from '$lib/data/experimental-status-display';
	import experimentalMethodology from '$lib/data/experimental-methodology-v43.json';
	import shadowComparison from '$lib/data/shadow-comparison-v43.json';
	import shadowValidation from '$lib/data/shadow-validation-v43.json';
	import { siteStatus } from '$lib/data/site-status';
	import {
		title as titleStyle,
		pageLayout,
		card,
		sectionLabel,
		microLabel
	} from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const inputRows = Object.entries(experimentalMethodology.required_inputs).map(([key, value]) => ({
		key,
		...value
	}));
	const presentInputCount = inputRows.filter(row => row.present).length;
	const coverage = experimentalMethodology.coverage;
	const promotionGates = experimentalMethodology.promotion_gates;
	const blockers = experimentalMethodology.blockers ?? [];
	const isPromoted = siteStatus.experimental_release.status === 'promoted';
	const validationPassCount = shadowComparison.validation_pass_count ?? 0;
	const validationTotal = shadowComparison.validation_total ?? 0;
	const headlineHoldItems = [
		...(!experimentalMethodology.shadow_score_published
			? ['A task-adjusted shadow score artifact is not published yet.']
			: []),
		...promotionGates
			.filter((gate: { state: string }) => gate.state !== 'pass')
			.map(
				(gate: { label: string; note: string; state: string }) =>
					`${gate.label}: ${gate.state === 'pending' ? 'still pending review' : gate.note}`
			),
		...(blockers.length === 0 && !experimentalMethodology.shadow_score_published
			? [
					'Input readiness is no longer the blocker; promotion now depends on publishing the shadow score and clearing validation review.'
				]
			: [])
	];
	const headlineHoldDisplayItems =
		headlineHoldItems.length > 0
			? headlineHoldItems
			: isPromoted
				? ['The V4.3 shadow model has already been promoted into the live structural release.']
				: [
						'No input blockers remain, but this archived shadow model still requires explicit validation and anchor-review sign-off before any headline promotion decision.'
					];
	const shippedNow = [
		'Bootstrap uncertainty intervals are published on occupations in the live dataset.',
		'Structural risk and near-term risk are separated in the forecast layer.',
		'Task-primitives fields now publish weighted evidence where normalized O*NET task matches exist; sparse occupations remain explicit null.',
		'The release and governance surfaces now expose shadow-model readiness instead of hiding it.',
		`${shadowComparison.task_native_count} occupations have published task-native shadow scores for archived comparison.`
	];
	const remainingInputGaps =
		blockers.length > 0
			? blockers.map((blocker: { note: string }) => blocker.note)
			: ['All required local shadow-model inputs are now present.'];
	const experimentalPositiveStates = ['ready_for_shadow_scoring', 'shadow_published', 'promoted'];
	const experimentalStatusBadgeClass = experimentalPositiveStates.includes(
		siteStatus.experimental_release?.status ?? ''
	)
		? 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
		: siteStatus.experimental_release?.status === 'blocked'
			? 'bg-risk-high-subtle text-risk-high border-risk-high-border'
			: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border';

	function formatPct(value: number | null | undefined, digits = 0): string {
		return typeof value === 'number' ? `${(value * 100).toFixed(digits)}%` : 'n/a';
	}

	function formatState(state: string): string {
		return state.replaceAll('_', ' ');
	}

	function stateClass(state: string): string {
		if (
			state === 'pass' ||
			state === 'passed' ||
			state === 'ready_for_shadow_scoring' ||
			state === 'shadow_published' ||
			state === 'promoted'
		) {
			return 'text-impact-leveraged';
		}
		if (state === 'blocked') return 'text-risk-high';
		return 'text-risk-moderate';
	}
</script>

<Seo
	title="V4.3 Shadow Model Note"
	description={isPromoted
		? 'How the V4.3 shadow model was promoted into the live release, what changed, and how the audit trail against V4.2 remains published.'
		: 'Archived V4.3 task-weighted shadow-model note showing task coverage, validation gates, and why the shadow layer is not the live V7 headline formula.'}
	path="/reports/v4-3-shadow"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Reports', href: '/reports' },
			{ label: 'V4.3 Shadow Model' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>V4.3 Shadow Model Note</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-4')}>
		<div class="flex flex-wrap items-center gap-2">
			<p class="text-sm font-semibold text-foreground">
				Status: {siteStatus.experimental_release.label}
			</p>
			<Badge variant="outline" class={experimentalStatusBadgeClass}>
				{experimentalStatusLabel(siteStatus.experimental_release.status)}
			</Badge>
		</div>
		<p class="mt-1 text-sm text-muted-foreground">
			This page explains release impact and readiness. It does not replace the formula spec on
			<a href="/methodology" class="text-primary hover:underline">Methodology</a>, the threshold
			detail on <a href="/methodology/appendix" class="text-primary hover:underline">Appendix</a>,
			the schema/download contract on
			<a href="/data" class="text-primary hover:underline">Data</a>, or the citation layer on
			<a href="/research" class="text-primary hover:underline">Research</a>.
		</p>
	</div>

	<div class="mt-6 grid gap-3 md:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>{isPromoted ? 'Comparison baseline' : 'Shadow baseline'}</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{experimentalMethodology.published_baseline_version}
			</p>
			<p class="text-xs text-muted-foreground">
				{isPromoted
					? 'pre-promotion live release used for comparison'
					: 'historical comparison basis for this shadow artifact'}
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Required inputs ready</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{presentInputCount}/{inputRows.length}
			</p>
			<p class="text-xs text-muted-foreground">present locally for shadow scoring</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Published task-native occupations</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{shadowComparison.task_native_count}
			</p>
			<p class="text-xs text-muted-foreground">
				occupations currently scored with the task-native shadow model
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Validation comparison</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{validationPassCount}/{validationTotal}
			</p>
			<p class="text-xs text-muted-foreground">current match-or-improve gates passing</p>
		</div>
	</div>

	<div class={cn(card({ padding: 'md' }), 'mt-6')}>
		<p class="text-sm font-semibold text-foreground">Published shadow artifacts</p>
		<p class="mt-1 text-sm text-muted-foreground">
			The shadow layer is now auditable as data, not just as a readiness note.
		</p>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<a
				href="/data/shadow-scores-v43.json"
				download
				class="rounded-lg border border-border/60 bg-background/70 px-3 py-3 no-underline transition-colors hover:border-primary/30 hover:bg-accent/40"
			>
				<p class="text-sm font-medium text-foreground">Shadow scores</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Per-occupation task-adjusted scores and fallback status.
				</p>
			</a>
			<a
				href="/data/shadow-comparison-v43.json"
				download
				class="rounded-lg border border-border/60 bg-background/70 px-3 py-3 no-underline transition-colors hover:border-primary/30 hover:bg-accent/40"
			>
				<p class="text-sm font-medium text-foreground">Comparison summary</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Score deltas, band flips, and anchor-review counts versus V4.2.
				</p>
			</a>
			<a
				href="/data/shadow-validation-v43.json"
				download
				class="rounded-lg border border-border/60 bg-background/70 px-3 py-3 no-underline transition-colors hover:border-primary/30 hover:bg-accent/40"
			>
				<p class="text-sm font-medium text-foreground">Validation comparison</p>
				<p class="mt-1 text-xs text-muted-foreground">
					BLS, family, and cluster comparisons against the live baseline.
				</p>
			</a>
		</div>
		<p class="mt-3 text-xs text-muted-foreground">
			Current shadow validation deltas: cluster {shadowValidation.cluster_directional_accuracy
				.delta}, BLS {shadowValidation.bls_spearman_rho.delta}, family {shadowValidation
				.occupation_family_spearman_rho.delta}.
		</p>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>What Changes Already Affect Users</p>
	<div class="grid gap-3 md:grid-cols-2">
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">
				{isPromoted ? 'Now live in V4.3' : 'Current live V7 keeps this separate'}
			</p>
			<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
				{#each shippedNow as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">
				{isPromoted
					? 'What the audit trail still preserves'
					: 'What still does not affect the headline score'}
			</p>
			<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
				{#each headlineHoldDisplayItems as item (item)}
					<li>{item}</li>
				{/each}
			</ul>
		</div>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Remaining Input Gaps</p>
	<div class={card({ padding: 'md' })}>
		<ul class="space-y-2 text-sm text-muted-foreground">
			{#each remainingInputGaps as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Input Readiness</p>
	<div class="grid gap-3 md:grid-cols-2">
		{#each inputRows as row (row.key)}
			<div class={card({ padding: 'sm', variant: 'flat' })}>
				<div class="flex items-start justify-between gap-3">
					<div>
						<p class="text-sm font-semibold text-foreground">{row.key.replaceAll('_', ' ')}</p>
						<p class="mt-1 text-xs text-muted-foreground">{row.file}</p>
					</div>
					<Badge
						variant="outline"
						class={row.present
							? 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
							: 'bg-risk-high-subtle text-risk-high border-risk-high-border'}
					>
						{row.present ? 'present' : 'missing'}
					</Badge>
				</div>
				<div class="mt-3 h-2 rounded-full bg-muted">
					<div
						class={row.present
							? 'h-2 rounded-full bg-impact-leveraged'
							: 'h-2 rounded-full bg-risk-high'}
						style={`width: ${row.present ? 100 : 18}%`}
					></div>
				</div>
			</div>
		{/each}
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Coverage Snapshot</p>
	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Occupations</p>
			<p class="mt-1 text-lg font-bold text-foreground">{coverage.occupation_count}</p>
			<p class="text-xs text-muted-foreground">current published universe</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Direct mapped</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{coverage.direct_mapped_occupation_count}
			</p>
			<p class="text-xs text-muted-foreground">eligible for the direct coverage gate</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Median direct matched task share</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{formatPct(coverage.median_direct_matched_task_weight_share)}
			</p>
			<p class="text-xs text-muted-foreground">current direct-coverage gate basis</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'flat' })}>
			<p class={microLabel()}>Task-weighted share</p>
			<p class="mt-1 text-lg font-bold text-foreground">
				{formatPct(coverage.task_weighted_share)}
			</p>
			<p class="text-xs text-muted-foreground">archived outside the live V7 headline</p>
		</div>
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Promotion Gates</p>
	<div class={card({ padding: 'none' })}>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="px-3 py-2.5 font-medium text-muted-foreground">Gate</th>
						<th class="px-3 py-2.5 font-medium text-muted-foreground">Threshold</th>
						<th class="px-3 py-2.5 font-medium text-muted-foreground">Actual</th>
						<th class="px-3 py-2.5 font-medium text-muted-foreground">State</th>
					</tr>
				</thead>
				<tbody>
					{#each promotionGates as gate (gate.key)}
						<tr class="border-b border-border/50 last:border-b-0">
							<td class="px-3 py-3">
								<p class="font-medium text-foreground">{gate.label}</p>
								<p class="mt-1 text-xs text-muted-foreground">{gate.note}</p>
							</td>
							<td class="px-3 py-3 text-xs text-muted-foreground">
								{gate.comparator}
								{String(gate.threshold)}
							</td>
							<td class="px-3 py-3 text-xs text-muted-foreground">
								{gate.actual === null ? 'n/a' : String(gate.actual)}
							</td>
							<td class={cn('px-3 py-3 text-xs font-semibold', stateClass(gate.state))}>
								{formatState(gate.state)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="mt-8 grid gap-3 md:grid-cols-2">
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">
				{isPromoted ? 'What V4.3 Proved' : 'If V4.3 is eventually promoted'}
			</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{#if isPromoted}
					V4.3 proved that task evidence works best as a disciplined exposure upgrade, not as a full
					wholesale rewrite of the structural formula. The candidate task-native formulas remain
					published as research scaffolding for V5, not as live rules.
				{:else}
					The intended direction is a task-weighted shadow model with effective coverage,
					automation-pressure, augmentation-upside, and concentration-aware net risk. Those
					candidate formulas are published as governance scaffolding, not live scoring rules.
				{/if}
			</p>
			<div class="mt-3 space-y-2 rounded-lg border border-border/60 bg-background/70 px-3 py-3">
				<p class="font-mono text-xs text-muted-foreground">
					effective_coverage = {experimentalMethodology.candidate_formulas.effective_coverage}
				</p>
				<p class="font-mono text-xs text-muted-foreground">
					net_risk = {experimentalMethodology.candidate_formulas.net_risk}
				</p>
			</div>
		</div>
		<div class={card({ padding: 'md' })}>
			<p class="text-sm font-semibold text-foreground">
				{isPromoted ? 'What Must Happen Next' : 'What Must Happen Next'}
			</p>
			<ul class="mt-3 space-y-2 text-sm text-muted-foreground">
				{#if isPromoted}
					<li>
						Keep the full V4.2 vs V4.3 comparison published so the promotion remains auditable.
					</li>
					<li>
						Start V5 as sidecar workstreams: augmentation heterogeneity, empirical mobility,
						posterior uncertainty, and realized-risk forecasting.
					</li>
					<li>
						Do not absorb multiple new constructs into the live score without separate sidecar
						validation first.
					</li>
					<li>
						Treat the current empirical mobility prior as supporting evidence until a
						higher-granularity Singapore transition dataset exists.
					</li>
				{:else}
					<li>Review the published shadow artifact against the current validation misses.</li>
					<li>
						Review anchor occupations and document any surprising label flips before promotion.
					</li>
					<li>
						Keep the current score published until the shadow model matches or improves current
						validation.
					</li>
					<li>
						Treat the empirical mobility prior as supporting evidence until a higher-granularity
						Singapore transition dataset exists.
					</li>
				{/if}
			</ul>
		</div>
	</div>
</main>
