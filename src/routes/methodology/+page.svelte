<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { card, pageLayout, title, sectionLabel, body, caption, mono } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import { siteStatus } from '$lib/data/site-status';
	const v9Counts = siteStatus.structural_release.counts;

	const iloCategories = [
		'Not Exposed',
		'Minimal Exposure',
		'Exposed: Gradient 1',
		'Exposed: Gradient 2',
		'Exposed: Gradient 3',
		'Exposed: Gradient 4'
	] as const;

	const evidenceLayers = [
		{
			construct: 'AI work pressure',
			source: 'ILO refined GenAI exposure index (2025)',
			grain: 'ISCO-08 occupation and task',
			use: 'Sole input to the headline rank'
		},
		{
			construct: 'Mapped task examples',
			source: 'ILO refined GenAI exposure workbook (2025)',
			grain: 'Four-digit ISCO-08 group and task',
			use: 'Explains the source score; never represented as exact SSOC duties and never changes the rank'
		},
		{
			construct: 'Current AI capability proximity',
			source: 'OECD AI Capability Gap Index (2026)',
			grain: 'O*NET 30.3 occupation mapped to a conservative SSOC title subset',
			use: 'Separate nine-domain profile for 68 occupations; no headline effect'
		},
		{
			construct: 'Observed AI use',
			source: 'Anthropic labour-market-impact file (March 2026)',
			grain: 'US SOC platform activity; August and November 2025 observations',
			use: 'Separate measure for 66 reviewed occupation identities; no headline effect'
		},
		{
			construct: 'Potential complementarity',
			source: 'Pizzinelli et al. (2023)',
			grain: 'Repository-derived US SOC proxy',
			use: 'Withheld: the checked-in proxy does not reproduce a frozen source-level construct'
		},
		{
			construct: 'External exposure comparisons',
			source: 'AIOE (2021) and Eloundou et al. (2023)',
			grain: 'US SOC / O*NET-SOC',
			use: 'Eloundou publishes for 68 reviewed identities; AIOE stays withheld pending a SOC-edition bridge'
		},
		{
			construct: 'Wages',
			source: 'MOM Occupational Wages 2025',
			grain: 'Direct detailed SSOC rows where published',
			use: 'Report direct published rows only; leave missing pay unknown'
		},
		{
			construct: 'Demand',
			source: 'MOM Job Vacancies 2025 and named official lists',
			grain: 'Published occupation or list entry',
			use: 'Positive evidence only; absence is not weak demand'
		},
		{
			construct: 'Labour market and adoption',
			source: 'MOM and IMDA releases published through 5 August 2026',
			grain: 'National, sector, firm-size or broad occupation group',
			use: 'Reported at source grain; never spread across occupations'
		}
	] as const;

	const evidenceLabels = [
		[
			'Observed',
			'A source directly reports the value for the stated population, such as a published wage row.'
		],
		[
			'Derived',
			'V9 calculates the value from published inputs, such as a mapping median or percentile rank.'
		],
		[
			'Modelled',
			'A non-official estimate depends on stated assumptions, such as a reviewed modern-role composite.'
		],
		[
			'Reviewed match',
			'An editor connected two named records after checking titles, definitions and synonyms.'
		],
		[
			'Unknown',
			'The evidence is missing or does not pass the publication gate. Unknown is not zero.'
		]
	] as const;
</script>

