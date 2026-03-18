<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	let {
		text,
		side = 'top'
	}: {
		text: string;
		side?: 'top' | 'bottom' | 'left' | 'right';
	} = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger class="ml-1 inline-flex cursor-help items-center">
			<svg
				class="h-3.5 w-3.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<circle cx="12" cy="12" r="10" />
				<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
		</Tooltip.Trigger>
		<Tooltip.Content {side} sideOffset={4} class="max-w-xs text-xs leading-relaxed">
			{text}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
