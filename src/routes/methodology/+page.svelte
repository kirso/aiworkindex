<svelte:head>
	<title>Methodology — Singapore AI Occupation Impact Index</title>
	<meta name="description" content="Three-layer scoring: exposure (AIOE), human bottleneck (theta), and market resilience. Net risk published as risk bands with visible confidence. No LLM in the scoring pipeline." />
	<meta property="og:title" content="Methodology — Singapore AI Occupation Impact Index" />
	<meta property="og:description" content="Three-layer scoring separating technical AI exposure from labor-market displacement. Academic indices, not LLM vibes." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/methodology" />
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
	<nav class="mb-4 text-sm text-gray-400">
		<a href="/" class="hover:text-gray-600">Explorer</a>
		<span class="mx-1">/</span>
		<span class="text-gray-700">Methodology</span>
	</nav>

	<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Methodology</h1>

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

	<p class="mt-4 text-gray-600">
		Our scoring pipeline uses peer-reviewed academic indices and government survey data.
		No LLM assigns a risk score — avoiding the circularity of using AI to score AI replaceability.
		The core formula is fully deterministic: every input is an observable signal from a published dataset.
	</p>

	<!-- Three-layer overview -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Three-Layer System</h2>
		<div class="mt-3 space-y-4">
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h3 class="text-sm font-semibold text-red-700">Layer 1: Exposure</h3>
				<p class="mt-1 text-sm text-gray-600">
					How much does this job overlap with AI capabilities? Per-occupation scoring from the Felten AIOE index.
				</p>
			</div>
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h3 class="text-sm font-semibold text-emerald-700">Layer 2: Human Bottleneck</h3>
				<p class="mt-1 text-sm text-gray-600">
					How much does this job require judgment, presence, and responsibility that resists automation?
					From Pizzinelli theta, computed from O*NET Work Context data.
				</p>
			</div>
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h3 class="text-sm font-semibold text-blue-700">Layer 3: Market Resilience</h3>
				<p class="mt-1 text-sm text-gray-600">
					Is Singapore's labor market for this occupation growing or shrinking?
					Group-level employment and wage trends plus occupation-level wage scarcity proxies.
				</p>
			</div>
		</div>
		<p class="mt-3 text-sm text-gray-500">
			These three layers produce sub-scores, a net risk band, and a visible confidence level — not a single magic number.
		</p>
		<div class="mt-2 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="py-2 pr-3 font-medium text-gray-700">Layer</th>
						<th class="py-2 pr-3 font-medium text-gray-700">Measures</th>
						<th class="py-2 font-medium text-gray-700">Source</th>
					</tr>
				</thead>
				<tbody class="text-gray-600">
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Exposure</td>
						<td class="py-2 pr-3">AI capability overlap with job abilities</td>
						<td class="py-2">Felten AIOE (2021), percentile-ranked</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Human Bottleneck</td>
						<td class="py-2 pr-3">Judgment, presence, responsibility that resists automation</td>
						<td class="py-2">Pizzinelli theta from O*NET (2023), percentile-ranked</td>
					</tr>
					<tr class="border-b border-gray-100">
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
		<h2 class="text-lg font-semibold text-gray-900">The Formula</h2>
		<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
			net_risk = pctile(aioe) &times; (1 - pctile(theta)) &times; market_modifier
		</p>
		<p class="mt-2 text-sm text-gray-600">
			Where:
		</p>
		<ul class="mt-1 list-inside list-disc space-y-0.5 text-sm text-gray-600">
			<li><code class="rounded bg-gray-100 px-1 text-xs">market_modifier = 1 - 0.35 &times; market_resilience</code></li>
			<li><code class="rounded bg-gray-100 px-1 text-xs">market_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity</code></li>
		</ul>
		<p class="mt-2 text-sm text-gray-500 italic">
			The market modifier only dampens risk (it is always &le; 1.0). Weak markets don't amplify risk beyond the technical signal — they simply provide less buffer. Maximum reduction: 35%.
		</p>
	</section>

	<!-- Layer 1 details -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Layer 1: Exposure</h2>

		<div class="mt-4 rounded-lg border border-gray-200 bg-white p-5">
			<h3 class="font-semibold text-gray-900">AIOE (AI Occupational Exposure)</h3>
			<p class="mt-1 text-sm text-gray-600">
				From Felten, Raj &amp; Seamans (2021). Maps 10 AI application areas to 52 human abilities to
				occupations via O*NET. Measures how much a job's required abilities overlap with current AI capabilities.
				Available for ~774 US occupations by 6-digit SOC code.
			</p>
			<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
				exposure = percentile_rank(aioe) across all matched occupations
			</p>
			<p class="mt-2 text-sm text-gray-500">Scale: 0 (lowest percentile) to 1 (highest percentile)</p>
			<p class="mt-1 text-sm text-gray-500 italic">What it does NOT measure: whether exposure leads to augmentation or replacement.</p>
		</div>
	</section>

	<!-- Layer 2 details -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Layer 2: Human Bottleneck (Theta)</h2>

		<div class="mt-4 rounded-lg border border-gray-200 bg-white p-5">
			<h3 class="font-semibold text-gray-900">Pizzinelli Theta (Complementarity)</h3>
			<p class="mt-1 text-sm text-gray-600">
				From Pizzinelli et al. (2023, IMF). Computed from 12 O*NET variables across 6 dimensions.
				Higher theta = stronger human bottleneck = harder to substitute.
			</p>
			<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600">
				<li>
					<strong>Communication</strong>: Face-to-Face Discussions
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.1.a.2.l</code>,
					Public Speaking
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.1.a.2.c</code>
				</li>
				<li>
					<strong>Responsibility</strong>: Outcomes/Results
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.1.c.2</code>,
					Health/Safety of Others
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.1.c.1</code>
				</li>
				<li>
					<strong>Physical Conditions</strong>: Outdoors
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.2.a.1.c</code>,
					Physical Proximity
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.2.a.3</code>
				</li>
				<li>
					<strong>Criticality</strong>: Consequence of Errors
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.3.a.1</code>,
					Decision Freedom
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.3.a.4</code>,
					Decision Frequency
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.3.a.2.b</code>
				</li>
				<li>
					<strong>Routine</strong> (inverted): Degree of Automation
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.3.b.2</code> (inverted),
					Structured vs. Unstructured Work
					<code class="rounded bg-gray-100 px-1 text-xs">4.C.3.b.8</code>
				</li>
				<li>
					<strong>Skills</strong>: O*NET Job Zone (1-5, scaled to 0-1)
				</li>
			</ol>
			<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
				&theta; = mean(6 dimension means, each normalized to 0-1)
			</p>
			<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
				bottleneck = percentile_rank(&theta;) across all matched occupations
			</p>
			<p class="mt-2 text-sm text-gray-500">Scale: 0 (lowest percentile — most automatable) to 1 (highest percentile — strongest human bottleneck)</p>
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
		<h2 class="text-lg font-semibold text-gray-900">Layer 3: Market Resilience</h2>
		<p class="mt-2 text-sm text-gray-600">
			Market data is a <strong>calibrator</strong>, not an override. Employment and wages are lagging
			and confounded. The market layer can reduce net risk by up to 35% — it never amplifies risk
			beyond the technical signal.
		</p>

		<div class="mt-4 space-y-4">
			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Market Momentum (group-level)</h3>
				<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
					market_momentum = mean(pctile(group_empl_cagr), pctile(group_wage_cagr))
				</p>
				<p class="mt-2 text-sm text-gray-600">
					10-year employment CAGR (2015-2025) and 8-year wage CAGR (2015-2023) from MOM data, per major occupation group.
					Percentile-ranked across the 8 major groups.
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Occupation Scarcity (occupation-level)</h3>
				<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
					occupation_scarcity = mean(pctile(log(q75/q25)), pctile(wage_median / group_median))
				</p>
				<p class="mt-2 text-sm text-gray-600">
					Two wage-structure signals: (1) log wage spread (winsorized at 1st/99th percentile) as a scarcity proxy,
					and (2) within-group wage position (above group median = relative specialization).
					Both percentile-ranked across all 562 occupations.
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Combined Market Modifier</h3>
				<div class="mt-2 space-y-2">
					<p class="rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
						market_resilience = 0.6 &times; market_momentum + 0.4 &times; occupation_scarcity
					</p>
					<p class="rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
						market_modifier = 1 - 0.35 &times; market_resilience
					</p>
				</div>
				<p class="mt-2 text-sm text-gray-600">
					Group-level trends get 60% weight (direct measurement). Occupation-level wage structure adds
					within-group differentiation at 40% weight (noisier signal).
					The 0.35 cap means the market layer can reduce net risk by up to 35%.
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Singapore Demand Signals (occupation-level bonuses)</h3>
				<p class="mt-1 text-sm text-gray-600">
					Two MOM data sources provide occupation-level demand flags that boost market resilience:
				</p>
				<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
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
				<p class="mt-2 text-sm text-gray-500 italic">
					Where both signals match (e.g., software developer appears on both SOL and Jobs in Demand), bonuses stack (capped at 1.0).
					SOL is EP/COMPASS-focused (PMET bias); Jobs in Demand offsets this by covering non-PMET roles.
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Anthropic Economic Index (exposure calibration)</h3>
				<p class="mt-1 text-sm text-gray-600">
					Observed AI usage rates from Claude conversations (HuggingFace dataset, Jan 2026 report).
					Calibrates the theoretical AIOE exposure by up to &plusmn;30% based on the gap between
					theoretical and observed AI usage per occupation.
				</p>
				<p class="mt-2 text-sm text-gray-600">
					Applied to 525 of 562 occupations via SOC code crosswalk. Key finding: some occupations
					(data entry, customer service) show higher observed usage than AIOE predicts, while others
					(teachers, software developers) show lower observed usage.
				</p>
				<p class="mt-2 text-sm text-gray-500 italic">
					Used as calibration, not replacement. Anthropic measures Claude usage specifically,
					not universal AI adoption.
				</p>
			</div>
		</div>
	</section>

	<!-- Risk Bands -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Risk Bands</h2>
		<p class="mt-2 text-sm text-gray-600">
			Net risk is published as bands, not pseudo-precise decimals:
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="py-2 pr-3 font-medium text-gray-700">Band</th>
						<th class="py-2 pr-3 font-medium text-gray-700">Range</th>
						<th class="py-2 font-medium text-gray-700">Meaning</th>
					</tr>
				</thead>
				<tbody class="text-gray-600">
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Very Low</td>
						<td class="py-2 pr-3">0.00 &ndash; 0.05</td>
						<td class="py-2">Negligible displacement pressure</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Low</td>
						<td class="py-2 pr-3">0.05 &ndash; 0.15</td>
						<td class="py-2">Limited pressure; AI likely augments</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Moderate</td>
						<td class="py-2 pr-3">0.15 &ndash; 0.30</td>
						<td class="py-2">Mixed; bottlenecks or market provide buffer</td>
					</tr>
					<tr class="border-b border-gray-100">
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
		<h2 class="text-lg font-semibold text-gray-900">Augmentation & Impact Type</h2>
		<p class="mt-2 text-sm text-gray-600">
			A single displacement risk number misses half the story. We compute augmentation potential from the
			<strong>same three layers</strong>, with a different formula:
		</p>
		<div class="mt-2 space-y-2">
			<p class="rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
				displacement_risk = exposure &times; (1 - bottleneck) &times; market_modifier
			</p>
			<p class="rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
				augmentation = exposure &times; bottleneck &times; market_resilience
			</p>
		</div>
		<p class="mt-3 text-sm text-gray-600">
			Crossing displacement with augmentation gives a 2&times;2 <strong>impact type</strong>:
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="py-2 pr-3 font-medium text-gray-700"></th>
						<th class="py-2 pr-3 font-medium text-gray-700">Low Augmentation</th>
						<th class="py-2 font-medium text-gray-700">High Augmentation</th>
					</tr>
				</thead>
				<tbody class="text-gray-600">
					<tr class="border-b border-gray-100">
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
		<h2 class="text-lg font-semibold text-gray-900">Confidence Scores</h2>
		<p class="mt-2 text-sm text-gray-600">
			Every score carries a visible confidence indicator:
		</p>
		<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
			confidence = mean(crosswalk_quality, market_data_granularity, source_freshness)
		</p>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="py-2 pr-3 font-medium text-gray-700">Factor</th>
						<th class="py-2 pr-3 font-medium text-gray-700">High (1.0)</th>
						<th class="py-2 pr-3 font-medium text-gray-700">Medium (0.6)</th>
						<th class="py-2 font-medium text-gray-700">Low (0.3)</th>
					</tr>
				</thead>
				<tbody class="text-gray-600">
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Crosswalk quality</td>
						<td class="py-2 pr-3">Direct ISCO match</td>
						<td class="py-2 pr-3">2-digit sub-major group average</td>
						<td class="py-2">Major group fallback</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Market data granularity</td>
						<td class="py-2 pr-3">Occupation-level wage signals strong</td>
						<td class="py-2 pr-3">Group-level trends only</td>
						<td class="py-2">Sparse group</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">Source freshness</td>
						<td class="py-2 pr-3">All inputs 2023+</td>
						<td class="py-2 pr-3">Mix of 2021 and 2024</td>
						<td class="py-2">Key input >3 years old</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="mt-2 text-sm text-gray-500">
			Published as: <strong>High</strong> (&ge;0.7) / <strong>Medium</strong> (0.4&ndash;0.7) / <strong>Low</strong> (&lt;0.4).
		</p>
		<p class="mt-2 text-sm text-gray-500 italic">
			Note: In v1, market_data_granularity and source_freshness are currently set to uniform values (0.6 and 0.8 respectively)
			across all occupations because we do not yet have occupation-level market signals. Crosswalk quality is the primary
			differentiator of confidence in this version.
		</p>
	</section>

	<!-- Worked example -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Worked Examples</h2>
		<p class="mt-2 text-sm text-gray-600">
			Both occupations score high on AI exposure. But their outcomes differ dramatically because of
			the bottleneck and market layers:
		</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<p class="text-sm font-semibold text-gray-900">Software Developer</p>
				<ul class="mt-2 space-y-1 text-xs text-gray-600">
					<li>Exposure: pctile(aioe) = 0.82 (high)</li>
					<li>Bottleneck: pctile(theta) = 0.71 (strong human bottleneck)</li>
					<li>Market resilience: 0.84 (Professionals: +4.45% CAGR)</li>
					<li>Market modifier: 1 - 0.35 &times; 0.84 = 0.71</li>
					<li>Net risk: 0.82 &times; 0.29 &times; 0.71 = <strong class="text-emerald-700">0.17 (Low)</strong></li>
					<li>Impact type: <strong class="text-blue-700">AI Leveraged</strong></li>
				</ul>
			</div>
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<p class="text-sm font-semibold text-gray-900">Data Entry Clerk</p>
				<ul class="mt-2 space-y-1 text-xs text-gray-600">
					<li>Exposure: pctile(aioe) = 0.88 (very high)</li>
					<li>Bottleneck: pctile(theta) = 0.18 (weak human bottleneck)</li>
					<li>Market resilience: 0.17 (Clerical: -2.82% CAGR)</li>
					<li>Market modifier: 1 - 0.35 &times; 0.17 = 0.94</li>
					<li>Net risk: 0.88 &times; 0.82 &times; 0.94 = <strong class="text-red-600">0.68 (Very High)</strong></li>
					<li>Impact type: <strong class="text-red-600">At Risk</strong></li>
				</ul>
			</div>
		</div>

		<p class="mt-3 text-sm text-gray-500">
			This is why a single "AI exposure score" is misleading. The software developer has higher exposure than many
			"at risk" occupations, yet their job is growing. The three-layer system captures this distinction.
		</p>
	</section>

	<!-- Classification (IMF-style) -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Classification</h2>
		<p class="mt-2 text-sm text-gray-600">
			Building on the IMF framework, occupations are classified into four impact types based on the 2&times;2 matrix of
			displacement risk and augmentation potential:
		</p>
		<div class="mt-3 space-y-2">
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #e15759;"></span>
				<div>
					<p class="text-sm font-medium text-gray-900">At Risk</p>
					<p class="text-sm text-gray-500">High displacement, low augmentation (e.g., data entry, bookkeepers)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #4e79a7;"></span>
				<div>
					<p class="text-sm font-medium text-gray-900">AI Leveraged</p>
					<p class="text-sm text-gray-500">Low displacement, high augmentation (e.g., software developers, surgeons)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #59a14f;"></span>
				<div>
					<p class="text-sm font-medium text-gray-900">Stable</p>
					<p class="text-sm text-gray-500">Low displacement, low augmentation (e.g., electricians, childcare workers)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #f28e2b;"></span>
				<div>
					<p class="text-sm font-medium text-gray-900">Mixed</p>
					<p class="text-sm text-gray-500">High displacement, high augmentation — conflicting signals, outcome depends on adoption path</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Crosswalk -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Crosswalk: Singapore to US Scores</h2>
		<p class="mt-2 text-sm text-gray-600">
			AIOE and theta scores originate from US O*NET data. We map Singapore's SSOC occupations to these scores via:
		</p>
		<ol class="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600">
			<li>SSOC 2020 maps to ISCO-08 unit groups via SingStat concordance</li>
			<li>ISCO-08 maps to US SOC 2010 via BLS crosswalk</li>
			<li>When one ISCO maps to multiple SOC codes, we average the scores</li>
			<li>Fallback 1: 2-digit ISCO sub-major group average (confidence = 0.6)</li>
			<li>Fallback 2: 1-digit major group average (confidence = 0.3)</li>
		</ol>
		<p class="mt-2 text-sm text-gray-500">Current coverage: 89.5% direct match (503/562), 7.1% sub-major fallback (40), 3.4% major fallback (19).</p>
	</section>

	<!-- What this version shows -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">What v1 Shows</h2>
		<p class="mt-2 text-sm text-gray-600">
			v1 implements the full three-layer model: exposure (AIOE percentile), human bottleneck (theta percentile),
			and market resilience (group-level employment/wage trends + occupation-level wage structure).
			Net risk is published as risk bands with visible confidence. Augmentation potential and impact type
			classification are included.
		</p>
		<p class="mt-2 text-sm text-gray-600">
			<strong>Not yet implemented:</strong> Occupation-level employment data (MOM OED, not publicly available)
			and career-stage analysis (informed by Stanford's "Canaries in the Coal Mine" research).
		</p>
	</section>

	<!-- Limitations -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Known Limitations</h2>
		<ul class="mt-2 list-inside list-disc space-y-1.5 text-sm text-gray-600">
			<li><strong>Exposure does not equal displacement</strong> — We model this gap explicitly, but the market translation layer uses heuristics and lagging indicators.</li>
			<li><strong>US-centric ability data</strong> — O*NET surveys US workers. Task composition may differ in Singapore's regulatory and cultural environment.</li>
			<li><strong>Hierarchical market granularity</strong> — Market momentum is major-group level. Occupation-level wage structure adds differentiation but is a scarcity proxy, not direct demand.</li>
			<li><strong>Proportional employment</strong> — Per-occupation employment is group_total / count, not actual counts. Treemap inner cells sized by wage as proxy.</li>
			<li><strong>Static exposure snapshot</strong> — Felten AIOE reflects 2021 AI capabilities. The GenAI AIOE extension partially addresses this.</li>
			<li><strong>Career-stage blind spot</strong> — v1 scores the occupation as a whole. Stanford's Canaries research suggests junior/senior impact differs significantly.</li>
			<li><strong>Crosswalk imprecision</strong> — 10.5% of occupations use fallback scores. Some SSOC occupations are Singapore-specific. Confidence score reflects this.</li>
			<li><strong>Wage-spread ambiguity</strong> — High wage ratio can mean specialization OR seniority ladder. Used at ~16% effective weight in the overall formula.</li>
			<li><strong>Uniform confidence components</strong> — market_data_granularity (0.6) and source_freshness (0.8) are currently uniform across all occupations. Crosswalk quality is the only per-occupation differentiator.</li>
		</ul>
	</section>

	<!-- References -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Academic References</h2>
		<ul class="mt-2 space-y-3 text-sm text-gray-600">
			<li>
				<p class="font-medium text-gray-800">Felten, Raj &amp; Seamans (2021)</p>
				<p>"Occupational, Industry, and Geographic Exposure to Artificial Intelligence: A Novel Dataset and Its Potential Uses." <em>Strategic Management Journal</em>, 42(12), 2195-2217.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Pizzinelli et al. (2023)</p>
				<p>"Labor Market Exposure to AI: Cross-country Differences and Distributional Implications." <em>IMF Working Paper</em> WP/23/216.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">IMF Singapore (2024)</p>
				<p>"Impact of Artificial Intelligence on the Singapore Labor Market." <em>IMF Selected Issues Paper</em> SIP/2024/040.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Eloundou et al. (2023)</p>
				<p>"GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models." <em>arXiv:2303.10130</em>.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Demirer et al. (2025)</p>
				<p>"Canaries in the Coal Mine: Early Signals from AI's Impact on the Labor Market." <em>Stanford Digital Economy Lab</em>.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Ministry of Manpower, Singapore (2025)</p>
				<p>"Jobs in Demand 2025." Released December 30, 2025.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Ministry of Manpower, Singapore (2025)</p>
				<p>"Job Vacancies 2024." Released March 28, 2025.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Ministry of Manpower, Singapore (2025)</p>
				<p>COMPASS Shortage Occupation List (SOL). Released November 2025, effective January 1, 2026.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Anthropic (2026)</p>
				<p>"The Anthropic Economic Index: Economic Primitives." January 15, 2026. Dataset on HuggingFace.</p>
			</li>
		</ul>
	</section>

	<!-- Reproduce -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Reproduce Our Results</h2>
		<p class="mt-2 text-sm text-gray-600">
			The entire scoring pipeline is open source and deterministic:
		</p>
		<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
			bun run scripts/score.ts
		</p>
		<p class="mt-2 text-sm text-gray-500">
			This reads raw data from <code class="rounded bg-gray-100 px-1 text-xs">data/raw/</code>,
			computes all scores, and writes <code class="rounded bg-gray-100 px-1 text-xs">data/occupations.json</code>.
		</p>
	</section>

	<div class="mt-10 border-t border-gray-200 pt-4 text-sm text-gray-400">
		<a href="/" class="hover:text-gray-600">&larr; Back to index</a>
	</div>
</main>
