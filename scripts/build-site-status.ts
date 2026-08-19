#!/usr/bin/env bun
/**
 * Build the public V9 status and dated release-history artifacts.
 *
 * site-status.json describes only the current V9 public contract. Earlier
 * models and experiments belong in releases.json as explicitly dated archives.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATIC_DATA_DIR = path.join(ROOT_DIR, 'static', 'data');
const SRC_DATA_DIR = path.join(ROOT_DIR, 'src', 'lib', 'data');

const V9_RELEASE_FILE = path.join(ROOT_DIR, 'data', 'occupations-v9.json');
const V9_MARKET_FILE = path.join(ROOT_DIR, 'data', 'v9-market-context.json');
const V9_ROLES_FILE = path.join(ROOT_DIR, 'data', 'synthetic-roles-v9.json');
const RESEARCH_LIBRARY_FILE = path.join(ROOT_DIR, 'data', 'research-library.json');

const SITE_STATUS_OUT = path.join(STATIC_DATA_DIR, 'site-status.json');
const SITE_STATUS_SRC_OUT = path.join(SRC_DATA_DIR, 'site-status.json');
const RELEASES_OUT = path.join(STATIC_DATA_DIR, 'releases.json');
const RELEASES_SRC_OUT = path.join(SRC_DATA_DIR, 'releases.json');

type V9Release = {
	generated_at: string;
	counts: {
		occupations: number;
		scored: number;
		insufficient_evidence: number;
		direct_wages: number;
	};
};

type DemandEvidence = {
	source_key: string;
	source_occupation: string;
};

type V9Market = {
	generated_at: string;
	taxonomy: string;
	rules: {
		demand: string;
		postings: string;
		headline_separation: string;
	};
	demand_by_code: Record<string, DemandEvidence[]>;
	withheld_demand_mappings: Array<{
		source_key: string;
		source_occupation: string;
		reason: string;
	}>;
	national: {
		labour_market_q2_2026_advance: {
			published_at: string;
			url: string;
			status: string;
			limitation: string;
		};
		postings_monitor: {
			status: string;
			public_demand_input: boolean;
			observed_through: string | null;
			limitation: string;
		};
	};
};

type V9Roles = {
	generated_at: string;
	taxonomy: string;
	counts: {
		roles: number;
		exact_title_matches: number;
		reviewed_alias_matches: number;
		official_query_matches: number;
		non_official_roles: number;
		composite_roles: number;
		mapping_withheld: number;
	};
};

type ResearchLibrary = {
	version: string;
	review_cutoff: string;
	entry_count: number;
};

function readJson<T>(filePath: string): T {
	if (!fs.existsSync(filePath)) throw new Error(`Missing required V9 artifact: ${filePath}`);
	return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeJson(filePath: string, payload: unknown): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

const V9_RELEASE = readJson<V9Release>(V9_RELEASE_FILE);
const V9_MARKET = readJson<V9Market>(V9_MARKET_FILE);
const V9_ROLES = readJson<V9Roles>(V9_ROLES_FILE);
const RESEARCH_LIBRARY = readJson<ResearchLibrary>(RESEARCH_LIBRARY_FILE);

const LATEST_OFFICIAL_LABOUR_REPORT = {
	label: 'MOM Labour Market Advance Release Q2 2026',
	period: 'Q2 2026',
	published_at: V9_MARKET.national.labour_market_q2_2026_advance.published_at,
	url: V9_MARKET.national.labour_market_q2_2026_advance.url,
	status: 'preliminary_macro' as const
};

const STRUCTURAL_VERSION_HISTORY = [
	{
		id: 'public-v9-2026-08-19',
		version_label: 'V9',
		label: 'V9 Singapore AI Work Pressure release',
		published_at: '2026-08-19',
		display_date: '19 Aug 2026',
		availability: 'current_report',
		href: '/reports/v9-release',
		notes: [
			'Migrates the active occupation universe to SSOC 2024.',
			'Uses ILO 2025 mean task exposure as the sole owner of the AI Work Pressure Rank.',
			'Publishes official exposure categories, mapping ranges, task-score dispersion, direct wages and separate market evidence.'
		]
	},
	{
		id: 'public-v8-2026-07-15',
		version_label: 'V8',
		label: 'V8 AI exposure release',
		published_at: '2026-07-15',
		display_date: '15 Jul 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v8.json',
		notes: [
			'Archived SSOC 2020 release retained for auditability.',
			'At publication, V8 introduced a relative 0-100 Singapore AI exposure contract with substitution, augmentation, pathway, confidence and sensitivity fields.',
			'At publication, demand, adoption, attrition, entry-level and transition economics were reported separately from the headline score.',
			'At publication, United States and global occupation scores were withdrawn until local validation gates passed.',
			'Its formulas, labels and sidecars are not part of V9 and must not be joined to V9 as a time series.'
		]
	},
	{
		id: 'structural-v7-2026-04-07',
		version_label: 'V7',
		label: 'V7 structural release',
		published_at: '2026-04-07',
		display_date: '7 Apr 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v7.json',
		notes: [
			'Archived SSOC 2020 structural release; superseded by V9.',
			'V7 added a task-concentration exposure buffer and demand-persistence proxy to the V6 structural model.',
			'Revised 7 June 2026: the task-concentration term was corrected from an exposure amplifier to a buffer.',
			'V6 remains preserved as its immediate structural baseline.'
		]
	},
	{
		id: 'structural-v6-2026-04-01',
		version_label: 'V6',
		label: 'V6 structural release',
		published_at: '2026-04-01',
		display_date: '1 Apr 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v6.json',
		notes: [
			'Archived SSOC 2020 structural release; superseded by V9.',
			'V6 published a two-axis structural model built from an exposure ensemble, a human bottleneck, displacement pressure and demand resilience.',
			'It is retained as the immediate pre-V7 structural baseline.'
		]
	},
	{
		id: 'structural-v5-2026-03-21',
		version_label: 'V5',
		label: 'V5 structural release',
		published_at: '2026-03-21',
		display_date: '21 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v5.json',
		notes: [
			'Archived SSOC 2020 structural release; superseded by V9.',
			'V5 published a latent-source posterior exposure model with task-mode blending, concentration-driven fragility and heterogeneous augmentation.',
			'Transition-adjusted and realised-risk layers were adjunct fields in that release.'
		]
	},
	{
		id: 'structural-v43-2026-03-21',
		version_label: 'V4.3',
		label: 'V4.3 structural release',
		published_at: '2026-03-21',
		display_date: '21 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v43.json',
		notes: [
			'Archived SSOC 2020 structural release; superseded by V9.',
			'V4.3 retained the task-aware structural snapshot from the V4 lineage.',
			'Its separate shadow-governance artifact remains available with its historical validation and anchor-review gates.'
		]
	},
	{
		id: 'structural-v42-2026-03-21',
		version_label: 'V4.2',
		label: 'V4.2 structural release',
		published_at: '2026-03-21',
		display_date: '21 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v42.json',
		notes: [
			'Archived SSOC 2020 structural release; superseded by V9.',
			'V4.2 introduced a shared methodology core, bootstrap uncertainty, forecast separation and governance hardening.',
			'It is retained as the final pre-V4.3 baseline.'
		]
	},
	{
		id: 'structural-v40-2026-03-19',
		version_label: 'V4.0',
		label: 'V4.0 four-source ensemble milestone',
		published_at: '2026-03-19',
		display_date: '19 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Methodology milestone retained for lineage; no standalone snapshot is published.',
			'V4.0 expanded exposure into a four-source ensemble: AIOE, Anthropic, Eloundou and ILO.',
			'It preceded the V4.2 methodology-hardening pass.'
		]
	},
	{
		id: 'structural-v33-2026-03-19',
		version_label: 'V3.3',
		label: 'V3.3 ensemble exposure iteration',
		published_at: '2026-03-19',
		display_date: '19 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Methodology milestone retained for lineage; no standalone snapshot is published.',
			'V3.3 introduced the first ensemble-style exposure blend before the four-source V4 lineage.'
		]
	},
	{
		id: 'structural-v32-2026-03-19',
		version_label: 'V3.2',
		label: 'V3.2 confidence-interval milestone',
		published_at: '2026-03-19',
		display_date: '19 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Methodology milestone retained for lineage; no standalone snapshot is published.',
			'V3.2 surfaced confidence intervals and recalibrated seniority adjustments.'
		]
	},
	{
		id: 'structural-v31-2026-03-16',
		version_label: 'V3.1',
		label: 'V3.1 observed-exposure and demand-signal milestone',
		published_at: '2026-03-16',
		display_date: '16 Mar 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Methodology milestone retained for lineage; no standalone snapshot is published.',
			'V3.1 added Anthropic observed-usage data and stronger Singapore demand/context layers.'
		]
	},
	{
		id: 'structural-v30-2026-03-16',
		version_label: 'V3.0',
		label: 'V3.0 three-layer structural score',
		published_at: '2026-03-16',
		display_date: '16 Mar 2026',
		availability: 'historical_snapshot',
		href: '/data/sg-ai-occupations-v3.json',
		notes: [
			'Archived SSOC 2020 structural release; superseded by V9.',
			'V3.0 published the first three-layer structural score: exposure, bottleneck and market modifier.'
		]
	},
	{
		id: 'structural-v2-2026-01',
		version_label: 'V2',
		label: 'V2 Singapore occupation scorer',
		published_at: null,
		display_date: 'Jan 2026',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Historical methodology lineage only; no standalone snapshot is published.',
			'V2 was the second-generation Singapore occupation scorer before the V3 formula rewrite.'
		]
	},
	{
		id: 'structural-v1-2025-12',
		version_label: 'V1',
		label: 'V1 public alpha',
		published_at: null,
		display_date: 'Dec 2025',
		availability: 'history_only',
		href: '/methodology',
		notes: [
			'Historical methodology lineage only; no standalone snapshot is published.',
			'V1 was the first public alpha of the Singapore occupation AI-impact project.'
		]
	}
] as const;

function buildSiteStatus() {
	const demandEvidence = Object.values(V9_MARKET.demand_by_code).flat();
	const reviewedNamedLabels = new Set(
		demandEvidence.map(item => `${item.source_key}\u0000${item.source_occupation}`)
	);
	const postings = V9_MARKET.national.postings_monitor;

	return {
		schema_version: '9.0',
		updated_at: V9_RELEASE.generated_at,
		structural_release: {
			version: 'V9',
			status: 'current',
			label: 'V9 Singapore AI Work Pressure release',
			generated_at: V9_RELEASE.generated_at,
			score_dataset_generated_at: V9_RELEASE.generated_at,
			release_manifest: 'release-manifest-v9.json',
			taxonomy: 'SSOC 2024',
			headline_construct: 'AI Work Pressure Rank',
			headline_source: 'ILO 2025 mean_score_2025',
			counts: V9_RELEASE.counts
		},
		role_query_layer: {
			status: 'official_resolutions_composites_and_withheld_queries',
			artifact: 'synthetic-roles-v9.json',
			taxonomy_mapping: V9_ROLES.taxonomy,
			count: V9_ROLES.counts.roles,
			exact_title_match_count: V9_ROLES.counts.exact_title_matches,
			reviewed_alias_match_count: V9_ROLES.counts.reviewed_alias_matches,
			official_match_count: V9_ROLES.counts.official_query_matches,
			non_official_count: V9_ROLES.counts.non_official_roles,
			estimated_count: V9_ROLES.counts.composite_roles,
			withheld_count: V9_ROLES.counts.mapping_withheld,
			headline_effect: 'none'
		},
		external_comparisons: {
			status: 'withheld',
			headline_effect: 'none',
			reason_code: 'missing_verified_isco08_to_soc_provenance_or_construct_replication',
			coverage: {
				aioe: { published: 0, total: V9_RELEASE.counts.occupations },
				eloundou: { published: 0, total: V9_RELEASE.counts.occupations },
				observed_ai_use: { published: 0, total: V9_RELEASE.counts.occupations },
				potential_complementarity: { published: 0, total: V9_RELEASE.counts.occupations }
			}
		},
		live_monitor: {
			market_context_artifact: 'v9-market-context.json',
			market_context_generated_at: V9_MARKET.generated_at,
			latest_official_labour_report: LATEST_OFFICIAL_LABOUR_REPORT,
			detailed_labour_evidence_vintage: 'Q1 2026',
			macro_context_vintage: 'Q2 2026 advance release',
			named_demand: {
				occupation_count: Object.keys(V9_MARKET.demand_by_code).length,
				reviewed_source_label_count: reviewedNamedLabels.size,
				withheld_generic_label_count: V9_MARKET.withheld_demand_mappings.length,
				mapping_rule: V9_MARKET.rules.demand
			},
			postings: {
				status: postings.status,
				public_demand_input: postings.public_demand_input,
				observed_through: postings.observed_through,
				limitation: postings.limitation
			},
			quarterly_comparison: {
				status: 'withheld_until_two_comparable_v9_snapshots',
				current_snapshot: null,
				previous_snapshot: null
			},
			research_review_cutoff: RESEARCH_LIBRARY.review_cutoff,
			research_record_count: RESEARCH_LIBRARY.entry_count,
			headline_separation: V9_MARKET.rules.headline_separation,
			refresh_note:
				'Q1 2026 remains the latest detailed occupation-group evidence. Q2 2026 is preliminary national context and does not become an occupation-level outcome.'
		},
		archives: {
			status: 'dated_historical_records_not_current_v9',
			releases_artifact: 'releases.json',
			release_history_page: '/changelog',
			reports_index: '/reports',
			methodology_boundary:
				'V1-V8 scores, formulas, validation summaries and sidecars are historical records. They are not current V9 evidence and are not comparable as a V9 time series.'
		},
		homepage_banner: {
			tag: 'Live now',
			title: 'V9 maps AI work pressure across SSOC 2024',
			body: 'The current release covers 1,001 Singapore occupations. Pressure ranks come from ILO task exposure; wages, demand and labour evidence remain separate.',
			link_href: '/methodology',
			link_label: 'Read the V9 methodology'
		}
	};
}

function buildReleases(siteStatus: ReturnType<typeof buildSiteStatus>) {
	const currentMonitorVintage = `${siteStatus.live_monitor.detailed_labour_evidence_vintage} detailed; ${siteStatus.live_monitor.macro_context_vintage}`;

	return [
		...STRUCTURAL_VERSION_HISTORY.map(entry => {
			const current = entry.version_label === 'V9';
			return {
				id: entry.id,
				type: 'structural_release',
				label: entry.label,
				version_label: entry.version_label,
				published_at: entry.published_at,
				display_date: entry.display_date,
				score_version: entry.version_label,
				monitor_vintage: current ? currentMonitorVintage : null,
				href: entry.href,
				availability: entry.availability,
				status: current ? 'current' : 'archive',
				archive: !current,
				notes: entry.notes
			};
		}),
		{
			id: 'shadow-score-v43-published',
			type: 'experimental_update',
			label: 'V4.3 shadow score published',
			version_label: null,
			published_at: '2026-03-21',
			display_date: '21 Mar 2026',
			score_version: 'V4.3',
			monitor_vintage: null,
			href: '/reports/v4-3-shadow',
			availability: 'archived_report',
			status: 'archive',
			archive: true,
			notes: [
				'Archived V4.3 shadow-model record. Its promotion gates and comparison metrics are not part of V9.'
			]
		},
		{
			id: 'v5-sidecars-published',
			type: 'experimental_update',
			label: 'V5 sidecars published',
			version_label: null,
			published_at: '2026-03-21',
			display_date: '21 Mar 2026',
			score_version: 'V5',
			monitor_vintage: null,
			href: '/reports/v5-roadmap',
			availability: 'archived_report',
			status: 'archive',
			archive: true,
			notes: ['Archived V5 sidecar record. Its fields do not contribute to V9.']
		},
		{
			id: 'v5-experimental-model-published',
			type: 'experimental_update',
			label: 'V5 experimental model published',
			version_label: null,
			published_at: '2026-03-21',
			display_date: '21 Mar 2026',
			score_version: 'V5',
			monitor_vintage: null,
			href: '/reports/v5-experimental',
			availability: 'archived_report',
			status: 'archive',
			archive: true,
			notes: [
				'Archived V5 experimental-model record. Its risk fields and validation are not part of V9.'
			]
		},
		{
			id: 'official-labour-advance-release-q2-2026',
			type: 'official_update',
			label: siteStatus.live_monitor.latest_official_labour_report.label,
			version_label: null,
			published_at: siteStatus.live_monitor.latest_official_labour_report.published_at,
			display_date: '31 Jul 2026',
			score_version: 'V9',
			monitor_vintage: currentMonitorVintage,
			href: siteStatus.live_monitor.latest_official_labour_report.url,
			availability: 'current_source',
			status: 'current_evidence',
			archive: false,
			notes: [
				'Preliminary national labour-market figures published by MOM.',
				'Q1 2026 remains the latest detailed occupation-group evidence until the full Q2 report.'
			]
		},
		{
			id: 'v9-quarterly-comparison-withheld',
			type: 'report_refresh',
			label: 'V9 quarterly comparison pending',
			version_label: null,
			published_at: V9_RELEASE.generated_at,
			display_date: '19 Aug 2026',
			score_version: 'V9',
			monitor_vintage: currentMonitorVintage,
			href: '/reports',
			availability: 'current_notice',
			status: 'withheld',
			archive: false,
			notes: [
				'No V9 mover ranking is published until two comparable V9 snapshots exist.',
				'Older structural snapshots are not treated as comparable to the SSOC 2024 release.'
			]
		}
	];
}

const siteStatus = buildSiteStatus();
const releases = buildReleases(siteStatus);

writeJson(SITE_STATUS_OUT, siteStatus);
writeJson(SITE_STATUS_SRC_OUT, siteStatus);
writeJson(RELEASES_OUT, releases);
writeJson(RELEASES_SRC_OUT, releases);

console.log(`Built V9 site status at ${SITE_STATUS_OUT}`);
console.log(`Built dated release history at ${RELEASES_OUT}`);
