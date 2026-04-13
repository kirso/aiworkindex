<script lang="ts">
	import { card } from '$lib/design-system';
	import { cn } from '$lib/utils';

	interface TaskItem {
		task: string;
		penetration?: number | null;
	}

	interface TechnologyItem {
		name: string;
		hot?: boolean;
		inDemand?: boolean;
	}

	interface Props {
		tasks: TaskItem[];
		technologies?: TechnologyItem[];
		class?: string;
	}

	let { tasks, technologies = [], class: className }: Props = $props();
</script>

<div class={cn(card({ padding: 'sm' }), className)}>
	<p class="text-sm font-semibold text-foreground">Key tasks</p>
	{#if tasks.length > 0}
		<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
			{#each tasks as task, index (`task-${index}`)}
				<li>
					<span class="font-medium text-foreground">{index + 1}.</span>
					{task.task}
					{#if task.penetration != null}
						<span class="text-xs text-muted-foreground">
							&middot; AI can do {(task.penetration * 100).toFixed(0)}%
						</span>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-1 text-sm text-muted-foreground">No task data available.</p>
	{/if}

	{#if technologies && technologies.length > 0}
		<p class="mt-4 text-xs font-semibold text-foreground">Tools commonly used</p>
		<div class="mt-2 flex flex-wrap gap-2">
			{#each technologies as technology, index (`tech-${index}`)}
				<span class={cn('rounded-full bg-muted px-2.5 py-1 text-xs text-foreground')}>
					{technology.name}
					{#if technology.hot && technology.inDemand}
						&middot; trending
					{:else if technology.inDemand}
						&middot; in demand
					{/if}
				</span>
			{/each}
		</div>
	{/if}
</div>
