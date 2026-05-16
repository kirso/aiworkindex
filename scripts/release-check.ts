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
const HEADERS_FILE = path.join(ROOT_DIR, 'static', '_headers');
const BUILD_DIR = path.join(ROOT_DIR, 'build');

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

function decodeHtmlEntities(value: string): string {
	return value
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&mdash;/g, '-')
		.replace(/&ndash;/g, '-')
		.replace(/&minus;/g, '-')
		.replace(/&times;/g, 'x')
		.replace(/&ge;/g, '>=')
		.replace(/&le;/g, '<=');
}

function normalizeText(value: string): string {
	return decodeHtmlEntities(value)
		.replace(/\s+/g, ' ')
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.trim()
		.toLowerCase();
}

function sameJson(fileA: string, fileB: string): boolean {
	return JSON.stringify(readJson(fileA)) === JSON.stringify(readJson(fileB));
}

function walkHtmlFiles(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	const files: string[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkHtmlFiles(entryPath));
		} else if (entry.isFile() && entry.name.endsWith('.html')) {
			files.push(entryPath);
		}
	}
	return files;
}

function htmlFileToRoute(filePath: string): string {
	const relative = path.relative(BUILD_DIR, filePath).replaceAll(path.sep, '/');
	if (relative === 'index.html') return '/';
	if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'/index.html'.length)}`;
	return `/${relative.slice(0, -'.html'.length)}`;
}

function normalizeRoute(route: string): string {
	const withoutTrailingSlash = route.length > 1 ? route.replace(/\/+$/g, '') : route;
	return withoutTrailingSlash || '/';
}

function canonicalForRoute(route: string): string {
	return route === '/' ? 'https://aiworkindex.com/' : `https://aiworkindex.com${route}`;
}

function routeFromCanonicalUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		if (parsed.origin !== 'https://aiworkindex.com') return null;
		return normalizeRoute(parsed.pathname);
	} catch {
		return null;
	}
}

function getAttr(tag: string, name: string): string | null {
	const quoted = tag.match(new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
	if (quoted?.[2]) return decodeHtmlEntities(quoted[2]);
	const unquoted = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, 'i'));
	return unquoted?.[1] ? decodeHtmlEntities(unquoted[1]) : null;
}

function getMetaTags(html: string): string[] {
	return [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => match[0]);
}

function getLinkTags(html: string): string[] {
	return [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]);
}

function getAnchorHrefs(html: string): string[] {
	return [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)].map(match =>
		decodeHtmlEntities(match[2])
	);
}

function visibleText(html: string): string {
	return normalizeText(
		html
			.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
			.replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
			.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
			.replace(/<[^>]+>/g, ' ')
	);
}

function extractJsonLd(html: string, route: string, errors: string[]): unknown[] {
	const scripts = [
		...html.matchAll(
			/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi
		)
	].map(match => match[2].trim());

	return scripts.flatMap(script => {
		try {
			return [JSON.parse(script)];
		} catch (error) {
			errors.push(`${route}: JSON-LD parse failed (${(error as Error).message})`);
			return [];
		}
	});
}

function flattenJsonLd(value: unknown): Array<Record<string, unknown>> {
	if (Array.isArray(value)) return value.flatMap(item => flattenJsonLd(item));
	if (!value || typeof value !== 'object') return [];
	const object = value as Record<string, unknown>;
	const graph = Array.isArray(object['@graph']) ? flattenJsonLd(object['@graph']) : [];
	return [object, ...graph];
}

function jsonLdType(node: Record<string, unknown>): string[] {
	const value = node['@type'];
	if (Array.isArray(value)) return value.filter((type): type is string => typeof type === 'string');
	return typeof value === 'string' ? [value] : [];
}

function fileExistsForHref(hrefPath: string): boolean {
	const decodedPath = decodeURIComponent(hrefPath);
	const candidate = path.join(BUILD_DIR, decodedPath.replace(/^\/+/, ''));
	return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
}

function routeHasHtml(route: string, routeSet: Set<string>): boolean {
	return routeSet.has(normalizeRoute(route));
}

function pagePathFromHref(href: string): string | null {
	if (
		!href ||
		href.startsWith('#') ||
		href.startsWith('mailto:') ||
		href.startsWith('tel:') ||
		href.startsWith('javascript:')
	) {
		return null;
	}
	try {
		const parsed = href.startsWith('http')
			? new URL(href)
			: new URL(href, 'https://aiworkindex.com');
		if (parsed.origin !== 'https://aiworkindex.com') return null;
		return parsed.pathname;
	} catch {
		return null;
	}
}

