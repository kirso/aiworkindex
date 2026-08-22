import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const retainedPages = [
	'src/routes/+page.svelte',
	'src/routes/explore/+page.svelte',
	'src/routes/groups/+page.svelte',
	'src/routes/group/[slug]/+page.svelte',
	'src/routes/occupation/[ssoc]/+page.svelte',
	'src/routes/roles/+page.svelte',
	'src/routes/role/[slug]/+page.svelte',
	'src/routes/rankings/+page.svelte',
	'src/routes/compare/+page.svelte',
	'src/routes/will-ai-take-my-job/+page.svelte',
	'src/routes/reports/+page.svelte',
	'src/routes/research/+page.svelte',
	'src/routes/methodology/+page.svelte',
	'src/routes/methodology/appendix/+page.svelte',
	'src/routes/data/+page.svelte',
	'src/routes/about/+page.svelte',
	'src/routes/[country]/+page.svelte'
];

const retainedRankingPages = [
	'ai-leveraged',
	'best-transitions',
	'high-exposure-in-demand',
	'high-risk-few-exits',
	'high-risk-in-demand',
	'highest-risk',
	'quarterly-movers',
	'rich-and-risky',
	'safest-high-paying',
	'theory-vs-practice'
];

const retainedReportPages = [
	'ai-capabilities',
	'job-market-evidence',
	'labour-observatory',
	'q4-2024',
	'v4-3-shadow',
	'v5-experimental',
	'v5-roadmap',
	'v6-release',
	'v7-release',
	'wage-exposure'
];

describe('V9 route preservation', () => {
	test('keeps the existing product journeys available for migration', () => {
		for (const file of retainedPages) {
			assert.equal(fs.existsSync(path.join(root, file)), true, `${file} is missing`);
		}
		for (const slug of retainedRankingPages) {
			assert.equal(
				fs.existsSync(path.join(root, 'src/routes/rankings', slug, '+page.svelte')),
				true,
				`ranking ${slug} is missing`
			);
		}
		for (const slug of retainedReportPages) {
			assert.equal(
				fs.existsSync(path.join(root, 'src/routes/reports', slug, '+page.svelte')),
				true,
				`report ${slug} is missing`
			);
		}
	});

	test('does not collapse retained route families through edge redirects', () => {
		const redirects = fs.readFileSync(path.join(root, 'static/_redirects'), 'utf8');
		for (const route of [
			'/compare ',
			'/roles ',
			'/role/* ',
			'/reports ',
			'/reports/* ',
			'/will-ai-take-my-job ',
			'/rankings/highest-risk ',
			'/rankings/rich-and-risky ',
			'/rankings/safest-high-paying ',
			'/us '
		]) {
			assert.equal(
				redirects.split('\n').some(line => line.trimStart().startsWith(route)),
				false,
				`${route.trim()} must stay a real surface`
			);
		}
	});
});
