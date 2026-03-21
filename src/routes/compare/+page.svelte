<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import {
		riskBandLabels,
		riskBandColors,
		impactTypeLabels,
		augmentationBandLabels,
		occupationsBySSoc
	} from '$lib/data';
	import type { Occupation } from '$lib/data';
	import { syntheticRoles } from '$lib/data/synthetic-roles';
	import { computeTransitionScore } from '$lib/data/transition-capacity';
	import {
		title as titleStyle,
		card,
		riskBadge,
		impactBadge,
		sectionLabel,
		display,
		caption
	} from '$lib/design-system';
	import { pageLayout } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	type CompareEntityRef = { kind: 'occupation'; id: string } | { kind: 'role'; id: string };

	/** Unified entity for display */
	interface CompareEntity {
		ref: CompareEntityRef;
		label: string;
		sublabel: string;
		href: string;
		net_risk: number;
		risk_band: string;
		exposure: number;
		bottleneck: number;
		market_resilience: number;
		augmentation: number;
		augmentation_band: string;
		impact_type: string;
		confidence: string;
		wage: number | null;
	}

	type SearchResult =
		| { type: 'occupation'; occupation: Occupation }
		| { type: 'role'; role: { slug: string; title: string } };

	let { data } = $props();

	// Parse entities from URL: /compare?entities=occupation:25121,role:product-manager
	// Also supports legacy: /compare?jobs=25121,41320
	let entities = $derived.by((): CompareEntity[] => {
		if (!browser) return [];

		const entitiesParam = $page.url.searchParams.get('entities');
		const legacyParam = $page.url.searchParams.get('jobs');

		const refs: CompareEntityRef[] = [];

		if (entitiesParam) {
			for (const part of entitiesParam
				.split(',')
				.map(s => s.trim())
				.filter(Boolean)) {
				const [kind, id] = part.split(':') as [string, string];
				if (kind === 'occupation' || kind === 'role') {
					refs.push({ kind, id });
				}
			}
		} else if (legacyParam) {
			for (const ssoc of legacyParam
				.split(',')
				.map(s => s.trim())
				.filter(Boolean)) {
				refs.push({ kind: 'occupation', id: ssoc });
			}
		}

		return refs.map(resolveEntity).filter((e): e is CompareEntity => e !== null);
	});

	function resolveEntity(ref: CompareEntityRef): CompareEntity | null {
		if (ref.kind === 'occupation') {
			const occ = occupationsBySSoc.get(ref.id);
			if (!occ) return null;
			return {
				ref,
				label: occ.title,
				sublabel: `SSOC ${occ.ssoc}`,
				href: `/occupation/${occ.ssoc}`,
				net_risk: occ.net_risk,
				risk_band: occ.risk_band,
				exposure: occ.exposure,
				bottleneck: occ.bottleneck,
				market_resilience: occ.market.market_resilience,
				augmentation: occ.augmentation,
				augmentation_band: occ.augmentation_band,
				impact_type: occ.impact_type,
				confidence: `${occ.confidence.level.charAt(0).toUpperCase() + occ.confidence.level.slice(1)} (${(occ.confidence.score * 100).toFixed(0)}%)`,
				wage: occ.gross_wage_median
			};
		} else {
			const scored = data.scoredRolesMap.get(ref.id);
			if (!scored) return null;
			return {
				ref,
				label: scored.title,
				sublabel: 'Estimated role',
				href: `/role/${scored.slug}`,
				net_risk: scored.net_risk,
				risk_band: scored.risk_band,
				exposure: scored.exposure,
				bottleneck: scored.bottleneck,
				market_resilience: scored.market_resilience,
				augmentation: scored.augmentation,
				augmentation_band: scored.augmentation_band,
				impact_type: scored.impact_type,
				confidence: `${scored.confidence.charAt(0).toUpperCase() + scored.confidence.slice(1)} (${(scored.confidence_score * 100).toFixed(0)}% estimated)`,
				wage: null
			};
		}
	}

	// Transition score between first two entities (if both are occupations)
	let journeyData = $derived.by(() => {
		if (entities.length < 2) return null;
		const from = entities[0]!;
		const to = entities[1]!;
		if (from.ref.kind !== 'occupation' || to.ref.kind !== 'occupation') return null;

		const fromOcc = occupationsBySSoc.get(from.ref.id);
		const toOcc = occupationsBySSoc.get(to.ref.id);
		if (!fromOcc || !toOcc) return null;

		const transition = computeTransitionScore(fromOcc, toOcc);
		const riskDelta = to.net_risk - from.net_risk;
		const wageDelta = (to.wage ?? 0) - (from.wage ?? 0);

		return { transition, riskDelta, wageDelta };
	});

	let searchQuery = $state('');
	let showSearch = $state(false);
	let copied = $state(false);

	let searchResults = $derived.by(() => {
		if (!searchQuery.trim() || searchQuery.trim().length < 2) return [] as SearchResult[];
		const q = searchQuery.trim().toLowerCase();
		const existingIds = new Set(entities.map(e => `${e.ref.kind}:${e.ref.id}`));

		const items: SearchResult[] = [];

		// Synthetic roles
		for (const role of syntheticRoles) {
			if (role.title.toLowerCase().includes(q) && !existingIds.has(`role:${role.slug}`)) {
				items.push({ type: 'role', role: { slug: role.slug, title: role.title } });
			}
			if (items.length >= 3) break;
		}

		// Occupations
		for (const occ of data.allOccupations) {
			if (occ.title.toLowerCase().includes(q) && !existingIds.has(`occupation:${occ.ssoc}`)) {
				items.push({ type: 'occupation', occupation: occ });
			}
			if (items.length >= 10) break;
		}

		return items.slice(0, 10);
	});

	function buildUrl(refs: CompareEntityRef[]): string {
		if (refs.length === 0) return '/compare';
		const param = refs.map(r => `${r.kind}:${r.id}`).join(',');
		return `/compare?entities=${param}`;
	}

	function addEntity(ref: CompareEntityRef) {
		if (entities.length >= 3) return;
		searchQuery = '';
		showSearch = false;
		goto(buildUrl([...entities.map(e => e.ref), ref]), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function removeEntity(ref: CompareEntityRef) {
		const remaining = entities.filter(e => !(e.ref.kind === ref.kind && e.ref.id === ref.id));
		goto(buildUrl(remaining.map(e => e.ref)), {
			replaceState: true,
			keepFocus: true,
			noScroll: true
		});
	}

	function shareUrl() {
		if (!browser) return;
		navigator.clipboard.writeText(window.location.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function pct(v: number): string {
		return (v * 100).toFixed(0) + '%';
	}

	function barColor(value: number, invert = false): string {
		const v = invert ? 1 - value : value;
		if (v > 0.66) return '#ef4444';
		if (v > 0.33) return '#f59e0b';
		return '#22c55e';
	}

	const metrics: { key: string; label: string; format: (e: CompareEntity) => string }[] = [
		{
			key: 'net_risk',
			label: 'Net Risk',
			format: e =>
				`${pct(e.net_risk)} ${riskBandLabels[e.risk_band as keyof typeof riskBandLabels]}`
		},
		{ key: 'exposure', label: 'Exposure', format: e => pct(e.exposure) },
		{ key: 'bottleneck', label: 'Human Bottleneck', format: e => pct(e.bottleneck) },
		{
			key: 'market_resilience',
			label: 'Market Resilience',
			format: e => e.market_resilience.toFixed(2)
		},
		{
			key: 'augmentation',
			label: 'Augmentation',
			format: e =>
				`${pct(e.augmentation)} ${augmentationBandLabels[e.augmentation_band as keyof typeof augmentationBandLabels]}`
		},
		{
			key: 'impact_type',
			label: 'Impact Type',
			format: e => impactTypeLabels[e.impact_type as keyof typeof impactTypeLabels]
		},
		{
			key: 'wage',
			label: 'Median Wage',
			format: e => (e.wage ? `SGD ${e.wage.toLocaleString()}` : 'N/A (synthetic)')
		},
		{ key: 'confidence', label: 'Confidence', format: e => e.confidence }
	];
</script>

<Seo
	title="Compare AI Risk Across Singapore Jobs"
	description="Compare AI displacement risk across Singapore occupations and modern roles side by side."
	path="/compare"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Compare' }]} />

	<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class={titleStyle({ size: 'page' })}>Compare</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Side-by-side comparison of occupations and modern roles (up to 3)
			</p>
		</div>
		{#if entities.length > 0}
			<Button variant="outline" size="sm" onclick={shareUrl}>
				{copied ? 'Copied!' : 'Share this comparison'}
			</Button>
		{/if}
	</div>

	<!-- Search to add entities -->
	{#if entities.length < 3}
		<div class="relative mb-6">
			<Input
				type="text"
				placeholder="Search occupations or modern roles to compare..."
				bind:value={searchQuery}
				onfocus={() => (showSearch = true)}
				onblur={() => setTimeout(() => (showSearch = false), 200)}
				class="max-w-md"
			/>
			{#if showSearch && searchResults.length > 0}
				<div
					class="absolute z-10 mt-1 w-full max-w-md rounded-md border border-border bg-card shadow-lg"
				>
					{#each searchResults as result}
						{#if result.type === 'role'}
							<button
								type="button"
								class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
								onmousedown={() => addEntity({ kind: 'role', id: result.role.slug })}
							>
								<span class="truncate text-text-secondary">{result.role.title}</span>
								<Badge
									variant="outline"
									class="ml-2 shrink-0 bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border"
								>
									Estimated Role
								</Badge>
							</button>
						{:else}
							<button
								type="button"
								class="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
								onmousedown={() => addEntity({ kind: 'occupation', id: result.occupation.ssoc })}
							>
								<span class="truncate text-text-secondary">{result.occupation.title}</span>
								<div class="ml-2 flex shrink-0 items-center gap-2">
									<span class={riskBadge({ band: result.occupation.risk_band })}>
										{riskBandLabels[result.occupation.risk_band]}
									</span>
									<span class="text-xs text-muted-foreground">SSOC {result.occupation.ssoc}</span>
								</div>
							</button>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if entities.length === 0}
		<div class={cn(card({ padding: 'lg' }))}>
			<p class="text-sm text-text-secondary leading-relaxed">
				Compare up to 3 occupations or roles side by side. See how their risk profiles, demand
				signals, and career paths differ — useful for exploring transitions or understanding where
				AI pressure varies across similar jobs.
			</p>

			<p class="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
				Popular comparisons
			</p>
			<div class="mt-2 grid gap-2 sm:grid-cols-2">
				{#each [{ label: 'Software Developer vs Data Entry Clerk', url: '/compare?entities=occupation:25121,occupation:41320', why: 'Same AI exposure, different outcomes' }, { label: 'Product Manager vs AI Product Manager', url: '/compare?entities=role:product-manager,role:ai-product-manager', why: 'Traditional vs AI-native variant' }, { label: 'Accountant vs Data Analyst', url: '/compare?entities=role:accountant,role:data-analyst', why: 'Both data-heavy, different risk profiles' }, { label: 'Frontend Engineer vs UX Designer', url: '/compare?entities=role:frontend-engineer,role:ux-designer', why: 'Tech vs design in the same product team' }] as comp}
					<a
						href={comp.url}
						class="rounded-md border border-border px-3 py-2.5 hover:bg-accent hover:border-primary/30 transition-colors block"
					>
						<p class="text-sm font-medium text-foreground">{comp.label}</p>
						<p class="text-xs text-muted-foreground">{comp.why}</p>
					</a>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Side-by-side columns (stack on mobile) -->
		<div
			class={cn(
				'mb-8 grid gap-4',
				entities.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
			)}
		>
			{#each entities as entity}
				<div class={card({ padding: 'sm' })}>
					<div class="mb-3 flex items-start justify-between">
						<div>
							<a href={entity.href} class="font-semibold text-foreground hover:text-primary">
								{entity.label}
							</a>
							<p class="text-xs text-muted-foreground">{entity.sublabel}</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							class="ml-2 h-7 w-7 shrink-0"
							onclick={() => removeEntity(entity.ref)}
							aria-label="Remove {entity.label}"
						>
							<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</Button>
					</div>

					<div class="mb-4 flex flex-wrap items-center gap-2">
						<span class={riskBadge({ band: entity.risk_band as any })}>
							{riskBandLabels[entity.risk_band as keyof typeof riskBandLabels]} Risk
						</span>
						<span class={impactBadge({ type: entity.impact_type as any })}>
							{impactTypeLabels[entity.impact_type as keyof typeof impactTypeLabels]}
						</span>
					</div>

					<div class="space-y-3">
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Net Risk</span>
								<span class="font-medium tabular-nums">{pct(entity.net_risk)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(
										entity.net_risk * 100,
										100
									)}%; background-color: {riskBandColors[
										entity.risk_band as keyof typeof riskBandColors
									]};"
								></div>
							</div>
						</div>
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Exposure</span>
								<span class="font-medium tabular-nums">{pct(entity.exposure)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(
										entity.exposure * 100,
										100
									)}%; background-color: {barColor(entity.exposure)};"
								></div>
							</div>
						</div>
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Human Bottleneck</span>
								<span class="font-medium tabular-nums">{pct(entity.bottleneck)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(
										entity.bottleneck * 100,
										100
									)}%; background-color: {barColor(entity.bottleneck, true)};"
								></div>
							</div>
						</div>
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Market Resilience</span>
								<span class="font-medium tabular-nums">{entity.market_resilience.toFixed(2)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full bg-impact-leveraged"
									style="width: {Math.min(entity.market_resilience * 100, 100)}%;"
								></div>
							</div>
						</div>
						<div>
							<div class="mb-1 flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Augmentation</span>
								<span class="font-medium tabular-nums">{pct(entity.augmentation)}</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full"
									style="width: {Math.min(
										entity.augmentation * 100,
										100
									)}%; background-color: var(--primary);"
								></div>
							</div>
						</div>
					</div>

					{#if entity.wage}
						<div class="mt-4 border-t border-border/50 pt-3">
							<div class="flex items-center justify-between text-xs">
								<span class="text-muted-foreground">Median Wage</span>
								<span class="font-semibold text-foreground">SGD {entity.wage.toLocaleString()}</span
								>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Journey: Current → Target (when exactly 2 occupation entities) -->
		{#if journeyData}
			<div class="mb-8">
				<p class={cn(sectionLabel(), 'mb-3')}>Career Transition</p>
				<div class={card({ padding: 'md' })}>
					<p class="text-sm font-semibold text-foreground mb-3">
						{entities[0]!.label} &rarr; {entities[1]!.label}
					</p>
					<div class="grid gap-4 sm:grid-cols-4">
						<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'text-center')}>
							<p class={caption()}>Transition Score</p>
							<p class={cn(display({ size: 'md' }), 'mt-1')}>
								{(journeyData.transition.composite * 100).toFixed(0)}%
							</p>
							<p
								class="mt-0.5 text-xs font-medium capitalize {journeyData.transition.label ===
								'easy'
									? 'text-risk-very-low'
									: journeyData.transition.label === 'moderate'
										? 'text-risk-moderate'
										: 'text-risk-very-high'}"
							>
								{journeyData.transition.label}
							</p>
						</div>
						<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'text-center')}>
							<p class={caption()}>Risk Delta</p>
							<p
								class={cn(
									display({ size: 'md' }),
									'mt-1',
									journeyData.riskDelta < 0
										? 'text-risk-very-low'
										: journeyData.riskDelta > 0
											? 'text-risk-very-high'
											: 'text-foreground'
								)}
							>
								{journeyData.riskDelta > 0 ? '+' : ''}{(journeyData.riskDelta * 100).toFixed(0)}pp
							</p>
						</div>
						<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'text-center')}>
							<p class={caption()}>Wage Delta</p>
							<p
								class={cn(
									display({ size: 'md' }),
									'mt-1',
									journeyData.wageDelta > 0
										? 'text-risk-very-low'
										: journeyData.wageDelta < 0
											? 'text-risk-very-high'
											: 'text-foreground'
								)}
							>
								{journeyData.wageDelta > 0 ? '+' : ''}SGD {journeyData.wageDelta.toLocaleString()}
							</p>
						</div>
						<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'text-center')}>
							<p class={caption()}>Skill Overlap</p>
							<p class={cn(display({ size: 'md' }), 'mt-1')}>
								{(journeyData.transition.skill_overlap * 100).toFixed(0)}%
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Comparison table -->
		<p class={cn(sectionLabel(), 'mb-3')}>Detailed Comparison</p>
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Metric</Table.Head>
						{#each entities as entity}
							<Table.Head>{entity.label}</Table.Head>
						{/each}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each metrics as metric (metric.key)}
						<Table.Row>
							<Table.Cell class="font-medium text-muted-foreground">{metric.label}</Table.Cell>
							{#each entities as entity}
								<Table.Cell class="tabular-nums">{metric.format(entity)}</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</main>
