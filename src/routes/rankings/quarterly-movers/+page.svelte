<script lang="ts">
	import { title as titleStyle, card } from '$lib/design-system';
	import { cn } from '$lib/utils';
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import { pageLayout } from '$lib/design-system';
	import Seo from '$lib/components/ui/Seo.svelte';
</script>

<Seo
	title="Quarterly Movers"
	description="Occupations that changed risk bands between quarterly snapshots."
	path="/rankings/quarterly-movers"
/>

<main class={pageLayout({ width: 'feature' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: 'Quarterly Movers' }
		]}
	/>

	<h1 class={titleStyle({ size: 'page' })}>Quarterly Movers</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		Occupations that changed risk bands between quarterly scoring snapshots.
	</p>

	<div class={cn(card({ padding: 'md' }), 'mt-8 text-center')}>
		<svg
			class="mx-auto h-12 w-12 text-muted-foreground/30"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
		>
			<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		<h2 class="mt-4 text-base font-semibold text-foreground">Coming Next Quarter</h2>
		<p class="mt-2 text-sm text-muted-foreground">
			V4.0 (March 2026) is the current baseline snapshot. This page will show occupations that
			change risk bands when the next quarterly labour data arrives and scores are re-run.
		</p>
		<p class="mt-2 text-xs text-muted-foreground">
			Expected: When Q4 2025 full MOM Labour Market Report is published.
		</p>
	</div>
</main>