<Seo
	path="/methodology"
	title="Singapore AI Work Pressure and Job-Risk Method (V9)"
	description="How V9 measures AI Work Pressure across SSOC 2024 occupations, separates job-risk evidence, handles uncertainty, and reviews modern-role queries."
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Methodology' }]} />

	<div class="max-w-3xl">
		<p class={sectionLabel()}>V9 headline · supporting data checked 21 August 2026</p>
		<h1 class={cn(title({ size: 'page' }), 'mt-2')}>How AI Work Pressure is measured</h1>
		<p class={body({ class: 'mt-4 text-muted-foreground' })}>
			AI Work Pressure Rank compares the task exposure of a Singapore occupation with other scored
			SSOC 2024 occupations. A rank of 82 places it at the 82nd midrank percentile for measured task
			exposure in the scored occupation set. Tied scores share a midrank. It is a relative pressure
			measure, not an 82% probability of job loss.
		</p>
	</div>

	<section class="mt-8 grid gap-4 md:grid-cols-2">
		<div class={card({ padding: 'lg', accent: 'high' })}>
			<h2 class="font-semibold text-foreground">What V9 measures</h2>
			<p class={body({ class: 'mt-2 text-muted-foreground' })}>
				How closely the tasks in an occupation overlap with capabilities assessed in the ILO's 2025
				refined GenAI exposure index, translated through the official SSOC 2024 to ISCO-08
				correspondence.
			</p>
		</div>
		<div class={card({ padding: 'lg', accent: 'moderate' })}>
			<h2 class="font-semibold text-foreground">What V9 does not predict</h2>
			<p class={body({ class: 'mt-2 text-muted-foreground' })}>
				Whether an employer will adopt AI, which tasks will be delegated, how demand will respond,
				or how many jobs, hours or wages will change. Those outcomes depend on evidence the score
				does not contain.
			</p>
		</div>
	</section>

	<section id="capability-evidence" class="mt-12 scroll-mt-24">
		<h2 class={sectionLabel()}>Current AI capability evidence</h2>
		<div class="mt-3 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
			<div class={card({ padding: 'lg', accent: 'primary' })}>
				<p class="font-mono text-4xl font-semibold tabular-nums text-foreground">68</p>
				<p class="mt-1 text-sm font-medium text-foreground">published occupation profiles</p>
				<p class={caption({ class: 'mt-3' })}>
					Out of 1,001 SSOC occupations. The other 933 stay unavailable; they are not scored lower.
				</p>
			</div>
			<div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
				<p>
					The OECD's 2026 measure compares current AI capabilities with job demands across language,
					social interaction, problem solving, creativity, critical thinking, knowledge and
					learning, vision, physical manipulation and robotic intelligence.
				</p>
				<p>
					V9 first uses the official SSOC-to-ISCO and ESCO-to-O*NET chain to generate candidates. An
					exact ESCO–O*NET relation does not prove that a five-digit Singapore occupation is the
					same job. Publication therefore also requires a conservative contiguous match to the
					official SSOC detailed title. Search synonyms, examples and close matches are excluded.
				</p>
				<p>
					Capability proximity is not task pressure, adoption, automation, job loss or a Singapore
					observation. It appears as a separate lens and cannot enter the headline builder.
				</p>
				<div class="flex flex-wrap gap-x-5 gap-y-2">
					<a href="/reports/ai-capabilities" class="font-semibold text-primary underline"
						>Read the capability report</a
					>
					<a href="/data/v9-capability-profiles.json" class="text-primary underline"
						>Download the profile artifact</a
					>
				</div>
			</div>
		</div>
	</section>

	<section id="research-comparisons" class="mt-12 scroll-mt-24">
		<h2 class={sectionLabel()}>Theoretical scope and observed use</h2>
		<div class="mt-3 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
			<div class="grid grid-cols-2 gap-px bg-border">
				<div class="bg-card p-5">
					<p class="font-mono text-4xl font-semibold tabular-nums text-foreground">68</p>
					<p class="mt-1 text-sm font-medium text-foreground">Eloundou profiles</p>
				</div>
				<div class="bg-card p-5">
					<p class="font-mono text-4xl font-semibold tabular-nums text-foreground">66</p>
					<p class="mt-1 text-sm font-medium text-foreground">Anthropic profiles</p>
				</div>
			</div>
			<div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
				<p>
					Eloundou estimates the task share-equivalent within an LLM's technical scope. Anthropic
					combines theoretical feasibility with work-related Claude use and weights automated use
					more than assisted use. They answer different questions, so V9 shows both rather than
					blending them.
				</p>
				<p>
					Publication requires the same conservative identity owner as the OECD layer: one exact
					ESCO–O*NET candidate, a reviewed match to the detailed SSOC title, then one exact source
					occupation code. The other occupations stay unavailable. Broader and many-to-many
					transfers are not averaged into a result.
				</p>
				<p>
					These US measures do not show Singapore adoption, hiring, productivity or job loss. They
					cannot change the ILO-based pressure rank.
				</p>
				<div class="flex flex-wrap gap-x-5 gap-y-2">
					<a href="/reports/research-signals" class="font-semibold text-primary underline"
						>Compare the signals</a
					>
					<a href="/data/v9-research-signals.json" class="text-primary underline"
						>Download the artifact</a
					>
				</div>
			</div>
		</div>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>The headline calculation</h2>
		<div class={cn(card({ padding: 'lg', variant: 'inset' }), 'mt-3 space-y-3')}>
			<p class={mono({ size: 'sm' })}>
				SSOC exposure = median of ILO mean scores across scored official ISCO-08 matches
			</p>
			<p class={mono({ size: 'sm' })}>Pressure rank = 100 × (midrank − 1) / (N − 1)</p>
			<p class={caption()}>
				N is the {v9Counts.scored}-occupation scored reference set. Equal exposure values receive
				the same midrank. Published ranks are rounded to one decimal place.
			</p>
		</div>

		<div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class={card({ padding: 'sm', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">{v9Counts.occupations.toLocaleString()}</p>
				<p class={caption()}>numeric SSOC 2024 occupations</p>
			</div>
			<div class={card({ padding: 'sm', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">{v9Counts.scored.toLocaleString()}</p>
				<p class={caption()}>with usable ILO evidence</p>
			</div>
			<div class={card({ padding: 'sm', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">{v9Counts.insufficient_evidence}</p>
				<p class={caption()}>shown as insufficient evidence</p>
			</div>
			<div class={card({ padding: 'sm', variant: 'metric' })}>
				<p class="text-2xl font-semibold tabular-nums">{v9Counts.direct_wages}</p>
				<p class={caption()}>with direct 2025 wage rows</p>
			</div>
		</div>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>Official ILO exposure categories</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			V9 preserves the ILO's categories and task-score dispersion. It does not replace them with
			custom “low” or “high” percentile bands. Pressure rank and ILO category answer different
			questions: the rank compares Singapore occupations; the category describes the ILO task
			exposure pattern.
		</p>
		<ol class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
			{#each iloCategories as category, index}
				<li class={card({ padding: 'sm' })}>
					<span class="mr-2 font-mono text-xs text-muted-foreground">{index + 1}</span>
					<span class="text-sm font-medium text-foreground">{category}</span>
				</li>
			{/each}
		</ol>
		<p class={caption({ class: 'mt-3 max-w-3xl' })}>
			Source:
			<a
				href="https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline">ILO, 20 May 2025</a
			>. The index covers nearly 30,000 tasks using worker input, expert review and model-assisted
			assessment.
		</p>
		<div
			class={cn(card({ padding: 'md', variant: 'notice', accent: 'primary' }), 'mt-4 max-w-4xl')}
		>
			<h3 class="font-semibold text-foreground">How task examples appear on occupation pages</h3>
			<p class={body({ class: 'mt-2 text-muted-foreground' })}>
				The downloadable ILO artifact contains 3,265 task rows across 427 four-digit ISCO groups. An
				occupation page follows its official SSOC-to-ISCO mapping and shows bounded higher- and
				lower-scoring examples from those groups. The source text, ISCO code and task score stay
				visible. The examples help a visitor inspect their own work; they are not exact duties for
				every worker under the five-digit SSOC title.
			</p>
			<p class={caption({ class: 'mt-2' })}>
				This explanatory artifact has no input path into the headline builder.
				<a href="/data/ilo-isco-task-evidence-v9.json" class="font-semibold text-primary underline">
					Download the mapped task evidence</a
				>.
			</p>
		</div>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>How evidence is labelled</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			A number should tell you whether it came straight from a source, was calculated, or depends on
			judgement. V9 uses these labels throughout the product and data files.
		</p>
		<dl class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each evidenceLabels as item}
				<div class={card({ padding: 'md' })}>
					<dt class="font-semibold text-foreground">{item[0]}</dt>
					<dd class={caption({ class: 'mt-1' })}>{item[1]}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>How mapping uncertainty is shown</h2>
		<div class="mt-3 grid gap-4 lg:grid-cols-3">
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold">One official match</h3>
				<p class={caption({ class: 'mt-2' })}>
					Use that ISCO-08 score and category. Preserve its task-score dispersion.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold">Several official matches</h3>
				<p class={caption({ class: 'mt-2' })}>
					Use the median scored match for the point estimate and publish the minimum, maximum,
					categories and candidate codes. No employment weights are invented.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold">No usable match</h3>
				<p class={caption({ class: 'mt-2' })}>
					Show “Insufficient evidence.” Do not borrow a score from the occupation's unit, minor or
					major group.
				</p>
			</div>
		</div>
		<p class={caption({ class: 'mt-3 max-w-3xl' })}>
			The taxonomy and correspondence come from the
			<a
				href="https://www.singstat.gov.sg/standards/standards-and-classifications/ssoc"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary underline">Singapore Department of Statistics SSOC 2024 release</a
			>, with definitions and index files published on 24 June 2026.
		</p>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>Risk evidence stays separate</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			Pressure tells us where task overlap is greater. Risk depends on whether firms automate or
			redesign work, how human responsibility and interaction matter, how quickly organisations
			adopt tools, and whether demand expands or contracts. V9 reports those signals independently
			instead of hiding them in a composite probability.
		</p>

		<div class={cn(card({ padding: 'none' }), 'mt-4 overflow-hidden')}>
			<div class="hidden md:block">
				<table class="w-full table-fixed text-left text-sm">
					<thead class="border-b bg-muted/40">
						<tr>
							<th class="p-3">Construct</th>
							<th class="p-3">Source</th>
							<th class="p-3">Published grain</th>
							<th class="p-3">Role in V9</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each evidenceLayers as layer}
							<tr class="align-top">
								<td class="break-words p-3 font-medium text-foreground">{layer.construct}</td>
								<td class="break-words p-3 text-muted-foreground">{layer.source}</td>
								<td class="break-words p-3 text-muted-foreground">{layer.grain}</td>
								<td class="break-words p-3 text-muted-foreground">{layer.use}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<dl class="divide-y divide-border md:hidden">
				{#each evidenceLayers as layer}
					<div class="space-y-2 p-4">
						<dt class="font-semibold text-foreground">{layer.construct}</dt>
						<dd class="text-sm text-muted-foreground">{layer.source}</dd>
						<dd class="text-xs text-muted-foreground">{layer.grain}</dd>
						<dd class="text-sm text-foreground">{layer.use}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>

	<section id="economic-evidence" class="mt-12 scroll-mt-24">
		<h2 class={sectionLabel()}>From task pressure to jobs</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			A task becoming easier does not tell us whether employment will fall. Employers may save
			labour, serve more customers, lower prices, improve quality, create new work or reorganise
			teams. The result also depends on adoption, human responsibility and how workers move between
			jobs.
		</p>
		<div class="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each [['Task substitution', 'Can AI complete work that people do today, with little review?'], ['Productivity and demand', 'Do lower costs or better service create enough new demand to expand work?'], ['New work', 'Are firms creating products, tasks and roles where people retain an advantage?'], ['Human responsibility', 'Where do judgement, trust, accountability and physical action remain central?'], ['Adoption and organisation', 'Are firms deploying AI and changing workflows, teams or hiring?'], ['Worker adjustment', 'Who gains, who faces disruption, and can people move or retrain?']] as mechanism}
				<div class={card({ padding: 'md' })}>
					<h3 class="font-semibold text-foreground">{mechanism[0]}</h3>
					<p class={caption({ class: 'mt-1' })}>{mechanism[1]}</p>
				</div>
			{/each}
		</div>
		<div class={cn(card({ padding: 'lg', variant: 'notice', accent: 'primary' }), 'mt-4')}>
			<h3 class="font-semibold text-foreground">What V9 can observe today</h3>
			<p class={body({ class: 'mt-2 text-muted-foreground' })}>
				V9 combines detailed task pressure with direct wages and named demand where available. It
				also publishes broad occupation-group employment, workforce, industry and labour-market
				context. The broad observations stay at their published grain; they are not copied into
				detailed occupations.
			</p>
			<p class={body({ class: 'mt-2 text-muted-foreground' })}>
				Singapore does not yet publish the detailed adoption, output, price, new-task and causal
				outcome data needed to classify an occupation as contracting or expanding because of AI. V9
				therefore publishes the missing evidence and its release gate instead of filling the gap
				with a scenario.
			</p>
			<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
				<a href="/reports/labour-observatory" class="font-semibold text-primary underline"
					>Explore the Singapore labour observatory</a
				>
				<a href="/data/v9-economic-observatory.json" class="text-primary underline"
					>Download the evidence contract</a
				>
			</div>
		</div>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>How to read the risk profile</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			These are conditional interpretation patterns, not V9 categories or outcome scores. The
			current release can show pressure beside direct demand and wage evidence. A reviewed
			detailed-title identity layer also supports separate Eloundou and Anthropic values for a
			conservative subset. AIOE, complementarity and every broader or ambiguous transfer stay
			unpublished until their narrower version, transfer and construct checks pass.
		</p>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold">Potential substitution concern</h3>
				<p class={caption({ class: 'mt-1' })}>
					Higher task pressure with validated evidence of low complementarity would raise concern.
					V9 does not currently publish that occupation-level combination.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold">Potential redesign pressure</h3>
				<p class={caption({ class: 'mt-1' })}>
					Higher pressure with validated evidence of strong human complementarity could point to
					task redesign. V9 does not currently turn that hypothesis into an occupation score.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold">Pressure with current demand</h3>
				<p class={caption({ class: 'mt-1' })}>
					The work is exposed and is also directly named by a selected Singapore demand source.
					Demand may coexist with redesign.
				</p>
			</div>
			<div class={card({ padding: 'md' })}>
				<h3 class="font-semibold">Evidence inconclusive</h3>
				<p class={caption({ class: 'mt-1' })}>
					The available sources do not support a narrower employment interpretation. Missing
					evidence is not scored as low risk.
				</p>
			</div>
		</div>
	</section>

	<section id="synthetic-roles" class="mt-12 scroll-mt-24">
		<h2 class={sectionLabel()}>Modern-title query layer</h2>
		<div class={cn(card({ padding: 'lg', variant: 'notice', accent: 'primary' }), 'mt-3')}>
			<p class="font-semibold text-foreground">
				Direct reviewed matches resolve before a composite is built.
			</p>
			<p class={body({ class: 'mt-2 text-muted-foreground' })}>
				A normalized exact title or explicit reviewed title, synonym or definition match uses one
				current SSOC 2024 record and no competing role estimate. Genuinely cross-occupation roles
				use editorially reviewed mixtures. The estimate is the weighted average of scored component
				exposure values. Each page publishes its components, weights, rationale and sensitivity.
				Cross-sector or unstable labels publish no mapping or score when a fixed mix would create
				false precision.
			</p>
			<p class={body({ class: 'mt-2 text-muted-foreground' })}>
				Non-official composites never receive official SSOC status, inferred employment, a
				role-level wage or a probability of job loss. Wage and demand entries remain observations
				about their components. Withheld queries publish no component evidence.
			</p>
		</div>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>Current Singapore evidence</h2>
		<ul
			class="mt-3 max-w-3xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground"
		>
			<li>
				MOM's 2025 occupational wage table supplies direct detailed-occupation wage evidence for
				{v9Counts.direct_wages} V9 occupations. No value is inferred for the remainder.
			</li>
			<li>
				MOM reported on 5 August 2026 that total vacancies moved from 77,700 in December 2025 to
				73,300 in March 2026, while entry-level PMET openings moved from 32,500 to 32,800. These are
				national figures, not detailed-occupation demand scores.
			</li>
			<li>
				The Q1 2026 Labour Market Report remains the latest detailed quarterly release at the review
				cutoff. The Q2 advance release is preliminary and is used only for national context.
			</li>
			<li>
				MOM's 30 April survey, its 5 August parliamentary answer and IMDA's 2025 digital-economy
				report describe adoption at their published firm, sector and workforce populations. Among
				AI-adopting firms, the August answer rounded responses to 6% reducing headcount, 8% reducing
				hiring, 19% redesigning roles and 14% creating AI roles. They do not identify
				occupation-level effects or establish causality.
			</li>
			<li>
				Singapore's 2022–2023 OECD Survey of Adult Skills provides national and subgroup skills
				context. It does not publish a reliable resilience score for every detailed SSOC 2024
				occupation.
			</li>
			<li>
				Singapore does not currently publish a defensible detailed-occupation estimate of AI-caused
				job loss, entry-level displacement or an AI salary premium. V9 leaves those outcomes
				unknown.
			</li>
		</ul>
		<a href="/reports/job-market-evidence" class="mt-4 inline-block text-sm text-primary underline"
			>Read the current Singapore job-market evidence</a
		>
	</section>

	<section class="mt-12">
		<h2 class={sectionLabel()}>Known limits</h2>
		<div class="mt-3 grid gap-3 md:grid-cols-2">
			{#each [['Capability is not adoption', 'A technically exposed task may not be used with AI because of cost, quality, regulation, data access or organisational choice.'], ['Occupations contain varied jobs', 'People with the same title can perform different task mixes across employers, seniority levels and countries.'], ['Crosswalks lose detail', 'SSOC and ISCO do not divide work identically. V9 preserves candidate mappings and ranges instead of hiding this loss.'], ['Outcomes remain conditional', 'Employment responds to product demand, prices, investment, firm entry, new tasks, worker mobility, policy and the wider economy.'], ['Observed-use data are selective', 'Platform logs describe their users and products. They are not representative measurements of the Singapore workforce.'], ['Current evidence is early', 'Hiring, hours, contractor use and career ladders may change before aggregate employment, and findings across countries currently differ.']] as limitation}
				<div class={card({ padding: 'md' })}>
					<h3 class="font-semibold text-foreground">{limitation[0]}</h3>
					<p class={caption({ class: 'mt-1' })}>{limitation[1]}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="my-12">
		<h2 class={sectionLabel()}>Reproduce and inspect V9</h2>
		<p class={body({ class: 'mt-3 max-w-3xl text-muted-foreground' })}>
			The release is deterministic: the repository downloads frozen public sources, builds the SSOC
			2024 registry, maps official ISCO candidates, creates V9 occupation records, and runs release
			checks. The build itself does not call a language model.
		</p>
		<div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
			<a class="text-primary underline" href="/methodology/appendix">Technical appendix</a>
			<a class="text-primary underline" href="/data">V9 downloads and field dictionary</a>
			<a class="text-primary underline" href="/research">Research register</a>
			<a class="text-primary underline" href="/reports/v9-release">V9 release report</a>
		</div>
	</section>
</main>
