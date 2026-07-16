<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import { pageLayout, title, body } from '$lib/design-system';
</script>

<Seo
	path="/calculator"
	title="AI Job Exposure Calculator | AI Work Index"
	description="Search Singapore occupations to see their AI Exposure Rank, likely impact, current hiring demand and evidence quality."
/>

<main class={pageLayout({ width: 'feature' })}>
	<h1 class={title({ size: 'page' })}>AI job exposure calculator</h1>
	<p class={body({ size: 'lg', tone: 'subtle', class: 'mt-3 max-w-2xl' })}>
		Search your occupation to see how exposed its work is to current AI capabilities, what still
		needs people, and what hiring demand looks like.
	</p>
	<a class="mt-6 inline-block font-medium text-primary hover:underline" href="/will-ai-take-my-job">
		Check your occupation →
	</a>
</main>
