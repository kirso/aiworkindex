<script lang="ts">
	import { Toaster as SonnerToaster, type ToasterProps } from 'svelte-sonner';

	let restProps: ToasterProps = $props();
</script>

<SonnerToaster
	class="toaster group"
	toastOptions={{
		classes: {
			toast:
				'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg',
			title: 'group-[.toast]:text-foreground group-[.toast]:text-sm group-[.toast]:font-semibold',
			description: 'group-[.toast]:text-text-secondary group-[.toast]:text-xs',
			actionButton:
				'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-md',
			cancelButton:
				'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-md',
			success:
				'group-[.toaster]:border-risk-very-low-border group-[.toaster]:bg-risk-very-low-subtle group-[.toaster]:text-foreground',
			error:
				'group-[.toaster]:border-destructive group-[.toaster]:bg-card group-[.toaster]:text-destructive',
			warning:
				'group-[.toaster]:border-risk-moderate-border group-[.toaster]:bg-risk-moderate-subtle group-[.toaster]:text-foreground',
			info: 'group-[.toaster]:border-primary/20 group-[.toaster]:bg-primary/5 group-[.toaster]:text-foreground'
		}
	}}
	{...restProps}
/>
