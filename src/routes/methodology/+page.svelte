<script lang="ts">
	import { occupations, impactTypeLabels, riskBandLabels } from '$lib/data';

	const occupationCount = occupations.length;
	const directCount = occupations.filter((occupation) => occupation.match_quality === 'direct').length;
	const submajorFallbackCount = occupations.filter(
		(occupation) => occupation.match_quality === 'submajor_fallback'
	).length;
	const majorFallbackCount = occupations.filter(
		(occupation) => occupation.match_quality === 'major_fallback'
	).length;
	const fallbackCount = submajorFallbackCount + majorFallbackCount;
	const anthropicCoverageCount = occupations.filter(
		(occupation) => occupation.evidence.anthropic_calibrated
	).length;

	function pct(value: number, total: number): string {
		return ((value / total) * 100).toFixed(1);
	}

	function findOccupation(pattern: RegExp) {
		return occupations.find((occupation) => pattern.test(occupation.title));
	}

	const softwareDeveloper = findOccupation(/software developer/i);
	const dataEntryClerk = findOccupation(/data entry clerk/i);
</script>

<svelte:head>
	<title>Methodology — Singapore AI Occupation Impact Index</title>
	<meta name="description" content="Three-layer scoring: exposure (AIOE), human bottleneck (theta), and market resilience. Net risk published as risk bands with visible confidence. No LLM in the scoring pipeline." />
	<meta property="og:title" content="Methodology — Singapore AI Occupation Impact Index" />
	<meta property="og:description" content="Three-layer scoring separating technical AI exposure from labor-market displacement. Academic indices, not LLM vibes." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/methodology" />
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
	<nav class="mb-4 text-sm text-muted-foreground">
		<a href="/" class="hover:text-muted-foreground">Explorer</a>
		<span class="mx-1">/</span>
		<span class="text-foreground/80">Methodology</span>
	</nav>

	<h1 class="text-2xl font-bold text-foreground sm:text-3xl">Methodology</h1>

	<!-- Core insight -->
	<div class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
		<p class="text-sm font-medium text-amber-900">
			AI exposure and job displacement are different objects.
		</p>
		<p class="mt-1 text-sm text-amber-800">
			A software developer and a data entry clerk can both score high on AI exposure, but one gets augmented
			(MOM lists software developers as in-demand in 2025) while the other faces substitution. We deliberately
			separate technical exposure from market translation using a three-layer system.
		</p>
	</div>

	<p class="mt-4 text-muted-foreground">
		Our scoring pipeline uses peer-reviewed academic indices and government survey data.
		No LLM assigns a risk score — avoiding the circularity of using AI to score AI replaceability.
		The core formula is fully deterministic: every input is an observable signal from a published dataset.
	</p>

	<!-- Three-layer overview -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Three-Layer System</h2>
		<div class="mt-3 space-y-4">
			<div class="rounded-lg border border-border bg-card p-4">
				<h3 class="text-sm font-semibold text-red-700">Layer 1: Exposure</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					How much does this job overlap with AI capabilities? Per-occupation scoring from the Felten AIOE index.
				</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<h3 class="text-sm font-semibold text-emerald-700">Layer 2: Human Bottleneck</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					How much does this job require judgment, presence, and responsibility that resists automation?
					From Pizzinelli theta, computed from O*NET Work Context data.
				</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<h3 class="text-sm font-semibold text-blue-700">Layer 3: Market Resilience</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Is Singapore's labor market for this occupation growing or shrinking?
					Group-level employment and wage trends plus occupation-level wage scarcity proxies.
				</p>
			</div>
		</div>
		<p class="mt-3 text-sm text-muted-foreground">
			These three layers produce sub-scores, a net risk band, and a visible confidence level — not a single magic number.
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
						<td class="py-2">Felten AIOE (2021), percentile-ranked</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">Human Bottleneck</td>
						<td class="py-2 pr-3">Judgment, presence, responsibility that resists automation</td>
						<td class="py-2">Pizzinelli theta from O*NET (2023), percentile-ranked</td>
					</tr>
					<tr class="border-b border-border/50">
						<td class="py-2 pr-3 font-medium">Market Resilience</td>
						<td class="py-2 pr-3">Employment momentum + occupation wage scarcity</td>
						<td class="py-2">MOM employment/wage trends + occupation wage structure</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">Net Displacement Risk</td>
						<td class="py-2 pr-3">Published as risk bands (Very Low to Very High) with confidence</td>
						<td class="py-2">Composite formula</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Net Risk Formula -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">The Formula</h2>
		<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
			net_risk = pctile(aioe) &times; (1 - pctile(theta)) &times; market_modifier
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Where:
		</p>
		<ul class="mt-1 list-inside list-disc space-y-0.5 text-sm text-muted-foreground">
			<li><code class="rounded bg-muted px-1 text-xs">market_modifier = 1 - 0.35 &times; market_resilience</code></li>
			<li><code class="rounded bg-muted px-1 text-xs">market_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity</code></li>
		</ul>
		<p class="mt-2 text-sm text-muted-foreground italic">
			The market modifier only dampens risk (it is always &le; 1.0). Weak markets don't amplify risk beyond the technical signal — they simply provide less buffer. Maximum reduction: 35%.
		</p>
	</section>

	<!-- Layer 1 details -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Layer 1: Exposure</h2>

		<div class="mt-4 rounded-lg border border-border bg-card p-5">
			<h3 class="font-semibold text-foreground">AIOE (AI Occupational Exposure)</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				From Felten, Raj &amp; Seamans (2021). Maps 10 AI application areas to 52 human abilities to
				occupations via O*NET. Measures how much a job's required abilities overlap with current AI capabilities.
				Available for ~774 US occupations by 6-digit SOC code.
			</p>
			<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
				exposure = percentile_rank(aioe) across all matched occupations
			</p>
			<p class="mt-2 text-sm text-muted-foreground">Scale: 0 (lowest percentile) to 1 (highest percentile)</p>
			<p class="mt-1 text-sm text-muted-foreground italic">What it does NOT measure: whether exposure leads to augmentation or replacement.</p>
		</div>
	</section>

	<!-- Layer 2 details -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Layer 2: Human Bottleneck (Theta)</h2>

		<div class="mt-4 rounded-lg border border-border bg-card p-5">
			<h3 class="font-semibold text-foreground">Pizzinelli Theta (Complementarity)</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				From Pizzinelli et al. (2023, IMF). Computed from 12 O*NET variables across 6 dimensions.
				Higher theta = stronger human bottleneck = harder to substitute.
			</p>
			<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
				<li>
					<strong>Communication</strong>: Face-to-Face Discussions
					<code class="rounded bg-muted px-1 text-xs">4.C.1.a.2.l</code>,
					Public Speaking
					<code class="rounded bg-muted px-1 text-xs">4.C.1.a.2.c</code>
				</li>
				<li>
					<strong>Responsibility</strong>: Outcomes/Results
					<code class="rounded bg-muted px-1 text-xs">4.C.1.c.2</code>,
					Health/Safety of Others
					<code class="rounded bg-muted px-1 text-xs">4.C.1.c.1</code>
				</li>
				<li>
					<strong>Physical Conditions</strong>: Outdoors
					<code class="rounded bg-muted px-1 text-xs">4.C.2.a.1.c</code>,
					Physical Proximity
					<code class="rounded bg-muted px-1 text-xs">4.C.2.a.3</code>
				</li>
				<li>
					<strong>Criticality</strong>: Consequence of Errors
					<code class="rounded bg-muted px-1 text-xs">4.C.3.a.1</code>,
					Decision Freedom
					<code class="rounded bg-muted px-1 text-xs">4.C.3.a.4</code>,
					Decision Frequency
					<code class="rounded bg-muted px-1 text-xs">4.C.3.a.2.b</code>
				</li>
				<li>
					<strong>Routine</strong> (inverted): Degree of Automation
					<code class="rounded bg-muted px-1 text-xs">4.C.3.b.2</code> (inverted),
					Structured vs. Unstructured Work
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
			<p class="mt-2 text-sm text-muted-foreground">Scale: 0 (lowest percentile — most automatable) to 1 (highest percentile — strongest human bottleneck)</p>
		</div>

		<div class="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-4">
			<p class="text-sm text-amber-800">
				<strong>No double-counting:</strong> We use AIOE and theta as separate, independent layers.
				We do NOT use C-AIOE (which is <code>aioe &times; f(theta)</code>) as an input to net_risk,
				because multiplying by <code>(1 - theta)</code> would double-count complementarity.
				C-AIOE is computed and displayed as a reference score for IMF comparability only.
			</p>
		</div>
	</section>

	<!-- Layer 3 details -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Layer 3: Market Resilience</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Market data is a <strong>calibrator</strong>, not an override. Employment and wages are lagging
			and confounded. The market layer can reduce net risk by up to 35% — it never amplifies risk
			beyond the technical signal.
		</p>

		<div class="mt-4 space-y-4">
			<div class="rounded-lg border border-border bg-card p-5">
				<h3 class="font-semibold text-foreground">Market Momentum (group-level)</h3>
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
					market_momentum = mean(pctile(group_empl_cagr), pctile(group_wage_cagr))
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					10-year employment CAGR (2015-2025) and 8-year wage CAGR (2015-2023) from MOM data, per major occupation group.
					Percentile-ranked across the 8 major groups.
				</p>
			</div>

			<div class="rounded-lg border border-border bg-card p-5">
				<h3 class="font-semibold text-foreground">Occupation Scarcity (occupation-level)</h3>
				<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
					occupation_scarcity = mean(pctile(log(q75/q25)), pctile(wage_median / group_median))
				</p>
				<p class="mt-2 text-sm text-muted-foreground">
					Two wage-structure signals: (1) log wage spread (winsorized at 1st/99th percentile) as a scarcity proxy,
					and (2) within-group wage position (above group median = relative specialization).
					Both percentile-ranked across all 562 occupations.
				</p>
			</div>

			<div class="rounded-lg border border-border bg-card p-5">
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
					Group-level trends get 60% weight (direct measurement). Occupation-level wage structure adds
					within-group differentiation at 40% weight (noisier signal).
					The 0.35 cap means the market layer can reduce net risk by up to 35%.
				</p>
			</div>

			<div class="rounded-lg border border-border bg-card p-5">
				<h3 class="font-semibold text-foreground">Singapore Demand Signals (occupation-level bonuses)</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Two MOM data sources provide occupation-level demand flags that boost market resilience:
				</p>
				<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
					<li>
						<strong>Shortage Occupation List (SOL) 2026</strong>: EP/COMPASS shortage list (released Nov 2025, effective Jan 2026).
						36 occupations across semiconductors, healthcare, ICT, green economy, maritime, agritech, financial services.
						Matched to 62 SSOC codes. <strong>+15% market resilience bonus.</strong>
					</li>
					<li>
						<strong>Jobs in Demand 2025</strong>: Broader resident demand list (released Dec 30, 2025).
						Covers PMET and non-PMET roles: software developers, nurses, waiters, drivers, security officers, auditors.
						Matched to 29 SSOC codes. <strong>+10% market resilience bonus.</strong>
					</li>
				</ul>
				<p class="mt-2 text-sm text-muted-foreground italic">
					Where both signals match (e.g., software developer appears on both SOL and Jobs in Demand), bonuses stack (capped at 1.0).
					SOL is EP/COMPASS-focused (PMET bias); Jobs in Demand offsets this by covering non-PMET roles.
				</p>
			</div>

			<div class="rounded-lg border border-border bg-card p-5">
				<h3 class="font-semibold text-foreground">Labour Monitor (cluster-level evidence layer)</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					We ingest official MOM/SingStat quarterly data from data.gov.sg and compute a unified labour monitor
					for three broad occupation clusters:
				</p>
				<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
					<li><strong>PMET</strong> — Professionals, Managers, Executives &amp; Technicians</li>
					<li><strong>Clerical, Sales &amp; Service Workers</strong></li>
					<li><strong>Production &amp; Transport Operators, Cleaners &amp; Labourers</strong></li>
				</ul>
				<p class="mt-2 text-sm text-muted-foreground">
					Three signals are computed per cluster (where data is available):
				</p>
				<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
					<li><strong>Vacancy rate trend</strong>: 4-quarter-over-4-quarter average trend. Signal: &gt;+5% = heating up (+1), &lt;-5% = cooling down (-1), else stable (0).</li>
					<li><strong>Net hiring pressure</strong>: recruitment rate minus resignation rate (when available). Signal: net &gt;+0.1pp = positive (+1), &lt;-0.1pp = negative (-1), else neutral (0).</li>
					<li><strong>Retrenchment trend</strong>: count and 4Q-over-4Q trend (when available). Falling retrenchment = positive (+1), rising = negative (-1).</li>
				</ol>
				<p class="mt-2 text-sm text-muted-foreground">
					The three signals are summed into an overall label:
				</p>
				<p class="mt-1 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
					total = vacancy_signal + hiring_signal + retrenchment_signal<br/>
					2-3 = "strong" | 1 = "moderate" | 0 = "weak" | &lt;0 = "deteriorating"
				</p>
				<p class="mt-2 text-sm text-muted-foreground italic">
					This is <strong>cluster-level data</strong>, not occupation-level. It provides context about the broad labour market
					conditions for each occupation's cluster, displayed as an evidence layer on occupation pages.
					It is not a scoring input — we show it to ground the analysis in current labour-market reality
					without overfitting a sparse cluster-level series into the per-occupation formula.
				</p>
				<p class="mt-2 text-sm text-muted-foreground italic">
					Data sources: vacancy rates (data.gov.sg, quarterly), recruitment/resignation rates, and retrenchment counts.
					Updated quarterly when new data is published.
				</p>
			</div>

			<div class="rounded-lg border border-border bg-card p-5">
				<h3 class="font-semibold text-foreground">Anthropic Economic Index (exposure calibration)</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Observed AI usage rates from Claude conversations (HuggingFace dataset, Jan 2026 report).
					Calibrates the theoretical AIOE exposure by up to &plusmn;30% based on the gap between
					theoretical and observed AI usage per occupation.
				</p>
					<p class="mt-2 text-sm text-muted-foreground">
						Applied to {anthropicCoverageCount} of {occupationCount} occupations via SOC code crosswalk. Key finding: some occupations
						(data entry, customer service) show higher observed usage than AIOE predicts, while others
						(teachers, software developers) show lower observed usage.
					</p>
				<p class="mt-2 text-sm text-muted-foreground italic">
					Used as calibration, not replacement. Anthropic measures Claude usage specifically,
					not universal AI adoption.
				</p>
			</div>
		</div>
	</section>

	<!-- Risk Bands -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Risk Bands</h2>
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
						<td class="py-2">Significant pressure; weaker bottlenecks and/or declining market</td>
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
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Augmentation & Impact Type</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			A single displacement risk number misses half the story. We compute augmentation potential from the
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
						<td class="py-2 pr-3"><span class="font-semibold text-red-600">At Risk</span> — AI substitutes, weak bottleneck</td>
						<td class="py-2"><span class="font-semibold text-amber-600">Mixed</span> — conflicting signals, high uncertainty</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">Low Displacement</td>
						<td class="py-2 pr-3"><span class="font-semibold text-green-600">Stable</span> — AI has limited overlap</td>
						<td class="py-2"><span class="font-semibold text-blue-600">AI Leveraged</span> — AI amplifies, human essential</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Confidence -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Confidence Scores</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Every score carries a visible confidence indicator:
		</p>
		<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
			confidence = mean(crosswalk_quality, market_data_granularity, source_freshness)
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
							<td class="py-2 pr-3">Direct = 1.0, sub-major fallback = 0.6, major fallback = 0.3, then reduced further by crosswalk dispersion where mapped SOC scores disagree.</td>
							<td class="py-2">0.3 - 1.0</td>
						</tr>
						<tr class="border-b border-border/50">
							<td class="py-2 pr-3 font-medium">Market data granularity</td>
							<td class="py-2 pr-3">Baseline = occupation wage structure + group employment/wage trends. Exact official demand evidence adds more occupation-specific Singapore signal than prefix-inferred or absent demand evidence.</td>
							<td class="py-2">0.65 - 0.85</td>
						</tr>
						<tr>
							<td class="py-2 pr-3 font-medium">Source freshness</td>
							<td class="py-2 pr-3">Baseline reflects a mix of 2021 academic exposure data and recent Singapore labour data. Anthropic observed-usage calibration raises freshness where available.</td>
							<td class="py-2">0.75 - 0.85</td>
						</tr>
					</tbody>
				</table>
			</div>
		<p class="mt-2 text-sm text-muted-foreground">
			Published as: <strong>High</strong> (&ge;0.7) / <strong>Medium</strong> (0.4&ndash;0.7) / <strong>Low</strong> (&lt;0.4).
		</p>
		<p class="mt-2 text-sm text-muted-foreground italic">
			In the current implementation, confidence varies by direct vs fallback crosswalk, exact vs prefix-inferred demand evidence,
			and whether Anthropic observed-usage calibration is available for the matched occupation.
		</p>
	</section>

	<!-- Worked example -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Worked Examples</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Both occupations score high on AI exposure. But their outcomes differ dramatically because of
			the bottleneck and market layers:
		</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg border border-border bg-card p-4">
				<p class="text-sm font-semibold text-foreground">Software Developer</p>
				<ul class="mt-2 space-y-1 text-xs text-muted-foreground">
						{#if softwareDeveloper}
							<li>Exposure: pctile(aioe) = {softwareDeveloper.exposure.toFixed(2)}</li>
							<li>Bottleneck: pctile(theta) = {softwareDeveloper.bottleneck.toFixed(2)}</li>
							<li>Market resilience: {softwareDeveloper.market.market_resilience.toFixed(2)}</li>
							<li>Market modifier: {softwareDeveloper.market.market_modifier.toFixed(2)}</li>
							<li>
								Net risk: <strong class="text-emerald-700">{softwareDeveloper.net_risk.toFixed(2)} ({riskBandLabels[softwareDeveloper.risk_band]})</strong>
							</li>
							<li>Impact type: <strong class="text-blue-700">{impactTypeLabels[softwareDeveloper.impact_type]}</strong></li>
						{/if}
					</ul>
				</div>
				<div class="rounded-lg border border-border bg-card p-4">
					<p class="text-sm font-semibold text-foreground">Data Entry Clerk</p>
					<ul class="mt-2 space-y-1 text-xs text-muted-foreground">
						{#if dataEntryClerk}
							<li>Exposure: pctile(aioe) = {dataEntryClerk.exposure.toFixed(2)}</li>
							<li>Bottleneck: pctile(theta) = {dataEntryClerk.bottleneck.toFixed(2)}</li>
							<li>Market resilience: {dataEntryClerk.market.market_resilience.toFixed(2)}</li>
							<li>Market modifier: {dataEntryClerk.market.market_modifier.toFixed(2)}</li>
							<li>
								Net risk: <strong class="text-red-600">{dataEntryClerk.net_risk.toFixed(2)} ({riskBandLabels[dataEntryClerk.risk_band]})</strong>
							</li>
							<li>Impact type: <strong class="text-red-600">{impactTypeLabels[dataEntryClerk.impact_type]}</strong></li>
						{/if}
					</ul>
				</div>
			</div>

		<p class="mt-3 text-sm text-muted-foreground">
			This is why a single "AI exposure score" is misleading. The software developer has higher exposure than many
			"at risk" occupations, yet their job is growing. The three-layer system captures this distinction.
		</p>
	</section>

	<!-- Classification (IMF-style) -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Classification</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			Building on the IMF framework, occupations are classified into four impact types based on the 2&times;2 matrix of
			displacement risk and augmentation potential:
		</p>
		<div class="mt-3 space-y-2">
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #e15759;"></span>
				<div>
					<p class="text-sm font-medium text-foreground">At Risk</p>
					<p class="text-sm text-muted-foreground">High displacement, low augmentation (e.g., data entry, bookkeepers)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #4e79a7;"></span>
				<div>
					<p class="text-sm font-medium text-foreground">AI Leveraged</p>
					<p class="text-sm text-muted-foreground">Low displacement, high augmentation (e.g., software developers, surgeons)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #59a14f;"></span>
				<div>
					<p class="text-sm font-medium text-foreground">Stable</p>
					<p class="text-sm text-muted-foreground">Low displacement, low augmentation (e.g., electricians, childcare workers)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #f28e2b;"></span>
				<div>
					<p class="text-sm font-medium text-foreground">Mixed</p>
					<p class="text-sm text-muted-foreground">High displacement, high augmentation — conflicting signals, outcome depends on adoption path</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Crosswalk -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Crosswalk: Singapore to US Scores</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			AIOE and theta scores originate from US O*NET data. We map Singapore's SSOC occupations to these scores via:
		</p>
		<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
			<li>SSOC 2020 maps to ISCO-08 unit groups via SingStat concordance</li>
			<li>ISCO-08 maps to US SOC 2010 via BLS crosswalk</li>
			<li>When one ISCO maps to multiple SOC codes, we average the scores</li>
			<li>Fallback 1: 2-digit ISCO sub-major group average (confidence = 0.6)</li>
			<li>Fallback 2: 1-digit major group average (confidence = 0.3)</li>
		</ol>
		<p class="mt-2 text-sm text-muted-foreground">
			Current coverage: {pct(directCount, occupationCount)}% direct match ({directCount}/{occupationCount}),
			{pct(submajorFallbackCount, occupationCount)}% sub-major fallback ({submajorFallbackCount}),
			{pct(majorFallbackCount, occupationCount)}% major fallback ({majorFallbackCount}).
		</p>
	</section>

	<!-- What this version shows -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">What v1 Shows</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			v1 implements the full three-layer model: exposure (AIOE percentile), human bottleneck (theta percentile),
			and market resilience (group-level employment/wage trends + occupation-level wage structure).
			Net risk is published as risk bands with visible confidence. Augmentation potential and impact type
			classification are included.
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			<strong>Not yet implemented:</strong> Occupation-level employment data (MOM OED, not publicly available)
			and career-stage analysis (informed by Stanford's "Canaries in the Coal Mine" research).
		</p>
	</section>

	<!-- Limitations -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Known Limitations</h2>
		<ul class="mt-2 list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
			<li><strong>Exposure does not equal displacement</strong> — We model this gap explicitly, but the market translation layer uses heuristics and lagging indicators.</li>
			<li><strong>US-centric ability data</strong> — O*NET surveys US workers. Task composition may differ in Singapore's regulatory and cultural environment.</li>
			<li><strong>Hierarchical market granularity</strong> — Market momentum is major-group level. Occupation-level wage structure adds differentiation but is a scarcity proxy, not direct demand.</li>
			<li><strong>Proportional employment</strong> — Per-occupation employment is group_total / count, not actual counts. Treemap inner cells sized by wage as proxy.</li>
			<li><strong>Static exposure snapshot</strong> — Felten AIOE reflects 2021 AI capabilities. The GenAI AIOE extension partially addresses this.</li>
			<li><strong>Career-stage blind spot</strong> — v1 scores the occupation as a whole. Stanford's Canaries research suggests junior/senior impact differs significantly.</li>
			<li><strong>Crosswalk imprecision</strong> — {pct(fallbackCount, occupationCount)}% of occupations use fallback scores. Some SSOC occupations are Singapore-specific. Confidence score reflects this.</li>
			<li><strong>Wage-spread ambiguity</strong> — High wage ratio can mean specialization OR seniority ladder. Used at ~16% effective weight in the overall formula.</li>
			<li><strong>Cluster-level labour monitor</strong> — the quarterly vacancy, hiring, and retrenchment signals are official and current, but only available for three broad labour clusters (PMET, clerical/sales/service, production/transport) rather than all 562 occupations. Always labeled as cluster-level data.</li>
		</ul>
	</section>

	<!-- References -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Academic References</h2>
		<ul class="mt-2 space-y-3 text-sm text-muted-foreground">
			<li>
				<p class="font-medium text-foreground/80">Felten, Raj &amp; Seamans (2021)</p>
				<p>"Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses." <em>Strategic Management Journal</em>, 42(12), 2195-2217.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Pizzinelli et al. (2023)</p>
				<p>"Labor Market Exposure to AI: Cross-country Differences and Distributional Implications." <em>IMF Working Paper</em> WP/23/216.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">IMF Singapore (2024)</p>
				<p>"Impact of Artificial Intelligence on the Singapore Labor Market." <em>IMF Selected Issues Paper</em> SIP/2024/040.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Eloundou et al. (2023)</p>
				<p>"GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models." <em>arXiv:2303.10130</em>.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Demirer et al. (2025)</p>
				<p>"Canaries in the Coal Mine: Early Signals from AI's Impact on the Labor Market." <em>Stanford Digital Economy Lab</em>.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Ministry of Manpower, Singapore (2025)</p>
				<p>"Jobs in Demand 2025." Released December 30, 2025.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Ministry of Manpower, Singapore (2025)</p>
				<p>"Job Vacancies 2024." Released March 28, 2025.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Ministry of Manpower, Singapore (2025)</p>
				<p>COMPASS Shortage Occupation List (SOL). Released November 2025, effective January 1, 2026.</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Anthropic (2026)</p>
				<p>"The Anthropic Economic Index: Economic Primitives." January 15, 2026. Dataset on HuggingFace.</p>
			</li>
		</ul>
	</section>

	<!-- Reproduce -->
	<section class="mt-8">
		<h2 class="text-base font-semibold text-foreground">Reproduce Our Results</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			The entire scoring pipeline is open source and deterministic:
		</p>
		<p class="mt-2 rounded bg-muted px-3 py-2 font-mono text-sm text-foreground/80">
			bun run scripts/score.ts
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			This reads raw data from <code class="rounded bg-muted px-1 text-xs">data/raw/</code>,
			computes all scores, and writes <code class="rounded bg-muted px-1 text-xs">data/occupations.json</code>.
		</p>
	</section>

	<div class="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
		<a href="/" class="hover:text-muted-foreground">&larr; Back to index</a>
	</div>
</main>
