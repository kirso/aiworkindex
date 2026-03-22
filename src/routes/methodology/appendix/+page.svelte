<script lang="ts">
	import { pageLayout, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
</script>

<Seo
	title={`Implementation Appendix — ${DATA_VINTAGE.model_version} Scoring Rules`}
	description={`Complete implementation reference for the ${DATA_VINTAGE.model_version} scoring pipeline: risk bands, impact classification, seniority modifiers, confidence, market modifier, stability, synthetic role rules, and separate support layers.`}
	path="/methodology/appendix"
/>

<main class={pageLayout({ width: 'content' })}>
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
		Complete {DATA_VINTAGE.model_version} implementation reference. All thresholds match
		<code class="rounded bg-muted px-1 text-xs">score.ts</code>,
		<code class="rounded bg-muted px-1 text-xs">synthetic-roles.ts</code>, and
		<code class="rounded bg-muted px-1 text-xs">validate.ts</code>. This appendix documents the
		current implementation, including heuristic components that should not be read as causal proof.
	</p>

	<!-- Core Formula -->
	<section class="mt-8 mb-8">
		<p class={sectionLabel()}>Core Formula</p>
		<div class="mt-3 space-y-2">
			<p class="rounded-md bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
				net_risk = exposure × (1 − bottleneck) × market_modifier
			</p>
			<p class="text-xs text-muted-foreground">
				Where exposure and bottleneck are percentile-ranked (0–1) across all {DATA_VINTAGE.occupation_count}
				occupations.
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
						<th class="py-2 pr-3 font-medium text-text-secondary">Band</th>
						<th class="py-2 pr-3 font-medium text-text-secondary">Threshold</th>
						<th class="py-2 font-medium text-text-secondary">Meaning</th>
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
			Based on a pure displacement (net_risk) × augmentation 2×2 matrix. SOL / Jobs in Demand now
			enter only through market resilience, not as a separate label override.
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-text-secondary">Type</th>
						<th class="py-2 pr-3 font-medium text-text-secondary">Rule</th>
						<th class="py-2 font-medium text-text-secondary">Description</th>
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
								>net_risk &ge; 0.25 AND augmentation &lt; 0.12</code
							>
						</td>
						<td class="py-2">High displacement, low augmentation</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">mixed</td>
						<td class="py-2 pr-3">
							<code class="rounded bg-muted px-1 text-xs"
								>net_risk &ge; 0.25 AND augmentation &ge; 0.12</code
							>
						</td>
						<td class="py-2">High displacement but still meaningfully augmentation-shaped</td>
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
		<p class="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
			augmentation = exposure × bottleneck × market_resilience
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			The same published <code class="rounded bg-muted px-1 text-xs">market_resilience</code> field is
			used in both the augmentation formula and the market modifier. Demand bonuses are applied inside
			that field before it is capped to the 0–1 range.
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-text-secondary">Band</th>
						<th class="py-2 font-medium text-text-secondary">Threshold</th>
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
			<p class="rounded-md bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
				market_resilience = 0.6 × market_momentum + 0.4 × occupation_scarcity
			</p>
			<p class="rounded-md bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
				market_modifier = 1 − 0.35 × market_resilience
			</p>
		</div>
		<p class="mt-2 text-sm text-muted-foreground">
			When occupation-level industry footprint data exists, the employment side of
			<code class="rounded bg-muted px-1 text-xs">market_momentum</code> is blended toward that occupation-specific
			industry growth signal instead of relying only on the major-group prior.
		</p>
		<p class={cn(caption({ weight: 'medium' }), 'mt-3')}>Singapore demand signal bonuses:</p>
		<div class="mt-2 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-text-secondary">Source</th>
						<th class="py-2 pr-3 font-medium text-text-secondary">Match</th>
						<th class="py-2 font-medium text-text-secondary">Bonus</th>
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
		<p class="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
			confidence = weighted_sum(crosswalk, market, freshness, coverage, agreement, sensitivity) −
			penalties
		</p>
		<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
			<li>Weights: crosswalk 0.25, market granularity 0.15, source freshness 0.10</li>
			<li>Weights: source coverage 0.20, signal agreement 0.15, sensitivity 0.15</li>
			<li>
				Penalties: one-source direct = 0.05, one-source sub-major fallback = 0.08, one-source major
				fallback = 0.12, contested signal = 0.04
			</li>
		</ul>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-text-secondary">Level</th>
						<th class="py-2 font-medium text-text-secondary">Score</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">high</td>
						<td class="py-2 font-mono">&ge; 0.7</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">medium</td>
						<td class="py-2 font-mono">0.45 – 0.7</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">low</td>
						<td class="py-2 font-mono">&lt; 0.45</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Stability -->
	<section class="mb-8">
		<p class={sectionLabel()}>Stability Stress Test</p>
		<p class="mt-2 text-sm text-muted-foreground">
			{DATA_VINTAGE.model_version} uses a seeded 1,000-run Monte Carlo perturbation of exposure, bottleneck,
			and market resilience. The current implementation perturbs the three inputs independently but deterministically,
			so identical source data reproduces the same 10th/90th percentile optimistic and pessimistic bounds
			across builds.
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-text-secondary">Label</th>
						<th class="py-2 font-medium text-text-secondary">Condition</th>
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
		<p class={sectionLabel()}>Seniority Modifiers ({DATA_VINTAGE.model_version})</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Applied in the Outlook engine. Adjustments scale with the occupation's variant_sensitivity
			(0–1), derived from institutional knowledge, relationship intensity, regulatory weight, and
			coordination requirements. The shifts are applied in latent percentile space, not as raw
			linear additions to already-ranked percentiles.
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-text-secondary">Level</th>
						<th class="py-2 pr-3 font-medium text-text-secondary">Exposure</th>
						<th class="py-2 font-medium text-text-secondary">Bottleneck</th>
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
			<li>Base score = weighted blend of 2–4 component SSOC occupation scores</li>
			<li>Workflow context adjustment is bounded to 0.85–1.15 around the blended prior</li>
			<li>All component SSOC codes validated against occupations.json at build time</li>
			<li>
				Confidence depends on component coverage, dispersion, primary-match distance, and workflow
				variant sensitivity
			</li>
			<li>
				Founder, gig, and independent-role families cannot publish <strong>High</strong> confidence
			</li>
			<li>
				High-dispersion roles (stddev &gt; 0.08) show risk range visualization, widened by variant
				sensitivity
			</li>
			<li>Low-dispersion roles (&lt; 3pp from primary) link to closest official occupation</li>
			<li>Always labeled "Estimated modern role" in the UI</li>
		</ul>
	</section>

	<!-- Validation -->
	<section class="mb-8">
		<p class={sectionLabel()}>Validation Checks ({DATA_VINTAGE.validation_checks} total)</p>
		<ul class="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
			<li>Record completeness ({DATA_VINTAGE.occupation_count} occupations, all fields present)</li>
			<li>Crosswalk coverage and evidence signals</li>
			<li>Distribution sanity (band counts, impact type ratios)</li>
			<li>Anchor occupation directional checks (5 occupations)</li>
			<li>Confidence coverage, source-weight, and contested-signal checks</li>
			<li>Labour monitor data integrity</li>
			<li>Synthetic role SSOC validity (all components must exist)</li>
			<li>Synthetic role workflow and confidence sanity checks</li>
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
