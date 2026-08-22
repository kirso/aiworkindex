<script lang="ts">
	import PageBreadcrumb from '$lib/components/ui/PageBreadcrumb.svelte';
	import Seo from '$lib/components/ui/Seo.svelte';
	import { badge, card, pageLayout, title as titleStyle } from '$lib/design-system';
	import RankingNav from './RankingNav.svelte';

	let {
		title,
		path,
		description,
		why,
		requirement
	}: {
		title: string;
		path: string;
		description: string;
		why: string;
		requirement: string;
	} = $props();
</script>

<Seo {title} {description} {path} noindex={true} />

<main class={pageLayout({ width: 'content' })}>
	<PageBreadcrumb
		items={[
			{ label: 'Home', href: '/' },
			{ label: 'Rankings', href: '/rankings' },
			{ label: title }
		]}
	/>

	<span class={badge({ variant: 'warning' })}>Experimental · unavailable in V9</span>
	<h1 class="mt-3 {titleStyle({ size: 'page' })}">{title}</h1>
	<p class="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">{description}</p>

	<section class="mt-8 {card({ padding: 'lg', variant: 'notice', accent: 'moderate' })}">
		<h2 class="text-lg font-semibold text-foreground">Why there is no ranking</h2>
		<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{why}</p>
		<h3 class="mt-5 text-sm font-semibold text-foreground">What would make it publishable</h3>
		<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{requirement}</p>
	</section>

	<p class="mt-6 text-sm leading-relaxed text-muted-foreground">
		The URL remains available for continuity. This page is excluded from search indexes until the
		evidence supports a comparable V9 result.
	</p>

	<div class="mt-6 flex flex-wrap gap-3 text-sm">
		<a href="/rankings/highest-risk" class="font-medium text-primary underline"
			>View pressure ranking</a
		>
		<a href="/methodology" class="font-medium text-primary underline">Read the V9 methodology</a>
	</div>

	<RankingNav current={path} />
</main>
