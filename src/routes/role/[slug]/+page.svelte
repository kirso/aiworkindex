<script lang="ts">
	import {
		riskBandLabels,
		riskBandColors,
		impactTypeLabels,
		impactTypeColors,
		augmentationBandLabels
	} from '$lib/data';
	import { title as titleStyle, card, riskBadge, impactBadge, confidenceBadge, confidenceColor } from '$lib/design-system';
	import { cn } from '$lib/utils';

	let { data } = $props();
	let scored = $derived(data.scored);

	// Summary card color based on impact type
	let summaryCardStyle = $derived.by(() => {
		switch (scored.impact_type) {
			case 'ai_leveraged':
				return { bg: 'bg-emerald-50/60', border: 'border-emerald-200' };
			case 'at_risk':
				return { bg: 'bg-rose-50/60', border: 'border-rose-200' };
			case 'stable':
				return { bg: 'bg-secondary', border: 'border-border' };
			case 'mixed':
				return { bg: 'bg-amber-50/60', border: 'border-amber-200' };
			default:
				return { bg: 'bg-secondary', border: 'border-border' };
		}
	});

	let meaningHeadingColor = $derived.by(() => {
		switch (scored.risk_band) {
			case 'very_low':
			case 'low':
				return 'text-emerald-700';
			case 'moderate':
				return 'text-amber-700';
			case 'high':
			case 'very_high':
				return 'text-rose-700';
			default:
				return 'text-foreground';
		}
	});

	// Helpers for plain-English summary
	function levelLabel(value: number): string {
		if (value > 0.66) return 'high';
		if (value >= 0.33) return 'moderate';
		return 'low';
	}

	function bottleneckInterpretation(bottleneck: number): string {
		if (bottleneck > 0.66) return 'judgment, creativity, and interpersonal skills';
		if (bottleneck >= 0.33) return 'specialized judgment and interpersonal skills';
		return 'routine task patterns with few unique human dependencies';
	}

	// Plain-English summary for the role
	let summaryText = $derived.by(() => {
		const title = scored.title;
		const exposureLevel = levelLabel(scored.exposure);
		const bottleneckDesc = bottleneckInterpretation(scored.bottleneck);

		switch (scored.impact_type) {
			case 'ai_leveraged':
				return `AI is likely to enhance productivity in this role rather than replace it. ${title} has ${exposureLevel} AI exposure, but strong human bottlenecks \u2014 like ${bottleneckDesc} \u2014 mean AI augments rather than substitutes.`;
			case 'at_risk':
				return `This role faces significant AI displacement pressure. ${title} has ${exposureLevel} exposure to AI capabilities with relatively few human bottlenecks to slow adoption. Workers in this field should consider developing skills that AI cannot easily replicate.`;
			case 'stable':
				return `AI is unlikely to significantly disrupt this role in the near term. ${title} has ${exposureLevel} AI exposure, meaning current AI capabilities have limited overlap with the core tasks.`;
			case 'mixed':
				return `This role shows conflicting AI signals \u2014 high exposure but also strong human dependencies. ${title} could see both displacement of some tasks and augmentation of others. The net outcome depends on how organizations choose to adopt AI.`;
			default:
				return '';
		}
	});

	// Skills: derived from the highest-weight component's major group
	let skillRecommendations = $derived.by(() => {
		const skills: { label: string; description: string }[] = [];

		// Use overall scores to determine skills
		const bt = scored.bottleneck;
		const exp = scored.exposure;

		if (bt > 0.6) {
			skills.push({ label: 'Complex Problem Solving', description: 'Tackling ambiguous, multi-factor challenges that resist formulaic solutions' });
			skills.push({ label: 'Interpersonal Communication', description: 'Persuading, negotiating, and building trust across diverse stakeholders' });
		}
		if (bt > 0.4) {
			skills.push({ label: 'Critical Thinking', description: 'Evaluating information quality and making sound judgments under uncertainty' });
		}

		// Tag-specific skills
		if (scored.tags.includes('tech') || scored.tags.includes('engineering')) {
			skills.push({ label: 'System Design', description: 'Architecting scalable, maintainable systems and understanding trade-offs' });
		}
		if (scored.tags.includes('management')) {
			skills.push({ label: 'Strategic Leadership', description: 'Setting direction, managing change, and aligning teams with organizational goals' });
		}
		if (scored.tags.includes('sales') || scored.tags.includes('customer')) {
			skills.push({ label: 'Relationship Building', description: 'Developing long-term trust and rapport with clients and partners' });
		}
		if (scored.tags.includes('hr') || scored.tags.includes('talent')) {
			skills.push({ label: 'People Development', description: 'Coaching, mentoring, and unlocking potential in individuals and teams' });
		}
		if (scored.tags.includes('design') || scored.tags.includes('ux')) {
			skills.push({ label: 'Design Thinking', description: 'Empathizing with users and iterating on solutions through prototyping and testing' });
		}
		if (scored.tags.includes('data')) {
			skills.push({ label: 'Data Modeling', description: 'Designing efficient data structures and pipelines for scale and reliability' });
		}

		if (exp > 0.5) {
			skills.push({ label: 'AI Literacy', description: 'Understanding AI capabilities and limitations to work alongside AI tools effectively' });
		}

		// Deduplicate by label and limit to 4
		const seen = new Set<string>();
		return skills.filter((s) => {
			if (seen.has(s.label)) return false;
			seen.add(s.label);
			return true;
		}).slice(0, 4);
	});

	// Highest-weight component for primary occupation reference
	let primaryComponent = $derived.by(() => {
		const sorted = [...scored.components].sort((a, b) => b.weight - a.weight);
		return sorted[0] ?? null;
	});
