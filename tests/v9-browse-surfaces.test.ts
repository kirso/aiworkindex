import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath: string): string {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const migratedPages = [
	'src/routes/+page.svelte',
	'src/routes/explore/+page.svelte',
	'src/routes/groups/+page.svelte',
	'src/routes/group/[slug]/+page.svelte',
	'src/routes/occupation/[ssoc]/+page.svelte',
	'src/routes/rankings/+page.svelte',
	'src/routes/rankings/ai-leveraged/+page.svelte',
	'src/routes/rankings/high-exposure-in-demand/+page.svelte',
	'src/routes/rankings/high-risk-in-demand/+page.svelte',
	'src/routes/rankings/highest-risk/+page.svelte',
	'src/routes/rankings/rich-and-risky/+page.svelte',
	'src/routes/rankings/safest-high-paying/+page.svelte',
	'src/routes/rankings/theory-vs-practice/+page.svelte'
];

const serverLoaders = [
	'src/routes/+page.server.ts',
	'src/routes/explore/+page.server.ts',
	'src/routes/groups/+page.server.ts',
	'src/routes/group/[slug]/+page.server.ts',
	'src/routes/occupation/[ssoc]/+page.server.ts',
	'src/routes/rankings/+page.server.ts',
	'src/routes/rankings/ai-leveraged/+page.server.ts',
	'src/routes/rankings/high-exposure-in-demand/+page.server.ts',
	'src/routes/rankings/highest-risk/+page.server.ts',
	'src/routes/rankings/rich-and-risky/+page.server.ts',
	'src/routes/rankings/safest-high-paying/+page.server.ts',
	'src/routes/rankings/theory-vs-practice/+page.server.ts'
];

describe('V9 browse and ranking surfaces', () => {
	test('loads the canonical V9 release on the server rather than legacy public occupations', () => {
		for (const file of serverLoaders) {
			const contents = source(file);
			assert.match(contents, /PageServerLoad/);
			assert.doesNotMatch(contents, /from ['"]\$lib\/data['"]/);
			assert.doesNotMatch(contents, /v8|net_risk|risk_band|likely_pathway/i);
		}
		assert.match(source('src/routes/rankings/ranking-data.server.ts'), /v9Occupations/);
		assert.match(source('src/lib/data/v9-browser.ts'), /toV9OccupationView/);
	});

	test('uses human pressure and evidence labels without retired score fields', () => {
		for (const file of migratedPages) {
			const contents = source(file);
			assert.doesNotMatch(
				contents,
				/net_risk|risk_band|gross_wage_median|augmentation_potential|likely_pathway/
			);
			assert.doesNotMatch(contents, /overflow-x-auto|overflow-x-scroll/);
		}

		assert.match(source('src/routes/+page.svelte'), /AI work pressure/);
		assert.match(source('src/routes/explore/+page.svelte'), /Official ILO category/);
		assert.match(
			source('src/routes/occupation/[ssoc]/+page.svelte'),
			/not a probability of job loss/i
		);
		assert.match(
			source('src/routes/rankings/high-exposure-in-demand/+page.svelte'),
			/not an exhaustive/i
		);
	});

	test('keeps null wage and demand evidence from becoming zero or weak demand', () => {
		const occupation = source('src/routes/occupation/[ssoc]/+page.svelte');
		const explore = source('src/routes/explore/+page.svelte');
		const scatter = source('src/lib/components/v9-browser/PressureWageScatter.svelte');

		assert.match(occupation, /unknown, not zero pressure/i);
		assert.match(occupation, /absence is not evidence\s+of weak demand/i);
		assert.match(
			explore,
			/Missing evidence stays unknown|missing observation cannot look like zero/i
		);
		assert.match(scatter, /Missing wages are omitted, not treated as zero/);
		assert.match(scatter, /item\.wageMedian != null/);
	});

	test('preserves experimental URLs while excluding unsupported rankings from search', () => {
		const unavailable = source('src/lib/components/v9-browser/UnavailableRanking.svelte');
		assert.match(unavailable, /noindex=\{true\}/);

		for (const slug of ['best-transitions', 'high-risk-few-exits', 'quarterly-movers']) {
			const contents = source(`src/routes/rankings/${slug}/+page.svelte`);
			assert.match(contents, /UnavailableRanking/);
			assert.match(contents, /unavailable|does not publish|There is no comparable/i);
		}
	});

	test('restores an honest pressure-versus-wage scatter with direct evidence only', () => {
		const contents = source('src/lib/components/v9-browser/PressureWageScatter.svelte');
		assert.match(contents, /AI work pressure percentile/);
		assert.match(contents, /Gross monthly wage \(SGD\)/);
		assert.match(contents, /direct June 2025 MOM occupation rows/i);
		assert.match(contents, /plotted\.length/);
		assert.doesNotMatch(contents, /estimated employment|wage pool|jobs affected/i);
	});
});
