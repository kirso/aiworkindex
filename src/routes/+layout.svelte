<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { SITE } from '$lib/data/scoring-constants';
	import { siteStatus } from '$lib/data/site-status';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import CommandMenu from '$lib/components/ui/CommandMenu.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { GA_MEASUREMENT_ID } from '$lib/analytics';
	import { afterNavigate } from '$app/navigation';
	import { countryConfigs } from '$lib/data/country-config';

	let { children } = $props();

	// Close mobile menu + track page view on every client-side navigation
	afterNavigate(() => {
		mobileMenuOpen = false;
		if (!window.gtag) return;
		window.gtag('config', GA_MEASUREMENT_ID, {
			page_path: window.location.pathname,
			page_title: document.title
		});
	});

	const navLinks = [
		{ href: '/', label: 'Find a job' },
		{ href: '/explore', label: 'Explore' },
		{ href: '/roles', label: 'Modern roles' },
		{ href: '/compare', label: 'Compare' },
		{ href: '/will-ai-take-my-job', label: 'My work' }
	];

	const secondaryLinks = [
		{ href: '/watchlist', label: 'Saved jobs' },
		{ href: '/rankings', label: 'Rankings' },
		{ href: '/reports', label: 'Reports' },
		{ href: '/research', label: 'Research' },
		{ href: '/methodology', label: 'Methodology' },
		{ href: '/data', label: 'Data' },
		{ href: '/about', label: 'About' },
		{ href: '/changelog', label: 'Changelog' }
	];

	const marketLinks = [
		{ href: '/sg', label: countryConfigs.sg.name },
		{ href: '/us', label: 'US Preview' }
	];

	let mobileMenuOpen = $state(false);

	function isActive(href: string): boolean {
		return page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(href));
	}

	const layoutJsonLd = `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${SITE.url}/#website`,
		name: SITE.name,
		alternateName: SITE.shortName,
		url: `${SITE.url}/`,
		description: `${siteStatus.structural_release.counts.scored} Singapore SSOC 2024 occupations ranked by AI Work Pressure using ILO 2025 task-exposure evidence, with ${siteStatus.structural_release.counts.insufficient_evidence} occupations explicitly unranked.`,
		publisher: {
			'@type': 'Organization',
			'@id': `${SITE.url}/#organization`,
			name: SITE.name,
			url: `${SITE.url}/`,
			description:
				'Open-source evidence on AI work pressure for Singapore occupations and clearly labelled modern-role estimates',
			foundingDate: '2024',
			knowsAbout: [
				'AI task pressure',
				'occupational exposure to artificial intelligence',
				'Singapore occupations',
				'Singapore wages',
				'Singapore labour demand',
				'labour economics'
			],
			areaServed: { '@type': 'Country', name: 'Singapore' },
			sameAs: [SITE.github, SITE.authorUrl]
		},
		inLanguage: 'en',
		dateModified: siteStatus.updated_at
	})}<\/script>`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content={SITE.name} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="author" content="Kirill So" />
	{@html layoutJsonLd}
</svelte:head>

<div class="flex min-h-screen flex-col bg-background">
	<!-- Skip navigation for keyboard/screen-reader users -->
	<a
		href="#main-content"
		class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg"
	>
		Skip to content
	</a>

	<!-- Header -->
	<header class="sticky top-0 z-50 border-b border-foreground bg-header-bg">
		<div class="mx-auto flex h-12 max-w-screen-2xl items-center justify-between px-5 sm:px-6">
			<a
				href="/"
				class="flex items-center gap-2 text-header-text transition-colors hover:text-primary"
			>
				<span class="text-sm font-black uppercase tracking-tight">{SITE.name}</span>
				<span class="hidden border-l border-border pl-2 text-xs text-header-muted xl:inline"
					>Singapore work and AI</span
				>
			</a>

			<!-- Desktop nav -->
			<div class="hidden items-center gap-1 sm:flex">
				<nav class="flex items-center">
					{#each navLinks as link (link.href)}
						<a
							href={link.href}
							class="inline-flex min-h-10 items-center rounded-none px-2.5 py-1 text-xs font-medium transition-colors duration-100
								{isActive(link.href)
								? 'bg-header-active-bg text-foreground'
								: 'text-header-muted hover:text-foreground'}"
						>
							{link.label}
						</a>
					{/each}
				</nav>
				<div
					class="ml-2 hidden items-center gap-1 border border-header-active-bg bg-header-active-bg/20 p-0.5 lg:flex"
				>
					{#each marketLinks as market (market.href)}
						<a
							href={market.href}
							class="rounded-none px-2.5 py-1 text-[11px] font-medium transition-colors duration-100
								{isActive(market.href)
								? 'bg-header-active-bg text-foreground'
								: 'text-header-muted hover:text-foreground'}"
						>
							{market.label}
						</a>
					{/each}
				</div>
				<CommandMenu />
				<a
					href="/watchlist"
					class="ml-1 hidden min-h-11 items-center gap-1.5 border border-border px-2.5 text-xs font-medium text-header-muted transition-colors hover:border-foreground hover:text-foreground lg:inline-flex"
				>
					<svg
						class="size-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
					</svg>
					Saved
				</a>
			</div>

			<!-- Mobile menu -->
			<div class="flex items-center gap-1 sm:hidden">
				<Sheet.Root bind:open={mobileMenuOpen}>
					<Sheet.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								class="h-11 w-11 text-header-muted hover:text-foreground"
							>
								<svg
									class="h-4.5 w-4.5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line
										x1="3"
										y1="18"
										x2="21"
										y2="18"
									/>
								</svg>
								<span class="sr-only">Open menu</span>
							</Button>
						{/snippet}
					</Sheet.Trigger>
					<Sheet.Content side="right" class="w-64 bg-card border-border">
						<Sheet.Header class="text-left">
							<Sheet.Title class="text-sm font-bold text-foreground">Navigation</Sheet.Title>
						</Sheet.Header>
						<nav class="mt-3 flex flex-col gap-0.5" aria-label="Mobile navigation">
							{#each navLinks as link (link.href)}
								<a
									href={link.href}
									class="flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100
										{isActive(link.href)
										? 'bg-accent text-foreground'
										: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
								>
									{link.label}
								</a>
							{/each}
						</nav>
						<div class="mt-3 rounded-md border border-border bg-muted/30 p-2">
							<p
								class="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>
								Markets
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#each marketLinks as market (market.href)}
									<a
										href={market.href}
										class="rounded-full border border-border px-2.5 py-1 text-xs font-medium transition-colors duration-100
											{isActive(market.href)
											? 'bg-accent text-foreground'
											: 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'}"
									>
										{market.label}
									</a>
								{/each}
							</div>
						</div>
						<Separator class="my-2" />
						<nav class="flex flex-col gap-0.5">
							{#each secondaryLinks as link (link.href)}
								<a
									href={link.href}
									class="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-100 hover:bg-accent hover:text-foreground"
								>
									{link.label}
								</a>
							{/each}
						</nav>
					</Sheet.Content>
				</Sheet.Root>
			</div>
		</div>
	</header>

	<div id="main-content" class="flex-1" tabindex="-1">
		{@render children()}
	</div>

	<!-- Footer -->
	<footer class="border-t border-border">
		<div class="mx-auto max-w-screen-2xl px-5 sm:px-6 py-4">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-xs text-muted-foreground">
					Explore how current AI overlaps with Singapore work, alongside pay and hiring signals.
					<a href="/methodology" class="text-primary hover:underline">How it works</a>
				</p>
				<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
					<a href="/rankings" class="hover:text-foreground">Rankings</a>
					<a href="/watchlist" class="hover:text-foreground">Saved jobs</a>
					<a href="/reports" class="hover:text-foreground">Reports</a>
					<a href="/research" class="hover:text-foreground">Research</a>
					<a href="/data" class="hover:text-foreground">Data</a>
					<a href="/about" class="hover:text-foreground">About</a>
					<a href="/changelog" class="hover:text-foreground">Changelog</a>
					<a
						href={SITE.github}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-foreground">GitHub</a
					>
				</div>
			</div>
			<p class="mt-2 text-xs text-text-ghost">
				{siteStatus.structural_release.version} · {siteStatus.structural_release.counts.occupations.toLocaleString()}
				SSOC 2024 occupations · {siteStatus.role_query_layer.count} modern-title journeys · Code under
				MIT ·
				<a
					href={SITE.authorUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="hover:text-muted-foreground">Kirill So</a
				>
			</p>
		</div>
	</footer>
	<Toaster />
</div>
