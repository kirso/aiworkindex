<script lang="ts">
	import Seo from '$lib/components/ui/Seo.svelte';
	import { pageLayout, title, body } from '$lib/design-system';
</script>

<Seo
	path="/calculator"
	title="AI Job Pressure Checker | AI Work Index"
	description="Search Singapore SSOC 2024 occupations and non-official modern-role estimates to inspect AI work pressure, wages, demand and evidence gaps."
/>

<main class={pageLayout({ width: 'feature' })}>
	<h1 class={title({ size: 'page' })}>AI job pressure checker</h1>
	<p class={body({ size: 'lg', tone: 'subtle', class: 'mt-3 max-w-2xl' })}>
		Search your occupation to see its V9 AI Work Pressure evidence. The result is not a prediction
		that your job will disappear.
	</p>
	<a class="mt-6 inline-block font-medium text-primary hover:underline" href="/will-ai-take-my-job">
		Check your occupation →
	</a>
</main>
