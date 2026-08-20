import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath: string): string {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('V9 consumer product journeys', () => {
	test('keeps the flagship explorer and personal action flow on active routes', () => {
		const home = source('src/routes/+page.svelte');
		const checker = source('src/routes/will-ai-take-my-job/+page.svelte');
		const personalCheck = source('src/lib/components/product/PersonalWorkCheck.svelte');
		assert.match(home, /OccupationExplorer/);
		assert.match(home, /Explore all occupations/);
		assert.match(checker, /PersonalWorkCheck/);
		assert.match(personalCheck, /Build my work plan/);
	});

	test('provides save, compare and share from both official and modern-title details', () => {
		for (const relativePath of [
			'src/routes/occupation/[ssoc]/+page.svelte',
			'src/routes/role/[slug]/+page.svelte'
		]) {
			const page = source(relativePath);
			assert.match(page, /SaveJobButton/);
			assert.match(page, /SharePageButton/);
			assert.match(page, /\/compare\?entities=/);
		}
	});

	test('uses responsive comparison cards instead of a wide scrolling table', () => {
		const compare = source('src/routes/compare/+page.svelte');
		assert.match(compare, /Job comparison matrix/);
		assert.match(compare, /Job comparison cards/);
		assert.doesNotMatch(compare, /overflow-x-(?:auto|scroll)/);
	});

	test('keeps one page-level main landmark and permits narrow viewports', () => {
		const layout = source('src/routes/+layout.svelte');
		const css = source('src/app.css');
		assert.match(layout, /<div id="main-content" class="flex-1" tabindex="-1">/);
		assert.doesNotMatch(layout, /<main id="main-content"/);
		assert.match(css, /body\s*\{[\s\S]*?min-width:\s*0;/);
	});

	test('keeps personal answers local and outside all published score builders', () => {
		const personalCheck = source('src/lib/components/product/PersonalWorkCheck.svelte');
		const guidance = source('src/lib/personal-work-check.ts');
		assert.match(personalCheck, /localStorage/);
		assert.doesNotMatch(personalCheck, /fetch\(/);
		assert.doesNotMatch(guidance, /pressure_rank|mean_score_2025|buildHeadlineExposure/);
	});

	test('does not send search text or personal answers through product analytics', () => {
		const analytics = source('src/lib/analytics.ts');
		const currentCallers = [
			source('src/lib/components/product/PersonalWorkCheck.svelte'),
			source('src/routes/will-ai-take-my-job/+page.svelte'),
			source('src/routes/compare/+page.svelte'),
			source('src/routes/watchlist/+page.svelte')
		].join('\n');
		assert.doesNotMatch(analytics, /\n\t(?:query|title|activities)\??:/);
		assert.doesNotMatch(currentCallers, /trackProductEvent\([^)]*(?:query|title|activities)/s);
	});
});
