#!/usr/bin/env bun
/**
 * build-confidence-ratings.ts — Publish IPCC-style confidence ratings as a sidecar.
 *
 * The ratings interpret existing confidence components. They do not feed back into
 * net_risk, risk_band, or any scoring formula.
 *
 * Run: bun run scripts/build-confidence-ratings.ts
 */

import * as fs from 'fs';
import * as path from 'path';

import occupations from '../data/occupations.json';
import { CONFIDENCE_COMPONENT_WEIGHTS, DATA_VINTAGE } from '../src/lib/data/scoring-constants';
import type { Occupation } from '../src/lib/data';

type ConfidenceRating = 'high' | 'medium' | 'low';

interface ComponentBreakdown {
	crosswalk_quality: number;
	market_data_granularity: number;
	source_freshness: number;
	source_coverage: number;
	signal_agreement: number;
	sensitivity: number;
}

interface ConfidenceEntry {
	ssoc: string;
	title: string;
	net_risk: number;
	risk_band: string;
	confidence_rating: ConfidenceRating;
	published_confidence_level: ConfidenceRating;
	confidence_score: number;
	evidence_quality: {
		level: ConfidenceRating;
		score: number;
	};
	agreement: {
		level: ConfidenceRating;
		score: number;
		exposure_agreement: string | null;
		classification_uncertainty: 'crosses_boundary' | null;
	};
	components: ComponentBreakdown;
	limiting_factors: string[];
	policy_cap_reason: string | null;
	match_quality: string;
	exposure_source_count: number;
}

const ROOT_DIR = path.join(import.meta.dir, '..');
const OUT_PATHS = [
	path.join(ROOT_DIR, 'data', 'confidence-ratings.json'),
	path.join(ROOT_DIR, 'src', 'lib', 'data', 'confidence-ratings.json'),
	path.join(ROOT_DIR, 'static', 'data', 'confidence-ratings.json')
];

function round(value: number, decimals = 4): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

function levelFromScore(score: number): ConfidenceRating {
	if (score >= 0.75) return 'high';
	if (score >= 0.55) return 'medium';
	return 'low';
}

