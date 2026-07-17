<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';

	const faqItems = [
		{
			question: 'What is the AI Work Index?',
			answer: `The AI Work Index ranks ${DATA_VINTAGE.occupation_count} Singapore occupations by relative AI exposure and publishes ${DATA_VINTAGE.role_count} synthetic modern-role estimates separately. Demand and adoption inform context and likely pathways, not a hidden headline multiplier. No LLM is used in the scoring pipeline.`
		},
		{
			question: 'How is the AI Exposure Rank calculated?',
			answer:
				'V8 converts a multi-source AI exposure signal into a within-Singapore percentile rank. It separately ranks substitution pressure and augmentation potential. Demand, adoption, attrition and transitions remain visible context. The score is not a probability or employment forecast.'
		},
		{
			question: 'Is the AI Work Index open source?',
			answer: `Yes. The entire scoring pipeline, data, and website are MIT licensed and available on GitHub at ${SITE.github}. Anyone can reproduce the results by running the deterministic scoring script.`
		}
	];

	const aboutJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="About the AI Work Index — Singapore AI Exposure Methodology"
	description="About the V8 AI Work Index: a relative Singapore AI exposure ranking with open methodology, explicit confidence and separate labour-market context."
	path="/about"
	jsonLd={[aboutJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

	<h1 class={titleStyle({ size: 'page' })}>About This Project</h1>

	<!-- TL;DR -->
	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'primary' }), 'mt-4')}>
		<p class="text-sm font-semibold text-foreground">
			{DATA_VINTAGE.occupation_count} occupations · {DATA_VINTAGE.role_count} roles · No LLM in scoring
			· MIT licensed · Singapore occupation methodology
		</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Relative AI exposure rankings with separate demand and adoption context. They are not
			predictions of job losses or probabilities that a role will disappear.
		</p>
	</div>

	<!-- Three signal layers — visual distinction -->
	<div class="mt-6 grid gap-3 sm:grid-cols-3">
		<div class={card({ padding: 'sm', accent: 'high' })}>
			<p class={cn(sectionLabel({ case: 'upper' }), 'text-risk-high')}>AI Exposure Rank</p>
			<p class={cn(caption(), 'mt-1')}>
				A within-Singapore percentile rank of a frozen, multi-source exposure signal. Demand does
				not change the rank.
			</p>
		</div>
		<div class={card({ padding: 'sm', accent: 'moderate' })}>
			<p class={cn(sectionLabel({ case: 'upper' }), 'text-risk-moderate')}>Labour Monitor</p>
			<p class={cn(caption(), 'mt-1')}>
				Quarterly live-market data (Singapore). Vacancy rates, hiring, retrenchment. Cluster-level,
				not per-occupation.
			</p>
		</div>
		<div class={card({ padding: 'sm', accent: 'primary' })}>
			<p class={cn(sectionLabel({ case: 'upper' }), 'text-primary')}>Offset & Support</p>
			<p class={cn(caption(), 'mt-1')}>
				Separate support layers. Offset potential, transition pathways, official skills programmes
				(e.g. SkillsFuture for Singapore), and scenario guidance. Useful context, not a forecast.
			</p>
		</div>
	</div>

	<!-- Key context boxes -->
	<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'moderate' }), 'mt-6')}>
		<p class="text-sm font-medium text-foreground">This model measures one side of the equation</p>
		<p class="mt-1 text-sm text-text-secondary">
			In the
			<a
				href="https://www.aeaweb.org/articles?id=10.1257/jep.33.2.3"
				target="_blank"
				rel="noopener noreferrer"
				class="underline">Acemoglu &amp; Restrepo (2019)</a
			>
			framework, employment outcomes reflect both displacement and new-task creation. This index ranks
			AI exposure; it does not estimate either effect. V8 reports augmentation potential and a likely
			job pathway separately.
		</p>
	</div>

	<details class="mt-3">
		<summary class="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
			Why the index stays cautious
		</summary>
		<div class={cn(card({ padding: 'sm', variant: 'notice', accent: 'leveraged' }), 'mt-2')}>
			<ul class="space-y-1 text-sm text-text-secondary">
				<li>
					Single exposure scores are poor unemployment predictors — ensembles do better (<a
						href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11983276/"
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
				<li>
					Early-career effects are an important research question, but the index does not estimate
					them from occupation exposure alone.
				</li>
			</ul>
		</div>
	</details>

	<!-- Model Card — the good part, keeping it -->
	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Model Card</p>
		<div class="mt-3">
			<div class={card({ padding: 'sm' })}>
				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-very-low">
							Direct / Reproducible
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>
								Reliability-weighted 4-source exposure ensemble when matched (AIOE + Anthropic +
								Eloundou + ILO)
							</li>
							<li>Theta complementarity scores (O*NET survey data)</li>
							<li>Within-market percentile rules (fully reproducible)</li>
							<li>Official demand signals (SOL 2026, Jobs in Demand)</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-moderate">
							Estimated / Group-Level
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>Market resilience (group-level employment trends + occupation wage structure)</li>
							<li>Crosswalk quality (national occupations mapped to ISCO-08)</li>
							<li>Labour monitor (cluster-level, not occupation-level)</li>
							<li>Observed-usage calibration (Anthropic usage, not universal AI adoption)</li>
							<li>
								BLS cross-country check: &rho; = 0.01 across 243 unique mapping signatures; no rank
								association
							</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-impact-leveraged">
							Synthetic / Illustrative
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>Modern role estimates (weighted SSOC priors + workflow/context adjustment)</li>
							<li>
								Transition support (deterministic feasibility estimates + official programme
								infrastructure)
							</li>
							<li>Offset potential (heuristic demand, redesign, and friction layer)</li>
							<li>Outlook/scenario modelling (rule-based guidance, not prediction)</li>
							<li>Seniority modifiers (research-grounded, not independently validated)</li>
						</ul>
					</div>
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-risk-very-high">
							Still Limited
						</p>
						<ul class="mt-1.5 space-y-1 text-sm text-muted-foreground">
							<li>
								Occupation-level backtesting is still limited; current public validation remains
								cluster- and family-level, not occupation-level
							</li>
							<li>Company-size modifiers (not part of the current structural model)</li>
							<li>
								Causal displacement claims are out of scope (current evidence is correlational)
							</li>
							<li>
								Occupation-level employment counts (not publicly released; requested from agencies)
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Data Vintage -->
	<section class="mb-8 mt-8">
		<details>
			<summary class={sectionLabel()}>
				<span class="cursor-pointer hover:text-primary">Data Vintage</span>
			</summary>
			<div class="mt-3 grid gap-2 sm:grid-cols-2">
				<div class={card({ padding: 'sm', variant: 'flat' })}>
					<p class={caption({ weight: 'medium' })}>Wages</p>
					<p class="text-sm text-foreground">{DATA_VINTAGE.wages} MOM data (Singapore)</p>
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
					<p class={caption({ weight: 'medium' })}>Observed AI Usage Input</p>
					<p class="text-sm text-foreground">Anthropic {DATA_VINTAGE.anthropic}</p>
				</div>
				<div class={card({ padding: 'sm', variant: 'flat' })}>
					<p class={caption({ weight: 'medium' })}>Model Version</p>
					<p class="text-sm text-foreground">
						{DATA_VINTAGE.public_version} public contract · {DATA_VINTAGE.validation_checks} checks
					</p>
				</div>
			</div>
		</details>
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
			(2026) and
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
				<strong>No LLM in scoring</strong> — we use deterministic transforms of published research and
				official data, not live model-generated ratings
			</li>
			<li>
				<strong>One live scored market.</strong> Singapore is the V8 reference market; U.S. and global
				occupation scores are withdrawn pending local validation
			</li>
			<li>
				<strong>Separate mechanisms</strong> — change, substitution, augmentation and labour-market context
				are visible rather than collapsed into one opaque probability
			</li>
			<li>
				<strong>Negative results retained</strong> — the deduplicated BLS comparison shows essentially
				no rank association, while internal checks establish reproducibility rather than external validity
			</li>
			<li>
				<strong>No hidden seniority adjustment</strong> — entry-level sensitivity remains unknown until
				a suitable open occupation-level series exists
			</li>
			<li>
				<strong>88 synthetic roles</strong> — modern job titles (AI Engineer, Prompt Engineer) scored
				as weighted occupation blends
			</li>
		</ul>
	</section>

	<FaqList items={faqItems} />

	<!-- Author & Independence (trust block) -->
	<section class="mb-8 mt-8">
		<p class={sectionLabel()}>Author & Independence</p>
		<p class="mt-2 text-sm text-foreground">
			The AI Work Index is built and maintained by
			<a
				href="https://www.linkedin.com/in/kirso/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-primary hover:underline">Kirill So</a
			>
			as an independent project.
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			<strong class="text-foreground">Self-funded, no sponsors.</strong> No advertisers, no paid placements,
			and no commercial relationship with any data provider or government agency. The full pipeline is
			open source and every score is reproducible from public inputs.
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Contact:
			<a
				href="https://www.linkedin.com/in/kirso/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">LinkedIn</a
			>
			·
			<a
				href={`${SITE.github}/issues`}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">GitHub issues</a
			>
			· <a href="/press" class="text-primary hover:underline">Press &amp; citation</a>
		</p>
		<p class="mt-2 text-sm text-muted-foreground">
			Corrections: mistakes are fixed publicly. Every methodology revision and score change is
			recorded in the <a href="/changelog" class="text-primary hover:underline">changelog</a> with per-release
			score diffs.
		</p>
	</section>

	<!-- Citation -->
	<section class="mb-8">
		<p class={sectionLabel()}>How to cite</p>
		<p class="mt-2 text-sm text-muted-foreground">
			So, K. ({new Date(DATA_VINTAGE.last_updated).getFullYear()}). <em>AI Work Index</em>
			({DATA_VINTAGE.model_version}
			release): structural AI displacement pressure for {DATA_VINTAGE.occupation_count} Singapore occupations.
			{SITE.url}
		</p>
		<pre
			class="mt-3 overflow-x-auto border border-border bg-muted p-3 font-mono text-xs text-text-secondary">{`@misc{aiworkindex,
  author = {So, Kirill},
  title  = {AI Work Index (${DATA_VINTAGE.model_version}): structural AI displacement pressure for ${DATA_VINTAGE.occupation_count} Singapore occupations},
  year   = {${new Date(DATA_VINTAGE.last_updated).getFullYear()}},
  url    = {${SITE.url}},
  note   = {Data vintage ${DATA_VINTAGE.last_updated}}
}`}</pre>
	</section>

	<!-- License + Credits -->
	<section class="mb-8">
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
			(OpenAI). Data from MOM, BLS, O*NET, Felten et al. (2021), Pizzinelli et al. (2023), Anthropic Economic
			Index, Eloundou et al. (Science, 2024), ILO, and Stanford DEL.
		</p>
	</section>

	<div
		class="mt-10 border-t border-border pt-4 flex items-center justify-between text-sm text-muted-foreground"
	>
		<a href="/" class="hover:text-foreground">&larr; Home</a>
		<div class="flex items-center gap-3">
			<a href="/methodology" class="hover:text-foreground">Methodology</a>
			<a href="/methodology/appendix" class="hover:text-foreground">Appendix</a>
			<a href="/reports/v7-release" class="hover:text-foreground">V7 Release</a>
			<a href="/data" class="hover:text-foreground">Data</a>
		</div>
	</div>
</main>
