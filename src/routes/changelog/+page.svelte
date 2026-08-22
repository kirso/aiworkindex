<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import releaseManifest from '$lib/data/release-manifest.json';
	import { releases, siteStatus } from '$lib/data/site-status';
	import { badge, card, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	type Release = (typeof releases)[number];
	type BadgeVariant = 'default' | 'outline' | 'success' | 'warning' | 'danger' | 'info';

	const currentRelease = releases.find(release => release.id === 'public-v9-2026-08-19');
	const v9Counts = siteStatus.structural_release.counts;
	const currentEvidenceUpdates = releases.filter(
		release => release.score_version === 'V9' && release.id !== 'public-v9-2026-08-19'
	);
	const historicalReleases = releases.filter(release => release.score_version !== 'V9');

	const releaseTypeMeta: Record<string, { label: string; variant: BadgeVariant }> = {
		structural_release: { label: 'Method release', variant: 'outline' },
		experimental_update: { label: 'Experiment', variant: 'warning' },
		report_refresh: { label: 'Report update', variant: 'info' },
		official_update: { label: 'Official data', variant: 'success' }
	};

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('en', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(value));
	}

	function releaseDateLabel(release: Release): string {
		if (release.display_date) return release.display_date;
		if (release.published_at) return formatDate(release.published_at);
		return 'Exact date not retained';
	}

	function releaseMeta(type: string): { label: string; variant: BadgeVariant } {
		return releaseTypeMeta[type] ?? { label: 'Release note', variant: 'info' };
	}
</script>

<Seo
	title="AI Work Index V9 Changelog and Release History"
	description="Current V9 release notes, Singapore labour-evidence updates and a dated archive of earlier AI Work Index methods and experiments."
	path="/changelog"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Changelog' }]} />

	<p class={sectionLabel()}>Release ledger</p>
	<h1 class={title({ size: 'page' })}>Changelog</h1>
	<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
		V9 is the current Singapore release. Earlier entries are retained as dated records of what the
		project published at the time. Their scores and formulas are not part of the V9 method and
		should not be joined into a time series.
	</p>

	<section class="mt-8 border border-foreground bg-card" aria-labelledby="current-release">
		<div class="border-b border-foreground p-5 sm:p-6">
			<div class="flex flex-wrap items-center gap-2">
				<span class={badge({ variant: 'success' })}>Current</span>
				<p class="font-mono text-xs text-muted-foreground">19 Aug 2026 · SSOC 2024</p>
			</div>
			<h2 id="current-release" class="mt-2 text-2xl font-black tracking-tight text-foreground">
				V9 Singapore AI Work Pressure
			</h2>
			<p class="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
				V9 moves the active occupation universe to SSOC 2024. The ILO 2025 mean task-exposure score
				is the sole owner of the headline pressure rank. Mapping uncertainty, official categories,
				wages and current market evidence are published separately.
			</p>
		</div>
		<div class="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{v9Counts.occupations.toLocaleString()}
				</p>
				<p class="text-xs text-muted-foreground">SSOC 2024 occupations</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">{v9Counts.scored.toLocaleString()}</p>
				<p class="text-xs text-muted-foreground">pressure ranks published</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">
					{v9Counts.insufficient_evidence.toLocaleString()}
				</p>
				<p class="text-xs text-muted-foreground">ranks withheld</p>
			</div>
			<div class="bg-card p-4">
				<p class="font-mono text-2xl font-black tabular-nums">{releaseManifest.artifacts.length}</p>
				<p class="text-xs text-muted-foreground">checksummed release artifacts</p>
			</div>
		</div>
		<div class="flex flex-wrap gap-x-5 gap-y-2 border-t border-border p-4 text-sm">
			<a class="font-medium text-primary hover:underline" href="/reports/v9-release"
				>Read the V9 release report</a
			>
			<a class="font-medium text-primary hover:underline" href="/methodology">Current methodology</a
			>
			<a class="font-medium text-primary hover:underline" href="/data">Downloads and manifest</a>
		</div>
	</section>

	{#if currentRelease}
		<section class="mt-8">
			<h2 class={sectionLabel()}>V9 release changes</h2>
			<ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
				{#each currentRelease.notes as note}
					<li>{note}</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="mt-10">
		<div class="border-b border-foreground pb-2">
			<p class={sectionLabel()}>Current evidence updates</p>
			<h2 class={title({ size: 'section' })}>Updates that do not recalculate the rank</h2>
		</div>
		<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
			Labour-market releases and report status are dated separately from the occupation score.
			{siteStatus.live_monitor.refresh_note}
		</p>
		<div class="mt-4 space-y-3">
			{#each currentEvidenceUpdates as release (release.id)}
				<article class={card({ padding: 'md' })}>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="text-sm font-bold text-foreground">{release.label}</h3>
								<span class={badge({ variant: releaseMeta(release.type).variant })}>
									{releaseMeta(release.type).label}
								</span>
							</div>
							<p class="mt-1 font-mono text-xs text-muted-foreground">
								{releaseDateLabel(release)} · {release.monitor_vintage}
							</p>
						</div>
						<a
							href={release.href}
							class="shrink-0 text-xs font-medium text-primary hover:underline"
							target={release.href.startsWith('http') ? '_blank' : undefined}
							rel={release.href.startsWith('http') ? 'noopener noreferrer' : undefined}
							>Open source or note</a
						>
					</div>
					<ul class="mt-3 space-y-1 text-sm leading-relaxed text-muted-foreground">
						{#each release.notes as note}
							<li>{note}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-10">
		<div class="border-b border-foreground pb-2">
			<p class={sectionLabel()}>Historical archive</p>
			<h2 class={title({ size: 'section' })}>Earlier methods and experiments</h2>
		</div>
		<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mt-4')}>
			<p class="text-sm font-bold text-foreground">Historical, not current</p>
			<p class="mt-1 text-sm leading-relaxed text-text-secondary">
				These entries document retired SSOC 2020 models, sidecars and experiments. Their labels and
				figures describe the release at its publication date. Use V9 for current Singapore
				occupation comparisons.
			</p>
		</div>

		<div class="mt-4 space-y-3">
			{#each historicalReleases as release (release.id)}
				<article class={card({ padding: 'md' })}>
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h3 class="text-sm font-bold text-foreground">{release.label}</h3>
								<span class={badge({ variant: 'outline' })}>Archive</span>
								<span class={badge({ variant: releaseMeta(release.type).variant })}>
									{releaseMeta(release.type).label}
								</span>
							</div>
							<p class="mt-1 font-mono text-xs text-muted-foreground">
								Published {releaseDateLabel(release)} · score {release.score_version}
							</p>
						</div>
						<a
							href={release.href}
							class="shrink-0 text-xs font-medium text-primary hover:underline"
							target={release.href.startsWith('http') ? '_blank' : undefined}
							rel={release.href.startsWith('http') ? 'noopener noreferrer' : undefined}
							>Open archive record</a
						>
					</div>
					<ul class="mt-3 space-y-1 text-sm leading-relaxed text-muted-foreground">
						{#each release.notes as note}
							<li>{note}</li>
						{/each}
					</ul>
				</article>
			{/each}
		</div>
	</section>
</main>
