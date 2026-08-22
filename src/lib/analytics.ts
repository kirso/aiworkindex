/**
 * Analytics — thin wrapper around gtag for GA4.
 *
 * Product analytics deliberately exclude search text and personal-work answers.
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

function trackEvent(name: string, params?: Record<string, unknown>) {
	if (!browser || !window.gtag) return;
	window.gtag('event', name, params);
}

export type ProductEventName =
	| 'job_search_selected'
	| 'explorer_filter_changed'
	| 'chart_view_changed'
	| 'job_saved'
	| 'comparison_created'
	| 'comparison_link_copied'
	| 'personal_check_started'
	| 'personal_check_completed'
	| 'technical_details_opened'
	| 'source_opened';

export type ProductEventParams = {
	entity_kind?: 'occupation' | 'role';
	selected_count?: number;
	saved?: boolean;
	context?: 'home' | 'explore' | 'job_page' | 'checker' | 'compare' | 'saved_jobs' | 'navigation';
	view?: 'map' | 'scatter' | 'list';
	filter_kind?: 'group' | 'pressure' | 'wage' | 'demand' | 'mapping' | 'sort';
};

/** Record a bounded product event without job titles, queries or personal answers. */
export function trackProductEvent(name: ProductEventName, params: ProductEventParams = {}) {
	trackEvent(name, params);
}

/** Track page view with custom dimensions */
export function trackPageView(params?: {
	page_type?: string;
	entity_kind?: 'occupation' | 'role';
}) {
	if (!browser || !window.gtag) return;
	window.gtag('event', 'page_view', {
		page_location: window.location.href,
		page_title: document.title,
		...params
	});
}
