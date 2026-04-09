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

async function main() {
	const { SITE, DATA_VINTAGE } = await import('../src/lib/data/scoring-constants');
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

	const staticPages: Array<{ path: string; priority: string; changefreq: string }> = [
		{ path: '/', priority: '1.0', changefreq: 'weekly' },
		{ path: '/methodology', priority: '0.8', changefreq: 'monthly' },
		{ path: '/methodology/appendix', priority: '0.7', changefreq: 'monthly' },
		{ path: '/about', priority: '0.8', changefreq: 'monthly' },
		{ path: '/data', priority: '0.8', changefreq: 'monthly' },
		{ path: '/reports', priority: '0.8', changefreq: 'monthly' },
		{ path: '/reports/q4-2024', priority: '0.6', changefreq: 'yearly' },
		{ path: '/reports/wage-exposure', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/highest-risk', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/ai-leveraged', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/high-exposure-in-demand', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/high-risk-in-demand', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/theory-vs-practice', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/safest-high-paying', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/best-transitions', priority: '0.7', changefreq: 'monthly' },
		{ path: '/rankings/quarterly-movers', priority: '0.7', changefreq: 'monthly' },
		{ path: '/compare', priority: '0.6', changefreq: 'monthly' },
		{ path: '/rankings/rich-and-risky', priority: '0.7', changefreq: 'monthly' },
		{ path: '/calculator', priority: '0.7', changefreq: 'monthly' },
		{ path: '/groups', priority: '0.7', changefreq: 'monthly' }
	];

	let urls = '';

	// Static pages
	for (const p of staticPages) {
		urls += `  <url><loc>${base}${p.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>\n`;
	}

	// Occupation pages
	for (const occ of occupations) {
		urls += `  <url><loc>${base}/occupation/${occ.ssoc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
	}

	// Group hub pages
	for (const g of majorGroups) {
		const slug = g.key.toLowerCase().replace(/[,&]/g, '').replace(/\s+/g, '-');
		urls += `  <url><loc>${base}/group/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
	}

	// Role pages
	for (const role of syntheticRoles) {
		urls += `  <url><loc>${base}/role/${role.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;

	fs.writeFileSync(OUT_FILE, sitemap);

	const totalUrls =
		staticPages.length + occupations.length + syntheticRoles.length + majorGroups.length;
	console.log(`Sitemap generated: ${totalUrls} URLs`);
	console.log(`Domain: ${base}`);
	console.log(`Output: ${OUT_FILE}`);
}

main().catch(console.error);