function titleCase(value: string): string {
	return value
		.split('_')
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function combineConfidence({
	publishedLevel,
	evidenceLevel,
	agreementLevel,
	policyCapReason
}: {
	publishedLevel: ConfidenceRating;
	evidenceLevel: ConfidenceRating;
	agreementLevel: ConfidenceRating;
	policyCapReason: string | null | undefined;
}): ConfidenceRating {
	if (publishedLevel === 'low' || evidenceLevel === 'low' || agreementLevel === 'low') return 'low';
	if (
		publishedLevel === 'high' &&
		evidenceLevel === 'high' &&
		agreementLevel !== 'low' &&
		!policyCapReason
	) {
		return 'high';
	}
	return 'medium';
}

function limitingFactors(
	components: ComponentBreakdown,
	policyCapReason: string | null | undefined
): string[] {
	const factors = Object.entries(components)
		.filter(([, value]) => value < 0.75)
		.sort(([, a], [, b]) => a - b)
		.map(([key]) => titleCase(key));

	if (policyCapReason) {
		factors.unshift(`Policy cap: ${titleCase(policyCapReason)}`);
	}

	return Array.from(new Set(factors)).slice(0, 4);
}

function summarizeCounts(entries: ConfidenceEntry[]) {
	return entries.reduce<Record<ConfidenceRating, number>>(
		(acc, entry) => {
			acc[entry.confidence_rating] += 1;
			return acc;
		},
		{ high: 0, medium: 0, low: 0 }
	);
}

function summarizeNestedCounts(
	entries: ConfidenceEntry[],
	getLevel: (entry: ConfidenceEntry) => ConfidenceRating
) {
	return entries.reduce<Record<ConfidenceRating, number>>(
		(acc, entry) => {
			acc[getLevel(entry)] += 1;
			return acc;
		},
		{ high: 0, medium: 0, low: 0 }
	);
}

function buildEntries(): ConfidenceEntry[] {
	return (occupations as Occupation[]).map(occ => {
		const confidence = occ.confidence;
		const components: ComponentBreakdown = {
			crosswalk_quality: confidence.crosswalk_quality,
			market_data_granularity: confidence.market_data_granularity,
			source_freshness: confidence.source_freshness,
			source_coverage: confidence.source_coverage ?? 0,
			signal_agreement: confidence.signal_agreement ?? 0,
			sensitivity: confidence.sensitivity ?? 0
		};
		const evidenceScore =
			components.crosswalk_quality * 0.4 +
			components.source_coverage * 0.25 +
			components.market_data_granularity * 0.2 +
			components.source_freshness * 0.15;
		const agreementScore =
			components.signal_agreement * 0.55 +
			components.sensitivity * 0.3 +
			(occ.classification_uncertainty === 'crosses_boundary' ? 0.45 : 0.85) * 0.15;
		const evidenceLevel = levelFromScore(evidenceScore);
		const agreementLevel = levelFromScore(agreementScore);
		const policyCapReason = confidence.policy_cap_reason ?? null;
		const publishedLevel = confidence.level;
		const confidenceRating = combineConfidence({
			publishedLevel,
			evidenceLevel,
			agreementLevel,
			policyCapReason
		});

		return {
			ssoc: occ.ssoc,
			title: occ.title,
			net_risk: occ.net_risk,
			risk_band: occ.risk_band,
			confidence_rating: confidenceRating,
			published_confidence_level: publishedLevel,
			confidence_score: confidence.score,
			evidence_quality: {
				level: evidenceLevel,
				score: round(evidenceScore)
			},
			agreement: {
				level: agreementLevel,
				score: round(agreementScore),
				exposure_agreement: occ.evidence.exposure_agreement ?? null,
				classification_uncertainty: occ.classification_uncertainty ?? null
			},
			components: Object.fromEntries(
				Object.entries(components).map(([key, value]) => [key, round(value)])
			) as ComponentBreakdown,
			limiting_factors: limitingFactors(components, policyCapReason),
			policy_cap_reason: policyCapReason,
			match_quality: occ.scores.match_quality,
			exposure_source_count:
				confidence.exposure_source_count ?? occ.evidence.exposure_source_count ?? 0
		};
	});
}

function buildArtifact() {
	const entries = buildEntries();
	const limitingFactorCounts = new Map<string, number>();
	const policyCapCounts = new Map<string, number>();

	for (const entry of entries) {
		for (const factor of entry.limiting_factors) {
			limitingFactorCounts.set(factor, (limitingFactorCounts.get(factor) ?? 0) + 1);
		}
		if (entry.policy_cap_reason) {
			policyCapCounts.set(
				entry.policy_cap_reason,
				(policyCapCounts.get(entry.policy_cap_reason) ?? 0) + 1
			);
		}
	}

	const topLimitingFactors = Array.from(limitingFactorCounts.entries())
		.map(([factor, count]) => ({ factor, count }))
		.sort((a, b) => b.count - a.count || a.factor.localeCompare(b.factor))
		.slice(0, 8);

	return {
		validation_date: new Date().toISOString().slice(0, 10),
		model_version: DATA_VINTAGE.model_version,
		method: 'confidence_ratings_v1',
		occupation_count: entries.length,
		framing:
			'IPCC-style confidence means evidence quality and signal agreement behind the published score; it is not a probability that the risk estimate is correct.',
		component_weights: CONFIDENCE_COMPONENT_WEIGHTS,
		derived_weights: {
			evidence_quality: {
				crosswalk_quality: 0.4,
				source_coverage: 0.25,
				market_data_granularity: 0.2,
				source_freshness: 0.15
			},
			agreement: {
				signal_agreement: 0.55,
				sensitivity: 0.3,
				band_boundary_stability: 0.15
			}
		},
		summary: {
			counts: summarizeCounts(entries),
			evidence_quality_counts: summarizeNestedCounts(
				entries,
				entry => entry.evidence_quality.level
			),
			agreement_counts: summarizeNestedCounts(entries, entry => entry.agreement.level),
			policy_cap_counts: Object.fromEntries(
				Array.from(policyCapCounts.entries()).sort(([a], [b]) => a.localeCompare(b))
			),
			top_limiting_factors: topLimitingFactors
		},
		entries,
		caveats: [
			'Confidence ratings are interpretive sidecars; they do not change occupation risk scores, bands, rankings, or role scores.',
			'High confidence means the score rests on stronger crosswalks, broader source coverage, fresher evidence, and less internal disagreement. It does not imply that the structural-pressure estimate is certain.',
			'Low confidence usually reflects crosswalk fallback, limited source coverage, internal signal disagreement, or sensitivity near a risk-band boundary.'
		]
	};
}

const artifact = buildArtifact();

for (const outPath of OUT_PATHS) {
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`);
}

console.log(
	`Built confidence-ratings.json for ${artifact.occupation_count} occupations: ` +
		`${artifact.summary.counts.high} high, ${artifact.summary.counts.medium} medium, ` +
		`${artifact.summary.counts.low} low`
);
