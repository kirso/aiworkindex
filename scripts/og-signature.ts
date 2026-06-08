/**
 * Shared signature for the OG-image freshness guard.
 *
 * generate-og.ts writes a manifest containing the signature of the scores it
 * rendered; release-check.ts recomputes the signature from the current data and
 * fails if it differs — so a score change can no longer pass `verify` while the
 * share cards still show stale numbers.
 */
import { createHash } from 'node:crypto';

export interface OgScoreItem {
	key: string;
	net_risk: number;
	risk_band: string;
}

/** Stable, order-independent signature of the rendered (key, net_risk, band) tuples. */
export function ogSignature(items: OgScoreItem[]): string {
	const normalized = items
		.map(item => `${item.key}|${item.net_risk.toFixed(4)}|${item.risk_band}`)
		.sort();
	return createHash('sha256').update(normalized.join('\n')).digest('hex').slice(0, 16);
}
