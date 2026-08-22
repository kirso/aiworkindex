<script lang="ts">
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';

	let {
		title,
		label = 'Share',
		size = 'sm'
	}: { title: string; label?: string; size?: 'default' | 'sm' | 'lg' } = $props();

	async function share() {
		if (!browser) return;
		try {
			if (navigator.share) {
				await navigator.share({ title, url: window.location.href });
				return;
			}
			await navigator.clipboard.writeText(window.location.href);
			toast('Link copied');
		} catch {
			// The native share sheet can be dismissed without changing the page.
		}
	}
</script>

<Button variant="outline" {size} onclick={share}>
	<svg
		class="size-4"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"
	>
		<circle cx="18" cy="5" r="3" />
		<circle cx="6" cy="12" r="3" />
		<circle cx="18" cy="19" r="3" />
		<path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
	</svg>
	{label}
</Button>
