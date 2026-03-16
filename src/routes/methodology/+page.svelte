<svelte:head>
	<title>Methodology — Singapore AI Occupation Impact Index</title>
	<meta name="description" content="Two-stage scoring: technical substitution (AIOE + theta + task share) then market translation (demand, regulation, physicality). AI exposure and displacement are different objects." />
	<meta property="og:title" content="Methodology — Singapore AI Occupation Impact Index" />
	<meta property="og:description" content="Two-stage scoring separating technical AI exposure from labor-market displacement. Academic indices, not LLM vibes." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/methodology" />
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<nav class="mb-6 text-sm text-gray-500">
		<a href="/" class="hover:text-gray-700">Home</a>
		<span class="mx-1">/</span>
		<span class="text-gray-900">Methodology</span>
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
			separate technical exposure from market translation using a two-stage system.
		</p>
	</div>

	<p class="mt-4 text-gray-600">
		Our scoring pipeline uses peer-reviewed academic indices and government survey data.
		No LLM assigns a risk score — avoiding the circularity of using AI to score AI replaceability.
	</p>

	<!-- Two-stage overview -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Two-Stage System</h2>
		<div class="mt-3 space-y-4">
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h3 class="text-sm font-semibold text-blue-700">Stage 1: Technical Substitution</h3>
				<p class="mt-1 text-sm text-gray-600">
					How much of this job <em>could</em> AI do? Deterministic, per-occupation scoring from academic indices.
				</p>
			</div>
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<h3 class="text-sm font-semibold text-emerald-700">Stage 2: Market Translation</h3>
				<p class="mt-1 text-sm text-gray-600">
					How much of that technical potential <em>will</em> translate to actual displacement?
					Factors: demand strength, hiring shortages, regulation, physicality.
				</p>
			</div>
		</div>
		<p class="mt-3 text-sm text-gray-500">
			This produces four visible axes per occupation, not one magic number:
		</p>
		<div class="mt-2 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="py-2 pr-3 font-medium text-gray-700">Axis</th>
						<th class="py-2 pr-3 font-medium text-gray-700">Measures</th>
						<th class="py-2 font-medium text-gray-700">Source</th>
					</tr>
				</thead>
				<tbody class="text-gray-600">
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Exposure</td>
						<td class="py-2 pr-3">AI capability overlap with job abilities</td>
						<td class="py-2">Felten AIOE (2021)</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Task Share</td>
						<td class="py-2 pr-3">% of core tasks AI can perform today</td>
						<td class="py-2">LLM-structured decomposition, deterministic scoring</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3 font-medium">Market Resilience</td>
						<td class="py-2 pr-3">Human bottlenecks + demand + regulation</td>
						<td class="py-2">O*NET + MOM data</td>
					</tr>
					<tr>
						<td class="py-2 pr-3 font-medium">Net Displacement Risk</td>
						<td class="py-2 pr-3">Combined estimate with confidence</td>
						<td class="py-2">Composite formula</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Stage 1 details -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Stage 1: Technical Substitution</h2>

		<div class="mt-4 space-y-6">
			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">AIOE (AI Occupational Exposure)</h3>
				<p class="mt-1 text-sm text-gray-600">
					From Felten, Raj &amp; Seamans (2021). Maps 10 AI application areas to 52 human abilities to
					occupations via O*NET. Measures how much a job's required abilities overlap with current AI capabilities.
					Available for ~800 US occupations by 6-digit SOC code.
				</p>
				<p class="mt-2 text-sm text-gray-500">Scale: continuous, 0 (no overlap) to 1 (full overlap)</p>
				<p class="mt-1 text-sm text-gray-500 italic">What it does NOT measure: whether exposure leads to augmentation or replacement.</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Theta (Complementarity)</h3>
				<p class="mt-1 text-sm text-gray-600">
					From Pizzinelli et al. (2023, IMF). Computed from 12 O*NET variables across 6 dimensions:
				</p>
				<ol class="mt-2 list-inside list-decimal space-y-0.5 text-sm text-gray-600">
					<li>Communication: face-to-face discussions, public speaking</li>
					<li>Responsibility: outcomes/results, health/safety of others</li>
					<li>Physical conditions: outdoor work, physical proximity</li>
					<li>Criticality: consequence of errors, decision freedom, decision frequency</li>
					<li>Routine (inverted): degree of automation, structured vs. unstructured work</li>
					<li>Skills: O*NET Job Zone (1-5, scaled to 20-100)</li>
				</ol>
				<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
					&theta; = mean(6 dimension means) / 100
				</p>
				<p class="mt-2 text-sm text-gray-500">Scale: 0 (fully automatable) to 1 (strongly human-complementary)</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">C-AIOE (Combined Exposure Score)</h3>
				<p class="mt-1 text-sm text-gray-600">
					The IMF's complementarity-adjusted AIOE, used to score occupations in 142 countries:
				</p>
				<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
					C-AIOE = AIOE &times; (1 - (&theta; - &theta;<sub>min</sub>))
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Automatable Task Share (v1.1)</h3>
				<p class="mt-1 text-sm text-gray-600">
					Per-occupation task decomposition: Claude Sonnet breaks each role into 5-8 core tasks with time-weight
					percentages and classifies each against a fixed rubric (routine-cognitive, routine-manual, creative,
					interpersonal, physical). Run 3 times; majority vote per task. Exposed task share = sum of time-weights
					for routine-cognitive and routine-manual tasks.
				</p>
				<p class="mt-2 text-sm text-gray-500 italic">
					The LLM produces structured JSON. It never assigns a risk score. All scoring is deterministic.
				</p>
			</div>

			<div class="rounded-lg border border-gray-200 bg-white p-5">
				<h3 class="font-semibold text-gray-900">Technical Substitution Score</h3>
				<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
					technical_substitution = geometric_mean(c_aioe, exposed_task_share)
				</p>
				<p class="mt-2 text-sm text-gray-600">
					Geometric mean because both signals must be present. A surgeon (high C-AIOE, low task share) and
					a manual assembler (low C-AIOE, high task share) both score lower than a data entry clerk (high on both).
				</p>
			</div>
		</div>
	</section>

	<!-- Stage 2 details -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Stage 2: Market Translation (v1.1)</h2>
		<p class="mt-2 text-sm text-gray-600">
			Technical substitution potential doesn't directly predict job loss. Stage 2 models the
			<strong>market buffer</strong> — factors that dampen or accelerate translation from exposure to displacement.
		</p>

		<div class="mt-4 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="py-2 pr-3 font-medium text-gray-700">Subfactor</th>
						<th class="py-2 pr-3 font-medium text-gray-700">Source</th>
						<th class="py-2 font-medium text-gray-700">Weight</th>
					</tr>
				</thead>
				<tbody class="text-gray-600">
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3">Complementarity (&theta;)</td>
						<td class="py-2 pr-3">Pizzinelli theta (from Stage 1)</td>
						<td class="py-2">0.25</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3">Demand Strength</td>
						<td class="py-2 pr-3">MOM Jobs in Demand 2025, Job Vacancies 2024</td>
						<td class="py-2">0.25</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3">Hiring Shortage</td>
						<td class="py-2 pr-3">MOM employment trends 2020-2025</td>
						<td class="py-2">0.20</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-3">Regulation / Licensing</td>
						<td class="py-2 pr-3">O*NET: consequence of errors, health/safety responsibility</td>
						<td class="py-2">0.15</td>
					</tr>
					<tr>
						<td class="py-2 pr-3">Physicality</td>
						<td class="py-2 pr-3">O*NET: outdoor work, physical proximity</td>
						<td class="py-2">0.15</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="mt-4 space-y-2">
			<p class="rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
				market_buffer = weighted_mean(complementarity, demand, shortage, regulation, physicality)
			</p>
			<p class="rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
				net_displacement_risk = technical_substitution &times; (1 - market_buffer)
			</p>
		</div>

		<p class="mt-3 text-sm text-gray-500 italic">
			Labor market data is a calibrator, not an override. Employment and wages are lagging and confounded.
			They dampen or elevate risk — they don't erase the exposure layer.
		</p>
	</section>

	<!-- Worked example -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Why It Matters: Software Developer vs Data Entry Clerk</h2>
		<p class="mt-2 text-sm text-gray-600">
			Both score high on AI exposure. But their outcomes differ dramatically:
		</p>

		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<p class="text-sm font-semibold text-gray-900">Software Developer</p>
				<ul class="mt-2 space-y-1 text-xs text-gray-600">
					<li>AIOE: 0.82 (high exposure)</li>
					<li>Task share: ~35% automatable</li>
					<li>Market buffer: 0.62 (MOM in-demand, growing employment)</li>
					<li>Net displacement risk: <strong class="text-emerald-700">0.17 (low)</strong></li>
				</ul>
			</div>
			<div class="rounded-lg border border-gray-200 bg-white p-4">
				<p class="text-sm font-semibold text-gray-900">Data Entry Clerk</p>
				<ul class="mt-2 space-y-1 text-xs text-gray-600">
					<li>AIOE: 0.88 (very high exposure)</li>
					<li>Task share: ~85% automatable</li>
					<li>Market buffer: 0.21 (declining demand, low complementarity)</li>
					<li>Net displacement risk: <strong class="text-red-600">0.66 (high)</strong></li>
				</ul>
			</div>
		</div>

		<p class="mt-3 text-sm text-gray-500">
			This is why a single "AI exposure score" is misleading. The software developer has higher exposure than many
			"at risk" occupations, yet their job is growing. The two-stage system captures this distinction.
		</p>
	</section>

	<!-- Confidence -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Confidence Scores</h2>
		<p class="mt-2 text-sm text-gray-600">
			Every score carries a visible confidence indicator:
		</p>
		<p class="mt-2 rounded bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
			confidence = crosswalk_quality &times; task_consensus &times; data_coverage
		</p>
		<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
			<li><strong>Crosswalk quality</strong>: 1.0 direct ISCO match, 0.7 group average, 0.4 interpolated</li>
			<li><strong>Task consensus</strong>: agreement rate across 3 LLM decomposition passes (v1.1)</li>
			<li><strong>Data coverage</strong>: 1.0 if MOM demand flag exists, 0.7 group-level only, 0.5 no local data</li>
		</ul>
	</section>

	<!-- Classification -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Classification</h2>
		<p class="mt-2 text-sm text-gray-600">
			Following the IMF framework, occupations are classified into three categories based on exposure and complementarity:
		</p>
		<div class="mt-3 space-y-2">
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #e15759;"></span>
				<div>
					<p class="text-sm font-medium text-gray-900">At Risk</p>
					<p class="text-sm text-gray-500">High AI exposure + low complementarity (e.g., data entry, bookkeepers)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #f28e2b;"></span>
				<div>
					<p class="text-sm font-medium text-gray-900">AI Augmented</p>
					<p class="text-sm text-gray-500">High AI exposure + high complementarity (e.g., surgeons, software developers)</p>
				</div>
			</div>
			<div class="flex items-start gap-3">
				<span class="mt-0.5 inline-block h-3 w-3 rounded-sm" style="background-color: #59a14f;"></span>
				<div>
					<p class="text-sm font-medium text-gray-900">Low Impact</p>
					<p class="text-sm text-gray-500">Low AI exposure (e.g., electricians, childcare workers)</p>
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
			<li>Unmapped occupations receive their sub-major group average</li>
		</ol>
		<p class="mt-2 text-sm text-gray-500">Expected coverage: >85% of 562 occupations with direct match.</p>
	</section>

	<!-- v1 vs v1.1 -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">What v1 Shows</h2>
		<p class="mt-2 text-sm text-gray-600">
			v1 implements Stage 1 scores: AIOE, theta, and C-AIOE (technical exposure).
			This matches the granularity used by the IMF in their Singapore analysis.
		</p>
		<p class="mt-2 text-sm text-gray-600">
			<strong>Coming in v1.1:</strong> automatable task share, market resilience subfactors
			(demand strength, hiring shortage, regulation, physicality), net displacement risk, and confidence scores.
			Career-stage analysis (informed by Stanford's "Canaries in the Coal Mine" research) follows in v1.2.
		</p>
	</section>

	<!-- Limitations -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Known Limitations</h2>
		<ul class="mt-2 list-inside list-disc space-y-1.5 text-sm text-gray-600">
			<li><strong>Exposure does not equal displacement</strong> — We model this gap explicitly, but the market translation layer uses heuristics and lagging indicators.</li>
			<li><strong>US-centric ability data</strong> — O*NET surveys US workers. Task composition may differ in Singapore's regulatory and cultural environment.</li>
			<li><strong>Proportional employment</strong> — Per-occupation employment is group_total / count, not actual counts. Treemap inner cells sized by wage as proxy.</li>
			<li><strong>Hierarchical granularity</strong> — Market signals are major-group level with occupation-specific flags where MOM data exists.</li>
			<li><strong>Static exposure snapshot</strong> — Felten AIOE reflects 2021 AI capabilities. The GenAI AIOE extension partially addresses this.</li>
			<li><strong>Career-stage blind spot in v1</strong> — v1 scores the occupation as a whole. Stanford's Canaries research suggests junior/senior impact differs significantly. Addressed in v1.2.</li>
			<li><strong>Crosswalk imprecision</strong> — Some SSOC occupations are Singapore-specific and may not have clean US SOC equivalents. Confidence score reflects this.</li>
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
		</ul>
	</section>

	<div class="mt-10 border-t border-gray-200 pt-4 text-sm text-gray-400">
		<a href="/" class="hover:text-gray-600">&larr; Back to index</a>
	</div>
</main>
