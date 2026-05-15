#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

import { DATA_VINTAGE } from '../src/lib/data/scoring-constants';

const ROOT_DIR = path.join(import.meta.dir, '..');
const versionTag = DATA_VINTAGE.model_version.toLowerCase().replaceAll('.', '');

const CANONICAL_DATA_FILE = path.join(ROOT_DIR, 'data', 'occupations.json');
const APP_DATA_FILE = path.join(ROOT_DIR, 'src', 'lib', 'data', 'occupations.json');
const STATIC_DATA_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	`sg-ai-occupations-${versionTag}.json`
);
const STATIC_CSV_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	`sg-ai-occupations-${versionTag}.csv`
);
const CLAIMS_MATRIX_FILE = path.join(
	ROOT_DIR,
	'static',
	'data',
	`claims-matrix-${versionTag}.json`
);
const SOURCE_MAP_FILE = path.join(ROOT_DIR, 'static', 'data', 'public-field-source-map.json');
const MANIFEST_FILE = path.join(ROOT_DIR, 'src', 'lib', 'data', 'release-manifest.json');
const SITE_STATUS_FILE = path.join(ROOT_DIR, 'src', 'lib', 'data', 'site-status.json');
const QUARTERLY_FILE = path.join(ROOT_DIR, 'src', 'lib', 'data', 'quarterly-report.json');
const LLMS_FILE = path.join(ROOT_DIR, 'static', 'llms.txt');
const LLMS_FULL_FILE = path.join(ROOT_DIR, 'static', 'llms-full.txt');
const ROBOTS_FILE = path.join(ROOT_DIR, 'static', 'robots.txt');
const SITEMAP_FILE = path.join(ROOT_DIR, 'static', 'sitemap.xml');

function readText(filePath: string): string {
	return fs.readFileSync(filePath, 'utf-8');
}

function readJson<T>(filePath: string): T {
	return JSON.parse(readText(filePath)) as T;
}

function fail(message: string): never {
	console.error(`release-check: ${message}`);
	process.exit(1);
}

function assert(condition: unknown, message: string): void {
	if (!condition) fail(message);
}

function sameJson(fileA: string, fileB: string): boolean {
	return JSON.stringify(readJson(fileA)) === JSON.stringify(readJson(fileB));
}

const canonicalData = readJson<Array<Record<string, unknown>>>(CANONICAL_DATA_FILE);
const staticData = readJson<Array<Record<string, unknown>>>(STATIC_DATA_FILE);
const claimsMatrix = readJson<{ version: string }>(CLAIMS_MATRIX_FILE);
const sourceMap = readJson<{ version: string; entries: Array<{ field_path: string }> }>(
	SOURCE_MAP_FILE
);
const manifest = readJson<{
	version: string;
	artifacts: Array<{ file: string }>;
}>(MANIFEST_FILE);
const siteStatus = readJson<{
	structural_release: { version: string; release_manifest: string };
	live_monitor: {
		quarterly_current_snapshot: string | null;
		quarterly_previous_snapshot: string | null;
	};
}>(SITE_STATUS_FILE);
const quarterlyReport = readJson<{ current_snapshot: string; previous_snapshot: string | null }>(
	QUARTERLY_FILE
);
const llms = readText(LLMS_FILE);
const llmsFull = readText(LLMS_FULL_FILE);
const robots = readText(ROBOTS_FILE);
const sitemap = readText(SITEMAP_FILE);
const currentCsvHeader = readText(STATIC_CSV_FILE).split('\n')[0] ?? '';

assert(
	sameJson(CANONICAL_DATA_FILE, APP_DATA_FILE),
	'data/occupations.json must match src/lib/data/occupations.json'
);
assert(
	JSON.stringify(canonicalData) === JSON.stringify(staticData),
	`static/data/sg-ai-occupations-${versionTag}.json must match the canonical dataset`
);
assert(fs.existsSync(STATIC_CSV_FILE), `missing static/data/sg-ai-occupations-${versionTag}.csv`);
assert(currentCsvHeader.includes('exposure_v7'), 'current CSV missing V7 exposure column');
assert(currentCsvHeader.includes('task_signal'), 'current CSV missing V7 task-signal column');
assert(currentCsvHeader.includes('baseline_v6_net_risk'), 'current CSV missing V6 baseline column');
assert(!currentCsvHeader.includes('scoring_basis'), 'current CSV still exposes old scoring_basis');
assert(
	!currentCsvHeader.includes('transition_adjusted_risk'),
	'current CSV still exposes archived V5 transition-adjusted field'
);
assert(
	!currentCsvHeader.includes('realized_risk_proxy'),
	'current CSV still exposes archived V5 realized-risk field'
);

