<script lang="ts">
	import { badge, card, sectionLabel } from '$lib/design-system';
	import type { V9SkillsPilotProfile } from '$lib/data/v9-skills-pilot';

	let { profile }: { profile: V9SkillsPilotProfile | null } = $props();
</script>

{#if profile}
	<section class="mt-10" aria-labelledby="official-skills-heading">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div>
				<p class={sectionLabel()}>Official sector skills</p>
				<h2 id="official-skills-heading" class="mt-1 text-2xl font-bold text-foreground">
					Skills to check and strengthen
				</h2>
			</div>
			<span class={badge({ variant: 'info' })}>Skills Framework pilot</span>
		</div>
		<p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
			Start with the skills used in your sector, mark where you need more practice, then discuss the
			gap with your manager or a training adviser. These official skill labels do not change the AI
			pressure rank.
		</p>

		<div class="mt-4 space-y-3">
			{#each profile.sector_profiles as sector, index (`${sector.sector_key}-${sector.source_job_role}`)}
				<details class={card({ padding: 'none' })} open={index === 0}>
					<summary
						class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden"
					>
						<span>
							<span class="block text-sm font-semibold text-foreground">{sector.sector}</span>
							<span class="mt-0.5 block text-xs text-muted-foreground">
								Source role: {sector.source_job_role}
							</span>
						</span>
						<span class="font-mono text-xs text-muted-foreground" aria-hidden="true">Open</span>
					</summary>
					<div class="border-t border-border px-5 py-5">
						<div class="grid gap-6 lg:grid-cols-2">
							<div>
								<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Technical skills
								</h3>
								<ul class="mt-3 grid gap-2">
									{#each sector.technical_skills as skill (skill.name)}
										<li
											class="flex items-start justify-between gap-3 border-b border-border pb-2 text-sm"
										>
											<span class="font-medium text-foreground">{skill.name}</span>
											<span class="shrink-0 font-mono text-xs text-muted-foreground">
												{skill.proficiency}
											</span>
										</li>
									{/each}
								</ul>
							</div>
							<div>
								<h3 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
									Core skills
								</h3>
								<ul class="mt-3 grid gap-2">
									{#each sector.core_skills as skill (skill.name)}
										<li
											class="flex items-start justify-between gap-3 border-b border-border pb-2 text-sm"
										>
											<span class="font-medium text-foreground">{skill.name}</span>
											<span class="shrink-0 font-mono text-xs text-muted-foreground">
												{skill.proficiency}
											</span>
										</li>
									{/each}
								</ul>
							</div>
						</div>
						<p class="mt-5 text-xs leading-relaxed text-muted-foreground">
							{sector.mapping.rationale}
						</p>
						<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
							<a
								href={sector.source.url}
								target="_blank"
								rel="noreferrer"
								class="font-medium text-primary underline">Open the official framework</a
							>
							<a
								href="https://www.myskillsfuture.gov.sg/"
								target="_blank"
								rel="noreferrer"
								class="font-medium text-primary underline">Find training on MySkillsFuture</a
							>
						</div>
					</div>
				</details>
			{/each}
		</div>
	</section>
{/if}
