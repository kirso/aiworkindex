<script lang="ts">
	import { experimentalStatusLabel } from '$lib/data/experimental-status-display';
	import experimentalMethodology from '$lib/data/experimental-methodology-v43.json';
	import releaseManifest from '$lib/data/release-manifest.json';
	import { releases, siteStatus } from '$lib/data/site-status';
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

	type ScopeCard = {
		label: string;
		description: string;
		href?: string;
	};

	type ExperimentalBlocker = {
		key: string;
		note: string;
	};

	const scopeCards: ScopeCard[] = [
		{
			label: 'Changelog',
			description: 'What changed, when it changed, and where to inspect the release.'
		},
		{
			label: 'Methodology',
			description: 'Why the score works this way and the canonical structural formulas.',
			href: '/methodology'
		},
		{
			label: 'Appendix',
			description: 'Thresholds, implementation rules, and heuristic overlays.',
			href: '/methodology/appendix'
		},
		{
			label: 'Data',
			description: 'Schema, downloads, manifest checksums, and raw-input health.',
			href: '/data'
		},
		{
			label: 'Reports',
			description: 'Narrative analysis and release impact notes.',
			href: '/reports'
		}
	];

	const defaultReleaseMeta = {
		label: 'Report',
		className: 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
	};

	const releaseTypeMeta: Record<string, { label: string; className: string }> = {
		structural_release: {
			label: 'Structural',
			className: 'bg-primary/10 text-primary border-primary/30'
		},
		experimental_update: {
			label: 'Shadow',
			className: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border'
		},
		report_refresh: defaultReleaseMeta,
		official_update: {
			label: 'Official update',
			className: 'bg-risk-high-subtle text-risk-high border-risk-high-border'
		}
	};

	const blockers = (experimentalMethodology.blockers ?? []) as ExperimentalBlocker[];
	const experimentalStatusBadgeClass =
		siteStatus.experimental_release.status === 'ready_for_shadow_scoring'
			? 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border'
			: siteStatus.experimental_release.status === 'blocked'
				? 'bg-risk-high-subtle text-risk-high border-risk-high-border'
				: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border';

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('en-SG', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			timeZone: 'Asia/Singapore'
		}).format(new Date(value));
	}

	function getReleaseMeta(type: string): { label: string; className: string } {
		return releaseTypeMeta[type] ?? defaultReleaseMeta;
	}
</script>

