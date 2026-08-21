<script lang="ts">
	import { linkPill, pressureColorScale, sectionLabel } from '$lib/design-system';
	import type { V9IloTaskEvidenceRow, V9MappedTaskExamples } from '$lib/data/v9-task-evidence';

	interface Props {
		groups: V9MappedTaskExamples[];
		sourceUrl: string;
		licenseUrl: string;
		occupationCode: string;
	}

	let { groups, sourceUrl, licenseUrl, occupationCode }: Props = $props();

	function displayScore(score: number): string {
		return `${(score * 100).toFixed(1)}/100`;
	}

	function scoreWidth(score: number): string {
		return `${Math.max(0, Math.min(100, score * 100))}%`;
	}

	function taskList(tasks: V9IloTaskEvidenceRow[], tone: 'higher' | 'lower') {
		return { tasks, tone };
	}

	function spectrum(group: V9MappedTaskExamples): V9IloTaskEvidenceRow[] {
		return [...group.lower, ...group.higher].sort((a, b) => a.score_2025 - b.score_2025);
	}
</script>

{#if groups.length > 0}
	<section class="mt-10" aria-labelledby="mapped-task-heading">
		<p class={sectionLabel()}>Mapped task examples</p>
		<div class="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
			<div class="max-w-4xl">
				<h2 id="mapped-task-heading" class="font-sans text-2xl font-bold text-foreground">
					Which tasks the ILO scored higher and lower
				</h2>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
					These examples come from the four-digit ISCO groups officially mapped to this occupation.
					They are prompts for inspecting your work, not a claim that every person in SSOC {occupationCode}
					performs each task.
				</p>
			</div>
			<a href="/will-ai-take-my-job?job=occupation:{occupationCode}" class={linkPill()}>
				Check the tasks you actually do →
			</a>
		</div>

		<div class="mt-5 space-y-5">
			{#each groups as group (group.isco08Code)}
				<article class="border border-border bg-card">
					<header class="border-b border-border bg-surface-subtle px-4 py-4 sm:px-5">
						<p class="font-mono text-xs text-muted-foreground">Mapped ISCO-08 {group.isco08Code}</p>
						<h3 class="mt-1 font-sans text-lg font-bold text-foreground">
							{group.isco08Title}
						</h3>
						<div class="mt-4" aria-label="Mapped ILO tasks from lower to higher GenAI potential">
							<div class="flex h-3 overflow-hidden border border-border">
								{#each spectrum(group) as task (task.task_id)}
									<span
										class="min-w-3 flex-1"
										style:background={pressureColorScale(task.score_2025 * 100)}
										title="{task.text} · {displayScore(task.score_2025)}"
									></span>
								{/each}
							</div>
							<div class="mt-2 flex justify-between text-[11px] text-muted-foreground">
								<span>Lower GenAI potential</span>
								<span>Higher GenAI potential</span>
							</div>
							<ol class="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2">
								{#each spectrum(group) as task (task.task_id)}
									<li class="flex min-w-0 items-baseline justify-between gap-2 text-xs">
										<span class="min-w-0 truncate text-foreground">{task.text}</span>
										<span class="shrink-0 font-mono tabular-nums text-muted-foreground"
											>{displayScore(task.score_2025)}</span
										>
									</li>
								{/each}
							</ol>
						</div>
					</header>

					<div class="grid lg:grid-cols-2">
						{#each [taskList(group.higher, 'higher'), taskList(group.lower, 'lower')] as lane (lane.tone)}
							<div
								class="px-4 py-5 first:border-b first:border-border sm:px-5 lg:first:border-b-0 lg:first:border-r"
							>
								<h4 class="text-sm font-bold text-foreground">
									{lane.tone === 'higher'
										? 'Higher potential to perform with GenAI'
										: 'Lower potential to perform with GenAI'}
								</h4>
								<p class="mt-1 text-xs leading-relaxed text-muted-foreground">
									{lane.tone === 'higher'
										? 'Good candidates for a careful, low-consequence trial with human review.'
										: 'Treat these as areas where context, judgment or direct human work may remain important.'}
								</p>

								<ol class="mt-4 space-y-4">
									{#each lane.tasks as task (task.task_id)}
										<li>
											<div class="flex items-start justify-between gap-4">
												<p class="text-sm leading-relaxed text-foreground">{task.text}</p>
												<span
													class="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground"
												>
													{displayScore(task.score_2025)}
												</span>
											</div>
											<div class="mt-2 h-1.5 bg-surface-metric" aria-hidden="true">
												<div
													class="h-full {lane.tone === 'higher' ? 'bg-chart-3' : 'bg-chart-2'}"
													style:width={scoreWidth(task.score_2025)}
												></div>
											</div>
										</li>
									{/each}
								</ol>
							</div>
						{/each}
					</div>
				</article>
			{/each}
		</div>

		<p class="mt-4 text-xs leading-relaxed text-muted-foreground">
			Scores use the ILO source’s 0–1 task scale, displayed here out of 100. Higher values mean more
			potential to perform the task with current GenAI in that assessment; they are not observed
			adoption or job-loss probabilities. Source:
			<a
				href={sourceUrl}
				target="_blank"
				rel="noreferrer"
				class="font-semibold text-primary underline"
			>
				ILO Working Paper 140</a
			>. Reused under
			<a
				href={licenseUrl}
				target="_blank"
				rel="noreferrer"
				class="font-semibold text-primary underline"
			>
				CC BY 4.0</a
			>; grouping, labels and example ordering are AI Work Index adaptations.
		</p>
	</section>
{/if}
