<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import PageFooterNav from '$lib/components/ui/PageFooterNav.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import releaseManifest from '$lib/data/release-manifest.json';
	import { SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import { pageLayout, sectionLabel, sectionNumber, title } from '$lib/design-system';
	import { cn } from '$lib/utils';

	const bibtex = `@misc{aiworkindex_v9,
  author = {So, Kirill},
  title  = {AI Work Index V9: Singapore AI Work Pressure across SSOC 2024 occupations},
  year   = {2026},
  url    = {${SITE.url}},
  note   = {Evidence cutoff 19 August 2026}
}`;
	const v9Counts = siteStatus.structural_release.counts;
	const roleLayer = siteStatus.role_query_layer;
</script>

<Seo
	title="Press and Citation: AI Work Index V9"
	description="How to cite and report AI Work Index V9, including the meaning of AI Work Pressure ranks, current coverage, data access and source-rights limits."
	path="/press"
/>

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Press and citation' }]} />

	<p class={sectionLabel()}>Current release · 19 Aug 2026</p>
	<h1 class={title({ size: 'page' })}>Press and citation</h1>
	<p class="mt-3 max-w-3xl text-[17px] leading-snug text-text-secondary">
		AI Work Index V9 covers {v9Counts.occupations.toLocaleString()} Singapore SSOC 2024 occupations. It
		publishes AI Work Pressure ranks for {v9Counts.scored.toLocaleString()} and withholds {v9Counts.insufficient_evidence.toLocaleString()}
		where evidence is insufficient. A separate layer handles {roleLayer.count} modern-title queries:
		{roleLayer.official_match_count} resolve to official occupations; {roleLayer.estimated_count} have
		non-official estimates; and {roleLayer.withheld_count} remain withheld.
	</p>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>01</span>
			<h2 class={cn(title({ size: 'section' }), 'mt-0.5')}>The one-sentence description</h2>
		</div>
		<p class="text-sm leading-relaxed text-muted-foreground">
			AI Work Index V9 compares the generative-AI task exposure of Singapore occupations using the
			ILO's 2025 refined index mapped through the official SSOC 2024 to ISCO-08 correspondence.
			Wages, demand and labour-market outcomes remain separate evidence. External observed-use and
			complementarity blocks are nullable and currently withheld because their cross-system mapping
			does not pass V9's provenance gate.
		</p>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>02</span>
			<h2 class={cn(title({ size: 'section' }), 'mt-0.5')}>How to report a rank</h2>
		</div>
		<div class="grid gap-5 sm:grid-cols-2">
			<div>
				<p class="text-sm font-bold text-foreground">Accurate</p>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					“An AI Work Pressure Rank of 90 places the occupation at the 90th midrank percentile for
					ILO-based task exposure among scored Singapore occupations.”
				</p>
			</div>
			<div>
				<p class="text-sm font-bold text-foreground">Not supported</p>
				<ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
					<li>“There is a 90% chance this job will disappear.”</li>
					<li>“AI can automate 90% of this occupation.”</li>
					<li>“These workers are 90% at risk.”</li>
					<li>Do not call lower-ranked occupations “AI-proof.”</li>
				</ul>
			</div>
		</div>
		<p class="mt-4 text-sm leading-relaxed text-muted-foreground">
			The rank is a midrank percentile within {v9Counts.scored.toLocaleString()} scored occupations. It
			is not a probability, task share, employment forecast or estimate of people affected.
		</p>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>03</span>
			<h2 class={cn(title({ size: 'section' }), 'mt-0.5')}>Cite V9</h2>
		</div>
		<p class="text-sm text-muted-foreground">
			So, K. (2026). <em
				>AI Work Index V9: Singapore AI Work Pressure across SSOC 2024 occupations</em
			>.
			{SITE.url}. Evidence cutoff 19 August 2026.
		</p>
		<pre
			class="mt-3 max-w-full overflow-x-auto border border-border bg-muted p-3 font-mono text-xs leading-5 text-text-secondary"><code
				>{bibtex}</code
			></pre>
		<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
			Link to the occupation or role page you discuss so readers can inspect the mapping, range,
			sources and record-specific limitations. Direct reviewed SSOC matches use official occupation
			records. Composite role pages must be described as non-official, and a withheld query must not
			be called an estimate.
		</p>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>04</span>
			<h2 class={cn(title({ size: 'section' }), 'mt-0.5')}>Data, method and reproducibility</h2>
		</div>
		<ul class="space-y-2 text-sm leading-relaxed text-muted-foreground">
			<li>
				<strong class="text-foreground">Downloads:</strong> the
				<a href="/data/sg-ai-occupations-v9.json" class="text-primary hover:underline">V9 JSON</a>,
				<a href="/data/sg-ai-occupations-v9.csv" class="text-primary hover:underline">V9 CSV</a>
				and supporting evidence files are listed on the
				<a href="/data" class="text-primary hover:underline">data page</a>.
			</li>
			<li>
				<strong class="text-foreground">Method:</strong> the
				<a href="/methodology" class="text-primary hover:underline">methodology</a> explains the
				construct and limits; the
				<a href="/methodology/appendix" class="text-primary hover:underline">technical appendix</a>
				specifies the calculation and null rules.
			</li>
			<li>
				<strong class="text-foreground">Sources:</strong> the
				<a href="/research" class="text-primary hover:underline">research register</a> records each source's
				role. Only the ILO task-exposure source determines the headline rank.
			</li>
			<li>
				<strong class="text-foreground">Build:</strong> score calculation is deterministic and does
				not call a language model. The current {releaseManifest.version} manifest lists
				{releaseManifest.artifacts.length} published artifacts with checksums.
			</li>
		</ul>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>05</span>
			<h2 class={cn(title({ size: 'section' }), 'mt-0.5')}>Code licence and source-data terms</h2>
		</div>
		<p class="text-sm leading-relaxed text-muted-foreground">
			The MIT License applies to original software in the repository. It does not grant new rights
			to SSOC, ILO, MOM or other official and third-party source material. Those inputs retain their
			own copyright, attribution and licence terms. Review the linked source terms before
			redistributing source-derived fields. Academic or editorial citation of the index is separate
			from software-licence compliance.
		</p>
	</section>

	<section class="mt-10">
		<div class="mb-4 border-b-2 border-foreground pb-2">
			<span class={sectionNumber()}>06</span>
			<h2 class={cn(title({ size: 'section' }), 'mt-0.5')}>Contact</h2>
		</div>
		<p class="text-sm leading-relaxed text-muted-foreground">
			Built and maintained by <strong class="text-foreground">{SITE.author}</strong>. For
			interviews, data questions or corrections, contact via
			<a
				href={SITE.authorUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">LinkedIn</a
			>
			or open a
			<a
				href={`${SITE.github}/issues`}
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline">GitHub issue</a
			>.
		</p>
	</section>

	<PageFooterNav
		links={[
			{ href: '/reports/v9-release', label: 'V9 release report' },
			{ href: '/data', label: 'Data and licensing' },
			{ href: '/methodology', label: 'Methodology' }
		]}
	/>
</main>
