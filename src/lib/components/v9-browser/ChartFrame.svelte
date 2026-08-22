<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		title: string;
		subtitle: string;
		source: string;
		note?: string;
		children: Snippet;
	}

	let { id, title, subtitle, source, note, children }: Props = $props();
</script>

<figure
	class="evidence-figure min-w-0"
	aria-labelledby="{id}-title"
	aria-describedby="{id}-subtitle {id}-source"
>
	<header class="border-b border-border px-4 py-4 sm:px-5 sm:py-5">
		<h3 id="{id}-title" class="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
			{title}
		</h3>
		<p id="{id}-subtitle" class="mt-1.5 max-w-4xl text-sm leading-relaxed text-muted-foreground">
			{subtitle}
		</p>
	</header>

	<div class="min-w-0 px-3 py-3 sm:px-5 sm:py-5">
		{@render children()}
	</div>

	<figcaption
		id="{id}-source"
		class="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5"
	>
		<span class="font-semibold text-text-secondary">Source:</span>
		{source}
		{#if note}
			<span class="mt-1 block">{note}</span>
		{/if}
	</figcaption>
</figure>
