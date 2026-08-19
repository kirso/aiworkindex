<script lang="ts">
	let { current = '' }: { current?: string } = $props();

	const links = [
		{ href: '/rankings/highest-risk', label: 'Pressure rank' },
		{ href: '/rankings/ai-leveraged', label: 'ILO categories' },
		{ href: '/rankings/high-exposure-in-demand', label: 'Named demand' },
		{ href: '/rankings/rich-and-risky', label: 'Wages + pressure' },
		{ href: '/rankings/safest-high-paying', label: 'Lower category + wages' },
		{ href: '/rankings/theory-vs-practice', label: 'Uncertainty' }
	];
</script>

<nav class="mt-8 border-t border-border pt-4" aria-label="Evidence rankings">
	<p class="mb-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
		Other evidence views
	</p>
	<div class="flex min-w-0 flex-wrap gap-2">
		{#each links as link (link.href)}
			<a
				href={link.href}
				aria-current={current === link.href ? 'page' : undefined}
				class="border border-border px-2.5 py-1.5 text-xs font-medium text-foreground no-underline hover:border-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
			>
				{link.label}
			</a>
		{/each}
	</div>
</nav>
