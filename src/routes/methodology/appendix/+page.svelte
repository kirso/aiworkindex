<script lang="ts">
	import { title as titleStyle, pageLayout } from '$lib/design-system';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
</script>

<svelte:head>
	<title>Methodology Appendix — Singapore AI Occupation Impact Index</title>
	<meta
		name="description"
		content="Complete implementation reference for the scoring pipeline: risk band boundaries, impact type classification, augmentation bands, confidence scoring, market modifiers, and stability stress tests."
	/>
	<meta property="og:title" content="Methodology Appendix — Singapore AI Occupation Impact Index" />
	<meta
		property="og:description"
		content="Complete implementation reference for the scoring pipeline. All thresholds, formulas, and classification rules in one place."
	/>
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/methodology/appendix" />
</svelte:head>

<main class={pageLayout({ width: 'prose' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Methodology', href: '/methodology' },
			{ label: 'Appendix' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Methodology Appendix</h1>
	<p class="mt-2 text-muted-foreground">
		Complete implementation reference for the scoring pipeline.
	</p>

	<!-- Risk Band Boundaries -->
	<section class="mt-8">
		<h2 class={titleStyle({ size: 'section' })}>Risk Band Boundaries</h2>
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
						<td class="py-2 pr-3">&lt; 0.05</td>
						<td class="py-2">Negligible displacement pressure</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">low</td>
						<td class="py-2 pr-3">0.05 &ndash; 0.15</td>
						<td class="py-2">Limited pressure; AI likely augments</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">moderate</td>
						<td class="py-2 pr-3">0.15 &ndash; 0.25</td>
						<td class="py-2">Mixed; bottlenecks or market provide buffer</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">high</td>
						<td class="py-2 pr-3">0.25 &ndash; 0.35</td>
						<td class="py-2">Significant pressure; weaker bottlenecks and/or declining market</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">very_high</td>
						<td class="py-2 pr-3">&ge; 0.35</td>
						<td class="py-2">Strong pressure across multiple signals</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Impact Type Classification -->
	<section class="mt-8">
		<h2 class={titleStyle({ size: 'section' })}>Impact Type Classification</h2>
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
						<td class="py-2 pr-3"
							><code class="rounded bg-muted px-1 text-xs"
								>exposure &gt; 0.6 AND bottleneck &gt; 0.6</code
							></td
						>
						<td class="py-2">High exposure with strong human bottleneck</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">at_risk</td>
						<td class="py-2 pr-3"
							><code class="rounded bg-muted px-1 text-xs"
								>exposure &gt; 0.6 AND bottleneck &le; 0.6</code
							></td
						>
						<td class="py-2">High exposure with weak bottleneck</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">stable</td>
						<td class="py-2 pr-3"
							><code class="rounded bg-muted px-1 text-xs">exposure &le; 0.4</code></td
						>
						<td class="py-2">Low AI capability overlap</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">mixed</td>
						<td class="py-2 pr-3">remaining</td>
						<td class="py-2">Exposure 0.4&ndash;0.6, varying bottleneck</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Augmentation Bands -->
	<section class="mt-8">
		<h2 class={titleStyle({ size: 'section' })}>Augmentation Bands</h2>
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
						<td class="py-2">&ge; 0.8</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">high</td>
						<td class="py-2">&ge; 0.6</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">moderate</td>
						<td class="py-2">&ge; 0.4</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">low</td>
						<td class="py-2">&ge; 0.2</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">very_low</td>
						<td class="py-2">&lt; 0.2</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Confidence Scoring -->
	<section class="mt-8">
		<h2 class={titleStyle({ size: 'section' })}>Confidence Scoring</h2>
		<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
			confidence = mean(crosswalk_quality, market_data_granularity, source_freshness)
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Level</th>
						<th class="py-2 font-medium text-foreground/80">Score Range</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">high</td>
						<td class="py-2">&ge; 0.7</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">medium</td>
						<td class="py-2">0.4 &ndash; 0.7</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">low</td>
						<td class="py-2">&lt; 0.4</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Market Modifier -->
	<section class="mt-8">
		<h2 class={titleStyle({ size: 'section' })}>Market Modifier</h2>
		<div class="mt-2 space-y-2">
			<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
				market_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity
			</p>
			<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
				market_modifier = 1 - 0.35 &times; market_resilience
			</p>
		</div>
		<p class="mt-3 text-sm font-medium text-foreground/80">Singapore demand signal bonuses:</p>
		<div class="mt-2 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-border">
						<th class="py-2 pr-3 font-medium text-foreground/80">Source</th>
						<th class="py-2 pr-3 font-medium text-foreground/80">Match Type</th>
						<th class="py-2 font-medium text-foreground/80">Bonus</th>
					</tr>
				</thead>
				<tbody class="text-muted-foreground">
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">SOL</td>
						<td class="py-2 pr-3">exact</td>
						<td class="py-2">+15%</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">SOL</td>
						<td class="py-2 pr-3">prefix</td>
						<td class="py-2">+8%</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">Jobs in Demand</td>
						<td class="py-2 pr-3">exact</td>
						<td class="py-2">+10%</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">Jobs in Demand</td>
						<td class="py-2 pr-3">prefix</td>
						<td class="py-2">+5%</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Stability Stress Test -->
	<section class="mt-8">
		<h2 class={titleStyle({ size: 'section' })}>Stability Stress Test</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Each of the three core layers (exposure, bottleneck, market resilience) is perturbed by
			&plusmn;5 percentile points. The resulting net risk is recomputed for all perturbation
			combinations, and the band stability is assessed:
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
						<td class="py-2">Risk band unchanged under all perturbations</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">watch</td>
						<td class="py-2">&plusmn;1 band shift under perturbation</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">sensitive</td>
						<td class="py-2">&plusmn;2 or more band shifts under perturbation</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Synthetic Role Rules -->
	<section class="mt-8">
		<h2 class={titleStyle({ size: 'section' })}>Synthetic Role Rules</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Some modern roles (e.g., "AI Engineer", "Growth Hacker") do not map to a single SSOC
			occupation. These are modeled as synthetic roles:
		</p>
		<ul class="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
			<li>Scores are computed as a weighted average of component occupations</li>
			<li>
				Confidence is capped at <strong>Medium</strong>, reflecting the estimation uncertainty
			</li>
			<li>Always labeled <strong>"Estimated modern role"</strong> in the UI</li>
		</ul>
	</section>

	<div class="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
		<a href="/methodology" class="hover:text-muted-foreground">&larr; Back to Methodology</a>
	</div>
</main>
