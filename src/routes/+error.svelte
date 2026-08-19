<script lang="ts">
	import { page } from '$app/state';
	import { pageLayout, title as titleStyle, linkPill } from '$lib/design-system';
	import { cn } from '$lib/utils';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page not found' : 'Error'} | AI Work Index</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main class={cn(pageLayout({ width: 'content' }), 'py-16')}>
	<p class="font-mono text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
		{page.status} — {page.status === 404 ? 'Not found' : 'Something went wrong'}
	</p>
	<h1 class={cn(titleStyle({ size: 'page' }), 'mt-2')}>
		{page.status === 404 ? 'This page doesn’t exist.' : 'An error occurred.'}
	</h1>
	<p class="mt-4 max-w-2xl text-[17px] leading-snug text-text-secondary">
		{#if page.status === 404}
			The occupation, role or page you’re looking for is not here. Singapore occupation codes moved
			to SSOC 2024 in V9, or the link may be mistyped. Try searching for the job title instead.
		{:else}
			{page.error?.message ?? 'Unexpected error.'} If this keeps happening, please report it.
		{/if}
	</p>
	<div class="mt-8 flex flex-wrap gap-3">
		<a href="/" class={linkPill()}>Search occupations →</a>
		<a href="/explore" class={linkPill()}>Browse all 1,001 →</a>
		<a href="/roles" class={linkPill()}>Modern role estimates →</a>
		<a href="/rankings" class={linkPill()}>Rankings →</a>
	</div>
	<p class="mt-10 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
		V9 AI Work Pressure ranks are comparisons of task exposure, not job-loss probabilities.
	</p>
</main>
