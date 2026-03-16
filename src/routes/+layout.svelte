<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';

	let { children } = $props();

	const navLinks = [
		{ href: '/', label: 'Explorer' },
		{ href: '/methodology', label: 'Methodology' },
		{ href: '/about', label: 'About' }
	];

	let currentPath = $derived($page.url.pathname);
	let duration = $derived(prefersReducedMotion.current ? 0 : 180);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="Singapore AI Occupation Impact Index" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50">
	<!-- Sticky header / nav — dark slate -->
	<header class="sticky top-0 z-50 border-b border-slate-700 bg-slate-900 shadow-md">
		<div class="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
			<a href="/" class="flex items-center gap-2 font-semibold text-white transition-colors hover:text-gray-300">
				<span class="text-lg">SG AI Jobs</span>
			</a>
			<nav class="flex items-center gap-1">
				{#each navLinks as link (link.href)}
					<a
						href={link.href}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors
							{$page.url.pathname === link.href
								? 'bg-white/15 text-white'
								: 'text-gray-400 hover:bg-white/10 hover:text-gray-200'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>
	</header>

	<div class="flex-1">
		{#key currentPath}
			<div in:fade={{ duration }}>
				{@render children()}
			</div>
		{/key}
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
						<a href="/methodology" class="text-indigo-600 underline hover:text-indigo-700">methodology</a>.
					</p>
				</div>
				<div class="flex flex-col gap-1.5 text-xs text-gray-400 sm:items-end">
				<div class="flex gap-3">
					<a href="/about" class="hover:text-gray-600">About</a>
					<span>&middot;</span>
					<span>MIT License</span>
				</div>
				<p>
					Made by <a href="https://www.linkedin.com/in/kirso/" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700">Kirill So</a>
					in collaboration with
					<a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700">Claude</a>
					&amp;
					<a href="https://openai.com" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-700">Codex</a>
				</p>
			</div>
			</div>
		</div>
	</footer>
</div>
