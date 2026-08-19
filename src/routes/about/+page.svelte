<script lang="ts">
	import { title as titleStyle, pageLayout, card, sectionLabel, caption } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import FaqList from '$lib/components/ui/FaqList.svelte';
	import { buildFaqJsonLd } from '$lib/data/ranking-jsonld';

	const v9Counts = siteStatus.structural_release.counts;
	const roleLayer = siteStatus.role_query_layer;
	const faqItems = [
		{
			question: 'What does AI Work Pressure mean?',
			answer: `AI Work Pressure is the relative rank of an occupation's ILO-based generative-AI task exposure among ${v9Counts.scored} scored SSOC 2024 occupations. It measures capability overlap, not the probability that a job will disappear.`
		},
		{
			question: 'Does the index predict job losses?',
			answer:
				'No. Employment depends on adoption, reliability, task redesign, product demand, prices, investment, regulation and worker mobility. V9 reports relevant risk evidence separately and leaves unsupported outcomes unknown.'
		},
		{
			question: 'Are the modern role pages official Singapore occupations?',
			answer:
				'Exact titles and explicit reviewed title, synonym or definition matches resolve to one official SSOC 2024 occupation. Genuinely cross-occupation roles use disclosed editorial components; ambiguous labels are withheld.'
		}
	];
	const aboutJsonLd = buildFaqJsonLd(faqItems);
</script>

