<script lang="ts">
	import { occupations, impactTypeLabels, riskBandLabels } from '$lib/data';
	import clusterValidation from '$lib/data/backtests/current-validation.json';
	import blsValidation from '$lib/data/backtests/bls-crosswalk-validation.json';
	import multiPeriodValidation from '$lib/data/backtests/multi-period-validation.json';
	import calibrationDiagnostics from '$lib/data/backtests/calibration-diagnostics.json';
	import occupationFamilyValidation from '$lib/data/backtests/occupation-family-validation.json';
	import { dataSourceRegistry } from '$lib/data/data-contract';
	import claimsMatrix from '$lib/data/claims-matrix.json';
	import researchLibrary from '$lib/data/research-library.json';
	import { releases, siteStatus } from '$lib/data/site-status';
	import { DATA_VINTAGE } from '$lib/data/scoring-constants';
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
	const dataSourceCount = dataSourceRegistry.length;
	const publicClaims = claimsMatrix.claims.slice(0, 10);
	const researchEntries = researchLibrary.entries;
	const activeCoreResearch = researchEntries.filter(entry => entry.role === 'active_core');
	const validationResearch = researchEntries.filter(entry => entry.role === 'validation');
	const nextHorizonResearch = researchEntries.filter(entry => entry.role === 'candidate_v5');
	const structuralHistory = releases.filter(release => release.type === 'structural_release');
	const clusterChecksPassed = clusterValidation.summary.checks_passed;
	const clusterChecksTotal = clusterValidation.summary.checks_total;
	const clusterBacktestPath = `data/backtests/${clusterValidation.data_period.toLowerCase().replace(/\s+/g, '-')}-validation.json`;
	const clusterChecks = clusterValidation.correlation_checks;
	const vacancyCheck = clusterChecks[0] ?? { pass: false, actual: 'N/A', note: 'Unavailable' };
	const retrenchmentCheck = clusterChecks[1] ?? { pass: false, actual: 'N/A', note: 'Unavailable' };
	const hiringCheck = clusterChecks[2] ?? { pass: false, actual: 'N/A', note: 'Unavailable' };
	const accuracyCheck = clusterChecks[3] ?? { pass: false, actual: 'N/A', note: 'Unavailable' };
	const temporalVacancySummary = multiPeriodValidation.metrics.vacancy_rate_yoy.summary;
	const temporalVacancyCountSummary = multiPeriodValidation.metrics.vacancy_count_yoy.summary;
	const temporalHiringSummary = multiPeriodValidation.metrics.annual_hiring_net.summary;
	const calibrationDirect = calibrationDiagnostics.segments.by_match_quality.direct;
	const calibrationFallback = calibrationDiagnostics.segments.by_match_quality.all_fallback;
	const calibrationHighMedium = calibrationDiagnostics.segments.by_confidence_level.high_or_medium;
	const calibrationLow = calibrationDiagnostics.segments.by_confidence_level.low;

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
	title="Scoring Methodology — Reliability-Weighted 4-Source Ensemble"
	description="Live V6 structural score: latent-source posterior exposure, task-mode adjustment, human bottleneck, demand resilience, and separately published transition-adjusted and realized-risk layers."
	path="/methodology"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Methodology</h1>

	<!-- Core insight -->
	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-4')}>
		<p class="text-sm font-medium text-foreground">
			AI exposure and job displacement are different objects.
		</p>
		<p class="mt-1 text-sm text-text-secondary">
			A software developer and a data entry clerk can both score high on AI exposure, but one gets
			augmented (MOM lists software developers as in-demand in 2025) while the other faces
			substitution. We deliberately separate technical exposure from market translation using a V6
			two-axis structural score.
		</p>
	</div>

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
				<span>
					Cluster-level directional check only: {clusterChecksPassed}/{clusterChecksTotal} checks pass
					({clusterValidation.data_period}, n = {clusterValidation.cluster_stats.length} clusters)
				</span>
			</div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span class="text-risk-moderate font-bold">~</span>
				<span>Not validated at individual occupation level</span>
			</div>
		</div>
	</div>

	<!-- Honest positioning -->
	<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'mt-4')}>
		<p class="text-sm text-text-secondary">
			<strong>What this model does:</strong> Measures structural AI displacement pressure using observable
			inputs. It tells you which occupations face the most technical overlap with AI capabilities and
			which have the strongest human bottlenecks and demand buffers.
		</p>
		<p class="mt-2 text-sm text-text-secondary">
			<strong>What it does not do:</strong> Predict actual job losses or forecast hiring trends. The core
			score still captures structural displacement pressure, not realised reinstatement. We now publish
			a separate offset-potential layer to approximate some cushioning forces, but it should not be read
			as a direct measure of new-task creation or job growth.
		</p>
	</div>

	<div class={cn(card({ variant: 'inset', padding: 'sm' }), 'mt-4')}>
		<p class={cn(sectionLabel(), 'mb-2')}>How To Read This</p>
		<p class="text-sm text-text-secondary">
			This site has two layers. The <strong>core score</strong> is the authoritative ranking layer:
			exposure, bottleneck, displacement pressure, demand resilience, headline risk, and
			uncertainty. The <strong>interpretive layer</strong> helps explain how work is performed in practice,
			including role-profile and workflow context.
		</p>
		<p class="mt-2 text-sm text-text-secondary">
			Interpretive fields are heuristic and should be read as context, not as direct
			occupation-level measurement. They help explain the score, but they do not replace the core
			formula.
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
			<!-- TL;DR -->
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mb-6')}>
				<p class="text-sm font-semibold text-foreground">TL;DR</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Headline risk = displacement pressure × (1 − demand resilience), where displacement
					pressure = AI exposure × (1 − human bottleneck). In live V6, exposure comes from an
					audited 4-source stack, then passes through a latent posterior and task-mode upgrade where
					the evidence is strong. No LLM assigns scores in the pipeline.
				</p>
			</div>

			<!-- V6 overview -->
			<section class="mb-8">
				<p class={sectionLabel()}>V6 Two-Axis Structural Score</p>
				<div class="mt-3 space-y-4">
					<div class={card({ padding: 'sm' })}>
						<h3 class="text-sm font-semibold text-red-700">Layer 1: Exposure</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							How much does this job overlap with current AI capabilities? The live {DATA_VINTAGE.model_version}
							exposure layer keeps the audited 4-source ensemble, then upgrades exposure with weighted
							task evidence where coverage is strong.
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
						<h3 class="text-sm font-semibold text-impact-leveraged">Axis 2: Demand Resilience</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							How strongly does Singapore demand counteract structural AI pressure for this
							occupation? Built from base resilience plus direct demand-signal bonuses.
						</p>
					</div>
				</div>
				<p class="mt-3 text-sm text-muted-foreground">
					Exposure and bottleneck first form <strong>displacement pressure</strong>. Demand
					resilience then acts as an independent counterforce. Around that core score we add
					confidence, labour evidence, synthetic-role estimates, offset potential, and scenario
					tooling rather than hiding everything inside one opaque number.
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
								<th class="py-2 pr-3 font-medium text-text-secondary">Layer</th>
								<th class="py-2 pr-3 font-medium text-text-secondary">Measures</th>
								<th class="py-2 font-medium text-text-secondary">Source</th>
							</tr>
						</thead>
						<tbody class="text-muted-foreground">
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Exposure</td>
								<td class="py-2 pr-3">AI capability overlap with job abilities</td>
								<td class="py-2"
									>Reliability-weighted blend of matched percentile-ranked exposure sources</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Human Bottleneck</td>
								<td class="py-2 pr-3">Judgment, presence, responsibility that resists automation</td
								>
								<td class="py-2">Pizzinelli theta from O*NET (2023), percentile-ranked</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Demand Resilience</td>
								<td class="py-2 pr-3">Base resilience plus occupation-level demand bonuses</td>
								<td class="py-2">MOM employment/wage trends + scarcity + SOL / JiD</td>
							</tr>
							<tr>
								<td class="py-2 pr-3 font-medium">Headline Risk</td>
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
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
					headline_risk = displacement_pressure &times; (1 - demand_resilience)
				</p>
				<p class="mt-2 text-sm text-muted-foreground">Where:</p>
				<ul class="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
					<li>
						<code class="rounded bg-muted px-1 text-xs"
							>displacement_pressure = exposure &times; (1 - bottleneck)</code
						>
					</li>
					<li>
						<code class="rounded bg-muted px-1 text-xs"
							>demand_resilience = min(1.0, base_resilience &times; 0.45 + demand_signal_bonus)</code
						>
					</li>
					<li>
						<code class="rounded bg-muted px-1 text-xs"
							>base_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity</code
						>
					</li>
				</ul>
				<p class="mt-2 text-sm text-muted-foreground italic">
					Demand resilience is its own axis, not a compressed multiplier. Weak demand provides less
					buffer; strong verified demand can offset much more of the structural pressure than the
					old buffering rule allowed.
				</p>
			</section>

			<!-- Layer 1 details -->
			<section class="mb-8">
				<p class={sectionLabel()}>Layer 1: Exposure</p>

				<div class={cn(card({ padding: 'md' }), 'mt-4')}>
					<h3 class="font-semibold text-foreground">Exposure Ensemble</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						{DATA_VINTAGE.model_version} treats exposure as an ensemble layer, not a single index. AIOE
						is the baseline source; Anthropic observed usage, Eloundou GPT exposure, and the ILO occupational
						exposure index are added when crosswalk coverage exists. In the live release, weighted task
						evidence can then upgrade that ensemble for occupations that clear the coverage gate.
					</p>
					<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
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
					<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
						&theta; = mean(6 dimension means, each normalized to 0-1)
					</p>
					<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
						bottleneck = percentile_rank(&theta;) across all matched occupations
					</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Scale: 0 (lowest percentile — most automatable) to 1 (highest percentile — strongest
						human bottleneck)
					</p>
				</div>

				<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-4')}>
					<p class="text-sm text-text-secondary">
						<strong>No double-counting:</strong> We use AIOE and theta as separate, independent
						layers. We do NOT use C-AIOE (which is <code>aioe &times; f(theta)</code>) as an input
						to net_risk, because multiplying by <code>(1 - theta)</code> would double-count complementarity.
						C-AIOE is computed and displayed as a reference score for IMF comparability only.
					</p>
				</div>
			</section>

			<!-- Layer 3 details -->
			<section class="mb-8">
				<p class={sectionLabel()}>Axis 2: Demand Resilience</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Market data is a <strong>counterforce</strong>, not an override. Employment and wages are
					lagging and confounded, so the base resilience layer stays conservative. Verified demand
					signals then add explicit occupation-level cushioning on top of that base instead of being
					compressed into the old single dampener.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Separately, we build a Singapore industry-footprint layer from the official industry ×
					occupation cross-tab plus industry vacancy series. When it exists, that footprint now
					informs the employment side of market momentum directly; the same footprint is also shown
					on occupation and synthetic-role pages as transparent supporting context.
				</p>

				<div class="mt-4 space-y-4">
					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">
							Market Momentum (group prior + industry footprint)
						</h3>
						<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
							market_momentum = mean(blend(pctile(group_empl_cagr),
							pctile(occupation_industry_growth)), pctile(group_wage_cagr))
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							The baseline prior is still MOM group employment CAGR (2015-2025) plus group wage CAGR
							(2015-2023). When an occupation has a published industry footprint, we replace most of
							the employment-side group prior with an occupation-specific industry growth signal
							built from the industries where that occupation actually appears.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">Occupation Scarcity (occupation-level)</h3>
						<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
							occupation_scarcity = mean(pctile(log(q75/q25)), pctile(wage_median / group_median))
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							Two wage-structure signals: (1) log wage spread (winsorized at 1st/99th percentile) as
							a scarcity proxy, and (2) within-group wage position (above group median = relative
							specialization). Both percentile-ranked across all 562 occupations.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">Base Resilience and Demand Resilience</h3>
						<div class="mt-2 space-y-2">
							<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
								base_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity
							</p>
							<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
								demand_resilience = min(1.0, base_resilience &times; 0.45 + demand_signal_bonus)
							</p>
						</div>
						<p class="mt-2 text-sm text-muted-foreground">
							Momentum gets 60% weight and scarcity 40%. Within momentum, group-level wage growth is
							retained as the common anchor while the employment side uses an occupation-specific
							industry-footprint blend when available, falling back to the group prior otherwise. V6
							then converts that base resilience into demand resilience by retaining 45% of the base
							signal and adding verified occupation-level demand bonuses.
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
								<strong>Demand resilience bonus: +0.15 exact, +0.08 prefix.</strong>
							</li>
							<li>
								<strong>Jobs in Demand 2025</strong>: Broader resident demand list (released Dec 30,
								2025). Covers PMET and non-PMET roles: software developers, nurses, waiters,
								drivers, security officers, auditors. Matched to 29 SSOC codes.
								<strong>Demand resilience bonus: +0.12 exact, +0.06 prefix.</strong>
							</li>
						</ul>
						<p class="mt-2 text-sm text-muted-foreground italic">
							Where both signals match (e.g., software developer appears on both SOL and Jobs in
							Demand), bonuses stack and are capped only at the final 1.0 demand-resilience ceiling.
							SOL is EP/COMPASS-focused (PMET bias); Jobs in Demand offsets this by covering
							non-PMET roles.
						</p>
					</div>

					<div class={card({ padding: 'md' })}>
						<h3 class="font-semibold text-foreground">
							Labour Monitor (cluster-level evidence layer)
						</h3>
						<p class="mt-1 text-sm text-muted-foreground">
							We ingest official MOM/SingStat raw feeds from data.gov.sg and compute a unified
							labour monitor for three broad occupation clusters. Where the published raw series is
							annual or incomplete, we attach the latest MOM quarterly enrichment snapshot instead
							of pretending the raw feed is finer than it is:
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
						<p class="mt-1 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
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
							Data sources: vacancy rates and counts, recruitment/resignation rates, retrenchment by
							occupation group, and re-entry into employment statistics from data.gov.sg/MOM, with
							MOM labour-monitor enrichment attached for the live monitor artifact vintage ({siteStatus
								.live_monitor.labour_monitor_artifact_vintage}) where the public raw series stays
							annual or sparse. Updated when a fresher official release is available.
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
								<th class="py-2 pr-3 font-medium text-text-secondary">Band</th>
								<th class="py-2 pr-3 font-medium text-text-secondary">Range</th>
								<th class="py-2 font-medium text-text-secondary">Meaning</th>
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
					<strong>same core ingredients</strong>, with a different formula:
				</p>
				<div class="mt-2 space-y-2">
					<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
						displacement_pressure = exposure &times; (1 - bottleneck)
					</p>
					<p class="rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
						augmentation = exposure &times; bottleneck &times; base_resilience
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
								<th class="py-2 pr-3 font-medium text-text-secondary"></th>
								<th class="py-2 pr-3 font-medium text-text-secondary">Low Augmentation</th>
								<th class="py-2 font-medium text-text-secondary">High Augmentation</th>
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
					Impact type is classified from headline risk and augmentation thresholds: net_risk &ge;
					0.25 = "high displacement", augmentation &ge; 0.12 = "high augmentation". Official demand
					signals affect impact type indirectly through demand resilience and therefore the
					structural scores; they are not applied again as a separate classification override.
				</p>
			</section>

			<!-- Confidence -->
			<section class="mb-8">
				<p class={sectionLabel()}>Confidence Scores</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Every score carries a visible confidence indicator:
				</p>
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
					confidence = weighted_sum(crosswalk, market, freshness, coverage, agreement, sensitivity)
					− penalties
				</p>
				<div class="mt-3 overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-b border-border">
								<th class="py-2 pr-3 font-medium text-text-secondary">Factor</th>
								<th class="py-2 pr-3 font-medium text-text-secondary">How it is assigned</th>
								<th class="py-2 font-medium text-text-secondary">Typical range</th>
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
					In the current implementation, <strong>High</strong> confidence is reserved for direct, clean,
					multi-source cases only. Contested occupations, sparse one-source matches, and fallback mappings
					are capped below High even when their raw score crosses the threshold.
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
			<!-- TL;DR -->
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mb-6')}>
				<p class="text-sm font-semibold text-foreground">TL;DR</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{clusterChecksPassed} of {clusterChecksTotal} cluster-level directional checks pass against
					{clusterValidation.data_period} MOM data. BLS cross-country check shows weak but significant
					negative correlation (rho = {blsValidation.spearman_rho}, p &lt; 0.01). This is a
					structural pressure score, not a job-loss prediction.
				</p>
			</div>

			<!-- Validation -->
			<section class="mb-8">
				<p class={sectionLabel()}>Validation</p>
				<p class="mt-2 text-sm text-muted-foreground">
					We backtest structural risk scores against actual labour market outcomes at the cluster
					level ({clusterValidation.data_period} data). This tests whether higher-risk clusters show worse
					outcomes than lower-risk ones.
				</p>
				<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
					<h3 class="text-sm font-semibold text-foreground mb-2">
						Cluster-Level Directional Checks
					</h3>
					<div class="space-y-2 text-sm text-muted-foreground">
						<div class="flex items-center gap-2">
							<span
								class={vacancyCheck.pass
									? 'text-risk-very-low font-bold shrink-0'
									: 'text-risk-very-high font-bold shrink-0'}>{vacancyCheck.pass ? '✓' : '✗'}</span
							>
							<span
								><strong>Risk vs vacancy trend:</strong>
								{vacancyCheck.note}
								({vacancyCheck.actual}, n={clusterValidation.cluster_stats.length})</span
							>
						</div>
						<div class="flex items-center gap-2">
							<span
								class={retrenchmentCheck.pass
									? 'text-risk-very-low font-bold shrink-0'
									: 'text-risk-very-high font-bold shrink-0'}
								>{retrenchmentCheck.pass ? '✓' : '✗'}</span
							>
							<span
								><strong>Risk vs retrenchment:</strong>
								{retrenchmentCheck.note}
								({retrenchmentCheck.actual})</span
							>
						</div>
						<div class="flex items-center gap-2">
							<span
								class={hiringCheck.pass
									? 'text-risk-very-low font-bold shrink-0'
									: 'text-risk-very-high font-bold shrink-0'}>{hiringCheck.pass ? '✓' : '✗'}</span
							>
							<span
								><strong>Risk vs hiring pressure:</strong>
								{hiringCheck.note}
								({hiringCheck.actual})</span
							>
						</div>
						<div class="flex items-center gap-2">
							<span
								class={accuracyCheck.pass
									? 'text-risk-very-low font-bold shrink-0'
									: 'text-risk-very-high font-bold shrink-0'}>{accuracyCheck.pass ? '✓' : '✗'}</span
							>
							<span
								><strong>Directional accuracy:</strong>
								{accuracyCheck.actual}
								on vacancy trend</span
							>
						</div>
					</div>
					<p class="mt-3 text-xs text-muted-foreground italic">
						Only {clusterValidation.cluster_stats.length} labour clusters are available, so statistical
						power is limited. This validates broad direction, not precision. Cluster-level data masks
						within-cluster variation. Full raw results in
						<code class="rounded bg-muted px-1">{clusterBacktestPath}</code>.
					</p>
				</div>

				<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
					<h3 class="text-sm font-semibold text-foreground mb-2">
						Cross-Country Convergent Check (BLS Projections)
					</h3>
					<p class="text-sm text-muted-foreground">
						We mapped {blsValidation.sample_size} of {blsValidation.total_occupations} Singapore SSOC
						occupations to US BLS 2024&ndash;2034 employment projections via the ISCO-08 &rarr; SOC crosswalk.
						Spearman rank correlation between our structural risk scores and BLS projected employment
						change:
						<strong>&rho; = {blsValidation.spearman_rho}</strong> (p &lt; 0.01, n = {blsValidation.sample_size}).
						Higher risk scores are associated with weaker projected employment growth.
					</p>
					<div class="mt-3 overflow-x-auto">
						<table class="w-full text-left text-sm">
							<thead>
								<tr class="border-b border-border">
									<th class="py-1.5 pr-3 font-medium text-text-secondary">Risk band</th>
									<th class="py-1.5 pr-3 font-medium text-text-secondary">n</th>
									<th class="py-1.5 font-medium text-text-secondary">Avg BLS change</th>
								</tr>
							</thead>
							<tbody class="text-muted-foreground">
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">Very Low</td>
									<td class="py-1.5 pr-3">{blsValidation.by_risk_band.very_low.count}</td>
									<td class="py-1.5 text-risk-very-low font-medium"
										>{blsValidation.by_risk_band.very_low.avg_bls_change > 0
											? '+'
											: ''}{blsValidation.by_risk_band.very_low.avg_bls_change}%</td
									>
								</tr>
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">Low</td>
									<td class="py-1.5 pr-3">{blsValidation.by_risk_band.low.count}</td>
									<td class="py-1.5 text-risk-low font-medium"
										>{blsValidation.by_risk_band.low.avg_bls_change > 0 ? '+' : ''}{blsValidation
											.by_risk_band.low.avg_bls_change}%</td
									>
								</tr>
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">Moderate</td>
									<td class="py-1.5 pr-3">{blsValidation.by_risk_band.moderate.count}</td>
									<td class="py-1.5 text-risk-moderate font-medium"
										>{blsValidation.by_risk_band.moderate.avg_bls_change > 0
											? '+'
											: ''}{blsValidation.by_risk_band.moderate.avg_bls_change}%</td
									>
								</tr>
								<tr class="border-b border-border/50">
									<td class="py-1.5 pr-3">High</td>
									<td class="py-1.5 pr-3">{blsValidation.by_risk_band.high.count}</td>
									<td class="py-1.5 text-risk-high font-medium"
										>{blsValidation.by_risk_band.high.avg_bls_change > 0 ? '+' : ''}{blsValidation
											.by_risk_band.high.avg_bls_change}%</td
									>
								</tr>
								<tr>
									<td class="py-1.5 pr-3">Very High</td>
									<td class="py-1.5 pr-3">{blsValidation.by_risk_band.very_high.count}</td>
									<td class="py-1.5 text-risk-very-high font-medium"
										>{blsValidation.by_risk_band.very_high.avg_bls_change > 0
											? '+'
											: ''}{blsValidation.by_risk_band.very_high.avg_bls_change}%</td
									>
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

				<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
					<h3 class="text-sm font-semibold text-foreground mb-2">
						Temporal Robustness Check (Singapore labour history)
					</h3>
					<p class="text-sm text-muted-foreground">
						Using the fixed cluster risk ordering, we also test whether higher-risk clusters show
						weaker vacancy movement over multiple observed periods. Vacancy rate YoY alignment is
						<strong> {temporalVacancySummary.avg_pairwise_accuracy.toFixed(2)}</strong> across
						{temporalVacancySummary.period_count} periods; vacancy count YoY alignment is
						<strong> {temporalVacancyCountSummary.avg_pairwise_accuracy.toFixed(2)}</strong> across
						{temporalVacancyCountSummary.period_count} periods. Annual hiring-net alignment is much weaker
						at <strong>{temporalHiringSummary.avg_pairwise_accuracy.toFixed(2)}</strong> across
						{temporalHiringSummary.period_count} years.
					</p>
					<p class="mt-3 text-xs text-muted-foreground italic">
						This strengthens the claim that the score tracks long-run pressure better than short-run
						hiring appetite. Full raw results in
						<code class="rounded bg-muted px-1">data/backtests/multi-period-validation.json</code>.
					</p>
				</div>

				<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
					<h3 class="text-sm font-semibold text-foreground mb-2">
						Calibration Diagnostics (mapping quality and confidence)
					</h3>
					<p class="text-sm text-muted-foreground">
						We also check whether the broadest, most trusted score population behaves as expected in
						the external cross-check. Direct SSOC mappings cover
						<strong> {(calibrationDirect.share_of_matched_sample * 100).toFixed(1)}%</strong> of the
						matched BLS sample and retain a significant negative relationship (<strong
							>&rho; = {calibrationDirect.spearman_rho}</strong
						>, p &lt; 0.01). The combined high/medium-confidence population covers
						<strong> {(calibrationHighMedium.share_of_matched_sample * 100).toFixed(1)}%</strong> of
						matched occupations and shows the same negative alignment (<strong
							>&rho; = {calibrationHighMedium.spearman_rho}</strong
						>, p &lt; 0.01).
					</p>
					<p class="mt-3 text-sm text-muted-foreground">
						Fallback mappings remain directionally negative but are much smaller (n = {calibrationFallback.sample_size},
						&rho; = {calibrationFallback.spearman_rho}). The low-confidence tier is intentionally
						tiny (n = {calibrationLow.sample_size}) and should be treated as noisy rather than
						over-interpreted.
					</p>
					<p class="mt-3 text-xs text-muted-foreground italic">
						This is a calibration check for mapping quality and confidence labels, not separate
						Singapore outcome truth. Full results in
						<code class="rounded bg-muted px-1">data/backtests/calibration-diagnostics.json</code>.
					</p>
				</div>

				<div class={cn(card({ padding: 'sm' }), 'mt-3')}>
					<h3 class="text-sm font-semibold text-foreground mb-2">
						Occupation-Family Convergent Check
					</h3>
					<p class="text-sm text-muted-foreground">
						To get beyond the 3 broad labour clusters without pretending we have occupation-level
						Singapore outcome data, we also aggregate occupations into
						<strong> {occupationFamilyValidation.family_count}</strong> 2-digit SSOC families and
						compare average family risk with average BLS projected employment change. The result is
						still directionally negative (<strong
							>&rho; = {occupationFamilyValidation.spearman_rho}</strong
						>), but weaker than the main vacancy-side checks and not significant at p &lt; 0.01.
					</p>
					<p class="mt-3 text-xs text-muted-foreground italic">
						This is a more granular convergent cross-check, not Singapore realised labour truth.
						Full raw results in
						<code class="rounded bg-muted px-1"
							>data/backtests/occupation-family-validation.json</code
						>.
					</p>
				</div>

				<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-3')}>
					<p class="text-sm text-text-secondary">
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
								<th class="py-2 pr-3 font-medium text-text-secondary">Measure</th>
								<th class="py-2 pr-3 font-medium text-text-secondary">Source</th>
								<th class="py-2 font-medium text-text-secondary">Coverage</th>
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
									>Integrated in the live ensemble with reliability weighting when matched via SOC
									crosswalk.</td
								>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">ILO AI Exposure</td>
								<td class="py-2 pr-3"
									>ILO (2024) — task-level AI automation potential scored across ISCO occupations</td
								>
								<td class="py-2"
									>Integrated in the live ensemble with reliability weighting when matched via ISCO
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
								<li>Exposure: {softwareDeveloper.exposure.toFixed(2)}</li>
								<li>Bottleneck: pctile(theta) = {softwareDeveloper.bottleneck.toFixed(2)}</li>
								<li>
									Displacement pressure: {softwareDeveloper.displacement_pressure?.toFixed(2) ??
										'N/A'}
								</li>
								<li>Base resilience: {softwareDeveloper.market.market_resilience.toFixed(2)}</li>
								<li>
									Demand resilience: {softwareDeveloper.demand_resilience?.toFixed(2) ?? 'N/A'}
								</li>
								<li>
									Headline risk: <strong class="text-risk-very-low"
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
								<li>Exposure: {dataEntryClerk.exposure.toFixed(2)}</li>
								<li>Bottleneck: pctile(theta) = {dataEntryClerk.bottleneck.toFixed(2)}</li>
								<li>
									Displacement pressure: {dataEntryClerk.displacement_pressure?.toFixed(2) ?? 'N/A'}
								</li>
								<li>Base resilience: {dataEntryClerk.market.market_resilience.toFixed(2)}</li>
								<li>
									Demand resilience: {dataEntryClerk.demand_resilience?.toFixed(2) ?? 'N/A'}
								</li>
								<li>
									Headline risk: <strong class="text-red-600"
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
					exposure than many "at risk" occupations, yet strong demand resilience offsets much more
					of that structural pressure. The V6 score captures this distinction directly.
				</p>
			</section>
		</Tabs.Content>

		<!-- Tab 3: Advanced -->
		<Tabs.Content value="advanced" class="mt-6">
			<!-- TL;DR -->
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mb-6')}>
				<p class="text-sm font-semibold text-foreground">TL;DR</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Singapore SSOC codes map to US O*NET scores via ISCO-08 crosswalk. A seeded Monte Carlo
					stability routine generates deterministic optimistic/pessimistic risk bounds. Seniority
					modifiers adjust outlook for entry/mid/senior levels. Synthetic roles are weighted blends
					of official occupations.
				</p>
			</div>

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
					{DATA_VINTAGE.model_version} implements the live structural score with a 4-source exposure stack,
					latent posterior exposure calibration, task-mode adjustments where weighted task evidence is
					strong, human bottleneck (theta percentile), and market resilience (group-level employment/wage
					trends + occupation-level wage structure). Net risk remains the published structural headline.
					Transition-adjusted risk and realized-risk proxy are published separately so short-run labour
					effects do not overwrite the structural score. Augmentation potential now reflects heterogeneous
					augmentation priors rather than only the earlier structural proxy. Task-primitives sidecar fields,
					uncertainty intervals, and scenario tooling remain published around the score. 88 estimated
					modern roles (AI engineer, product manager, prompt engineer, startup operator, creator, gig-worker
					variants, etc.) are scored as weighted occupation priors plus workflow-aware context adjustments,
					with dispersion analysis for high-variance compositions.
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
					<strong>Labour monitor</strong> is built from official vacancy, recruitment/resignation, retrenchment,
					and re-entry feeds, then supplemented by MOM quarterly enrichment where the published raw series
					is annual or incomplete. It remains a cluster-level evidence layer, not a hidden scoring multiplier.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					<strong>Singapore context bundle</strong> now publishes industry footprint, worker profile,
					sector wage anchors, geography context, macro labour context, national AI-adoption context,
					and official transition infrastructure as separate artifacts around the structural score.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					<strong>Transition support</strong> is a hybrid layer: deterministic transition-capacity scoring
					plus official Singapore programme and training-system anchors (Jobs Transformation Maps, SkillsFuture
					/ WSG programmes, WSQ activity). It is published separately from the structural score and should
					be read as decision support, not observed mobility data.
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					<strong>Not yet implemented:</strong> Occupation-level employment data (MOM OED, not publicly
					released; requested from agencies), company-size modifiers (startup vs enterprise context),
					and job postings pipeline for real-time demand signals.
				</p>
			</section>

			<!-- Synthetic Roles -->
			<section class="mb-8">
				<p class={sectionLabel()}>Synthetic Role Methodology</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Modern job titles (AI Engineer, Product Manager, Prompt Engineer) don't map to a single
					official SSOC occupation. We estimate scores by blending 2-4 official occupations with
					weights reflecting the typical task composition of each modern role, then applying a
					bounded workflow-context adjustment so the result is not treated as a flat occupation
					average.
				</p>
				<div class="mt-3 space-y-2 text-sm text-muted-foreground">
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground">Composition</p>
						<p class="mt-1">
							Each synthetic role defines component SSOC occupations and weights (e.g., Startup CTO
							= 40% Software Manager + 30% Solution Architect + 30% Software Developer). Scores are
							built from weighted structural primitives. Workflow context then adjusts the role's
							net-risk estimate and uncertainty range, but the published exposure, bottleneck,
							market resilience, and augmentation remain formula-consistent with the structural
							model. All component SSOC codes are validated against the occupations dataset.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground">Dispersion</p>
						<p class="mt-1">
							When component occupations have very different risk scores, the weighted average may
							not represent any single reality. For roles with high dispersion (stddev &gt; 0.08),
							we show the full risk range. That range is widened further when the workflow overlay
							says the role is highly context-sensitive, so founder, gig, and hybrid GTM roles do
							not get a false sense of precision.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-foreground">Confidence</p>
						<p class="mt-1">
							Confidence is role-native, not hardcoded. It depends on component coverage, component
							agreement, primary-match distance, and workflow variant sensitivity. Founder, gig, and
							independent-role families are capped below High confidence even when the component
							blend is tight. Use component occupation pages for the strongest underlying evidence.
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
								<th class="py-2 pr-3 font-medium text-text-secondary">Level</th>
								<th class="py-2 pr-3 font-medium text-text-secondary">Exposure Adj.</th>
								<th class="py-2 pr-3 font-medium text-text-secondary">Bottleneck Adj.</th>
								<th class="py-2 font-medium text-text-secondary">Research Basis</th>
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
					seniority than low-sensitivity roles (e.g., truck driver: 0.15). These outlook adjustments
					are applied as latent percentile shifts rather than raw linear additions, so extreme tail
					occupations are compressed instead of being moved unrealistically.
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
								<th class="py-2 pr-3 font-medium text-text-secondary">Parameter</th>
								<th class="py-2 pr-3 font-medium text-text-secondary">Value</th>
								<th class="py-2 font-medium text-text-secondary">Details</th>
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
								<td class="py-2 pr-3">0.45 &ndash; 0.7</td>
								<td class="py-2">Confidence score between 0.45 and 0.7 published as "Medium"</td>
							</tr>
							<tr class="border-b border-border/50">
								<td class="py-2 pr-3 font-medium">Confidence: low</td>
								<td class="py-2 pr-3">&lt; 0.45</td>
								<td class="py-2">Confidence score below 0.45 published as "Low"</td>
							</tr>
							<tr>
								<td class="py-2 pr-3 font-medium">Demand resilience weighting</td>
								<td class="py-2 pr-3">0.45</td>
								<td class="py-2"
									><code class="rounded bg-muted px-1 text-xs"
										>demand_resilience = min(1.0, base_resilience &times; 0.45 +
										demand_signal_bonus)</code
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
						<strong>Estimated occupation employment</strong> —
						<code class="rounded bg-muted px-1 text-xs">estimated_sg_employment_thousands</code>
						is derived from published Labour Force 2024 sub-major totals, not official per-occupation
						headcounts. Wage-pool analysis separately uses a labeled BLS-weighted proxy rather than pretending
						this estimate is measured employment.
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
			<!-- TL;DR -->
			<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mb-6')}>
				<p class="text-sm font-semibold text-foreground">TL;DR</p>
				<p class="mt-1 text-sm text-muted-foreground">
					{researchLibrary.entry_count} research entries + {dataSourceCount} data sources. The live V6
					model now absorbs the prior upgrade stack plus the new two-axis demand-resilience formulation:
					Felten AIOE, Pizzinelli complementarity, Anthropic observed usage and labour-market work, Eloundou
					GPT exposure, ILO occupational exposure, task-mode weighting, concentration effects, mobility
					priors, and latent-source uncertainty.
				</p>
			</div>

			<!-- Claims Matrix -->
			<section class="mb-8">
				<p class={sectionLabel()}>Claims We Make</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Every public claim on the site is tracked with its evidence source and strength.
				</p>
				<div class="mt-3 space-y-2">
					{#each publicClaims as item (item.id)}
						<div class="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2">
							<span
								class="shrink-0 h-2 w-2 rounded-full {item.strength === 'high'
									? 'bg-risk-very-low'
									: item.strength === 'medium'
										? 'bg-risk-moderate'
										: item.strength === 'directional'
											? 'bg-primary'
											: item.strength === 'estimated'
												? 'bg-risk-high'
												: 'bg-muted-foreground'}"
							></span>
							<div class="flex-1 min-w-0">
								<p class="text-xs text-foreground">{item.claim}</p>
								<p class="text-xs text-muted-foreground">
									{item.source_keys.join(', ')}
								</p>
							</div>
							<span
								class="text-xs font-medium shrink-0 {item.strength === 'high'
									? 'text-risk-very-low'
									: item.strength === 'medium'
										? 'text-risk-moderate'
										: item.strength === 'directional'
											? 'text-primary'
											: item.strength === 'estimated'
												? 'text-risk-high'
												: 'text-muted-foreground'}"
							>
								{item.strength}
							</span>
						</div>
					{/each}
				</div>
			</section>

			<!-- References -->
			<section class="mb-8">
				<p class={sectionLabel()}>Research Registry</p>
				<p class="mt-2 text-sm text-muted-foreground">
					The methodology now reads from the same canonical research registry as the reports, data
					page, and archived roadmap pages. Use <a
						href="/research"
						class="text-primary hover:underline">/research</a
					>
					for the full source library and repo notes.
				</p>
				<div class="mt-4 space-y-6">
					<div>
						<p class="text-sm font-semibold text-foreground">Active core</p>
						<div class="mt-3 grid gap-3 lg:grid-cols-2">
							{#each activeCoreResearch as entry (entry.key)}
								<div class={card({ padding: 'sm' })}>
									<p class="text-sm font-medium text-foreground">{entry.title}</p>
									<p class="mt-1 text-xs text-muted-foreground">
										{entry.authors.join(', ')} · {entry.publisher} · {entry.published_at}
									</p>
									<p class="mt-2 text-sm text-muted-foreground">{entry.summary}</p>
									<a
										href={entry.url}
										target="_blank"
										rel="noopener noreferrer"
										class="mt-2 inline-block text-xs text-primary hover:underline"
									>
										Open source →
									</a>
								</div>
							{/each}
						</div>
					</div>
					<div>
						<p class="text-sm font-semibold text-foreground">
							Validation and next-horizon references
						</p>
						<div class="mt-3 grid gap-3 lg:grid-cols-2">
							{#each [...validationResearch, ...nextHorizonResearch.slice(0, 6)] as entry (entry.key)}
								<div class={card({ padding: 'sm', variant: 'inset' })}>
									<p class="text-sm font-medium text-foreground">{entry.title}</p>
									<p class="mt-1 text-xs text-muted-foreground">
										{entry.publisher} · {entry.published_at}
									</p>
									<p class="mt-2 text-sm text-muted-foreground">{entry.repo_notes}</p>
									<a
										href={entry.url}
										target="_blank"
										rel="noopener noreferrer"
										class="mt-2 inline-block text-xs text-primary hover:underline"
									>
										Open source →
									</a>
								</div>
							{/each}
						</div>
					</div>
				</div>
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
						<p class="font-medium text-text-secondary">
							Individual AI exposure scores are poor predictors of actual unemployment
						</p>
						<p class="mt-1 text-xs">
							Frank et al. (2025, PNAS Nexus) found that single exposure measures "misrepresent AI's
							impact" — but an ensemble of multiple measures accounts for 18% more variation in
							actual outcomes.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-text-secondary">Research is "still in the first inning"</p>
						<p class="mt-1 text-xs">
							Brookings/PIIE (2026) reports no consensus on how to measure AI's labour market
							impact. BLS employment projections show only weak correlation between AI exposure and
							projected job decline.
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-text-secondary">
							No clear aggregate displacement through 2025
						</p>
						<p class="mt-1 text-xs">
							Yale Budget Lab finds no aggregate displacement signal. But entry-level pressure in
							exposed occupations is emerging (Stanford "Canaries in the Coal Mine," 2025).
						</p>
					</div>
					<div class={card({ padding: 'sm' })}>
						<p class="font-medium text-text-secondary">
							Our approach: structural pressure model, not prediction
						</p>
						<p class="mt-1 text-xs">
							We measure where AI has the most technical overlap with human tasks, adjusted for
							human bottlenecks and market signals. Validated directionally at cluster level ({clusterChecksPassed}/{clusterChecksTotal}
							checks pass vs {siteStatus.live_monitor.labour_monitor_validation_vintage} data) and temporally
							through vacancy rank-order checks, not causally at occupation level.
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
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-text-secondary">
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
					{#each structuralHistory as release, index (release.id)}
						<div class={cn(card({ variant: index === 0 ? 'default' : 'inset', padding: 'sm' }))}>
							<div class="flex items-center justify-between">
								<span
									class={cn(
										'text-sm font-semibold',
										index === 0 ? 'text-foreground' : 'text-text-secondary'
									)}
								>
									{release.version_label}{index === 0 ? ' — Current' : ''}
								</span>
								<span class={index === 0 ? 'text-xs text-muted-foreground' : caption()}
									>{release.display_date}</span
								>
							</div>
							<p class="mt-1 text-sm text-muted-foreground">{release.notes.join(' ')}</p>
						</div>
					{/each}
				</div>
			</section>
		</Tabs.Content>
	</Tabs.Root>

	<div
		class="mt-10 border-t border-border pt-4 flex items-center justify-between text-sm text-muted-foreground"
	>
		<a href="/" class="hover:text-text-secondary">&larr; Back to index</a>
		<a href="/methodology/appendix" class="hover:text-text-secondary"
			>Implementation appendix &rarr;</a
		>
	</div>
</main>
