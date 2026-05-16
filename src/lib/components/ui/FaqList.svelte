<script lang="ts">
	import { card, sectionLabel } from '$lib/design-system';
	import { cn } from '$lib/utils';

	interface FaqItem {
		question: string;
		answer: string;
	}

	interface Props {
		items: FaqItem[];
		heading?: string;
	}

	let { items, heading = 'Frequently asked questions' }: Props = $props();
</script>

<section class="mt-8">
	<h2 class={sectionLabel()}>{heading}</h2>
	<div class="mt-3 space-y-1">
		{#each items as item (item.question)}
			<details class={cn(card({ padding: 'md' }), 'group')}>
				<summary class="cursor-pointer text-sm font-semibold text-foreground select-none">
					{item.question}
				</summary>
				<p class="mt-2 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
			</details>
		{/each}
	</div>
</section>