assert(claimsMatrix.version === DATA_VINTAGE.model_version, 'claims matrix version drift');
assert(sourceMap.version === DATA_VINTAGE.model_version, 'public field source map version drift');
assert(
	!sourceMap.entries.some(entry =>
		['transition_adjusted_risk', 'realized_risk_proxy'].includes(entry.field_path)
	),
	'public field source map still advertises deprecated V5 experimental fields'
);

assert(manifest.version === DATA_VINTAGE.model_version, 'release manifest version drift');
assert(
	manifest.artifacts.some(artifact => artifact.file === `sg-ai-occupations-${versionTag}.json`),
	'missing current JSON dataset in release manifest'
);
assert(
	manifest.artifacts.some(artifact => artifact.file === `sg-ai-occupations-${versionTag}.csv`),
	'missing current CSV dataset in release manifest'
);
assert(
	manifest.artifacts.some(artifact => artifact.file === 'quarterly-report.json'),
	'missing quarterly report in release manifest'
);

assert(
	siteStatus.structural_release.version === DATA_VINTAGE.model_version,
	'site status structural version drift'
);
assert(
	siteStatus.structural_release.release_manifest === `release-manifest-${versionTag}.json`,
	'site status release manifest drift'
);
assert(
	quarterlyReport.current_snapshot.startsWith(`occupations-${versionTag}-`),
	'quarterly report current snapshot does not match current release'
);
assert(
	siteStatus.live_monitor.quarterly_current_snapshot === quarterlyReport.current_snapshot,
	'site status quarterly current snapshot drift'
);
assert(
	quarterlyReport.previous_snapshot === null ||
		quarterlyReport.previous_snapshot.startsWith(`occupations-${versionTag}-`),
	'quarterly report previous snapshot should point at the prior snapshot for the current release line'
);

for (const [name, contents] of [
	['llms.txt', llms],
	['llms-full.txt', llmsFull]
] as const) {
	assert(
		contents.includes(`Data vintage: ${DATA_VINTAGE.model_version}`) ||
			contents.includes(`Current public release: ${DATA_VINTAGE.model_version}`),
		`${name} missing current ${DATA_VINTAGE.model_version} vintage`
	);
	assert(!contents.includes('V5'), `${name} still contains stale V5 references`);
	assert(
		!contents.includes('three-layer model'),
		`${name} still contains stale three-layer wording`
	);
	assert(
		!contents.includes('transition-adjusted'),
		`${name} still contains stale transition-adjusted wording`
	);
	assert(!contents.includes('realized-risk'), `${name} still contains stale realized-risk wording`);
	assert(!contents.includes('www.kirillso.com'), `${name} still points at the old host`);
	assert(contents.includes(DATA_VINTAGE.model_version), `${name} missing current release tag`);
}

const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const uniqueSitemapLocs = new Set(sitemapLocs);
assert(
	robots.includes('Sitemap: https://aiworkindex.com/sitemap.xml'),
	'robots sitemap host drift'
);
assert(!robots.includes('www.kirillso.com'), 'robots still points at the old host');
assert(sitemapLocs.length > 1800, 'sitemap is unexpectedly small');
assert(sitemapLocs.length === uniqueSitemapLocs.size, 'sitemap contains duplicate URLs');
assert(
	sitemapLocs.every(loc => loc?.startsWith('https://aiworkindex.com/')),
	'sitemap contains URLs outside the canonical host'
);
assert(!sitemap.includes('/sg/occupation/'), 'sitemap includes Singapore redirect aliases');

console.log('release-check: ok');
