<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, pageLayout, sectionLabel, title } from '$lib/design-system';
	import { globalMethodology } from '$lib/data/global-methodology';
	import { cn } from '$lib/utils';

	const evidenceQuestions = [
		{
			title: 'What can current AI do?',
			answer:
				'Task and capability studies estimate technical overlap. They do not measure adoption or employment effects.',
			examples: 'ILO refined exposure index; lab capability evaluations'
		},
		{
			title: 'How is AI actually used?',
			answer:
				'Observed-use studies show which tasks people delegate, share with AI or keep human-led. Platform samples are selective.',
			examples: 'Anthropic Economic Index; OpenAI Signals; Microsoft telemetry'
		},
		{
			title: 'What changes in the labour market?',
			answer:
				'Hiring, wages, hours, entry routes and employment can move differently and at different speeds.',
			examples: 'Administrative records, employer data, household surveys and job postings'
		},
		{
			title: 'Why can outcomes differ from exposure?',
			answer:
				'Prices, demand, regulation, investment, firm redesign, worker mobility and new tasks mediate the result.',
			examples: 'Labour economics, productivity research and institutional context'
		}
	];
</script>

<Seo
	title="Global Research on AI, Jobs and Employment Economics"
	description="A current evidence map for AI task exposure, observed use, productivity, hiring, wages and employment. No global occupation risk scores are published."
	path="/global"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Global research context' }]} />

	<header class="max-w-4xl border-b-2 border-foreground pb-6">
		<p class={sectionLabel()}>Research context · no global rankings</p>
		<h1 class={title({ size: 'page' })}>
			What global evidence can and cannot tell us about AI and jobs
		</h1>
		<p class="mt-3 max-w-3xl text-base leading-relaxed text-text-secondary">
			AI changes tasks before it cleanly changes occupation counts. Technical capability, actual
			use, firm adoption, productivity, hiring, wages and employment are separate parts of the
			story. We review them together, but do not manufacture a global job-risk score from
			incompatible data.
		</p>
	</header>

	<div class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-6')}>
		<p class="text-sm font-bold">Current publication boundary</p>
		<p class="mt-1 text-sm leading-relaxed text-text-secondary">
			Singapore SSOC 2024 is the only live V9 scored market. The United States remains a frozen
			evidence preview. Global studies inform interpretation and validation; they do not change a
			Singapore occupation's pressure rank.
		</p>
	</div>

	<section class="mt-10">
		<div class="border-b border-foreground pb-2">
			<p class={sectionLabel()}>Four different questions</p>
			<h2 class={title({ size: 'section' })}>
				A complete picture needs more than an exposure score
			</h2>
		</div>
		<div class="mt-3 grid gap-px bg-border md:grid-cols-2">
			{#each evidenceQuestions as item, index}
				<article class="bg-card p-5">
					<p class="font-mono text-xs font-bold text-muted-foreground">0{index + 1}</p>
					<h3 class="mt-1 text-base font-bold">{item.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
					<p class="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
						{item.examples}
					</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="mt-10 grid gap-6 lg:grid-cols-2">
		<div>
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>What recent research agrees on</p>
				<h2 class={title({ size: 'section' })}>Pressure is real; outcomes are conditional</h2>
			</div>
			<ul class="mt-3 space-y-3 text-sm leading-relaxed text-text-secondary">
				<li class="border-l-2 border-border pl-3">
					Generative AI can already perform or assist parts of many cognitive jobs, with large
					differences across tasks.
				</li>
				<li class="border-l-2 border-border pl-3">
					Use is concentrated and selective. Product telemetry describes users of particular
					systems, not the whole workforce.
				</li>
				<li class="border-l-2 border-border pl-3">
					Early labour effects can appear in hiring composition and entry-level opportunities
					without an immediate fall in total employment.
				</li>
				<li class="border-l-2 border-border pl-3">
					Productivity gains can reduce labour needed per task while lower prices and new demand
					expand the amount of work.
				</li>
				<li class="border-l-2 border-border pl-3">
					Institutional details such as regulation, bargaining power, training, mobility and firm
					design shape who gains and who bears the pressure.
				</li>
			</ul>
		</div>
		<div>
			<div class="border-b border-foreground pb-2">
				<p class={sectionLabel()}>Common errors</p>
				<h2 class={title({ size: 'section' })}>Do not turn one signal into a forecast</h2>
			</div>
			<ul class="mt-3 space-y-3 text-sm leading-relaxed text-text-secondary">
				<li class="border-l-2 border-risk-moderate pl-3">
					<strong class="text-foreground">Exposure ≠ automation.</strong> A task may be technically exposed
					but rarely delegated.
				</li>
				<li class="border-l-2 border-risk-moderate pl-3">
					<strong class="text-foreground">Automation ≠ job loss.</strong> Jobs are bundles of tasks and
					demand can change.
				</li>
				<li class="border-l-2 border-risk-moderate pl-3">
					<strong class="text-foreground">No aggregate effect ≠ no harm.</strong> Effects may be concentrated
					by age, seniority, firm or occupation.
				</li>
				<li class="border-l-2 border-risk-moderate pl-3">
					<strong class="text-foreground">Job postings ≠ employment.</strong> Posting data have duplicates,
					coverage shifts and platform-selection bias.
				</li>
				<li class="border-l-2 border-risk-moderate pl-3">
					<strong class="text-foreground">A demo ≠ durable productivity.</strong> Reliability, integration
					and supervision costs matter.
				</li>
			</ul>
		</div>
	</section>

	<section class="mt-10">
		<div class="border-b border-foreground pb-2">
			<p class={sectionLabel()}>Country evidence inventory</p>
			<h2 class={title({ size: 'section' })}>What is published</h2>
		</div>
		<div class="mt-3 grid gap-px bg-border sm:grid-cols-2">
			{#each globalMethodology.countryReadiness as country}
				<article class="min-w-0 bg-card p-4">
					<div class="flex min-w-0 items-start justify-between gap-3">
						<h3 class="text-sm font-bold">{country.title}</h3>
						<span
							class="shrink-0 border border-border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide"
							>{country.readiness}</span
						>
					</div>
					<p class="mt-2 break-words text-xs leading-relaxed text-muted-foreground">
						{country.primary_sources.join(' · ')}
					</p>
					{#if country.code === 'sg'}<a
							class="mt-3 inline-block text-xs font-medium text-primary hover:underline"
							href="/sg">Open Singapore V9</a
						>{/if}
					{#if country.code === 'us'}<a
							class="mt-3 inline-block text-xs font-medium text-primary hover:underline"
							href="/us">Open US Preview</a
						>{/if}
				</article>
			{/each}
		</div>
	</section>

	<div class="mt-10 flex flex-wrap gap-4 border-t-2 border-foreground pt-5 text-sm font-medium">
		<a class="text-primary hover:underline" href="/research">Review the full research library</a>
		<a class="text-primary hover:underline" href="/reports/job-market-evidence"
			>Read the current job-market evidence report</a
		>
		<a class="text-primary hover:underline" href="/methodology">See how V9 separates the evidence</a
		>
	</div>
</main>
