<script lang="ts">
	import { pill } from '$lib/design-system';
</script>

<div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
	<span>More:</span>
	<a href="/rankings/highest-risk" class={pill({ size: 'md', tone: 'outline', interactive: true })}
		>Highest Risk</a
	>
	<a href="/rankings/ai-leveraged" class={pill({ size: 'md', tone: 'outline', interactive: true })}
		>Augmented</a
	>
	<a
		href="/rankings/safest-high-paying"
		class={pill({ size: 'md', tone: 'outline', interactive: true })}>Safest High-Paying</a
	>
	<a
		href="/rankings/best-transitions"
		class={pill({ size: 'md', tone: 'outline', interactive: true })}>Transitions</a
	>
	<a href="/rankings" class={pill({ size: 'md', tone: 'outline', interactive: true })}
		>All Rankings</a
	>
</div>
