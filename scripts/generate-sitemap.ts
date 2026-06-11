#!/usr/bin/env bun
/**
 * generate-sitemap.ts — Build sitemap.xml from known routes + data.
 * Run: bun run scripts/generate-sitemap.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(import.meta.dir, '..', 'data');
const OUT_FILE = path.join(import.meta.dir, '..', 'static', 'sitemap.xml');

interface Occupation {
	ssoc: string;
}

interface SitemapEntry {
	path: string;
	priority: string;
	changefreq: string;
}

async function main() {
	const { SITE, DATA_VINTAGE } = await import('../src/lib/data/scoring-constants');
	const { getCountryOccupationRows } = await import('../src/lib/data/country-pages');
	const { getGlobalOccupationEntries } = await import('../src/lib/data/global-occupations');
	const lastmod = DATA_VINTAGE.last_updated;
	const base = SITE.url;

	const occupations: Occupation[] = JSON.parse(
		fs.readFileSync(path.join(DATA_DIR, 'occupations.json'), 'utf-8')
	);

	const { syntheticRoles } = await import('../src/lib/data/synthetic-roles');
	const majorGroups: Array<{ key: string }> = JSON.parse(
		fs.readFileSync(
			path.join(import.meta.dir, '..', 'src', 'lib', 'data', 'major-groups.json'),
			'utf-8'
		)
	);

	const staticPages: SitemapEntry[] = [
		{ path: '/', priority: '1.0', changefreq: 'weekly' },
		{ path: '/explore', priority: '0.8', changefreq: 'weekly' },
		{ path: '/methodology', priority: '0.8', changefreq: 'monthly' },
		{ path: '/global', priority: '0.8', changefreq: 'monthly' },
		{ path: '/sg', priority: '0.7', changefreq: 'monthly' },
		{ path: '/us', priority: '0.7', changefreq: 'monthly' },
		{ path: '/methodology/appendix', priority: '0.7', changefreq: 'monthly' },
		{ path: '/about', priority: '0.8', changefreq: 'monthly' },
		{ path: '/data', priority: '0.8', changefreq: 'monthly' },
		{ path: '/research', priority: '0.7', changefreq: 'monthly' },
		{ path: '/roles', priority: '0.7', changefreq: 'monthly' },
		{ path: '/reports', priority: '0.8', changefreq: 'monthly' },
		{ path: '/reports/q4-2024', priority: '0.6', changefreq: 'yearly' },
		{ path: '/reports/wage-exposure', priority: '0.7', changefreq: 'monthly' },
		{ path: '/reports/v7-release', priority: '0.7', changefreq: 'monthly' },
		{ path: '/reports/v6-release', priority: '0.6', changefreq: 'yearly' },
		{ path: '/reports/v5-experimental', priority: '0.5', changefreq: 'yearly' },
		{ path: '/reports/v5-roadmap', priority: '0.5', changefreq: 'yearly' },
		{ path: '/reports/v4-3-shadow', priority: '0.5', changefreq: 'yearly' },
		{ path: '/rankings', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/highest-risk', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/ai-leveraged', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/high-exposure-in-demand', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/high-risk-in-demand', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/theory-vs-practice', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/safest-high-paying', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/best-transitions', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/high-risk-few-exits', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/quarterly-movers', priority: '0.7', changefreq: 'monthly' },
		{ path: '/compare', priority: '0.6', changefreq: 'monthly' },
		{ path: '/rankings/rich-and-risky', priority: '0.7', changefreq: 'monthly' },
		{ path: '/calculator', priority: '0.7', changefreq: 'monthly' },
		{ path: '/will-ai-take-my-job', priority: '0.8', changefreq: 'monthly' },
		{ path: '/ai-proof-jobs', priority: '0.8', changefreq: 'monthly' },
		{ path: '/ai-job-loss', priority: '0.8', changefreq: 'monthly' },
		{ path: '/groups', priority: '0.7', changefreq: 'monthly' },
		{ path: '/changelog', priority: '0.5', changefreq: 'monthly' }
	];

	const entries: SitemapEntry[] = [];
	const seen = new Set<string>();
	function addUrl(entry: SitemapEntry) {
		const normalizedPath = entry.path === '/' ? '/' : entry.path.replace(/\/+$/g, '');
		if (seen.has(normalizedPath)) return;
		seen.add(normalizedPath);
		entries.push({ ...entry, path: normalizedPath });
	}

	// Static pages
	for (const p of staticPages) {
		addUrl(p);
	}

	// Occupation pages
	for (const occ of occupations) {
		addUrl({ path: `/occupation/${occ.ssoc}`, changefreq: 'monthly', priority: '0.5' });
	}

	// Global occupation pages
	for (const occ of getGlobalOccupationEntries()) {
		addUrl({
			path: `/global/occupation/${occ.code}`,
			changefreq: 'monthly',
			priority: '0.5'
		});
	}

	// Country occupation pages
	for (const row of getCountryOccupationRows('us')) {
		addUrl({
			path: `/us/occupation/${row.localCode}`,
			changefreq: 'monthly',
			priority: '0.5'
		});
	}

	// Group hub pages
	for (const g of majorGroups) {
		const slug = g.key.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-');
		addUrl({ path: `/group/${slug}`, changefreq: 'monthly', priority: '0.7' });
	}

	// Role pages
	for (const role of syntheticRoles) {
		addUrl({ path: `/role/${role.slug}`, changefreq: 'monthly', priority: '0.5' });
		addUrl({ path: `/us/role/${role.slug}`, changefreq: 'monthly', priority: '0.5' });
	}

	const urls = entries
		.map(
			entry =>
				`  <url><loc>${base}${entry.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
		)
		.join('\n');
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;

	fs.writeFileSync(OUT_FILE, sitemap);
	console.log(`Sitemap generated: ${entries.length} canonical URLs`);
	console.log(`Domain: ${base}`);
	console.log(`Output: ${OUT_FILE}`);
}

main().catch(console.error);
