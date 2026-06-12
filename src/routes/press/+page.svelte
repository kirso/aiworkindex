<script lang="ts">
	import { pageLayout, sectionLabel, title as titleStyle, sectionNumber } from '$lib/design-system';
	import { DATA_VINTAGE, SITE } from '$lib/data/scoring-constants';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { cn } from '$lib/utils';

	const citationYear = new Date(DATA_VINTAGE.last_updated).getFullYear();
	const bibtex = `@misc{aiworkindex,
  author = {So, Kirill},
  title  = {AI Work Index (${DATA_VINTAGE.model_version}): structural AI displacement pressure for ${DATA_VINTAGE.occupation_count} Singapore occupations},
  year   = {${citationYear}},
  url    = {${SITE.url}},
  note   = {Data vintage ${DATA_VINTAGE.last_updated}}
}`;
</script>

<Seo
	title="Press & Citation"
	description="How to cite the AI Work Index, what the numbers mean (and don't), data access, and contact for journalists and researchers."
	path="/press"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Press & Citation' }]} />

	<h1 class={titleStyle({ size: 'page' })}>Press &amp; Citation</h1>
	<p class="mt-3 max-w-3xl text-[17px] leading-snug text-text-secondary">
		The AI Work Index scores {DATA_VINTAGE.occupation_count} Singapore occupations and {DATA_VINTAGE.role_count}
		modern roles for structural AI displacement pressure, using a fully deterministic, open-source pipeline
		built on public data. Every score on this site can be reproduced from raw inputs with one command.
	</p>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>01</span>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-0.5')}>How to describe the numbers</h2>
		</div>
		<p class="text-sm text-muted-foreground">
			The headline score is <strong class="text-foreground"
				>structural pressure, not a prediction of job loss</strong
			>. Accurate phrasings: &ldquo;X% of this occupation&rsquo;s tasks overlap with current AI
			capability, adjusted for human bottlenecks and local demand&rdquo; or &ldquo;higher structural
			AI pressure than N% of Singapore occupations&rdquo;. Please avoid: &ldquo;X% chance of losing
			your job&rdquo;, &ldquo;X jobs will be lost&rdquo;, or any framing that treats the score as a
			forecast. The research record so far shows displacement arriving through slower hiring of new
			entrants, wage compression, and role redesign — not layoffs.
		</p>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>02</span>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-0.5')}>Cite</h2>
		</div>
		<p class="text-sm text-muted-foreground">
			So, K. ({citationYear}). <em>AI Work Index</em> ({DATA_VINTAGE.model_version} release).
			{SITE.url} — data vintage {DATA_VINTAGE.last_updated}.
		</p>
		<pre
			class="mt-3 overflow-x-auto border border-border bg-muted p-3 font-mono text-xs text-text-secondary">{bibtex}</pre>
		<p class="mt-3 text-sm text-muted-foreground">
			Attribution is required (MIT licensed). Link to the occupation page you reference so readers
			can see the evidence, ranges, and caveats behind the single number.
		</p>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>03</span>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-0.5')}>Data, methods, independence</h2>
		</div>
		<ul class="space-y-2 text-sm text-muted-foreground">
			<li>
				<strong class="text-foreground">Downloads</strong> — full datasets (JSON/CSV), the release
				manifest with checksums, and every validation artifact are on the
				<a href="/data" class="text-primary hover:underline">data page</a>.
			</li>
			<li>
				<strong class="text-foreground">Methodology</strong> — formulas, thresholds, validation
				results (including the honest negatives), and version history are on the
				<a href="/methodology" class="text-primary hover:underline">methodology page</a>; exact
				constants in the
				<a href="/methodology/appendix" class="text-primary hover:underline">appendix</a>.
			</li>
			<li>
				<strong class="text-foreground">Reproducibility</strong> — the pipeline is deterministic (no
				LLM assigns any score) and open source at
				<a
					href={SITE.github}
					target="_blank"
					rel="noopener noreferrer"
					class="text-primary hover:underline">GitHub</a
				>.
			</li>
			<li>
				<strong class="text-foreground">Independence</strong> — self-funded; no sponsors,
				advertisers, or commercial relationships with data providers. Corrections are public in the
				<a href="/changelog" class="text-primary hover:underline">changelog</a>.
			</li>
		</ul>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>04</span>
			<h2 class={cn(titleStyle({ size: 'section' }), 'mt-0.5')}>Contact</h2>
		</div>
		<p class="text-sm text-muted-foreground">
			Built and maintained by <strong class="text-foreground">{SITE.author}</strong>. For
			interviews, data questions, or corrections:
			<a
				href="https://www.linkedin.com/in/kirso/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">LinkedIn</a
			>
			·
			<a
				href="{SITE.github}/issues"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">GitHub issues</a
			>. Custom cuts of the data for stories are possible — the pipeline is parameterized.
		</p>
		<p class={cn(sectionLabel(), 'mt-6')}>
			Current release: {DATA_VINTAGE.model_version} · {DATA_VINTAGE.last_updated} · {DATA_VINTAGE.validation_checks}
			automated validation checks
		</p>
	</section>

	<PageFooterNav
		links={[
			{ href: '/about', label: 'About & model card' },
			{ href: '/data', label: 'Data downloads' },
			{ href: '/methodology', label: 'Methodology' }
		]}
	/>
</main>