function runStaticBuildSeoAudit(sitemapLocs: string[]): void {
	if (!fs.existsSync(BUILD_DIR)) return;

	const errors: string[] = [];
	const htmlFiles = walkHtmlFiles(BUILD_DIR);
	const sitemapRoutes = new Set(
		sitemapLocs
			.map(loc => routeFromCanonicalUrl(loc))
			.filter((route): route is string => Boolean(route))
	);
	const pages = htmlFiles.map(file => {
		const route = htmlFileToRoute(file);
		return {
			file,
			route,
			url: canonicalForRoute(route),
			html: readText(file)
		};
	});
	const routeSet = new Set(pages.map(page => page.route));
	const alternateMap = new Map<string, Array<{ hreflang: string; href: string }>>();

	for (const route of sitemapRoutes) {
		if (!routeSet.has(route)) errors.push(`${route}: sitemap URL has no built HTML page`);
	}

	for (const page of pages) {
		const metaTags = getMetaTags(page.html);
		const robotsTags = metaTags.filter(tag => getAttr(tag, 'name')?.toLowerCase() === 'robots');
		const robotsContents = robotsTags
			.map(tag => getAttr(tag, 'content')?.toLowerCase() ?? '')
			.filter(Boolean);
		const noindex = robotsContents.some(content => content.includes('noindex'));
		const isSitemapPage = sitemapRoutes.has(page.route);

		if (robotsTags.length !== 1) {
			errors.push(`${page.route}: expected exactly one robots meta, found ${robotsTags.length}`);
		}
		if (new Set(robotsContents).size > 1) {
			errors.push(`${page.route}: conflicting robots meta values (${robotsContents.join(', ')})`);
		}
		if (!noindex && !isSitemapPage) {
			errors.push(`${page.route}: indexable built page missing from sitemap`);
		}
		if (noindex && isSitemapPage) {
			errors.push(`${page.route}: noindex page is present in sitemap`);
		}

		const linkTags = getLinkTags(page.html);
		const canonicalTags = linkTags.filter(tag => {
			const rel = getAttr(tag, 'rel')?.toLowerCase();
			return rel?.split(/\s+/).includes('canonical');
		});
		if (canonicalTags.length !== 1) {
			errors.push(
				`${page.route}: expected exactly one canonical link, found ${canonicalTags.length}`
			);
		} else {
			const canonical = getAttr(canonicalTags[0], 'href');
			if (!canonical) {
				errors.push(`${page.route}: canonical link missing href`);
			} else {
				if (canonical.includes('kirillso.com') || canonical.includes('pages.dev')) {
					errors.push(`${page.route}: canonical points at non-canonical host (${canonical})`);
				}
				if (!noindex && canonical !== page.url) {
					errors.push(`${page.route}: canonical mismatch (${canonical} !== ${page.url})`);
				}
			}
		}

		if (page.html.includes('kirillso.com') || page.html.includes('pages.dev')) {
			errors.push(`${page.route}: HTML contains old or duplicate host`);
		}
		for (const token of ['${', '{DATA_VINTAGE', '{SITE.', '{groups.', '{data.']) {
			if (page.html.includes(token)) {
				errors.push(`${page.route}: HTML contains unresolved template token (${token})`);
			}
		}

		if (!noindex && !/<h1\b/i.test(page.html)) {
			errors.push(`${page.route}: indexable page missing h1`);
		}

		const title = page.html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
		const descriptionTag = metaTags.find(
			tag => getAttr(tag, 'name')?.toLowerCase() === 'description'
		);
		const description = descriptionTag ? (getAttr(descriptionTag, 'content') ?? '') : '';
		if (!title.trim()) errors.push(`${page.route}: missing title`);
		if (!description.trim()) errors.push(`${page.route}: missing meta description`);
		if (decodeHtmlEntities(title).trim().length > 75) {
			errors.push(`${page.route}: title is too long (${decodeHtmlEntities(title).trim().length})`);
		}
		if (description.trim().length > 170) {
			errors.push(`${page.route}: description is too long (${description.trim().length})`);
		}

		const alternates = linkTags
			.filter(tag => getAttr(tag, 'rel')?.toLowerCase().split(/\s+/).includes('alternate'))
			.map(tag => ({
				hreflang: getAttr(tag, 'hreflang') ?? '',
				href: getAttr(tag, 'href') ?? ''
			}))
			.filter(alternate => alternate.hreflang && alternate.href);
		alternateMap.set(page.url, alternates);

		const jsonLd = extractJsonLd(page.html, page.route, errors);
		const nodes = jsonLd.flatMap(flattenJsonLd);
		const pageText = visibleText(page.html);
		for (const node of nodes.filter(candidate => jsonLdType(candidate).includes('FAQPage'))) {
			const mainEntity = node.mainEntity;
			const questions = Array.isArray(mainEntity) ? mainEntity : mainEntity ? [mainEntity] : [];
			for (const question of questions) {
				if (!question || typeof question !== 'object') continue;
				const questionObject = question as Record<string, unknown>;
				const questionText = typeof questionObject.name === 'string' ? questionObject.name : '';
				const answerObject = Array.isArray(questionObject.acceptedAnswer)
					? questionObject.acceptedAnswer[0]
					: questionObject.acceptedAnswer;
				const answerText =
					answerObject && typeof answerObject === 'object'
						? (answerObject as Record<string, unknown>).text
						: '';
				const normalizedQuestion = normalizeText(questionText);
				const normalizedAnswer = normalizeText(typeof answerText === 'string' ? answerText : '');
				const answerNeedle = normalizedAnswer.slice(0, Math.min(110, normalizedAnswer.length));
				if (normalizedQuestion && !pageText.includes(normalizedQuestion)) {
					errors.push(`${page.route}: FAQ question is not visible (${questionText})`);
				}
				if (answerNeedle && !pageText.includes(answerNeedle)) {
					errors.push(`${page.route}: FAQ answer is not visibly backed (${questionText})`);
				}
			}
		}

		for (const href of getAnchorHrefs(page.html)) {
			const hrefPath = pagePathFromHref(href);
			if (!hrefPath) continue;
			const extension = path.extname(hrefPath);
			if (extension && extension !== '.html') {
				if (!fileExistsForHref(hrefPath)) {
					errors.push(`${page.route}: internal asset link is missing (${href})`);
				}
				continue;
			}
			const targetRoute = normalizeRoute(hrefPath.replace(/\.html$/i, ''));
			if (!routeHasHtml(targetRoute, routeSet)) {
				errors.push(`${page.route}: internal page link is missing (${href})`);
			}
		}
	}

	for (const page of pages) {
		const alternates = alternateMap.get(page.url) ?? [];
		for (const alternate of alternates) {
			if (alternate.href === page.url) continue;
			const targetAlternates = alternateMap.get(alternate.href);
			if (!targetAlternates) {
				errors.push(`${page.route}: alternate target has no built page (${alternate.href})`);
				continue;
			}
			if (!targetAlternates.some(target => target.href === page.url)) {
				errors.push(`${page.route}: alternate target does not reciprocate (${alternate.href})`);
			}
		}
	}

	assert(
		errors.length === 0,
		`static build SEO audit failed (${errors.length} issues):\n${errors
			.slice(0, 40)
			.map(error => `- ${error}`)
			.join('\n')}`
	);
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
const headers = readText(HEADERS_FILE);
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
assert(
	headers.includes('https://aiworkindex.pages.dev/*') &&
		headers.includes('https://:version.aiworkindex.pages.dev/*'),
	'headers must cover Cloudflare Pages default and preview hosts'
);
assert(
	headers.includes('X-Robots-Tag: noindex') &&
		headers.includes('Link: <https://aiworkindex.com/:splat>; rel="canonical"'),
	'headers must noindex duplicate Pages hosts and point canonicals at aiworkindex.com'
);
assert(sitemapLocs.length > 1800, 'sitemap is unexpectedly small');
assert(sitemapLocs.length === uniqueSitemapLocs.size, 'sitemap contains duplicate URLs');
assert(
	sitemapLocs.every(loc => loc?.startsWith('https://aiworkindex.com/')),
	'sitemap contains URLs outside the canonical host'
);
assert(!sitemap.includes('/sg/occupation/'), 'sitemap includes Singapore redirect aliases');

runStaticBuildSeoAudit(sitemapLocs);

console.log('release-check: ok');
