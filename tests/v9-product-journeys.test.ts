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
	test('keeps flagship discovery, the detailed explorer and personal action flow', () => {
		const home = source('src/routes/+page.svelte');
		const explore = source('src/routes/explore/+page.svelte');
		const checker = source('src/routes/will-ai-take-my-job/+page.svelte');
		const personalCheck = source('src/lib/components/product/PersonalWorkCheck.svelte');
		assert.match(home, /OccupationExplorer/);
		assert.match(explore, /OccupationExplorer/);
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

	test('keeps long official definitions and role directories behind progressive disclosure', () => {
		const occupation = source('src/routes/occupation/[ssoc]/+page.svelte');
		const hero = source('src/lib/components/ui/OccupationHero.svelte');
		const roles = source('src/routes/roles/+page.svelte');
		assert.match(hero, /Read the official SSOC definition/);
		assert.match(occupation, /spokenOccupationTitle/);
		assert.match(occupation, /definition=\{occupation\.taxonomy\.detailed_definition\}/);
		assert.doesNotMatch(occupation, /view\.title\.split\('\/'\)/);
		assert.match(roles, /visibleLimit = \$state\(24\)/);
		assert.match(roles, /Show all \{resultCount\} roles/);
	});

	test('names the command palette and keeps closed chrome inside the dialog', () => {
		const menu = source('src/lib/components/ui/CommandMenu.svelte');
		const dialog = source('src/lib/components/ui/command/command-dialog.svelte');
		assert.match(menu, /title="Search occupations and pages"/);
		assert.match(menu, /aria-label="Search occupations, roles or pages"/);
		assert.match(dialog, /<Dialog\.Header class="sr-only">/);
		assert.ok(dialog.indexOf('<Dialog.Content') < dialog.indexOf('<Dialog.Header'));
	});

	test('restores a named homepage search listbox without Gradient legends', () => {
		const search = source('src/lib/components/v9-browser/OccupationSearch.svelte');
		const hero = source('src/lib/components/ui/OccupationHero.svelte');
		assert.match(search, /role="combobox"/);
		assert.match(search, /role="listbox"/);
		assert.match(search, /role="option"/);
		assert.match(search, /aria-selected=/);
		assert.doesNotMatch(search, /Exposed: Gradient/);
		assert.match(hero, /display\(\{ size: 'hero' \}\)/);
		assert.doesNotMatch(hero, /Exposed: Gradient|riskBadge|Highest Risk|Augmented/);
		assert.match(hero, /percentile AI work pressure/);
		assert.doesNotMatch(hero, /percent AI task overlap/);
	});

	test('explains the occupation rank as an evidence chain without per-page unavailable panels', () => {
		const occupation = source('src/routes/occupation/[ssoc]/+page.svelte');
		const chain = source('src/lib/components/product/PressureEvidenceChain.svelte');
		assert.match(occupation, /PressureEvidenceChain/);
		assert.doesNotMatch(occupation, /Unavailable external comparisons/);
		assert.match(chain, /01 · Job/);
		assert.match(chain, /02 · Mapping/);
		assert.match(chain, /03 · Task evidence/);
		assert.match(chain, /04 · Comparison/);
		assert.match(chain, /Pay, demand, capability profiles and personal answers stay outside/);
	});

	test('does not attach a family radar to withheld role mappings', () => {
		const role = source('src/routes/role/[slug]/+page.svelte');
		assert.match(role, /\{#if !mappingWithheld\}/);
		assert.match(role, /RoleWorkProfile/);
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
