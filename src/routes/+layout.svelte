<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="Singapore AI Occupation Impact Index" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<div class="flex-1">
		{@render children()}
	</div>

	<footer class="border-t border-gray-200 bg-gray-50">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<p class="text-xs text-gray-500">
				Data: Ministry of Manpower, Singapore. Methodology: Felten et al. (2021), Pizzinelli et al. (2023).
			</p>
			<p class="mt-1 text-xs text-gray-400">
				Scores represent technical AI exposure, not employment predictions.
				Exposure and displacement are distinct — see
				<a href="/methodology" class="underline hover:text-gray-600">methodology</a>.
			</p>
			<div class="mt-2 flex gap-3 text-xs text-gray-400">
				<a href="/about" class="hover:text-gray-600">About</a>
				<span>&middot;</span>
				<span>MIT License</span>
			</div>
		</div>
	</footer>
</div>