<Seo
	title="Changelog & Release Notes"
	description="Canonical change log for structural releases, shadow-model updates, report refreshes, and official labour-monitor updates."
	path="/changelog"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Changelog' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Changelog</h1>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">Scope</p>
		<p class="mt-1 text-sm text-muted-foreground">
			This page is the release ledger. It records what changed and where to inspect it. It does not
			restate formulas, thresholds, or dataset fields already documented elsewhere.
		</p>
	</div>

	<div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
		{#each scopeCards as item}
			<div class={card({ padding: 'sm', variant: 'flat' })}>
				<p class={microLabel()}>{item.label}</p>
				<p class="mt-1 text-sm text-muted-foreground">{item.description}</p>
				{#if item.href}
					<a href={item.href} class="mt-2 inline-block text-xs text-primary hover:underline">
						Open →
					</a>
				{/if}
			</div>
		{/each}
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Current State</p>
	<div class="grid gap-3 md:grid-cols-3">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Structural release</p>
			<p class="mt-1 text-lg font-bold text-foreground">{siteStatus.structural_release.version}</p>
			<p class="text-xs text-muted-foreground">
				dataset generated {siteStatus.structural_release.score_dataset_generated_at}
			</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Shadow model</p>
			<p class="mt-1 text-sm font-semibold text-foreground">
				{siteStatus.experimental_release.label}
			</p>
			<p class="text-xs text-muted-foreground">{siteStatus.experimental_release.summary}</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class={microLabel()}>Release manifest</p>
			<p class="mt-1 text-sm font-semibold text-foreground">{releaseManifest.version}</p>
			<p class="text-xs text-muted-foreground">
				{releaseManifest.artifacts.length} published artifacts in the current ledger
			</p>
		</div>
	</div>

	<div class={cn(card({ padding: 'md' }), 'mt-6')}>
		<div class="flex items-start justify-between gap-4">
			<div>
				<p class="text-sm font-semibold text-foreground">Shadow status</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{experimentalMethodology.shadow_readiness.summary} Release-readiness inputs are shown here so
					status is auditable instead of implied.
				</p>
			</div>
			<Badge variant="outline" class={experimentalStatusBadgeClass}>
				{experimentalStatusLabel(siteStatus.experimental_release.status)}
			</Badge>
		</div>
		{#if blockers.length > 0}
			<div class="mt-4 grid gap-3 sm:grid-cols-2">
				{#each blockers as blocker (blocker.key)}
					<div class="rounded-lg border border-border/60 bg-background/70 px-3 py-3">
						<p class="text-sm font-medium text-foreground">{blocker.key.replaceAll('_', ' ')}</p>
						<p class="mt-1 text-xs text-muted-foreground">{blocker.note}</p>
					</div>
				{/each}
			</div>
		{:else}
			<div
				class="mt-4 rounded-lg border border-impact-leveraged-border bg-impact-leveraged-subtle px-3 py-3"
			>
				<p class="text-sm font-medium text-impact-leveraged">No local input blockers remain</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Shadow scoring is ready at the input layer. Remaining gates are validation and anchor
					review, not missing files.
				</p>
			</div>
		{/if}
	</div>

	<p class={cn(sectionLabel(), 'mt-8 mb-3')}>Release Ledger</p>
	<div class="space-y-4">
		{#each releases as release (release.id)}
			<div class={card({ padding: 'lg' })}>
				<div class="flex items-start justify-between gap-4">
					<div>
						<div class="flex flex-wrap items-center gap-2">
							<p class="text-base font-semibold text-foreground">{release.label}</p>
							<Badge variant="outline" class={getReleaseMeta(release.type).className}
								>{getReleaseMeta(release.type).label}</Badge
							>
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							Published {formatDate(release.published_at)} · score {release.score_version} · monitor
							{release.monitor_vintage}
						</p>
					</div>
					<a
						href={release.href}
						class="text-xs text-primary hover:underline"
						target={release.href.startsWith('http') ? '_blank' : undefined}
						rel={release.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					>
						Open →
					</a>
				</div>
				<ul class="mt-3 space-y-1 text-sm text-muted-foreground">
					{#each release.notes as note}
						<li>{note}</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>

	<div class={cn(card({ padding: 'md' }), 'mt-8')}>
		<p class="text-sm font-semibold text-foreground">Use This With</p>
		<div class="mt-3 grid gap-3 md:grid-cols-3">
			<a
				href="/reports/v4-3-shadow"
				class="rounded-lg border border-border/60 bg-background/70 px-3 py-3 no-underline transition-colors hover:border-primary/30 hover:bg-accent/40"
			>
				<p class="text-sm font-medium text-foreground">V4.3 shadow note</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Release-impact narrative for the task-weighted shadow model and what users should infer
					today.
				</p>
			</a>
			<a
				href="/data"
				class="rounded-lg border border-border/60 bg-background/70 px-3 py-3 no-underline transition-colors hover:border-primary/30 hover:bg-accent/40"
			>
				<p class="text-sm font-medium text-foreground">Data page</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Schema, downloads, manifest checksums, and raw-input audit.
				</p>
			</a>
			<a
				href="/methodology"
				class="rounded-lg border border-border/60 bg-background/70 px-3 py-3 no-underline transition-colors hover:border-primary/30 hover:bg-accent/40"
			>
				<p class="text-sm font-medium text-foreground">Methodology</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Canonical explanation of the structural model and its validation boundaries.
				</p>
			</a>
		</div>
	</div>
</main>
