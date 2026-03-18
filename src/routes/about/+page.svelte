<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
</script>

<svelte:head>
	<title>About — Singapore AI Occupation Impact Index</title>
	<meta
		name="description"
		content="Data sources, credits, and license for the Singapore AI Occupation Impact Index. Three layers of AI impact: exposure, human bottleneck, and market resilience. Open-source, MIT licensed."
	/>
	<meta property="og:title" content="About — Singapore AI Occupation Impact Index" />
	<meta
		property="og:description"
		content="Data sources, credits, and license. Open-source, MIT licensed."
	/>
	<meta property="og:url" content="https://sg-ai-jobs.vercel.app/about" />
</svelte:head>

<main class={pageLayout({ width: 'prose' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

	<h1 class={titleStyle({ size: 'page' })}>About This Project</h1>
	<p class="mt-2 text-muted-foreground">
		The Singapore AI Occupation Index scores 562 occupations and 80 modern roles for AI displacement
		risk. It uses a three-layer model — exposure, human bottleneck, and market resilience — grounded
		in peer-reviewed academic indices and official Singapore government data.
	</p>
	<p class="mt-2 text-muted-foreground">
		This is a structural score of AI pressure, not a prediction of exact job losses. No LLM is used
		in the scoring pipeline — avoiding the circularity of using AI to score AI replaceability. The
		model explicitly separates technical exposure from labour-market displacement, because a
		software developer and a data entry clerk can both score high on AI exposure yet have very
		different outcomes.
	</p>
	<p class="mt-2 text-muted-foreground">
		Labour market context is updated quarterly using MOM data (latest: Q4 2025 advance release). The
		scoring pipeline is open source and fully deterministic.
	</p>

	<!-- Displacement vs Reinstatement framing -->
	<div
		class={cn(
			card({ padding: 'sm', variant: 'default' }),
			'mt-4 border-risk-moderate-border bg-risk-moderate-subtle'
		)}
	>
		<p class="text-sm font-medium text-foreground">
			Important: This model measures one side of the equation
		</p>
		<p class="mt-1 text-sm text-foreground/80">
			In the <a
				href="https://www.aeaweb.org/articles?id=10.1257/jep.33.2.3"
				target="_blank"
				rel="noopener noreferrer"
				class="underline">Acemoglu &amp; Restrepo (2019)</a
			>
			framework, AI's net impact = <strong>displacement</strong> - <strong>reinstatement</strong>.
			We measure displacement potential (how much AI overlaps with existing tasks). We do
			<em>not</em> capture the reinstatement effect — new tasks and roles that AI creates. This means
			our scores likely overstate net job risk for occupations where AI generates new work.
		</p>
	</div>

	<!-- State of the Science -->
	<div
		class={cn(
			card({ padding: 'sm', variant: 'default' }),
			'mt-4 border-impact-leveraged-border bg-impact-leveraged-subtle'
		)}
	>
		<p class="text-sm font-medium text-foreground">State of the science (as of early 2026)</p>
		<ul class="mt-2 space-y-1.5 text-sm text-foreground/80">
			<li>
				Individual AI exposure scores are poor predictors of actual unemployment (<a
					href="http://www.yongyeol.com/papers/frank2025ai.pdf"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">Frank et al., 2025</a
				>) — ensembles of multiple measures do better
			</li>
			<li>
				Research is "<a
					href="https://www.brookings.edu/articles/research-on-ai-and-the-labor-market-is-still-in-the-first-inning/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">still in the first inning</a
				>" with no consensus on measurement (Brookings/PIIE, 2026)
			</li>
			<li>
				No clear aggregate displacement through 2025 (<a
					href="https://budgetlab.yale.edu/research/labor-market-ai-exposure-what-do-we-know"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">Yale Budget Lab</a
				>)
			</li>
			<li>
				Entry-level workers in exposed occupations show earliest pressure signals (Stanford DEL,
				2025)
			</li>
			<li>
				Our approach: structural pressure model, validated directionally at cluster level, not
				causally
			</li>
		</ul>
	</div>

	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Data Sources</p>
		<ul class="mt-3 space-y-3 text-sm text-muted-foreground">
			<li>
				<p class="font-medium text-foreground/80">Singapore Occupation Data</p>
				<p>
					Ministry of Manpower (MOM) — 562 occupations with SSOC codes, titles, wage distributions
					(25th/median/75th percentile), and employment estimates. Based on 2024 published data.
				</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">AIOE Scores</p>
				<p>
					Felten, Raj &amp; Seamans (2021) — AI Occupational Exposure index. Published dataset
					covering ~800 US occupations via O*NET ability mapping.
				</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">O*NET Data</p>
				<p>
					O*NET OnLine (US Department of Labor) — Work Context survey data and Job Zone
					classifications used to compute the complementarity (theta) score. CC-BY 4.0 license.
				</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Crosswalk Tables</p>
				<p>
					BLS SOC-to-ISCO crosswalk and SingStat SSOC-to-ISCO concordance tables for mapping
					Singapore occupations to US scores.
				</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">MOM Shortage Occupation List (SOL) 2026</p>
				<p>
					Ministry of Manpower — Occupation-level shortage flags used in market resilience.
					Effective January 1, 2026.
				</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Anthropic Economic Index (2025-2026)</p>
				<p>
					Observed AI usage rates by occupation from Claude conversations. Used as exposure
					calibration layer.
				</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">MOM Labour Market Report (Q3 2025)</p>
				<p>
					Ministry of Manpower — Quarterly vacancy rates, recruitment/resignation rates,
					retrenchment counts and incidence, and re-entry into employment by occupation cluster.
					Released December 2025.
				</p>
			</li>
			<li>
				<p class="font-medium text-foreground/80">Stanford "Canaries in the Coal Mine" (2025)</p>
				<p>
					Demirer et al. — Early signals from AI's impact on the labor market. Research informing
					career-stage impact analysis.
				</p>
			</li>
		</ul>
	</section>

	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Technical Stack</p>
		<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
			<li>SvelteKit + Svelte 5 (static site generation via adapter-static)</li>
			<li>D3.js for layout computation (treemap, scales — no DOM manipulation)</li>
			<li>Tailwind CSS v4 for styling</li>
			<li>TypeScript scoring pipeline (runs via Bun)</li>
			<li>Deployed on Vercel</li>
		</ul>
	</section>

	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Model Card</p>
		<div class="mt-3 space-y-3">
			<div class={card({ padding: 'sm' })}>
				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-very-low">
							Exact / Validated
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>AIOE exposure scores (peer-reviewed, deterministic)</li>
							<li>Theta complementarity scores (O*NET survey data)</li>
							<li>Net risk formula (fully reproducible)</li>
							<li>Official demand signals (SOL 2026, Jobs in Demand)</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-moderate">
							Estimated / Group-Level
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>Market resilience (group-level employment + wage heuristics)</li>
							<li>Crosswalk quality (US occupations mapped to SG)</li>
							<li>Labour monitor (cluster-level, not occupation-level)</li>
							<li>Anthropic calibration (Claude usage, not universal AI)</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-impact-leveraged">
							Synthetic / Illustrative
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>Modern role estimates (weighted blends of official occupations)</li>
							<li>Transition scores (heuristic feasibility estimates)</li>
							<li>Outlook/scenario modelling (rule-based, not predictive)</li>
							<li>Personalized AI impact content (archetype-based)</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-very-high">
							Not Validated
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>
								Occupation-level backtesting (cluster-level only: 3/4 directional checks pass)
							</li>
							<li>Career-stage heterogeneity (junior vs senior impact)</li>
							<li>Causal displacement claims (directional correlation only)</li>
							<li>Occupation-level employment data (not publicly available)</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>License</p>
		<p class="mt-2 text-sm text-muted-foreground">
			This project is released under the MIT License. The code and methodology are designed to be
			adaptable for other countries via ISCO-08 crosswalks — see the repository for a country
			adapter template.
		</p>
	</section>

	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Credits</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Made by <a
				href="https://www.linkedin.com/in/kirso/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:text-primary/80">Kirill So</a
			>
			in collaboration with
			<a
				href="https://www.anthropic.com"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:text-primary/80">Claude</a
			>
			(Anthropic) &amp;
			<a
				href="https://openai.com"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:text-primary/80">Codex</a
			> (OpenAI).
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Built with data from Singapore's Ministry of Manpower, academic research by Felten et al.
			(2021) and Pizzinelli et al. (2023), the O*NET program from the US Department of Labor,
			observed AI usage data from the Anthropic Economic Index, and insights from Stanford Digital
			Economy Lab's "Canaries in the Coal Mine" research (2025).
		</p>
	</section>

	<div class="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
		<a href="/" class="hover:text-muted-foreground">&larr; Back to index</a>
		<span class="mx-2">&middot;</span>
		<a href="/methodology" class="hover:text-muted-foreground">Methodology</a>
	</div>
</main>
