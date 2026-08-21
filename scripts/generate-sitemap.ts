#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE } from '../src/lib/data/scoring-constants';
import { loadV9Release } from './v9-public-export';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(ROOT, 'static', 'sitemap.xml');

interface SitemapEntry {
	path: string;
	priority: string;
	changefreq: 'weekly' | 'monthly' | 'yearly';
}

const staticPages: SitemapEntry[] = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/explore', priority: '0.9', changefreq: 'monthly' },
	{ path: '/methodology', priority: '0.9', changefreq: 'monthly' },
	{ path: '/methodology/appendix', priority: '0.6', changefreq: 'monthly' },
	{ path: '/about', priority: '0.7', changefreq: 'monthly' },
	{ path: '/data', priority: '0.8', changefreq: 'monthly' },
	{ path: '/research', priority: '0.8', changefreq: 'monthly' },
	{ path: '/sg', priority: '0.7', changefreq: 'monthly' },
	{ path: '/us', priority: '0.4', changefreq: 'monthly' },
	{ path: '/global', priority: '0.5', changefreq: 'monthly' },
	{ path: '/roles', priority: '0.8', changefreq: 'monthly' },
	{ path: '/groups', priority: '0.7', changefreq: 'monthly' },
	{ path: '/rankings', priority: '0.8', changefreq: 'monthly' },
	{ path: '/rankings/highest-risk', priority: '0.8', changefreq: 'monthly' },
	{ path: '/rankings/ai-leveraged', priority: '0.7', changefreq: 'monthly' },
	{ path: '/rankings/high-exposure-in-demand', priority: '0.8', changefreq: 'monthly' },
	{ path: '/rankings/theory-vs-practice', priority: '0.7', changefreq: 'monthly' },
	{ path: '/rankings/safest-high-paying', priority: '0.8', changefreq: 'monthly' },
	{ path: '/rankings/rich-and-risky', priority: '0.8', changefreq: 'monthly' },
	{ path: '/compare', priority: '0.8', changefreq: 'monthly' },
	{ path: '/will-ai-take-my-job', priority: '0.9', changefreq: 'monthly' },
	{ path: '/ai-proof-jobs', priority: '0.8', changefreq: 'monthly' },
	{ path: '/ai-job-loss', priority: '0.8', changefreq: 'monthly' },
	{ path: '/reports', priority: '0.8', changefreq: 'monthly' },
	{ path: '/reports/job-market-evidence', priority: '0.8', changefreq: 'monthly' },
	{ path: '/reports/labour-observatory', priority: '0.8', changefreq: 'monthly' },
	{ path: '/reports/ai-capabilities', priority: '0.8', changefreq: 'monthly' },
	{ path: '/press', priority: '0.5', changefreq: 'monthly' },
	{ path: '/changelog', priority: '0.5', changefreq: 'monthly' }
];

function routeSourceExists(route: string): boolean {
	if (route === '/') return fs.existsSync(path.join(ROOT, 'src', 'routes', '+page.svelte'));
	return fs.existsSync(path.join(ROOT, 'src', 'routes', route.slice(1), '+page.svelte'));
}

function xml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function main() {
	const release = loadV9Release();
	const majorGroups = JSON.parse(
		fs.readFileSync(path.join(ROOT, 'src', 'lib', 'data', 'major-groups.json'), 'utf8')
	) as Array<{ key: string }>;
	const roleRelease = JSON.parse(
		fs.readFileSync(path.join(ROOT, 'data', 'synthetic-roles-v9.json'), 'utf8')
	) as {
		roles: Array<{
			slug: string;
			resolution_basis: string;
			official_status: 'official_occupation_match' | 'non_official_role_query';
		}>;
	};
	const entries: SitemapEntry[] = [];
	const seen = new Set<string>();
	const add = (entry: SitemapEntry) => {
		const normalized = entry.path === '/' ? '/' : entry.path.replace(/\/+$/g, '');
		if (seen.has(normalized)) return;
		seen.add(normalized);
		entries.push({ ...entry, path: normalized });
	};

	for (const entry of staticPages) {
		if (!routeSourceExists(entry.path) && !['/sg', '/us', '/global'].includes(entry.path)) {
			throw new Error(`Sitemap route has no source page: ${entry.path}`);
		}
		add(entry);
	}
	if (routeSourceExists('/reports/v9-release')) {
		add({ path: '/reports/v9-release', priority: '0.9', changefreq: 'monthly' });
	}

	for (const occupation of release.occupations) {
		add({
			path: `/occupation/${occupation.taxonomy.code}`,
			priority: '0.6',
			changefreq: 'monthly'
		});
	}
	for (const group of majorGroups) {
		const slug = group.key.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-');
		add({ path: `/group/${slug}`, priority: '0.6', changefreq: 'monthly' });
	}
	const modernTitleGuides = roleRelease.roles.filter(
		role => role.resolution_basis !== 'normalized_exact_title'
	);
	for (const role of modernTitleGuides) {
		add({ path: `/role/${role.slug}`, priority: '0.6', changefreq: 'monthly' });
	}

	const urls = entries
		.map(
			entry =>
				`  <url><loc>${xml(`${SITE.url}${entry.path}`)}</loc><lastmod>${release.generated_at}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
		)
		.join('\n');
	fs.writeFileSync(
		OUT_FILE,
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
		'utf8'
	);

	console.log(
		`Sitemap generated: ${entries.length} canonical URLs (${release.occupations.length} occupations, ${modernTitleGuides.length} modern-title guides)`
	);
}

main();