</script>

<svelte:head>
	<title>{scored.title} — AI Risk Estimate | SG AI Occupation Index</title>
	<meta
		name="description"
		content="{scored.title}: Estimated AI displacement risk {(scored.net_risk * 100).toFixed(0)}%, rated {riskBandLabels[scored.risk_band]}. A modern role estimate based on related official occupations."
	/>
	<meta property="og:title" content="{scored.title} — AI Risk Estimate | SG AI Occupation Index" />
	<meta property="og:description" content="Estimated risk: {(scored.net_risk * 100).toFixed(0)}% ({riskBandLabels[scored.risk_band]}). Modern role estimate based on {scored.components.length} official SSOC occupations." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/role/{scored.slug}" />
</svelte:head>

<main class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
	<!-- Breadcrumb -->
	<nav class="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
		<a href="/" class="hover:text-foreground/80">Home</a>
		<span class="mx-1">/</span>
		<span class="text-foreground">{scored.title}</span>
	</nav>

	<!-- Synthetic role banner -->
	<div class="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
		<p class="text-sm text-amber-800">
			<span class="font-semibold">Estimated modern role</span> &mdash;
			This is not an official Singapore occupation. Scores are computed as a weighted blend of {scored.components.length} related official occupations.
		</p>
	</div>

	<!-- 1. Hero Header -->
	<div class="mb-4">
		<div>
			<h1 class={titleStyle({ size: 'page' })}>{scored.title}</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{scored.description}
			</p>
			<div class="mt-3 flex flex-wrap items-center gap-2">
				<span class={riskBadge({ band: scored.risk_band })}>
					{riskBandLabels[scored.risk_band]} Risk
				</span>
				<span class={impactBadge({ type: scored.impact_type })}>
					{impactTypeLabels[scored.impact_type]}
				</span>
				<span class={confidenceBadge({ level: 'medium' })}>
					Medium Confidence
				</span>
			</div>
		</div>
	</div>

	<!-- 2. What This Means For You -->
	<section class="mb-4 rounded-xl border-2 {summaryCardStyle.border} {summaryCardStyle.bg} p-6">
		<h2 class="mb-3 text-base font-bold {meaningHeadingColor}">What This Means For You</h2>
		<p class="text-base leading-relaxed text-foreground/80">{summaryText}</p>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			This estimate blends {scored.components.length} official Singapore occupations. Actual outcomes depend on your specific employer, industry, and task mix. Confidence is capped at Medium for all synthetic roles.
		</p>
	</section>

	<!-- 3. Built From — Component Occupations -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-3')}>Built From</h2>
		<p class="mb-4 text-sm text-muted-foreground">
			This role's scores are a weighted average of these official SSOC occupations:
		</p>
		<div class="space-y-3">
			{#each scored.components as comp}
				<div class="flex items-center gap-3 rounded-lg border border-border/50 bg-muted p-3">
					<!-- Weight bar -->
					<div class="w-16 shrink-0">
						<div class="h-2 w-full overflow-hidden rounded-full bg-border">
							<div
								class="h-full rounded-full bg-blue-500"
								style="width: {comp.weight * 100}%;"
							></div>
						</div>
						<p class="mt-1 text-center text-xs font-semibold tabular-nums text-muted-foreground">
							{(comp.weight * 100).toFixed(0)}%
						</p>
					</div>
					<!-- Occupation details -->
					<div class="min-w-0 flex-1">
						{#if comp.occupation}
							<a
								href="/occupation/{comp.ssoc}"
								class="text-sm font-medium text-foreground hover:text-blue-600 hover:underline"
							>
								{comp.occupation.title}
							</a>
							<p class="mt-0.5 text-xs text-muted-foreground">
								SSOC {comp.ssoc} &middot; Risk: {(comp.occupation.net_risk * 100).toFixed(0)}%
								<span class={cn(riskBadge({ band: comp.occupation.risk_band }), 'ml-1')}>
									{riskBandLabels[comp.occupation.risk_band]}
								</span>
							</p>
						{:else}
							<p class="text-sm font-medium text-muted-foreground">
								SSOC {comp.ssoc} — not found in dataset
							</p>
						{/if}
						<p class="mt-0.5 text-xs italic text-muted-foreground/70">{comp.rationale}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- 4. Score Breakdown -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-3')}>Score Breakdown</h2>
		<div class="space-y-3">
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-muted-foreground">AI Task Overlap <span class="text-xs">(Exposure)</span></span>
					<span class="font-medium tabular-nums text-foreground">{(scored.exposure * 100).toFixed(0)}%</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-red-400"
						style="width: {Math.min(scored.exposure * 100, 100)}%;"
					></div>
				</div>
			</div>
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Human Advantage <span class="text-xs">(Bottleneck)</span></span>
					<span class="font-medium tabular-nums text-foreground">{(scored.bottleneck * 100).toFixed(0)}%</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-green-400"
						style="width: {Math.min(scored.bottleneck * 100, 100)}%;"
					></div>
				</div>
			</div>
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Singapore Demand Buffer <span class="text-xs">(Market Resilience)</span></span>
					<span class="font-medium tabular-nums text-foreground">{(scored.market_resilience * 100).toFixed(0)}%</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-blue-400"
						style="width: {Math.min(scored.market_resilience * 100, 100)}%;"
					></div>
				</div>
			</div>
			<div class="border-t border-border/50 pt-3">
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="font-medium text-foreground">AI Risk Score <span class="text-xs">(Net Risk)</span></span>
					<span class="text-base font-bold tabular-nums text-foreground">{(scored.net_risk * 100).toFixed(0)}%</span>
				</div>
				<div class="h-3 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full"
						style="width: {Math.min(scored.net_risk * 100, 100)}%; background-color: {riskBandColors[scored.risk_band]};"
					></div>
				</div>
			</div>
			<div class="border-t border-border/50 pt-3">
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="font-medium text-primary">Augmentation Potential</span>
					<span class="text-xs font-medium text-primary">{augmentationBandLabels[scored.augmentation_band]}</span>
				</div>
				<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-primary"
						style="width: {Math.min(scored.augmentation * 100, 100)}%;"
					></div>
				</div>
				<div class="mt-0.5 text-right text-xs tabular-nums text-primary">{(scored.augmentation * 100).toFixed(0)}%</div>
			</div>
		</div>
		<p class="mt-3 text-xs text-muted-foreground">
			Formula: Exposure &times; (1 - Bottleneck) &times; (1 - 0.35 &times; Market Resilience).
			<a href="/methodology" class="underline hover:text-foreground/80">About this scoring</a>
		</p>
	</section>

	<!-- 5. Skills to Focus On -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-3')}>Skills to Focus On</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each skillRecommendations as skill}
				<div class="rounded-lg border border-border/50 bg-muted p-4">
					<p class="text-sm font-semibold text-foreground">{skill.label}</p>
					<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{skill.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- 6. Explore Component Occupations -->
	<section class={cn(card({ padding: 'md' }), 'mb-4')}>
		<h2 class={cn(titleStyle({ size: 'section' }), 'mb-3')}>Explore Component Occupations</h2>
		<p class="mb-3 text-sm text-muted-foreground">
			Each component has its own detailed page with wage data, labour market signals, and evidence trail.
		</p>
		<div class="grid gap-2 sm:grid-cols-2">
			{#each scored.components.filter(c => c.occupation) as comp}
				<a
					href="/occupation/{comp.ssoc}"
					class="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 transition-colors hover:bg-muted"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">{comp.occupation?.title}</p>
						<p class="text-xs text-muted-foreground">SSOC {comp.ssoc}</p>
					</div>
					<span
						class={cn(riskBadge({ band: comp.occupation?.risk_band ?? 'moderate' }), 'ml-2 shrink-0')}
					>
						{riskBandLabels[comp.occupation?.risk_band ?? 'moderate']}
					</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-border/50 pt-4 text-center text-xs text-muted-foreground">
		<p>
			Data: MOM Singapore | Felten AIOE | Pizzinelli/IMF | Anthropic | SOL 2026
		</p>
		<p class="mt-1">
			Confidence: Medium &mdash; Synthetic role estimate based on weighted blend of official occupations
		</p>
	</footer>
</main>
