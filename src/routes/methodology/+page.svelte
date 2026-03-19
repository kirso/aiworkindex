<script lang="ts">
	import { occupations, impactTypeLabels, riskBandLabels } from '$lib/data';
	import { pageLayout, card, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { title as titleStyle } from '$lib/design-system';
	import Seo from '$lib/components/ui/Seo.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	const occupationCount = occupations.length;
	const directCount = occupations.filter(
		occupation => occupation.match_quality === 'direct'
	).length;
	const submajorFallbackCount = occupations.filter(
		occupation => occupation.match_quality === 'submajor_fallback'
	).length;
	const majorFallbackCount = occupations.filter(
		occupation => occupation.match_quality === 'major_fallback'
	).length;
	const fallbackCount = submajorFallbackCount + majorFallbackCount;
	const anthropicCoverageCount = occupations.filter(
		occupation => occupation.evidence.anthropic_calibrated
	).length;

	function pct(value: number, total: number): string {
		return ((value / total) * 100).toFixed(1);
	}

	function findOccupation(pattern: RegExp) {
		return occupations.find(occupation => pattern.test(occupation.title));
	}

	const softwareDeveloper = findOccupation(/software developer/i);
	const dataEntryClerk = findOccupation(/data entry clerk/i);
</script>

<Seo
	title="Scoring Methodology — 4-Input AI Ensemble"
	description="Three-layer scoring: exposure (AIOE), human bottleneck (theta), and market resilience. Net risk published as risk bands with visible confidence. No LLM in the scoring pipeline."
	path="/methodology"
/>

<main class={pageLayout({ width: 'prose' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Methodology</h1>

	<!-- Core insight -->
	<div
		class={cn(
			card({ padding: 'sm', variant: 'default' }),
			'mt-4 border-risk-moderate-border bg-risk-moderate-subtle'
		)}
	>
		<p class="text-sm font-medium text-foreground">
			AI exposure and job displacement are different objects.
		</p>
		<p class="mt-1 text-sm text-foreground/80">
			A software developer and a data entry clerk can both score high on AI exposure, but one gets
			augmented (MOM lists software developers as in-demand in 2025) while the other faces
			substitution. We deliberately separate technical exposure from market translation using a
			three-layer system.
		</p>
	</div>

	<p class="mt-4 text-muted-foreground">
		Our scoring pipeline uses government survey data plus published academic and institutional
		research. No LLM assigns a risk score — avoiding the circularity of using AI to score AI
		replaceability. The core formula is fully deterministic: every input is an observable signal
		from a published dataset. We publish the structural score separately from the Singapore context
		bundle so users can audit the core model independently from current labour conditions and
		support layers.
	</p>

	<!-- Validation Status -->
	<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'mt-4')}>
		<p class={cn(sectionLabel(), 'mb-2')}>Validation & Limits</p>
		<div class="mt-2 grid gap-2 sm:grid-cols-2">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-risk-very-low font-bold">&#10003;</span>
				<span>Deterministic and reproducible scoring</span>
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-risk-very-low font-bold">&#10003;</span>
				<span>Sensitivity-tested (band stability stress test)</span>
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-risk-very-low font-bold">&#10003;</span>
				<span>Cluster-level directional check only: 3/4 checks pass (Q3 2025, n = 3 clusters)</span>
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-risk-moderate font-bold">~</span>
				<span>Not validated at individual occupation level</span>
			</div>
		</div>
	</div>

	<!-- Honest positioning -->
	<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'mt-4')}>
		<p class="text-sm text-foreground/80">
			<strong>What this model does:</strong> Measures structural AI displacement pressure using observable
			inputs. It tells you which occupations face the most technical overlap with AI capabilities and
			which have the strongest human bottlenecks and market buffers.
		</p>
		<p class="mt-2 text-sm text-foreground/80">
			<strong>What it does not do:</strong> Predict actual job losses, forecast hiring trends, or account
			for the creation of new tasks that AI enables (the "reinstatement effect" in Acemoglu &amp; Restrepo's
			framework). The model captures displacement potential but not the offsetting force of new task creation.
		</p>
	</div>

	<!-- Tabbed content -->
	<Tabs.Root value="scoring" class="mt-8">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="scoring">Scoring Model</Tabs.Trigger>
			<Tabs.Trigger value="validation">Validation</Tabs.Trigger>
			<Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
			<Tabs.Trigger value="references">References</Tabs.Trigger>
		</Tabs.List>

		<!-- Tab 1: Scoring Model -->
		<Tabs.Content value="scoring" class="mt-6">
			<!-- Three-layer overview -->
			<section class="mb-8">
				<p class={sectionLabel()}>Three-Layer Structural Score</p>
				<div class="mt-3 space-y-4">
					<div class={card({ padding: 'sm' })}>
						<h3 class="text-sm font-semibold text-red-700">Layer 1: Exposure</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							How much does this job overlap with current AI capabilities? The V4.0 exposure layer
							blends available signals from AIOE, Anthropic observed usage, Eloundou GPT exposure,
							and the ILO occupational exposure index.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<h3 class="text-sm font-semibold text-risk-very-low">Layer 2: Human Bottleneck</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							How much does this job require judgment, presence, and responsibility that resists
							automation? From Pizzinelli theta, computed from O*NET Work Context data.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<h3 class="text-sm font-semibold text-impact-leveraged">Layer 3: Market Resilience</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							Is Singapore's labor market for this occupation growing or shrinking? Group-level
							employment and wage trends plus occupation-level wage scarcity proxies.
						</p>
					</div>
				</div>
				<p class="mt-3 text-sm text-muted-foreground">
					These three layers produce the structural score. Around that core score we add confidence,
					labour evidence, synthetic-role estimates, and scenario tooling rather than hiding
					everything inside one opaque number.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Separate Singapore context modules now show industry footprint and worker-profile
					composition from official Section D labour-force tables and wage-by-sex tables. The
					industry footprint card now also shows sector wage anchors from MOM's industry wage tables
					where the occupation is covered. The labour monitor carries both published vacancy rates
					and published vacancy counts at cluster level. These context blocks are displayed as
					evidence around the score, not folded into hidden multipliers, and are published in a
					separate Singapore context bundle alongside the main score dataset.
				</p>
				<div class="mt-2 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-foreground/80">Layer</th>
								<th class="py-2 pr-3 font-medium text-foreground/80">Measures</th>
								<th class="py-2 font-medium text-foreground/80">Source</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Exposure</td>
								<td class="py-2 pr-3">AI capability overlap with job abilities</td>
								<td class="py-2">Availability-weighted equal average of matched exposure sources</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Human Bottleneck</td>
								<td class="py-2 pr-3">Judgment, presence, responsibility that resists automation</td
								>
								<td class="py-2">Pizzinelli theta from O*NET (2023), percentile-ranked</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Market Resilience</td>
								<td class="py-2 pr-3">Employment momentum + occupation wage scarcity</td>
								<td class="py-2">MOM employment/wage trends + occupation wage structure</td>
							</tr>
							<tr>
								<td class="py-2 pr-3 font-medium">Net Displacement Risk</td>
								<td class="py-2 pr-3"
									>Published as risk bands (Very Low to Very High) with confidence</td
								>
								<td class="py-2">Composite formula</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Net Risk Formula -->
			<section class="mb-8">
				<p class={sectionLabel()}>The Formula</p>
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
					net_risk = exposure_ensemble &times; (1 - bottleneck) &times; market_modifier
				</p>
				<p class="mt-2 text-sm text-muted-foreground">Where:</p>
				<ul class="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
					<li>
						<code class="rounded bg-muted px-1 text-xs"
							>market_modifier = 1 - 0.35 &times; market_resilience</code
						>
					</li>
					<li>
						<code class="rounded bg-muted px-1 text-xs"
							>market_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity</code
						>
					</li>
				</ul>
				<p class="mt-2 text-sm text-muted-foreground italic">
					The market modifier only dampens risk (it is always &le; 1.0). Weak markets don't amplify
					risk beyond the technical signal — they simply provide less buffer. Maximum reduction:
					35%.
				</p>
			</section>

			<!-- Layer 1 details -->
			<section class="mb-8">
				<p class={sectionLabel()}>Layer 1: Exposure</p>

				<div class={cn(card({ padding: 'md' }), 'mt-4')}>
					<h3 class="font-semibold text-foreground">Exposure Ensemble</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						V4.0 treats exposure as an ensemble layer, not a single index. AIOE is the baseline
						source; Anthropic observed usage, Eloundou GPT exposure, and the ILO occupational
						exposure index are added when crosswalk coverage exists.
					</p>
					<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
						exposure_ensemble = weighted_mean(percentile-ranked matched exposure inputs)
					</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Each source is percentile-ranked to a 0–1 scale and then blended using deterministic
						source weights based on recency, construct fit, coverage quality, and validation
						support. Occupations with fewer matched sources are kept, but should be read with lower
						evidential coverage.
					</p>
					<p class="mt-1 text-sm text-muted-foreground italic">
						What it does NOT measure: whether exposure leads to augmentation or replacement.
					</p>
				</div>
			</section>

			<!-- Layer 2 details -->
			<section class="mb-8">
				<p class={sectionLabel()}>Layer 2: Human Bottleneck (Theta)</p>

				<div class={cn(card({ padding: 'md' }), 'mt-4')}>
					<h3 class="font-semibold text-foreground">Pizzinelli Theta (Complementarity)</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						From Pizzinelli et al. (2023, IMF). Computed from 12 O*NET variables across 6
						dimensions. Higher theta = stronger human bottleneck = harder to substitute.
					</p>
					<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
						<li>
							<strong>Communication</strong>: Face-to-Face Discussions
							<code class="rounded bg-muted px-1 text-xs">4.C.1.a.2.l</code>, Public Speaking
							<code class="rounded bg-muted px-1 text-xs">4.C.1.a.2.c</code>
						</li>
						<li>
							<strong>Responsibility</strong>: Outcomes/Results
							<code class="rounded bg-muted px-1 text-xs">4.C.1.c.2</code>, Health/Safety of Others
							<code class="rounded bg-muted px-1 text-xs">4.C.1.c.1</code>
						</li>
						<li>
							<strong>Physical Conditions</strong>: Outdoors
							<code class="rounded bg-muted px-1 text-xs">4.C.2.a.1.c</code>, Physical Proximity
							<code class="rounded bg-muted px-1 text-xs">4.C.2.a.3</code>
						</li>
						<li>
							<strong>Criticality</strong>: Consequence of Errors
							<code class="rounded bg-muted px-1 text-xs">4.C.3.a.1</code>, Decision Freedom
							<code class="rounded bg-muted px-1 text-xs">4.C.3.a.4</code>, Decision Frequency
							<code class="rounded bg-muted px-1 text-xs">4.C.3.a.2.b</code>
						</li>
						<li>
							<strong>Routine</strong> (inverted): Degree of Automation
							<code class="rounded bg-muted px-1 text-xs">4.C.3.b.2</code> (inverted), Structured
							vs. Unstructured Work
							<code class="rounded bg-muted px-1 text-xs">4.C.3.b.8</code>
						</li>
						<li>
							<strong>Skills</strong>: O*NET Job Zone (1-5, scaled to 0-1)
						</li>
					</ol>
					<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
						&theta; = mean(6 dimension means, each normalized to 0-1)
					</p>
					<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
						bottleneck = percentile_rank(&theta;) across all matched occupations
					</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Scale: 0 (lowest percentile — most automatable) to 1 (highest percentile — strongest
						human bottleneck)
					</p>
				</div>

				<div
					class={cn(
						card({ padding: 'sm', variant: 'default' }),
						'mt-4 border-risk-moderate-border bg-risk-moderate-subtle'
					)}
				>
					<p class="text-sm text-foreground/80">
						<strong>No double-counting:</strong> We use AIOE and theta as separate, independent
						layers. We do NOT use C-AIOE (which is <code>aioe &times; f(theta)</code>) as an input
						to net_risk, because multiplying by <code>(1 - theta)</code> would double-count complementarity.
						C-AIOE is computed and displayed as a reference score for IMF comparability only.
					</p>
				</div>
			</section>

			<!-- Layer 3 details -->
			<section class="mb-8">
				<p class={sectionLabel()}>Layer 3: Market Resilience</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Market data is a <strong>calibrator</strong>, not an override. Employment and wages are
					lagging and confounded. The market layer can reduce net risk by up to 35% — it never
					amplifies risk beyond the technical signal.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Separately, we build a Singapore industry-footprint layer from the official industry ×
					occupation cross-tab plus industry vacancy series. That layer is shown on occupation and
					synthetic-role pages as contextual evidence, not as a direct score multiplier.
				</p>

				<div class="mt-4 space-y-4">
					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">Market Momentum (group-level)</h3>
						<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
							market_momentum = mean(pctile(group_empl_cagr), pctile(group_wage_cagr))
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							10-year employment CAGR (2015-2025) and 8-year wage CAGR (2015-2023) from MOM data,
							per major occupation group. Percentile-ranked across the 8 major groups.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">Occupation Scarcity (occupation-level)</h3>
						<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
							occupation_scarcity = mean(pctile(log(q75/q25)), pctile(wage_median / group_median))
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							Two wage-structure signals: (1) log wage spread (winsorized at 1st/99th percentile) as
							a scarcity proxy, and (2) within-group wage position (above group median = relative
							specialization). Both percentile-ranked across all 562 occupations.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">Combined Market Modifier</h3>
						<div class="mt-2 space-y-2">
							<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
								market_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity
							</p>
							<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
								market_modifier = 1 - 0.35 &times; market_resilience
							</p>
						</div>
						<p class="mt-2 text-sm text-muted-foreground">
							Group-level trends get 60% weight (direct measurement). Occupation-level wage
							structure adds within-group differentiation at 40% weight (noisier signal). The 0.35
							cap means the market layer can reduce net risk by up to 35%.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">
							Singapore Demand Signals (occupation-level bonuses)
						</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							Two MOM data sources provide occupation-level demand flags that boost market
							resilience:
						</p>
						<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
							<li>
								<strong>Shortage Occupation List (SOL) 2026</strong>: EP/COMPASS shortage list
								(released Nov 2025, effective Jan 2026). 36 occupations across semiconductors,
								healthcare, ICT, green economy, maritime, agritech, financial services. Matched to
								62 SSOC codes.
								<strong>+15% market resilience bonus.</strong>
							</li>
							<li>
								<strong>Jobs in Demand 2025</strong>: Broader resident demand list (released Dec 30,
								2025). Covers PMET and non-PMET roles: software developers, nurses, waiters,
								drivers, security officers, auditors. Matched to 29 SSOC codes.
								<strong>+10% market resilience bonus.</strong>
							</li>
						</ul>
						<p class="mt-2 text-sm text-muted-foreground italic">
							Where both signals match (e.g., software developer appears on both SOL and Jobs in
							Demand), bonuses stack (capped at 1.0). SOL is EP/COMPASS-focused (PMET bias); Jobs in
							Demand offsets this by covering non-PMET roles.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">
							Labour Monitor (cluster-level evidence layer)
						</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							We ingest official MOM/SingStat quarterly data from data.gov.sg and compute a unified
							labour monitor for three broad occupation clusters:
						</p>
						<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
							<li><strong>PMET</strong> — Professionals, Managers, Executives &amp; Technicians</li>
							<li><strong>Clerical, Sales &amp; Service Workers</strong></li>
							<li>
								<strong>Production &amp; Transport Operators, Cleaners &amp; Labourers</strong>
							</li>
						</ul>
						<p class="mt-2 text-sm text-muted-foreground">
							Three signals are computed per cluster (where data is available):
						</p>
						<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
							<li>
								<strong>Vacancy rate trend</strong>: 4-quarter-over-4-quarter average trend. Signal:
								&gt;+5% = heating up (+1), &lt;-5% = cooling down (-1), else stable (0).
							</li>
							<li>
								<strong>Net hiring pressure</strong>: recruitment rate minus resignation rate (when
								available). Signal: net &gt;+0.1pp = positive (+1), &lt;-0.1pp = negative (-1), else
								neutral (0).
							</li>
							<li>
								<strong>Retrenchment trend</strong>: count and 4Q-over-4Q trend (when available).
								Falling retrenchment = positive (+1), rising = negative (-1).
							</li>
						</ol>
						<p class="mt-2 text-sm text-muted-foreground">
							The three signals are summed into an overall label:
						</p>
						<p class="mt-1 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
							total = vacancy_signal + hiring_signal + retrenchment_signal<br />
							2-3 = "strong" | 1 = "moderate" | 0 = "weak" | &lt;0 = "deteriorating"
						</p>
						<p class="mt-2 text-sm text-muted-foreground italic">
							This is <strong>cluster-level data</strong>, not occupation-level. It provides context
							about the broad labour market conditions for each occupation's cluster, displayed as a
							labour market card on occupation pages. It is not a direct scoring input — we show it
							to ground the analysis in current labour-market reality without overfitting a sparse
							cluster-level series into the per-occupation formula.
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							<strong>Data displayed per cluster:</strong> vacancy rate with year-over-year trend and
							multi-year sparkline (2021–2025), recruitment vs resignation rates, retrenchment incidence
							per 1,000 employees, and re-entry rates (proportion of retrenched workers finding employment
							within 6 and 12 months).
						</p>
						<p class="mt-2 text-sm text-muted-foreground italic">
							Data sources: vacancy rates (data.gov.sg + MOM Labour Market Report Q3 2025),
							recruitment/resignation rates, retrenchment by occupation group, and re-entry into
							employment statistics. Updated quarterly.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">
							Anthropic Economic Index (exposure calibration)
						</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							Observed AI usage rates from Claude conversations (HuggingFace dataset, Jan 2026
							report). Calibrates the theoretical AIOE exposure by up to &plusmn;30% based on the
							gap between theoretical and observed AI usage per occupation.
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							Applied to {anthropicCoverageCount} of {occupationCount} occupations via SOC code crosswalk.
							Key finding: some occupations (data entry, customer service) show higher observed usage
							than AIOE predicts, while others (teachers, software developers) show lower observed usage.
						</p>
						<p class="mt-2 text-sm text-muted-foreground italic">
							Used as calibration, not replacement. Anthropic measures Claude usage specifically,
							not universal AI adoption.
						</p>
					</div>
				</div>
			</section>

			<!-- Risk Bands -->
			<section class="mb-8">
				<p class={sectionLabel()}>Risk Bands</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Net risk is published as bands, not pseudo-precise decimals:
				</p>
				<div class="mt-3 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-foreground/80">Band</th>
								<th class="py-2 pr-3 font-medium text-foreground/80">Range</th>
								<th class="py-2 font-medium text-foreground/80">Meaning</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Very Low</td>
								<td class="py-2 pr-3">0.00 &ndash; 0.05</td>
								<td class="py-2">Negligible displacement pressure</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Low</td>
								<td class="py-2 pr-3">0.05 &ndash; 0.15</td>
								<td class="py-2">Limited pressure; AI likely augments</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Moderate</td>
								<td class="py-2 pr-3">0.15 &ndash; 0.30</td>
								<td class="py-2">Mixed; bottlenecks or market provide buffer</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">High</td>
								<td class="py-2 pr-3">0.30 &ndash; 0.50</td>
								<td class="py-2"
									>Significant pressure; weaker bottlenecks and/or declining market</td
								>
							</tr>
							<tr>
								<td class="py-2 pr-3 font-medium">Very High</td>
								<td class="py-2 pr-3">0.50+</td>
								<td class="py-2">Strong pressure across multiple signals</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Augmentation & Impact Type -->
			<section class="mb-8">
				<p class={sectionLabel()}>Augmentation &amp; Impact Type</p>
				<p class="mt-2 text-sm text-muted-foreground">
					A single displacement risk number misses half the story. We compute augmentation potential
					from the
					<strong>same three layers</strong>, with a different formula:
				</p>
				<div class="mt-2 space-y-2">
					<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
						displacement_risk = exposure &times; (1 - bottleneck) &times; market_modifier
					</p>
					<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
						augmentation = exposure &times; bottleneck &times; market_resilience
					</p>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					Augmentation is highest when AI capability overlaps with strong human bottlenecks AND the
					local market has demand for the occupation. High exposure alone does not guarantee
					augmentation — the occupation must also have irreplaceable human elements (high
					bottleneck) that make AI a complement rather than a substitute.
				</p>
				<p class="mt-3 text-sm text-muted-foreground">
					Crossing displacement with augmentation gives a 2&times;2 <strong>impact type</strong>:
				</p>
				<div class="mt-3 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-foreground/80"></th>
								<th class="py-2 pr-3 font-medium text-foreground/80">Low Augmentation</th>
								<th class="py-2 font-medium text-foreground/80">High Augmentation</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">High Displacement</td>
								<td class="py-2 pr-3"
									><span class="font-semibold text-red-600">At Risk</span> — AI substitutes, weak bottleneck</td
								>
								<td class="py-2"
									><span class="font-semibold text-impact-mixed">Mixed</span> — conflicting signals, high
									uncertainty</td
								>
							</tr>
							<tr>
								<td class="py-2 pr-3 font-medium">Low Displacement</td>
								<td class="py-2 pr-3"
									><span class="font-semibold text-green-600">Stable</span> — AI has limited overlap</td
								>
								<td class="py-2"
									><span class="font-semibold text-impact-leveraged">Augmented</span> — AI amplifies,
									human essential</td
								>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="mt-3 text-sm text-muted-foreground italic">
					Impact type is classified from net_risk and augmentation thresholds: net_risk &ge; 0.25 =
					"high displacement", augmentation &ge; 0.12 = "high augmentation". Occupations with high
					displacement and official demand signals (SOL/JiD) are classified as "mixed" rather than
					"at risk".
				</p>
			</section>

			<!-- Confidence -->
			<section class="mb-8">
				<p class={sectionLabel()}>Confidence Scores</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Every score carries a visible confidence indicator:
				</p>
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
					confidence = weighted_sum(crosswalk, market, freshness, coverage, agreement, sensitivity)
					− penalties
				</p>
				<div class="mt-3 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-foreground/80">Factor</th>
								<th class="py-2 pr-3 font-medium text-foreground/80">How it is assigned</th>
								<th class="py-2 font-medium text-foreground/80">Typical range</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Crosswalk quality</td>
								<td class="py-2 pr-3"
									>Direct = 1.0, sub-major fallback = 0.6, major fallback = 0.3, then reduced
									further by crosswalk dispersion where mapped SOC scores disagree.</td
								>
								<td class="py-2">0.3 - 1.0</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Market data granularity</td>
								<td class="py-2 pr-3"
									>Baseline = occupation wage structure + group employment/wage trends. Exact
									official demand evidence adds more occupation-specific Singapore signal than
									prefix-inferred or absent demand evidence.</td
								>
								<td class="py-2">0.65 - 0.85</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Source freshness</td>
								<td class="py-2 pr-3"
									>Weighted from the matched exposure sources' recency scores inside the
									reliability-weighted ensemble.</td
								>
								<td class="py-2">0.55 - 0.98</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Source coverage</td>
								<td class="py-2 pr-3"
									>Rewards occupations with broader matched exposure coverage across AIOE,
									Anthropic, Eloundou, and ILO.</td
								>
								<td class="py-2">0.10 - 1.00</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Signal agreement</td>
								<td class="py-2 pr-3"
									>Penalizes occupations whose matched exposure sources materially disagree or where
									only one source is available.</td
								>
								<td class="py-2">0.25 - 0.95</td>
							</tr>
							<tr>
								<td class="py-2 pr-3 font-medium">Sensitivity</td>
								<td class="py-2 pr-3"
									>Derived from the Monte Carlo stability label: stable &gt; watch &gt; sensitive.</td
								>
								<td class="py-2">0.40 - 0.85</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					Published as: <strong>High</strong> (&ge;0.7) / <strong>Medium</strong>
					(0.45&ndash;0.7) / <strong>Low</strong> (&lt;0.45).
				</p>
				<p class="mt-2 text-sm text-muted-foreground italic">
					In the current implementation, confidence is also reduced for one-source occupations and
					for materially contested signal combinations.
				</p>
			</section>

			<!-- Classification (IMF-style) -->
			<section class="mb-8">
				<p class={sectionLabel()}>Classification</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Building on the IMF framework, occupations are classified into four impact types based on
					the 2&times;2 matrix of displacement risk and augmentation potential:
				</p>
				<div class="mt-3 space-y-2">
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #e15759;"
						></span>
						<div>
							<p class="text-sm font-medium text-foreground">At Risk</p>
							<p class="text-sm text-muted-foreground">
								High displacement, low augmentation (e.g., data entry, bookkeepers)
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #4e79a7;"
						></span>
						<div>
							<p class="text-sm font-medium text-foreground">Augmented</p>
							<p class="text-sm text-muted-foreground">
								Low displacement, high augmentation (e.g., software developers, surgeons)
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #59a14f;"
						></span>
						<div>
							<p class="text-sm font-medium text-foreground">Stable</p>
							<p class="text-sm text-muted-foreground">
								Low displacement, low augmentation (e.g., electricians, childcare workers)
							</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #f28e2b;"
						></span>
						<div>
							<p class="text-sm font-medium text-foreground">Mixed</p>
							<p class="text-sm text-muted-foreground">
								High displacement, high augmentation — conflicting signals, outcome depends on
								adoption path
							</p>
						</div>
					</div>
				</div>
			</section>
		</Tabs.Content>

		<!-- Tab 2: Validation -->
		<Tabs.Content value="validation" class="mt-6">
			<!-- Validation -->
			<section class="mb-8">
				<p class={sectionLabel()}>Validation</p>
				<p class="mt-2 text-sm text-muted-foreground">
					We backtest structural risk scores against actual labour market outcomes at the cluster
					level (Q3 2025 data). This tests whether higher-risk clusters show worse outcomes than
					lower-risk ones.
				</p>
				<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
					<h3 class="text-sm font-semibold text-foreground mb-2">
						Cluster-Level Directional Checks
					</h3>
					<div class="space-y-2 text-sm text-muted-foreground">
						<div class="flex items-center gap-2">
							<span class="text-risk-very-low font-bold shrink-0">&#10003;</span>
							<span
								><strong>Risk vs vacancy trend:</strong> Higher-risk clusters have lower vacancy growth
								(Spearman &rho; = -1.0, n=3)</span
							>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-risk-very-low font-bold shrink-0">&#10003;</span>
							<span
								><strong>Risk vs retrenchment:</strong> Higher-risk clusters have higher retrenchment
								incidence (&rho; = 0.5)</span
							>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-risk-very-high font-bold shrink-0">&#10007;</span>
							<span
								><strong>Risk vs hiring pressure:</strong> Hiring net pressure does not inversely track
								risk (&rho; = 0.5)</span
							>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-risk-very-low font-bold shrink-0">&#10003;</span>
							<span
								><strong>Directional accuracy:</strong> 100% of pairwise cluster comparisons rank correctly
								on vacancy trend</span
							>
						</div>
					</div>
					<p class="mt-3 text-xs text-muted-foreground italic">
						Only 3 labour clusters available, so statistical power is limited. This validates broad
						direction, not precision. Cluster-level data masks within-cluster variation. Full raw
						results in <code class="rounded bg-muted px-1"
							>data/backtests/q3-2025-validation.json</code
						>.
					</p>
				</div>

				<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
					<h3 class="text-sm font-semibold text-foreground mb-2">
						Cross-Country Convergent Check (BLS Projections)
					</h3>
					<p class="text-sm text-muted-foreground">
						We mapped 530 of 562 Singapore SSOC occupations to US BLS 2024&ndash;2034 employment
						projections via the ISCO-08 &rarr; SOC crosswalk. Spearman rank correlation between our
						structural risk scores and BLS projected employment change:
						<strong>&rho; = &minus;0.14</strong> (p &lt; 0.01, n = 530). Higher risk scores are associated
						with weaker projected employment growth.
					</p>
					<div class="mt-3 overflow-x-auto">
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="border-b border-border">
									<th class="py-1.5 pr-3 font-medium text-foreground/80">Risk band</th>
									<th class="py-1.5 pr-3 font-medium text-foreground/80">n</th>
									<th class="py-1.5 font-medium text-foreground/80">Avg BLS change</th>
								</tr>
							</thead>
							<tbody class="text-muted-foreground">
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">Very Low</td>
									<td class="py-1.5 pr-3">87</td>
									<td class="py-1.5 text-risk-very-low font-medium">+3.3%</td>
								</tr>
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">Low</td>
									<td class="py-1.5 pr-3">204</td>
									<td class="py-1.5 text-risk-low font-medium">+3.1%</td>
								</tr>
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">Moderate</td>
									<td class="py-1.5 pr-3">120</td>
									<td class="py-1.5 text-risk-moderate font-medium">+3.2%</td>
								</tr>
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">High</td>
									<td class="py-1.5 pr-3">76</td>
									<td class="py-1.5 text-risk-high font-medium">+2.0%</td>
								</tr>
								<tr>
									<td class="py-1.5 pr-3">Very High</td>
									<td class="py-1.5 pr-3">43</td>
									<td class="py-1.5 text-risk-very-high font-medium">&minus;3.0%</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="mt-3 text-xs text-muted-foreground italic">
						The highest-risk band is the only one with projected negative employment growth. Caveat:
						BLS projections include non-AI factors (demographics, trade, policy). The modest
						correlation (&rho; = &minus;0.14) is expected &mdash; our model measures AI-specific
						structural pressure, not total employment change. Treat this as weak convergent
						evidence, not strong external validation. Full results in
						<code class="rounded bg-muted px-1">data/backtests/bls-crosswalk-validation.json</code>.
					</p>
				</div>

				<div
					class={cn(
						card({ padding: 'sm', variant: 'default' }),
						'mt-3 border-risk-moderate-border bg-risk-moderate-subtle'
					)}
				>
					<p class="text-sm text-foreground/80">
						<strong>Honest framing:</strong> Structural risk scores capture long-run pressure, not
						short-run employment fluctuations. A single exposure measure poorly predicts actual
						unemployment (<a
							href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11983276/"
							target="_blank"
							rel="noopener noreferrer"
							class="underline">Frank et al., 2025, PNAS Nexus</a
						>). Research is "<a
							href="https://www.brookings.edu/articles/research-on-ai-and-the-labor-market-is-still-in-the-first-inning/"
							target="_blank"
							rel="noopener noreferrer"
							class="underline">still in the first inning</a
						>" (Brookings/PIIE, 2026) with no consensus on measurement.
					</p>
				</div>
			</section>

			<!-- Ensemble Exposure -->
			<section class="mb-8">
				<p class={sectionLabel()}>Ensemble Exposure Measures</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Frank et al. (2025) found that individual AI exposure scores are poor predictors of actual
					unemployment, but an <strong>ensemble of multiple measures</strong> improves fit over single
					scores. That motivates our multi-source exposure layer, but does not by itself prove any particular
					weighting scheme. We therefore use a deterministic reliability-weighted blend across multiple
					lenses:
				</p>
				<div class="mt-3 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-foreground/80">Measure</th>
								<th class="py-2 pr-3 font-medium text-foreground/80">Source</th>
								<th class="py-2 font-medium text-foreground/80">Coverage</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Felten AIOE</td>
								<td class="py-2 pr-3"
									>Academic index (Felten et al., 2021) — task-ability overlap with 10 AI
									applications</td
								>
								<td class="py-2"
									>Primary exposure score. Covers all 562 occupations via SOC crosswalk.</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Anthropic Observed Usage</td>
								<td class="py-2 pr-3"
									>Anthropic Economic Index (2026) — actual LLM usage patterns by occupation</td
								>
								<td class="py-2"
									>{pct(anthropicCoverageCount, occupationCount)}% of occupations calibrated. Used
									to adjust AIOE where theory diverges from practice.</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">GPTs-are-GPTs</td>
								<td class="py-2 pr-3"
									>Eloundou et al. (2023) — LLM task-level exposure via human + GPT-4 assessment</td
								>
								<td class="py-2"
									>Integrated in V4.0 ensemble with reliability weighting when matched via SOC
									crosswalk.</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">ILO AI Exposure</td>
								<td class="py-2 pr-3"
									>ILO (2024) — task-level AI automation potential scored across ISCO occupations</td
								>
								<td class="py-2"
									>Integrated in V4.0 ensemble with reliability weighting when matched via ISCO
									crosswalk.</td
								>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="mt-3 text-sm text-muted-foreground">
					Where multiple measures are available, we report whether they agree ("consensus high",
					"consensus low") or diverge. Divergence flags occupations where theory-based and observed
					measures disagree — often the most interesting cases for investigation.
				</p>
			</section>

			<!-- Worked Examples -->
			<section class="mb-8">
				<p class={sectionLabel()}>Worked Examples</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Both occupations score high on AI exposure. But their outcomes differ dramatically because
					of the bottleneck and market layers:
				</p>

				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Software Developer</p>
						<ul class="mt-2 space-y-1 text-xs text-muted-foreground">
							{#if softwareDeveloper}
								<li>Exposure: pctile(aioe) = {softwareDeveloper.exposure.toFixed(2)}</li>
								<li>Bottleneck: pctile(theta) = {softwareDeveloper.bottleneck.toFixed(2)}</li>
								<li>Market resilience: {softwareDeveloper.market.market_resilience.toFixed(2)}</li>
								<li>Market modifier: {softwareDeveloper.market.market_modifier.toFixed(2)}</li>
								<li>
									Net risk: <strong class="text-risk-very-low"
										>{softwareDeveloper.net_risk.toFixed(2)} ({riskBandLabels[
											softwareDeveloper.risk_band
										]})</strong
									>
								</li>
								<li>
									Impact type: <strong class="text-impact-leveraged"
										>{impactTypeLabels[softwareDeveloper.impact_type]}</strong
									>
								</li>
							{/if}
						</ul>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="text-sm font-semibold text-foreground">Data Entry Clerk</p>
						<ul class="mt-2 space-y-1 text-xs text-muted-foreground">
							{#if dataEntryClerk}
								<li>Exposure: pctile(aioe) = {dataEntryClerk.exposure.toFixed(2)}</li>
								<li>Bottleneck: pctile(theta) = {dataEntryClerk.bottleneck.toFixed(2)}</li>
								<li>Market resilience: {dataEntryClerk.market.market_resilience.toFixed(2)}</li>
								<li>Market modifier: {dataEntryClerk.market.market_modifier.toFixed(2)}</li>
								<li>
									Net risk: <strong class="text-red-600"
										>{dataEntryClerk.net_risk.toFixed(2)} ({riskBandLabels[
											dataEntryClerk.risk_band
										]})</strong
									>
								</li>
								<li>
									Impact type: <strong class="text-red-600"
										>{impactTypeLabels[dataEntryClerk.impact_type]}</strong
									>
								</li>
							{/if}
						</ul>
					</div>
				</div>

				<p class="mt-3 text-sm text-muted-foreground">
					This is why a single "AI exposure score" is misleading. The software developer has higher
					exposure than many "at risk" occupations, yet their job is growing. The structural score
					captures this distinction.
				</p>
			</section>
		</Tabs.Content>

		<!-- Tab 3: Advanced -->
		<Tabs.Content value="advanced" class="mt-6">
			<!-- Crosswalk -->
			<section class="mb-8">
				<p class={sectionLabel()}>Crosswalk: Singapore to US Scores</p>
				<p class="mt-2 text-sm text-muted-foreground">
					AIOE and theta scores originate from US O*NET data. We map Singapore's SSOC occupations to
					these scores via:
				</p>
				<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
					<li>SSOC 2020 maps to ISCO-08 unit groups via SingStat concordance</li>
					<li>ISCO-08 maps to US SOC 2010 via BLS crosswalk</li>
					<li>When one ISCO maps to multiple SOC codes, we average the scores</li>
					<li>
						Fallback 1: 2-digit ISCO sub-major group average (crosswalk quality starts at 0.6)
					</li>
					<li>Fallback 2: 1-digit major group average (crosswalk quality starts at 0.3)</li>
				</ol>
				<p class="mt-2 text-sm text-muted-foreground">
					Current coverage: {pct(directCount, occupationCount)}% direct match ({directCount}/{occupationCount}),
					{pct(submajorFallbackCount, occupationCount)}% sub-major fallback ({submajorFallbackCount}),
					{pct(majorFallbackCount, occupationCount)}% major fallback ({majorFallbackCount}).
				</p>
			</section>

			<!-- What this version shows -->
			<section class="mb-8">
				<p class={sectionLabel()}>What This Version Shows</p>
				<p class="mt-2 text-sm text-muted-foreground">
					V4.0 implements the full three-layer structural score with a 4-source exposure ensemble,
					human bottleneck (theta percentile), and market resilience (group-level employment/wage
					trends + occupation-level wage structure). Net risk is published as risk bands with
					visible confidence. Augmentation potential, impact type classification, and rule-based
					outlook/scenario modelling are included. 88 estimated modern roles (AI engineer, product
					manager, prompt engineer, startup operator, creator, gig-worker variants, etc.) are scored
					as weighted blends of official occupations, with dispersion analysis for high-variance
					compositions.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					<strong>Seniority adjustment</strong> (V3.2+): the Outlook section now supports experience-level
					modifiers (Entry-level / Mid-career / Senior). Adjustments scale with each occupation's variant
					sensitivity — roles with high institutional knowledge (e.g., software engineering) vary more
					by seniority than roles with low context-dependence (e.g., truck driver). Grounded in: Stanford
					"Canaries in the Coal Mine" (2025) showing entry-level displacement pressure, and Anthropic
					Economic Index (2026) showing 14% drop in job-finding for 22-25 year olds in AI-exposed occupations.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					<strong>Labour market data</strong> updated through Q3 2025 full report + Q4 2025 advance release.
					Vacancy rates, retrenchment, and recruitment/resignation rates by occupation cluster.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					<strong>Not yet implemented:</strong> Occupation-level employment data (MOM OED, not publicly
					available), company-size modifiers (startup vs enterprise context), and job postings pipeline
					for real-time demand signals.
				</p>
			</section>

			<!-- Synthetic Roles -->
			<section class="mb-8">
				<p class={sectionLabel()}>Synthetic Role Methodology</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Modern job titles (AI Engineer, Product Manager, Prompt Engineer) don't map to a single
					official SSOC occupation. We estimate scores by blending 2-4 official occupations with
					weights reflecting the typical task composition of each modern role.
				</p>
				<div class="mt-3 space-y-2 text-sm text-muted-foreground">
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground">Composition</p>
						<p class="mt-1">
							Each synthetic role defines component SSOC occupations and weights (e.g., Startup CTO
							= 40% Software Manager + 30% Solution Architect + 30% Software Developer). Scores are
							weighted averages of component occupation scores. All component SSOC codes are
							validated against the occupations dataset.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground">Dispersion</p>
						<p class="mt-1">
							When component occupations have very different risk scores, the weighted average may
							not represent any single reality. For roles with high dispersion (stddev > 0.08), we
							show the full risk range and explain: "Your actual risk depends on how much you code
							vs manage." Low-dispersion roles (where the blend barely changes the score) link to
							their closest official occupation.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground">Confidence</p>
						<p class="mt-1">
							Synthetic role scores never exceed Medium confidence and drop to Low when component
							occupations disagree materially. They are illustrative estimates, not validated
							against actual labour outcomes. Use the component occupation pages for
							higher-confidence individual scores.
						</p>
					</div>
				</div>
			</section>

			<!-- Seniority Modifiers -->
			<section class="mb-8">
				<p class={sectionLabel()}>Experience Level Adjustment</p>
				<p class="mt-2 text-sm text-muted-foreground">
					The Outlook section supports experience-level modifiers that adjust displacement pressure
					based on research showing AI affects different seniority levels unequally.
				</p>
				<div class="mt-3 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-foreground/80">Level</th>
								<th class="py-2 pr-3 font-medium text-foreground/80">Exposure Adj.</th>
								<th class="py-2 pr-3 font-medium text-foreground/80">Bottleneck Adj.</th>
								<th class="py-2 font-medium text-foreground/80">Research Basis</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Entry-level</td>
								<td class="py-2 pr-3 font-mono">+14pp × sensitivity</td>
								<td class="py-2 pr-3 font-mono">−12pp × sensitivity</td>
								<td class="py-2">
									More routine tasks, less institutional knowledge. Anthropic (2026): 14% drop in
									job-finding for ages 22-25. Stanford DEL (2025): entry-level faces
									disproportionate pressure. Brynjolfsson et al. (2023): largest AI productivity
									gains among junior workers, compressing the experience gap.
								</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Mid-career</td>
								<td class="py-2 pr-3 font-mono">0</td>
								<td class="py-2 pr-3 font-mono">0</td>
								<td class="py-2">Baseline — current scores reflect mid-career task composition.</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Senior / Lead</td>
								<td class="py-2 pr-3 font-mono">−10pp × sensitivity</td>
								<td class="py-2 pr-3 font-mono">+12pp × sensitivity</td>
								<td class="py-2">
									More judgment/strategy work, higher institutional knowledge. Noy & Zhang (2023):
									AI narrows experience gap. Dell'Acqua (2023): seniors better at knowing AI's
									capability boundary.
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p class="mt-2 text-xs text-muted-foreground italic">
					"Sensitivity" refers to the occupation's variant_sensitivity score (0–1), derived from
					institutional knowledge, relationship intensity, regulatory weight, and coordination
					requirements. High-sensitivity roles (e.g., software engineering: 0.55) vary more by
					seniority than low-sensitivity roles (e.g., truck driver: 0.15).
				</p>
			</section>

			<!-- Implementation Constants -->
			<section class="mb-8">
				<p class={sectionLabel()}>Implementation Constants</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Key constants and thresholds used in the scoring pipeline. All values are deterministic
					and reproducible.
				</p>
				<div class="mt-3 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-foreground/80">Parameter</th>
								<th class="py-2 pr-3 font-medium text-foreground/80">Value</th>
								<th class="py-2 font-medium text-foreground/80">Details</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Anthropic calibration cap</td>
								<td class="py-2 pr-3">&plusmn;30%</td>
								<td class="py-2"
									><code class="rounded bg-muted px-1 text-xs"
										>exposure + 0.3 &times; (observed - exposure)</code
									></td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">SOL exact bonus</td>
								<td class="py-2 pr-3">+15%</td>
								<td class="py-2"
									>Exact match to Shortage Occupation List adds 15% to market resilience</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">SOL prefix bonus</td>
								<td class="py-2 pr-3">+8%</td>
								<td class="py-2">Prefix-inferred match to SOL adds 8% to market resilience</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Jobs in Demand exact bonus</td>
								<td class="py-2 pr-3">+10%</td>
								<td class="py-2">Exact match to Jobs in Demand adds 10% to market resilience</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Jobs in Demand prefix bonus</td>
								<td class="py-2 pr-3">+5%</td>
								<td class="py-2"
									>Prefix-inferred match to Jobs in Demand adds 5% to market resilience</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Augmented threshold</td>
								<td class="py-2 pr-3">net_risk &lt; 0.25 AND augmentation &ge; 0.12</td>
								<td class="py-2">Low displacement with meaningful augmentation potential</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">At Risk threshold</td>
								<td class="py-2 pr-3">net_risk &ge; 0.25 AND augmentation &lt; 0.12</td>
								<td class="py-2">High displacement pressure with weak augmentation buffer</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Stable threshold</td>
								<td class="py-2 pr-3">net_risk &lt; 0.25 AND augmentation &lt; 0.12</td>
								<td class="py-2">Low displacement, low augmentation — AI has limited overlap</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Mixed</td>
								<td class="py-2 pr-3">net_risk &ge; 0.25 AND augmentation &ge; 0.12</td>
								<td class="py-2">High displacement AND high augmentation — conflicting signals</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Stability stress test</td>
								<td class="py-2 pr-3">&plusmn;5 percentile points</td>
								<td class="py-2"
									>Each of the three core layers is perturbed by &plusmn;5 percentile points to test
									band stability</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Confidence: high</td>
								<td class="py-2 pr-3">&ge; 0.7</td>
								<td class="py-2">Confidence score &ge; 0.7 published as "High"</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Confidence: medium</td>
								<td class="py-2 pr-3">0.4 &ndash; 0.7</td>
								<td class="py-2">Confidence score between 0.4 and 0.7 published as "Medium"</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Confidence: low</td>
								<td class="py-2 pr-3">&lt; 0.4</td>
								<td class="py-2">Confidence score below 0.4 published as "Low"</td>
							</tr>
							<tr>
								<td class="py-2 pr-3 font-medium">Market modifier cap</td>
								<td class="py-2 pr-3">0.35</td>
								<td class="py-2"
									><code class="rounded bg-muted px-1 text-xs"
										>market_modifier = 1 - 0.35 &times; market_resilience</code
									></td
								>
							</tr>
						</tbody>
					</table>
				</div>
			</section>

			<!-- Limitations -->
			<section class="mb-8">
				<p class={sectionLabel()}>Known Limitations</p>
				<ul class="mt-2 list-inside list-disc space-y-2 text-sm text-muted-foreground">
					<li>
						<strong>Exposure ≠ displacement</strong> — Market translation uses heuristics and lagging
						indicators. Captures displacement but not reinstatement (Acemoglu &amp; Restrepo, 2019).
					</li>
					<li>
						<strong>US-centric ability data</strong> — O*NET surveys US workers; task composition may
						differ in Singapore.
					</li>
					<li>
						<strong>Hierarchical market granularity</strong> — Momentum is major-group level; wage structure
						adds occupation-level differentiation as a proxy.
					</li>
					<li>
						<strong>Proportional employment</strong> — Per-occupation employment is sub-major-group total
						/ count (41 groups from Labour Force 2024 Table D8), not actual per-occupation counts. Better
						than the previous 8 major groups but still an allocation, not a measurement.
					</li>
					<li>
						<strong>Static exposure snapshot</strong> — AIOE reflects 2021 AI capabilities.
					</li>
					<li>
						<strong>Career-stage blind spot</strong> — Scores the occupation as a whole; junior/senior
						impact likely differs (Stanford Canaries, 2025).
					</li>
					<li>
						<strong>Crosswalk imprecision</strong> — {pct(fallbackCount, occupationCount)}% of
						occupations use fallback scores. Confidence score reflects this.
					</li>
					<li>
						<strong>Wage-spread ambiguity</strong> — High wage ratio can mean specialization or seniority
						ladder (~16% effective weight).
					</li>
					<li>
						<strong>Cluster-level labour monitor</strong> — Only available for three broad clusters, not
						all 562 occupations.
					</li>
				</ul>
			</section>
		</Tabs.Content>

		<!-- Tab 4: References -->
		<Tabs.Content value="references" class="mt-6">
			<!-- References -->
			<section class="mb-8">
				<p class={sectionLabel()}>Academic References</p>
				<ul class="mt-2 space-y-3 text-sm text-muted-foreground">
					<li>
						<p class="font-medium text-foreground/80">Felten, Raj &amp; Seamans (2021)</p>
						<p>
							<a
								href="https://doi.org/10.1002/smj.3286"
								target="_blank"
								rel="noopener noreferrer"
								class="underline"
								>"Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A
								Novel Dataset and Its Potential Uses."</a
							> <em>Strategic Management Journal</em>, 42(12), 2195-2217.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Pizzinelli et al. (2023)</p>
						<p>
							<a
								href="https://www.imf.org/en/Publications/WP/Issues/2023/10/05/Labor-Market-Exposure-to-AI-Cross-country-Differences-and-Distributional-Implications-540476"
								target="_blank"
								rel="noopener noreferrer"
								class="underline"
								>"Labor Market Exposure to AI: Cross-country Differences and Distributional
								Implications."</a
							> <em>IMF Working Paper</em> WP/23/216.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">IMF Singapore (2024)</p>
						<p>
							<a
								href="https://www.imf.org/en/Publications/selected-issues-papers/Issues/2024/07/30/Impact-of-Artificial-Intelligence-on-the-Singapore-Labor-Market-552447"
								target="_blank"
								rel="noopener noreferrer"
								class="underline"
								>"Impact of Artificial Intelligence on the Singapore Labor Market."</a
							> <em>IMF Selected Issues Paper</em> SIP/2024/040.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Acemoglu &amp; Restrepo (2019)</p>
						<p>
							<a
								href="https://www.aeaweb.org/articles?id=10.1257/jep.33.2.3"
								target="_blank"
								rel="noopener noreferrer"
								class="underline"
								>"Automation and New Tasks: How Technology Displaces and Reinstates Labor."</a
							> <em>Journal of Economic Perspectives</em>, 33(2), 3-30.
							Displacement-vs-reinstatement framework referenced in our limitations.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Brynjolfsson, Li &amp; Raymond (2023)</p>
						<p>
							<a
								href="https://www.nber.org/papers/w31161"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">"Generative AI at Work."</a
							> <em>NBER Working Paper</em> 31161. Largest AI productivity gains among junior workers;
							narrows experience gap.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Eloundou et al. (2023)</p>
						<p>
							<a
								href="https://arxiv.org/abs/2303.10130"
								target="_blank"
								rel="noopener noreferrer"
								class="underline"
								>"GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large
								Language Models."</a
							> <em>arXiv:2303.10130</em>. Published in <em>Science</em> (2024).
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Demirer et al. (2025)</p>
						<p>
							<a
								href="https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline"
								>"Canaries in the Coal Mine: Early Signals from AI's Impact on the Labor Market."</a
							> <em>Stanford Digital Economy Lab</em>.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Frank et al. (2025)</p>
						<p>
							<a
								href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11983276/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">"AI Exposure Predicts Unemployment Risk."</a
							> <em>PNAS Nexus</em>. Ensemble of exposure measures outperforms any single score.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Ministry of Manpower, Singapore (2025)</p>
						<p>
							<a
								href="https://www.mom.gov.sg/newsroom/press-releases/2025/1230-jobs-in-demand-2025"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">"Jobs in Demand 2025."</a
							> Released December 30, 2025.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Ministry of Manpower, Singapore (2025)</p>
						<p>
							<a
								href="https://stats.mom.gov.sg/Pages/Job-Vacancies.aspx"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">"Job Vacancies 2024."</a
							> Released March 28, 2025.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Ministry of Manpower, Singapore (2025)</p>
						<p>
							<a
								href="https://www.mom.gov.sg/passes-and-permits/employment-pass/compass/shortage-occupation-list"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">COMPASS Shortage Occupation List (SOL).</a
							> Released November 2025, effective January 1, 2026.
						</p>
					</li>
					<li>
						<p class="font-medium text-foreground/80">Anthropic (2026)</p>
						<p>
							<a
								href="https://www.anthropic.com/research/anthropic-economic-index-january-2026-report"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">"The Anthropic Economic Index: Economic Primitives."</a
							>
							January 15, 2026.
							<a
								href="https://huggingface.co/datasets/Anthropic/EconomicIndex"
								target="_blank"
								rel="noopener noreferrer"
								class="underline">Dataset on HuggingFace</a
							>.
						</p>
					</li>
				</ul>
			</section>

			<!-- State of the Science -->
			<section class="mb-8">
				<p class={sectionLabel()}>State of the Science</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Research on AI and the labour market is evolving rapidly. Our model is informed by — and
					honest about — the current consensus:
				</p>
				<div class="mt-3 space-y-2 text-sm text-muted-foreground">
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground/80">
							Individual AI exposure scores are poor predictors of actual unemployment
						</p>
						<p class="mt-1 text-xs">
							Frank et al. (2025, PNAS Nexus) found that single exposure measures "misrepresent AI's
							impact" — but an ensemble of multiple measures accounts for 18% more variation in
							actual outcomes.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground/80">Research is "still in the first inning"</p>
						<p class="mt-1 text-xs">
							Brookings/PIIE (2026) reports no consensus on how to measure AI's labour market
							impact. BLS employment projections show only weak correlation between AI exposure and
							projected job decline.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground/80">
							No clear aggregate displacement through 2025
						</p>
						<p class="mt-1 text-xs">
							Yale Budget Lab finds no aggregate displacement signal. But entry-level pressure in
							exposed occupations is emerging (Stanford "Canaries in the Coal Mine," 2025).
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground/80">
							Our approach: structural pressure model, not prediction
						</p>
						<p class="mt-1 text-xs">
							We measure where AI has the most technical overlap with human tasks, adjusted for
							human bottlenecks and market signals. Validated directionally at cluster level (3/4
							checks pass vs Q3 2025 data), not causally at occupation level.
						</p>
					</div>
				</div>
			</section>

			<!-- Reproduce -->
			<section class="mb-8">
				<p class={sectionLabel()}>Reproduce Our Results</p>
				<p class="mt-2 text-sm text-muted-foreground">
					The entire scoring pipeline is open source and deterministic:
				</p>
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
					bun run scripts/score.ts
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					This reads raw data from <code class="rounded bg-muted px-1 text-xs">data/raw/</code>,
					computes all scores, and writes
					<code class="rounded bg-muted px-1 text-xs">data/occupations.json</code>.
				</p>
			</section>

			<!-- Version History -->
			<section class="mb-8">
				<p class={sectionLabel()}>Version History</p>
				<div class="mt-3 space-y-3">
					<div class={card({ padding: 'sm' })}>
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-foreground">V4.0 — Current</span>
							<span class="text-xs text-muted-foreground">March 2026</span>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							4-source exposure ensemble (AIOE + Anthropic + Eloundou + ILO). Reliability-weighted
							blend of all available matched inputs. BLS convergent cross-check, industry momentum
							spread, and 56 validation checks.
						</p>
					</div>
					<div class={cn(card({ variant: 'inset', padding: 'sm' }))}>
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-foreground/70">V3.1</span>
							<span class={caption()}>March 2026</span>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							Seniority modifiers (entry-level / mid-career / senior) scaled by variant sensitivity.
							2-input ensemble exposure (AIOE + Anthropic). Cluster-level backtesting (3/4
							directional checks pass). Labour data updated to Q4 2025 advance release. 80 synthetic
							roles. Archetype classification expanded to cover all SSOC prefixes. 48 validation
							checks. Outlook simplified to 2 tabs with seniority toggle.
						</p>
					</div>
					<div class={cn(card({ variant: 'inset', padding: 'sm' }))}>
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-foreground/70">V3.0</span>
							<span class={caption()}>February 2026</span>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							Three-layer scoring: exposure (AIOE), bottleneck (theta), market resilience. Produces:
							net risk, augmentation, impact type, stability, confidence. Anthropic observed-usage
							calibration. SOL 2026 and Jobs in Demand 2025 demand signals. Cluster-level labour
							monitor (Q3 2025 vacancy, recruitment/resignation, retrenchment, re-entry rates).
							Stability stress testing. 75 estimated modern roles. Rule-based outlook/scenario
							engine with 3 presets.
						</p>
					</div>
					<div class={cn(card({ variant: 'inset', padding: 'sm' }))}>
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-foreground/70">V2</span>
							<span class={caption()}>January 2026</span>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							Added market resilience layer (employment trends + wage scarcity). Introduced risk
							bands and confidence scoring. Replaced single-score output with multi-layer evidence
							display.
						</p>
					</div>
					<div class={cn(card({ variant: 'inset', padding: 'sm' }))}>
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-foreground/70">V1</span>
							<span class={caption()}>December 2025</span>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							Initial release. Two-layer model: AIOE exposure + Pizzinelli theta complementarity.
							562 SSOC occupations via ISCO crosswalk.
						</p>
					</div>
				</div>
			</section>
		</Tabs.Content>
	</Tabs.Root>

	<div
		class="mt-10 border-t border-border pt-4 flex items-center justify-between text-sm text-muted-foreground"
	>
		<a href="/" class="hover:text-foreground/80">&larr; Back to index</a>
		<a href="/methodology/appendix" class="hover:text-foreground/80"
			>Implementation appendix &rarr;</a
		>
	</div>
</main>
