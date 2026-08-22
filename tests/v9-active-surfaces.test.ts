import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const routesRoot = path.join(root, 'src', 'routes');

const archivedRoutePrefixes = [
	'reports/q4-2024/',
	'reports/v4-3-shadow/',
	'reports/v5-experimental/',
	'reports/v5-roadmap/',
	'reports/v6-release/',
	'reports/v7-release/',
	'reports/wage-exposure/'
];

const retiredCurrentFields = [
	'net_risk',
	'risk_band',
	'likely_pathway',
	'jobs_affected',
	'wage_pool',
	'augmentation_score',
	'substitution_score',
	'gross_wage_median',
	'employment_estimate',
	'transition_adjusted_risk',
	'realized_risk_proxy'
];

function walk(directory: string): string[] {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const absolute = path.join(directory, entry.name);
		return entry.isDirectory() ? walk(absolute) : [absolute];
	});
}

function isArchived(relativeRoutePath: string): boolean {
	return archivedRoutePrefixes.some(prefix => relativeRoutePath.startsWith(prefix));
}

describe('V9 active public surfaces', () => {
	test('keeps retired outcome fields out of every active route source', () => {
		const activeRouteSources = walk(routesRoot).filter(file => {
			if (!/\.(?:svelte|ts)$/.test(file)) return false;
			return !isArchived(path.relative(routesRoot, file));
		});

		for (const file of activeRouteSources) {
			const contents = fs.readFileSync(file, 'utf8');
			for (const field of retiredCurrentFields) {
				assert.equal(
					contents.includes(field),
					false,
					`${path.relative(root, file)} contains retired current field ${field}`
				);
			}
			assert.doesNotMatch(
				contents,
				/from\s+['"]\$lib\/data['"]/,
				`${path.relative(root, file)} imports the legacy occupation facade`
			);
		}
	});

	test('loads canonical V9 and synthetic-role datasets only from server route modules', () => {
		const universalOrComponentSources = walk(path.join(root, 'src')).filter(file => {
			if (!/\.(?:svelte|ts)$/.test(file)) return false;
			if (file.endsWith('.server.ts')) return false;
			if (file.includes(`${path.sep}lib${path.sep}data${path.sep}`)) return false;
			return true;
		});

		for (const file of universalOrComponentSources) {
			const contents = fs.readFileSync(file, 'utf8');
			assert.doesNotMatch(
				contents,
				/from\s+['"]\$lib\/data\/(?:v9|synthetic-roles-v9)['"]/,
				`${path.relative(root, file)} would ship the full canonical dataset to the browser`
			);
		}
	});

	test('keeps archive, noindex and canonicalized duplicate routes out of the sitemap', () => {
		const sitemap = fs.readFileSync(path.join(root, 'static', 'sitemap.xml'), 'utf8');
		for (const route of [
			'/reports/q4-2024',
			'/reports/v4-3-shadow',
			'/reports/v5-experimental',
			'/reports/v5-roadmap',
			'/reports/v6-release',
			'/reports/v7-release',
			'/reports/wage-exposure',
			'/rankings/best-transitions',
			'/rankings/high-risk-few-exits',
			'/rankings/quarterly-movers',
			'/rankings/high-risk-in-demand',
			'/watchlist',
			'/calculator'
		]) {
			assert.equal(sitemap.includes(`<loc>https://aiworkindex.com${route}</loc>`), false, route);
		}
	});

	test('marks superseded data releases noindex at the edge', () => {
		const headers = fs.readFileSync(path.join(root, 'static', '_headers'), 'utf8');
		for (const version of ['v3', 'v4', 'v5', 'v6', 'v7', 'v8']) {
			assert.match(
				headers,
				new RegExp(`/data/sg-ai-occupations-${version}\\*\\n\\s+X-Robots-Tag: noindex`)
			);
		}
		assert.doesNotMatch(headers, /sg-ai-occupations-v9\.json\n\s+X-Robots-Tag: noindex/);
	});

	test('publishes the synthetic-role methodology anchor used by role pages', () => {
		const methodology = fs.readFileSync(
			path.join(routesRoot, 'methodology', '+page.svelte'),
			'utf8'
		);
		assert.match(methodology, /id="synthetic-roles"/);
	});
});
