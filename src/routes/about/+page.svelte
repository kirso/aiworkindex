<svelte:head>
	<title>About — Singapore AI Occupation Impact Index</title>
	<meta name="description" content="Data sources, credits, and license for the Singapore AI Occupation Impact Index. Four axes of AI impact. Open-source, MIT licensed." />
	<meta property="og:title" content="About — Singapore AI Occupation Impact Index" />
	<meta property="og:description" content="Data sources, credits, and license. Open-source, MIT licensed." />
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/about" />
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<nav class="mb-6 text-sm text-gray-500">
		<a href="/" class="hover:text-gray-700">Home</a>
		<span class="mx-1">/</span>
		<span class="text-gray-900">About</span>
	</nav>

	<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">About This Project</h1>
	<p class="mt-2 text-gray-600">
		The Singapore AI Occupation Impact Index measures how 562 occupations in Singapore are affected by AI
		across four visible axes: exposure, automatable task share, market resilience, and net displacement risk.
		We use peer-reviewed academic indices instead of LLM self-assessment — because using AI to score
		how replaceable jobs are by AI is methodologically circular.
	</p>
	<p class="mt-2 text-gray-600">
		Inspired by Andrej Karpathy's AI Employment Outlook Map, this project goes further by
		explicitly separating technical exposure from labor-market displacement — because a software developer
		and a data entry clerk can both score high on AI exposure, yet have very different outcomes.
	</p>

	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Data Sources</h2>
		<ul class="mt-3 space-y-3 text-sm text-gray-600">
			<li>
				<p class="font-medium text-gray-800">Singapore Occupation Data</p>
				<p>Ministry of Manpower (MOM) — 562 occupations with SSOC codes, titles, wage distributions (25th/median/75th percentile), and employment estimates. Based on 2024 published data.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">AIOE Scores</p>
				<p>Felten, Raj &amp; Seamans (2021) — AI Occupational Exposure index. Published dataset covering ~800 US occupations via O*NET ability mapping.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">O*NET Data</p>
				<p>O*NET OnLine (US Department of Labor) — Work Context survey data and Job Zone classifications used to compute the complementarity (theta) score. CC-BY 4.0 license.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Crosswalk Tables</p>
				<p>BLS SOC-to-ISCO crosswalk and SingStat SSOC-to-ISCO concordance tables for mapping Singapore occupations to US scores.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">MOM Jobs in Demand 2025</p>
				<p>Ministry of Manpower — Occupation-specific in-demand flags for market resilience scoring. Released December 30, 2025.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">MOM Job Vacancies 2024</p>
				<p>Ministry of Manpower — Occupation-specific demand signals. Released March 28, 2025.</p>
			</li>
			<li>
				<p class="font-medium text-gray-800">Stanford "Canaries in the Coal Mine" (2025)</p>
				<p>Demirer et al. — Early signals from AI's impact on the labor market. Informs career-stage analysis (v1.2).</p>
			</li>
		</ul>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Technical Stack</h2>
		<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
			<li>SvelteKit + Svelte 5 (static site generation via adapter-static)</li>
			<li>D3.js for layout computation (treemap, scales — no DOM manipulation)</li>
			<li>Tailwind CSS v4 for styling</li>
			<li>TypeScript scoring pipeline (runs via Bun)</li>
			<li>Deployed on Vercel</li>
		</ul>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Comparison with Karpathy's Approach</h2>
		<div class="mt-3 overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="py-2 pr-4 font-medium text-gray-700">Dimension</th>
						<th class="py-2 pr-4 font-medium text-gray-700">Karpathy</th>
						<th class="py-2 font-medium text-gray-700">Ours</th>
					</tr>
				</thead>
				<tbody class="text-gray-600">
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-4">Scoring</td>
						<td class="py-2 pr-4">Single LLM call (Gemini Flash)</td>
						<td class="py-2">Multi-signal: academic indices + demand data</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-4">Circularity</td>
						<td class="py-2 pr-4">LLM scores LLM replaceability</td>
						<td class="py-2">No LLM in scoring pipeline</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-4">Axes</td>
						<td class="py-2 pr-4">1 (ad hoc 0-10)</td>
						<td class="py-2">4 (exposure, task share, resilience, risk)</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-4">Detail pages</td>
						<td class="py-2 pr-4">None (links to BLS)</td>
						<td class="py-2">562 rich pages with charts + similar jobs</td>
					</tr>
					<tr class="border-b border-gray-100">
						<td class="py-2 pr-4">Exposure vs displacement</td>
						<td class="py-2 pr-4">Conflated</td>
						<td class="py-2">Explicitly separated (two-stage)</td>
					</tr>
					<tr>
						<td class="py-2 pr-4">Confidence</td>
						<td class="py-2 pr-4">None</td>
						<td class="py-2">Per-occupation confidence score</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">License</h2>
		<p class="mt-2 text-sm text-gray-600">
			This project is released under the MIT License. The code and methodology are designed to be
			adaptable for other countries via ISCO-08 crosswalks — see the repository for a country adapter template.
		</p>
	</section>

	<section class="mt-8">
		<h2 class="text-lg font-semibold text-gray-900">Credits</h2>
		<p class="mt-2 text-sm text-gray-600">
			Built with data from Singapore's Ministry of Manpower, academic research by Felten et al. (2021)
			and Pizzinelli et al. (2023), the O*NET program from the US Department of Labor,
			and insights from Stanford Digital Economy Lab's "Canaries in the Coal Mine" research (2025).
		</p>
	</section>

	<div class="mt-10 border-t border-gray-200 pt-4 text-sm text-gray-400">
		<a href="/" class="hover:text-gray-600">&larr; Back to index</a>
		<span class="mx-2">&middot;</span>
		<a href="/methodology" class="hover:text-gray-600">Methodology</a>
	</div>
</main>
