<script lang="ts">
	import { card } from '$lib/design-system';
	import { cn } from '$lib/utils';

	interface Props {
		release: string;
		date: string;
		note?: string;
	}

	let { release, date, note }: Props = $props();
</script>

<aside
	class={cn(card({ padding: 'md', variant: 'notice', accent: 'moderate' }), 'mb-6')}
	aria-label="Archived report notice"
>
	<p class="text-sm font-semibold text-foreground">Archived {release} report · {date}</p>
	<p class="mt-1 text-sm leading-relaxed text-muted-foreground">
		{note ??
			'This page preserves the figures, definitions and assumptions published with an earlier methodology.'}
		It is not part of the current V9 score and is excluded from search indexing. Read the
		<a href="/reports/v9-release" class="font-medium text-primary underline">V9 release report</a>
		or the
		<a href="/methodology" class="font-medium text-primary underline">current methodology</a>.
	</p>
</aside>
