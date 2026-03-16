<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();

	const navLinks = [
		{ href: '/', label: 'Explorer' },
		{ href: '/methodology', label: 'Methodology' },
		{ href: '/about', label: 'About' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="Singapore AI Occupation Impact Index" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50">
	<!-- Sticky header / nav -->
	<header class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
		<div class="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
			<a href="/" class="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700">
				<span class="text-lg">SG AI Jobs</span>
			</a>
			<nav class="flex items-center gap-1">
				{#each navLinks as link}
					<a
						href={link.href}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
							{$page.url.pathname === link.href
								? 'bg-gray-100 text-gray-900'
								: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<div class="flex-1">
		{@render children()}
	</div>

	<footer class="border-t border-gray-200 bg-white">
		<div class="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs text-gray-500">
						Data: Ministry of Manpower, Singapore. Methodology: Felten et al. (2021), Pizzinelli et al. (2023).
					</p>
					<p class="mt-0.5 text-xs text-gray-400">
						Scores represent technical AI exposure, not employment predictions.
						Exposure and displacement are distinct — see
						<a href="/methodology" class="underline hover:text-gray-600">methodology</a>.
					</p>
				</div>
				<div class="flex gap-3 text-xs text-gray-400">
					<a href="/about" class="hover:text-gray-600">About</a>
					<span>&middot;</span>
					<span>MIT License</span>
				</div>
			</div>
		</div>
	</footer>
</div>
