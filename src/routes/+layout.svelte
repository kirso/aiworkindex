<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';

	let { children } = $props();

	const navLinks = [
		{ href: '/', label: 'Explorer' },
		{ href: '/compare', label: 'Compare' },
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

<div class="flex min-h-screen flex-col bg-background">
	<!-- Sticky header -->
	<header class="sticky top-0 z-50 bg-header-bg shadow-sm">
		<div class="mx-auto flex max-w-screen-2xl items-center justify-between px-5 py-3 sm:px-6">
			<a href="/" class="flex items-center gap-2.5 text-header-text transition-colors hover:text-white">
				<svg class="h-5 w-5 text-ring" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2L2 7l10 5 10-5-10-5z"/>
					<path d="M2 17l10 5 10-5"/>
					<path d="M2 12l10 5 10-5"/>
				</svg>
				<span class="text-base font-semibold tracking-tight">SG AI Jobs</span>
			</a>
			<nav class="flex items-center gap-0.5">
				{#each navLinks as link (link.href)}
					<a
						href={link.href}
						class="rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors
							{$page.url.pathname === link.href
								? 'bg-header-active-bg text-white'
								: 'text-header-muted hover:bg-header-active-bg hover:text-header-text'}"
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

	<footer class="border-t border-border bg-card">
		<div class="mx-auto max-w-screen-2xl px-5 py-6 sm:px-6">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-xs text-muted-foreground">
						Data: Ministry of Manpower, Singapore. Methodology: Felten et al. (2021), Pizzinelli et al. (2023).
					</p>
					<p class="mt-0.5 text-xs text-muted-foreground/70">
						Scores represent technical AI exposure, not employment predictions.
						Exposure and displacement are distinct — see
						<a href="/methodology" class="text-ring underline hover:text-ring/80">methodology</a>.
					</p>
				</div>
				<div class="flex flex-col gap-1.5 text-xs text-muted-foreground sm:items-end">
				<div class="flex gap-3">
					<a href="/about" class="hover:text-foreground/80">About</a>
					<span>&middot;</span>
					<span>MIT License</span>
				</div>
				<p>
					Made by <a href="https://www.linkedin.com/in/kirso/" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80">Kirill So</a>
					in collaboration with
					<a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80">Claude</a>
					&amp;
					<a href="https://openai.com" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary/80">Codex</a>
				</p>
			</div>
			</div>
		</div>
	</footer>
</div>
