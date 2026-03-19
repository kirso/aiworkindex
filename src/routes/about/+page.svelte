<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';

	const aboutJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'What is the AI Work Index?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: `The AI Work Index scores ${DATA_VINTAGE.occupation_count} Singapore occupations and ${DATA_VINTAGE.role_count} modern roles for AI displacement risk using a three-layer model: exposure (Felten AIOE), human bottleneck (Pizzinelli theta), and market resilience (MOM data). No LLM is used in the scoring pipeline.`
				}
			},
			{
				'@type': 'Question',
				name: 'How is the AI job risk score calculated?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Net displacement risk = AI exposure × (1 − human bottleneck) × market modifier. Exposure comes from the Felten AIOE academic index, bottleneck from Pizzinelli theta (O*NET work context), and market resilience from Singapore MOM employment and wage data.'
				}
			},
			{
				'@type': 'Question',
				name: 'Is the AI Work Index open source?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: `Yes. The entire scoring pipeline, data, and website are MIT licensed and available on GitHub at ${SITE.github}. Anyone can reproduce the results by running the deterministic scoring script.`
				}
			}
		]
	})}<\/script>`;
</script>

<Seo
	title="About"
	description="About the AI Work Index: purpose, model card, data sources, and credits. Open-source, MIT licensed."
	path="/about"
	jsonLd={[aboutJsonLd]}
/>

<main class={pageLayout({ width: 'prose' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

	<h1 class={titleStyle({ size: 'page' })}>About This Project</h1>
	<p class="mt-2 text-muted-foreground">
		The AI Work Index scores {DATA_VINTAGE.occupation_count} occupations and {DATA_VINTAGE.role_count}
		modern roles for AI displacement risk. It uses a three-layer model — exposure, human bottleneck, and
		market resilience — grounded in peer-reviewed academic indices and official Singapore government data.
	</p>
	<p class="mt-2 text-muted-foreground">
		This is a structural score of AI pressure, not a prediction of exact job losses. No LLM is used
		in the scoring pipeline. The model separates technical exposure from labour-market displacement
		— a software developer and a data entry clerk can both score high on AI exposure yet have very
		different outcomes.
	</p>

	<!-- Key context boxes -->
	<div
		class={cn(card({ padding: 'sm' }), 'mt-4 border-risk-moderate-border bg-risk-moderate-subtle')}
	>
		<p class="text-sm font-medium text-foreground">This model measures one side of the equation</p>
		<p class="mt-1 text-sm text-foreground/80">
			In the
			<a
				href="https://www.aeaweb.org/articles?id=10.1257/jep.33.2.3"
				target="_blank"
				rel="noopener noreferrer"
				class="underline">Acemoglu &amp; Restrepo (2019)</a
			>
			framework, AI's net impact = displacement − reinstatement. We measure displacement only. Scores
			likely overstate net risk for occupations where AI creates new work.
		</p>
	</div>

	<div
		class={cn(
			card({ padding: 'sm' }),
			'mt-3 border-impact-leveraged-border bg-impact-leveraged-subtle'
		)}
	>
		<p class="text-sm font-medium text-foreground">State of the science (early 2026)</p>
		<ul class="mt-1.5 space-y-1 text-sm text-foreground/80">
			<li>
				Single exposure scores are poor unemployment predictors — ensembles do better (<a
					href="http://www.yongyeol.com/papers/frank2025ai.pdf"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">Frank et al., 2025</a
				>)
			</li>
			<li>
				No consensus on measurement — "<a
					href="https://www.brookings.edu/articles/research-on-ai-and-the-labor-market-is-still-in-the-first-inning/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline">still in the first inning</a
				>" (Brookings/PIIE, 2026)
			</li>
			<li>Entry-level workers face earliest pressure (Stanford DEL, 2025; Anthropic, 2026)</li>
		</ul>
	</div>

	<!-- Model Card — the good part, keeping it -->
	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Model Card</p>
		<div class="mt-3">
			<div class={card({ padding: 'sm' })}>
				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-very-low">
							Exact / Validated
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>Ensemble exposure (AIOE + Anthropic, equal-weight)</li>
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
							<li>BLS cross-validation (&rho; = &minus;0.13, directional only)</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-impact-leveraged">
							Synthetic / Illustrative
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>Modern role estimates (weighted SSOC blends, medium confidence)</li>
							<li>Transition scores (heuristic feasibility estimates)</li>
							<li>Outlook/scenario modelling (rule-based, not predictive)</li>
							<li>Seniority modifiers (research-grounded, not validated)</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-very-high">
							Not Validated
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>Occupation-level backtesting (cluster-level only: 3/4 pass)</li>
							<li>Company-size modifiers (not yet implemented)</li>
							<li>Causal displacement claims (directional correlation only)</li>
							<li>Occupation-level employment data (not publicly available)</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Data Vintage -->
	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Data Vintage</p>
		<div class="mt-3 grid gap-2 sm:grid-cols-2">
			<div class={card({ padding: 'sm', variant: 'flat' })}>
				<p class={caption({ weight: 'medium' })}>Wages</p>
				<p class="text-sm text-foreground">{DATA_VINTAGE.wages} MOM data</p>
			</div>
			<div class={card({ padding: 'sm', variant: 'flat' })}>
				<p class={caption({ weight: 'medium' })}>Demand Signals</p>
				<p class="text-sm text-foreground">{DATA_VINTAGE.demand_signals}</p>
			</div>
			<div class={card({ padding: 'sm', variant: 'flat' })}>
				<p class={caption({ weight: 'medium' })}>Labour Market</p>
				<p class="text-sm text-foreground">{DATA_VINTAGE.labour_monitor}</p>
			</div>
			<div class={card({ padding: 'sm', variant: 'flat' })}>
				<p class={caption({ weight: 'medium' })}>Model Version</p>
				<p class="text-sm text-foreground">
					{DATA_VINTAGE.model_version} · {DATA_VINTAGE.validation_checks} checks
				</p>
			</div>
		</div>
	</section>

	<!-- Inspiration & What We Do Differently -->
	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Inspiration & How We Differ</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Inspired by
			<a
				href="https://karpathy.ai/jobs/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:underline">Andrej Karpathy's AI Job Exposure Map</a
			>
			(March 2026) and
			<a
				href="https://joshkale.github.io/jobs/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:underline">Josh Kale's extended visualization</a
			>, which score 342 US occupations using LLM-generated ratings (Gemini Flash, 0–10 scale).
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			<strong>What we do differently:</strong>
		</p>
		<ul class="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
			<li>
				<strong>No LLM in scoring</strong> — we use peer-reviewed academic indices (Felten AIOE, Pizzinelli
				theta), not LLM-generated subjective ratings
			</li>
			<li>
				<strong>Singapore-specific</strong> — SSOC occupational classification, MOM demand signals (SOL
				2026, Jobs in Demand), Singapore labour market data
			</li>
			<li>
				<strong>Three-layer decomposition</strong> — we separate AI exposure from human bottleneck from
				market resilience, not a single composite score
			</li>
			<li>
				<strong>Validated</strong> — cluster-level backtesting against actual labour outcomes (3/4 directional
				checks pass), 49 structural checks
			</li>
			<li>
				<strong>Seniority modifiers</strong> — research-grounded experience level adjustments (Stanford
				DEL, Anthropic 2026)
			</li>
			<li>
				<strong>80 synthetic roles</strong> — modern job titles (AI Engineer, Prompt Engineer) scored
				as weighted SSOC blends
			</li>
		</ul>
	</section>

	<!-- License + Credits -->
	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>License & Credits</p>
		<p class="mt-2 text-sm text-muted-foreground">
			MIT License. Adaptable for other countries via ISCO-08 crosswalks.
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Made by
			<a
				href="https://www.linkedin.com/in/kirso/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:underline">Kirill So</a
			>
			with
			<a
				href="https://www.anthropic.com"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:underline">Claude</a
			>
			(Anthropic) &amp;
			<a
				href="https://openai.com"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium text-primary hover:underline">Codex</a
			>
			(OpenAI). Data from MOM, Felten et al. (2021), Pizzinelli et al. (2023), O*NET, Anthropic Economic
			Index, and Stanford DEL.
		</p>
	</section>

	<div
		class="mt-10 border-t border-border pt-4 flex items-center justify-between text-sm text-muted-foreground"
	>
		<a href="/" class="hover:text-foreground">&larr; Home</a>
		<div class="flex items-center gap-3">
			<a href="/methodology" class="hover:text-foreground">Methodology</a>
			<a href="/methodology/appendix" class="hover:text-foreground">Appendix</a>
			<a href="/data" class="hover:text-foreground">Data</a>
		</div>
	</div>
</main>
