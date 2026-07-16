<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, pageLayout, title, sectionLabel, body, caption, mono } from '$lib/design-system';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
</script>

<Seo
	path="/methodology"
	title="V8 Methodology: AI Exposure Rank | AI Work Index"
	description="How AI Work Index ranks AI exposure across 562 Singapore occupations without treating an index as a job-loss probability."
/>

<div class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />
	<h1 class={title({ size: 'page' })}>V8 methodology</h1>
	<p class={caption({ class: 'mt-1 mb-8' })}>
		A deterministic, open-data ranking of how exposed occupations are to current AI capabilities,
		built from the retained V7 research inputs.
	</p>

	<section class="mb-10">
		<h2 class={sectionLabel({ class: 'mb-3' })}>What the headline means</h2>
		<div class={card({ padding: 'lg' })}>
			<p class={body({ class: 'font-medium' })}>
				An AI Exposure Rank of 72/100 means the occupation ranks higher than approximately 72% of
				occupations in the Singapore reference market for AI task exposure.
			</p>
			<p class={body({ class: 'mt-3 text-muted-foreground' })}>
				It does not mean a 72% chance of job loss, 72% of jobs disappearing, or 72% of tasks being
				automated. The score is relative to the other occupations in this release.
			</p>
		</div>
	</section>

	<section class="mb-10 space-y-4">
		<h2 class={sectionLabel()}>How V8 is calculated</h2>
		<div class={card({ padding: 'lg', class: 'space-y-5' })}>
			<div>
				<h3 class="font-semibold">1. Build the exposure ensemble</h3>
				<p class={body({ class: 'mt-1 text-muted-foreground' })}>
					Combine Felten AIOE, Anthropic observed usage, Eloundou GPT exposure and the ILO refined
					index using published reliability weights. Missing sources are renormalized rather than
					imputed.
				</p>
			</div>
			<div>
				<h3 class="font-semibold">2. Rank occupations within Singapore</h3>
				<p class={body({ class: 'mt-1 text-muted-foreground' })}>
					Tied values receive their midrank. Index points are
					<span class={mono()}>100 × (midrank − 1) / (N − 1)</span>, with N = {DATA_VINTAGE.occupation_count}.
					Bands are quintiles: 0–19 Very Low, 20–39 Low, 40–59 Moderate, 60–79 High and 80–100 Very
					High.
				</p>
			</div>
			<div>
				<h3 class="font-semibold">3. Keep employment economics separate</h3>
				<p class={body({ class: 'mt-1 text-muted-foreground' })}>
					Structural substitution pressure ranks exposure × (1 − human bottleneck). Augmentation
					potential ranks exposure × human bottleneck. Official demand, firm adoption, workforce
					age, entry-level sensitivity and transition evidence are published beside those indices
					rather than hidden inside the headline. Entry-level sensitivity is currently <code
						>unknown</code
					>: no suitable open official occupation-level hiring series isolates entry-level workers.
				</p>
			</div>
		</div>
	</section>

	<section class="mb-10">
		<h2 class={sectionLabel({ class: 'mb-3' })}>Likely pathway rules</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each [['Limited direct change', 'AI Exposure Rank below 40.'], ['Hiring or substitution pressure', 'Substitution pressure is High+, directly supported adoption is established or leading, and demand is not strong.'], ['Augmentation-led growth', 'Augmentation potential is High+ and official demand is strong.'], ['Demand-buffered redesign', 'Substitution pressure is High+ but official demand is strong.'], ['Workflow redesign', 'All remaining combinations; evidence supports change but not a narrower employment claim.']] as rule}
				<div class={card({ padding: 'md' })}>
					<h3 class="font-semibold">{rule[0]}</h3>
					<p class={caption({ class: 'mt-1' })}>{rule[1]}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mb-10 space-y-4">
		<h2 class={sectionLabel()}>Confidence and sensitivity</h2>
		<p class={body()}>
			Confidence is High, Medium or Low based on mapping quality, source coverage, task evidence and
			policy caps. The site shows the limiting factors; it does not render confidence as a
			probability.
		</p>
		<p class={body()}>
			Sensitivity is the score range produced by equal source weights and leave-one-source-out
			variants. It is an assumption-sensitivity range, not a statistical confidence interval.
		</p>
	</section>

	<section class="mb-10">
		<h2 class={sectionLabel({ class: 'mb-3' })}>Important limitations</h2>
		<ul class="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
			<li>
				Exposure measures disagree about constructs and magnitude; the ensemble does not make them
				causal.
			</li>
			<li>Detailed Singapore occupation employment is estimated from broader official groups.</li>
			<li>Demand and age evidence can be broader than the individual SSOC occupation.</li>
			<li>
				Output-demand elasticity, firm reorganization and job quality are not measured as occupation
				scores.
			</li>
			<li>
				Observed employment effects can appear first in hiring, hours, contractors or career ladders
				rather than layoffs.
			</li>
			<li>
				The deduplicated U.S. BLS cross-country check finds essentially no rank association (&rho; =
				0.01 across 243 unique mapping signatures); it does not validate Singapore employment
				outcomes.
			</li>
			<li>Synthetic modern roles are estimates and are kept separate from official occupations.</li>
		</ul>
	</section>

	<section class="mb-10">
		<h2 class={sectionLabel({ class: 'mb-3' })}>Data and history</h2>
		<div class="flex flex-wrap gap-3 text-sm">
			<a class="text-primary hover:underline" href="/data">Download V8 data</a>
			<a class="text-primary hover:underline" href="/research">Research library</a>
			<a class="text-primary hover:underline" href="/reports/v7-release">Archived V7 release</a>
			<a class="text-primary hover:underline" href="/methodology/appendix">Technical appendix</a>
		</div>
	</section>
</div>
