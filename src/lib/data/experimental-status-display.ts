export function experimentalStatusLabel(status: string | null | undefined): string {
	if (status === 'ready_for_shadow_scoring') return 'Shadow ready';
	if (status === 'shadow_published') return 'Shadow published';
	if (status === 'promoted') return 'Promoted';
	if (status === 'not_ready') return 'Not ready';
	if (status === 'blocked') return 'Blocked';
	if (!status) return 'Not published';

	return status
		.replaceAll('_', ' ')
		.replace(/\b\w/g, match => match.toUpperCase());
}
