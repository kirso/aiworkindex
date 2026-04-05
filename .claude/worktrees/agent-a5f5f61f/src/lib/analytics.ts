/**
 * Analytics — thin wrapper around gtag for GA4.
 *
 * Usage:
 *   import { trackEvent } from '$lib/analytics';
 *   trackEvent('search_used', { query: 'nurse', result_count: 5 });
 *
 * The gtag script is loaded in +layout.svelte.
 * All events are client-side only (adapter-static).
 */

import { browser } from '$app/environment';

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
		dataLayer?: unknown[];
	}
}

/** Your GA4 Measurement ID — set this after creating the property */
export const GA_MEASUREMENT_ID = 'G-0YDYQY6PED';

/** Track a custom event */
export function trackEvent(name: string, params?: Record<string, unknown>) {
	if (!browser || !window.gtag) return;
	window.gtag('event', name, params);
}

/** Track page view with custom dimensions */
export function trackPageView(params?: {
	page_type?: string;
	ssoc?: string;
	slug?: string;
	risk_band?: string;
}) {
	if (!browser || !window.gtag) return;
	window.gtag('event', 'page_view', {
		page_location: window.location.href,
		page_title: document.title,
		...params
	});
}
