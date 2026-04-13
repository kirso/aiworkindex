<script lang="ts">
	let {
		links = [
			{ href: '/methodology', label: 'Methodology' },
			{ href: '/explore', label: 'Browse occupations' },
			{ href: '/rankings', label: 'Rankings' },
			{ href: '/data', label: 'Data' }
		]
	}: {
		links?: Array<{ href: string; label: string }>;
	} = $props();
</script>

<div
	class="mt-10 border-t border-border pt-4 flex items-center justify-between text-sm text-muted-foreground"
>
	<a href="/" class="hover:text-foreground">&larr; Home</a>
	<div class="flex items-center gap-3">
		{#each links as link}
			<a href={link.href} class="hover:text-foreground">{link.label}</a>
		{/each}
	</div>
</div>
