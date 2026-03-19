<script lang="ts">
	import { pageLayout, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
</script>

<Seo
	title="Implementation Appendix"
	description="Complete implementation reference for the V4.0 scoring pipeline: risk bands, impact classification, seniority modifiers, confidence, market modifier, stability, and synthetic role rules."
	path="/methodology/appendix"
/>

<main class={pageLayout({ width: 'prose' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Methodology', href: '/methodology' },
			{ label: 'Appendix' }
		]}
	/>

	<h1 class="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
		Implementation Appendix
	</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Complete V4.0 implementation reference. All thresholds match
		<code class="rounded bg-muted px-1 text-xs">score.ts</code>,
		<code class="rounded bg-muted px-1 text-xs">synthetic-roles.ts</code>, and
		<code class="rounded bg-muted px-1 text-xs">validate.ts</code>.
	</p>

	<!-- Core Formula -->
	<section class="mt-8 mb-8">
		<p class={sectionLabel()}>Core Formula</p>
		<div class="mt-3 space-y-2">
			<p class="rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
				net_risk = exposure × (1 − bottleneck) × market_modifier
			</p>
			<p class="text-xs text-muted-foreground">
				Where exposure and bottleneck are percentile-ranked (0–1) across all 562 occupations.
			</p>
		</div>
	</section>

	<!-- Risk Band Boundaries -->
	<section class="mb-8">
		<p class={sectionLabel()}>Risk Band Boundaries</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Band</th>
						<th class="py-2 pr-3 font-medium text-foreground/80">Threshold</th>
						<th class="py-2 font-medium text-foreground/80">Meaning</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">very_low</td>
						<td class="py-2 pr-3 font-mono">&lt; 0.05</td>
						<td class="py-2">Negligible displacement pressure</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">low</td>
						<td class="py-2 pr-3 font-mono">0.05 – 0.15</td>
						<td class="py-2">Limited pressure; AI likely augments</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">moderate</td>
						<td class="py-2 pr-3 font-mono">0.15 – 0.30</td>
						<td class="py-2">Mixed; bottlenecks or market provide buffer</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">high</td>
						<td class="py-2 pr-3 font-mono">0.30 – 0.50</td>
						<td class="py-2">Significant pressure; weaker buffers</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">very_high</td>
						<td class="py-2 pr-3 font-mono">&ge; 0.50</td>
						<td class="py-2">Strong pressure across multiple signals</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Impact Type Classification -->
	<section class="mb-8">
		<p class={sectionLabel()}>Impact Type Classification</p>
		<p class="mt-2 text-xs text-muted-foreground">
			Based on displacement (net_risk) × augmentation 2×2 matrix. Demand signal override: high
			displacement + SOL/JiD match → mixed (not at_risk).
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Type</th>
						<th class="py-2 pr-3 font-medium text-foreground/80">Rule</th>
						<th class="py-2 font-medium text-foreground/80">Description</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">ai_leveraged</td>
						<td class="py-2 pr-3">
							<code class="rounded bg-muted px-1 text-xs"
								>net_risk &lt; 0.25 AND augmentation &ge; 0.12</code
							>
						</td>
						<td class="py-2">Low displacement with meaningful augmentation potential</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">at_risk</td>
						<td class="py-2 pr-3">
							<code class="rounded bg-muted px-1 text-xs"
								>net_risk &ge; 0.25 AND augmentation &lt; 0.12 AND no demand signal</code
							>
						</td>
						<td class="py-2">High displacement, low augmentation, no market buffer</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">mixed</td>
						<td class="py-2 pr-3">
							<code class="rounded bg-muted px-1 text-xs"
								>net_risk &ge; 0.25 AND (augmentation &ge; 0.12 OR demand signal)</code
							>
						</td>
						<td class="py-2">High displacement but offset by augmentation or demand</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">stable</td>
						<td class="py-2 pr-3">
							<code class="rounded bg-muted px-1 text-xs"
								>net_risk &lt; 0.25 AND augmentation &lt; 0.12</code
							>
						</td>
						<td class="py-2">Low displacement, low augmentation — minimal AI impact</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Augmentation -->
	<section class="mb-8">
		<p class={sectionLabel()}>Augmentation Score</p>
		<p class="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
			augmentation = exposure × bottleneck × (1 + market_resilience × 0.3)
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Band</th>
						<th class="py-2 font-medium text-foreground/80">Threshold</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">very_high</td>
						<td class="py-2 font-mono">&ge; 0.8</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">high</td>
						<td class="py-2 font-mono">&ge; 0.6</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">moderate</td>
						<td class="py-2 font-mono">&ge; 0.4</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">low</td>
						<td class="py-2 font-mono">&ge; 0.2</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">very_low</td>
						<td class="py-2 font-mono">&lt; 0.2</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Market Modifier -->
	<section class="mb-8">
		<p class={sectionLabel()}>Market Modifier</p>
		<div class="mt-3 space-y-2">
			<p class="rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
				market_resilience = 0.6 × market_momentum + 0.4 × occupation_scarcity
			</p>
			<p class="rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
				market_modifier = 1 − 0.35 × market_resilience
			</p>
		</div>
		<p class={cn(caption({ weight: 'medium' }), 'mt-3')}>Singapore demand signal bonuses:</p>
		<div class="mt-2 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Source</th>
						<th class="py-2 pr-3 font-medium text-foreground/80">Match</th>
						<th class="py-2 font-medium text-foreground/80">Bonus</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3">SOL 2026</td>
						<td class="py-2 pr-3">exact</td>
						<td class="py-2 font-mono">+0.15</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3">SOL 2026</td>
						<td class="py-2 pr-3">prefix</td>
						<td class="py-2 font-mono">+0.08</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3">Jobs in Demand 2025</td>
						<td class="py-2 pr-3">exact</td>
						<td class="py-2 font-mono">+0.10</td>
					</tr>
					<tr>
						<td class="py-2 pr-3">Jobs in Demand 2025</td>
						<td class="py-2 pr-3">prefix</td>
						<td class="py-2 font-mono">+0.05</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Confidence -->
	<section class="mb-8">
		<p class={sectionLabel()}>Confidence Scoring</p>
		<p class="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
			confidence = mean(crosswalk_quality, market_data_granularity, source_freshness)
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Level</th>
						<th class="py-2 font-medium text-foreground/80">Score</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">high</td>
						<td class="py-2 font-mono">&ge; 0.7</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">medium</td>
						<td class="py-2 font-mono">0.4 – 0.7</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">low</td>
						<td class="py-2 font-mono">&lt; 0.4</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Stability -->
	<section class="mb-8">
		<p class={sectionLabel()}>Stability Stress Test</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Each layer is perturbed by ±5 percentile points. Net risk is recomputed for all combinations.
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Label</th>
						<th class="py-2 font-medium text-foreground/80">Condition</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">stable</td>
						<td class="py-2">Band unchanged under all perturbations</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">watch</td>
						<td class="py-2">±1 band shift</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">sensitive</td>
						<td class="py-2">±2+ band shifts</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Seniority Modifiers -->
	<section class="mb-8">
		<p class={sectionLabel()}>Seniority Modifiers (V3.2)</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Applied in the Outlook engine. Adjustments scale with the occupation's variant_sensitivity
			(0–1), derived from institutional knowledge, relationship intensity, regulatory weight, and
			coordination requirements.
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Level</th>
						<th class="py-2 pr-3 font-medium text-foreground/80">Exposure</th>
						<th class="py-2 font-medium text-foreground/80">Bottleneck</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">Entry-level</td>
						<td class="py-2 pr-3 font-mono">+0.14 × sensitivity</td>
						<td class="py-2 font-mono">−0.12 × sensitivity</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">Mid-career</td>
						<td class="py-2 pr-3 font-mono">0</td>
						<td class="py-2 font-mono">0</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">Senior / Lead</td>
						<td class="py-2 pr-3 font-mono">−0.10 × sensitivity</td>
						<td class="py-2 font-mono">+0.12 × sensitivity</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Synthetic Roles -->
	<section class="mb-8">
		<p class={sectionLabel()}>Synthetic Role Rules</p>
		<ul class="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
			<li>Scores = weighted average of 2–4 component SSOC occupation scores</li>
			<li>All component SSOC codes validated against occupations.json at build time</li>
			<li>Confidence capped at <strong>Medium</strong></li>
			<li>High-dispersion roles (stddev &gt; 0.08) show risk range visualization</li>
			<li>Low-dispersion roles (&lt; 3pp from primary) link to closest official occupation</li>
			<li>Always labeled "Estimated modern role" in the UI</li>
		</ul>
	</section>

	<!-- Validation -->
	<section class="mb-8">
		<p class={sectionLabel()}>Validation Checks (49 total)</p>
		<ul class="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
			<li>Record completeness (562 occupations, all fields present)</li>
			<li>Crosswalk coverage and evidence signals</li>
			<li>Distribution sanity (band counts, impact type ratios)</li>
			<li>Anchor occupation directional checks (5 occupations)</li>
			<li>Labour monitor data integrity</li>
			<li>Synthetic role SSOC validity (all components must exist)</li>
			<li>Alias SSOC validity (all references must exist)</li>
			<li>Archetype classification coverage (no professional/manager gets field_manual)</li>
			<li>Workflow overlay completeness (17 archetypes)</li>
			<li>Transition capacity sanity checks</li>
		</ul>
	</section>

	<div class="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
		<a href="/methodology" class="hover:text-foreground">&larr; Back to Methodology</a>
	</div>
</main>