<Seo
	title="About AI Work Index — Singapore AI Job Pressure"
	description="AI Work Index measures GenAI task pressure across SSOC 2024 occupations and reports job-risk evidence without claiming a probability of displacement."
	path="/about"
	jsonLd={[aboutJsonLd]}
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

	<p class={sectionLabel()}>Singapore · V9</p>
	<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>About AI Work Index</h1>
	<p class="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
		AI Work Index shows where generative AI places greater pressure on occupational tasks and what
		current evidence says about the risk around that pressure. The active product covers Singapore's
		SSOC 2024 occupations. It keeps exposure, wages, demand and labour-market evidence separate.
		Observed-use and complementarity fields remain visibly null when their occupation mapping does
		not pass the evidence gate.
	</p>

	<section class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class="text-2xl font-semibold tabular-nums">{v9Counts.occupations.toLocaleString()}</p>
			<p class={caption()}>SSOC 2024 occupations</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class="text-2xl font-semibold tabular-nums">{v9Counts.scored.toLocaleString()}</p>
			<p class={caption()}>with pressure ranks</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class="text-2xl font-semibold tabular-nums">{roleLayer.count}</p>
			<p class={caption()}>modern-title queries</p>
		</div>
		<div class={card({ padding: 'sm', variant: 'metric' })}>
			<p class="text-2xl font-semibold tabular-nums">19 Aug 2026</p>
			<p class={caption()}>research and data cutoff</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>The product promise</h2>
		<div class={cn(card({ padding: 'lg', variant: 'notice', accent: 'primary' }), 'mt-3')}>
			<p class="text-lg font-semibold text-foreground">
				See which Singapore jobs face more AI pressure, then inspect the evidence that shapes the
				risk.
			</p>
			<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
				Pressure is measurable task exposure. Risk is conditional: firms may automate, redesign,
				expand or create work depending on technical performance, human responsibility, demand and
				adoption. The site uses risk language without presenting an unsupported job-loss
				probability.
			</p>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Four evidence states</h2>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<div class={card({ padding: 'md', accent: 'primary' })}>
				<h3 class="font-semibold text-foreground">Measured</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Official SSOC definitions and mappings, ILO source values, MOM wage rows, vacancy survey
					statistics and published Singapore adoption indicators.
				</p>
			</div>
			<div class={card({ padding: 'md', accent: 'moderate' })}>
				<h3 class="font-semibold text-foreground">Derived</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					The median across official ISCO matches, mapping ranges, and the within-Singapore midrank
					percentile. Every transformation is deterministic and documented.
				</p>
			</div>
			<div class={card({ padding: 'md', accent: 'high' })}>
				<h3 class="font-semibold text-foreground">Modelled</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Non-official modern-role composites. Exact current title matches use the official
					occupation instead. Experimental transition outputs are withheld until their evidence gate
					passes. Published modelled surfaces carry prominent labels, assumptions and sensitivity
					information.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold text-foreground">Unknown</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Detailed AI-caused employment change, occupation-level Singapore AI use, AI salary
					premiums and job-loss probabilities. Missing evidence is never treated as zero.
				</p>
			</div>
		</div>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Why V9 uses one headline source</h2>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			Earlier releases blended exposure, usage, complementarity and market proxies. V9 uses the ILO
			2025 refined GenAI index as the sole headline input because it is current, task-based and
			aligned to ISCO-08. Other sources remain useful, but they measure different constructs. V9
			reserves separate evidence blocks for them; the current external occupation comparisons are
			withheld rather than mapped through an unverifiable bridge.
		</p>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			The build reads the official SSOC 2024 to ISCO-08 correspondence, preserves every candidate,
			uses the median scored ILO match, and publishes the range. It never falls back to a broad
			occupation-group average.
		</p>
		<a href="/methodology" class="mt-3 inline-block text-sm text-primary underline"
			>Read the complete V9 methodology</a
		>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Modern titles resolve before they are estimated</h2>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			Search behaviour and real workplaces use titles that do not map neatly to one official
			occupation. The site keeps {roleLayer.count} modern-title queries over SSOC 2024. The
			{roleLayer.official_match_count} direct reviewed matches resolve to the official record, so the
			site does not publish competing values for the same job. The remaining
			{roleLayer.non_official_count} titles use disclosed composites or publish no mapping when the label
			is too ambiguous.
		</p>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			A non-official composite can show an estimated comparison percentile and component evidence. A
			withheld query shows neither. Neither can claim official SSOC status, a role-level employment
			total, a wage pool, demand level or probability of displacement.
		</p>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Checks that protect the interpretation</h2>
		<ul class="mt-3 grid gap-2 md:grid-cols-2">
			{#each ['Headline ranks use only ILO exposure and official SSOC–ISCO mappings.', 'Sidecars cannot change an occupation’s pressure rank.', 'Missing wages, demand or usage render as unavailable, not zero.', 'Named demand evidence attaches only after a reviewed SSOC 2024 match.', 'Platform evidence identifies its geography and selection limits.', 'Historical reports keep their original method and are marked as archives.', 'Direct reviewed role matches resolve to official occupations before any composite is built.', 'Release artifacts document sources, dates, mapping quality and limitations at their supported grain.'] as check}
				<li class={card({ padding: 'sm' })}>
					<span class="text-sm text-muted-foreground">{check}</span>
				</li>
			{/each}
		</ul>
	</section>

	<FaqList items={faqItems} />

	<section class="mt-10">
		<h2 class={sectionLabel()}>Author and independence</h2>
		<p class="mt-3 text-sm text-foreground">
			AI Work Index is built and maintained by
			<a
				href={SITE.authorUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-primary underline">{SITE.author}</a
			>
			as an independent, self-funded project.
		</p>
		<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
			There are no sponsors, paid placements or commercial relationships with the data providers or
			government agencies cited here. Errors and methodology changes are recorded publicly. Report
			issues through
			<a
				href={`${SITE.github}/issues`}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline">GitHub</a
			>
			or contact the author on LinkedIn.
		</p>
	</section>

	<section class="mt-10">
		<h2 class={sectionLabel()}>Open methods and source rights</h2>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			The scoring build is deterministic and does not call a language model. Project code and
			original editorial material use the licence included in the repository. Official and
			third-party source data keep their own terms and attribution requirements.
		</p>
		<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a href={SITE.github} target="_blank" rel="noopener noreferrer" class="text-primary underline"
				>Source repository</a
			>
			<a href="/data" class="text-primary underline">V9 data and provenance</a>
			<a href="/research" class="text-primary underline">Research register</a>
		</div>
	</section>

	<section class="my-10">
		<h2 class={sectionLabel()}>How to cite V9</h2>
		<p class="mt-3 text-sm text-muted-foreground">
			So, K. (2026). <em
				>AI Work Index V9: Singapore AI Work Pressure across SSOC 2024 occupations</em
			>.
			{SITE.url}. Evidence cutoff 19 August 2026.
		</p>
		<pre
			class="mt-3 overflow-x-auto border border-border bg-muted p-3 font-mono text-xs leading-5 text-muted-foreground"><code
				>@misc&#123;aiworkindex_v9,
  author = &#123;So, Kirill&#125;,
  title  = &#123;AI Work Index V9: Singapore AI Work Pressure across SSOC 2024 occupations&#125;,
  year   = &#123;2026&#125;,
  url    = &#123;{SITE.url}&#125;,
  note   = &#123;Evidence cutoff 19 August 2026&#125;
&#125;</code
			></pre>
	</section>
</main>
