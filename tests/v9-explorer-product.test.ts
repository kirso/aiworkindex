import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { occupationToV9BrowserItem } from '../src/lib/data/v9-browser';
import {
	buildV9CategorySummary,
	buildV9GroupSummaries,
	buildV9PressureBins
} from '../src/lib/data/v9-home';
import { v9Occupations } from '../src/lib/data/v9';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath: string): string {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('V9 consumer occupation explorer', () => {
	test('builds category-first summaries without changing the occupation denominator', () => {
		const items = v9Occupations.map(occupationToV9BrowserItem);
		const groups = buildV9GroupSummaries(items);
		const categories = buildV9CategorySummary(items);
		const bins = buildV9PressureBins(items);
		assert.equal(groups.length, 9);
		assert.equal(
			groups.reduce((sum, group) => sum + group.total, 0),
			1001
		);
		assert.equal(
			categories.reduce((sum, category) => sum + category.count, 0),
			987
		);
		assert.equal(
			bins.reduce((sum, bin) => sum + bin.count, 0),
			987
		);
		assert.equal(items.filter(item => item.pressureRank == null).length, 14);
	});

	test('uses one equal-weight leaf for every mapped occupation tile', () => {
		const map = source('src/lib/components/v9-browser/EqualAreaOccupationMap.svelte');
		assert.match(map, /datum\.kind === 'occupation' \? 1 : 0/);
		assert.match(map, /Each equal tile represents one occupation record/);
		assert.match(map, /Tile area carries no worker count/);
		assert.match(map, /Unranked occupations stay visible with a hatch and an Unknown label/);
		assert.match(map, /occupation-map-unranked/);
		assert.match(map, /capabilityProximity/);
		assert.match(map, /mode === 'pressure'/);
		assert.doesNotMatch(map, /employment|jobs affected|wage pool/i);
	});

	test('shares bounded URL state across the flagship explorer views', () => {
		const explorer = source('src/lib/components/v9-browser/OccupationExplorer.svelte');
		for (const parameter of ['q', 'category', 'group', 'evidence', 'sort', 'view', 'job']) {
			assert.match(explorer, new RegExp(`params\\.set\\('${parameter}'`));
		}
		assert.doesNotMatch(explorer, /GroupedOccupationMap/);
		assert.match(explorer, /EqualAreaOccupationMap/);
		assert.match(explorer, /PressureWageScatter/);
		assert.match(explorer, /NamedDemandPressurePlot/);
		assert.match(explorer, /PressureDistribution/);
		assert.match(explorer, /OccupationResultList/);
		for (const label of [
			'Occupation map',
			'Pressure & pay',
			'Named demand',
			'Distribution',
			'List'
		]) {
			assert.match(explorer, new RegExp(label.replace('&', '&')));
		}
		assert.match(explorer, /replaceState/);
		assert.match(explorer, /browser_occupations/);
		const homeLoader = source('src/routes/+page.server.ts');
		assert.doesNotMatch(homeLoader, /buildV9GroupSummaries/);
		assert.doesNotMatch(homeLoader, /occupations: \[\] as V9BrowserItem\[\]/);
		assert.match(
			source('src/routes/explore/+page.server.ts'),
			/occupations: \[\] as V9BrowserItem\[\]/
		);
	});

	test('makes the 1,001-record explorer the flagship on home and Explore', () => {
		const home = source('src/routes/+page.svelte');
		const explore = source('src/routes/explore/+page.svelte');
		assert.match(home, /<OccupationExplorer/);
		assert.match(home, /How does AI overlap with your job\?/);
		assert.doesNotMatch(home, /Exposed: Gradient/);
		assert.match(explore, /<OccupationExplorer/);
	});

	test('publishes capability coverage in the browser artifact without changing pressure', () => {
		const builder = source('scripts/build-v9-search-index.ts');
		const artifact = JSON.parse(source('data/v9-search-index.json')) as {
			browser_occupations: Array<{ capabilityProximity: number | null }>;
		};
		assert.match(builder, /v9-capability-profiles\.json/);
		assert.equal(
			artifact.browser_occupations.filter(item => item.capabilityProximity != null).length,
			75
		);
	});

	test('keeps the scatter relationship on mobile and exposes one keyboard entry point', () => {
		const scatter = source('src/lib/components/v9-browser/PressureWageScatter.svelte');
		const marks = scatter.slice(
			scatter.indexOf('{#each plotted as item'),
			scatter.indexOf('AI task-pressure percentile')
		);
		assert.doesNotMatch(scatter, /full scatter appears on wider screens/i);
		assert.doesNotMatch(marks, /tabindex|href=/);
		assert.match(scatter, /use arrow keys to move and Enter to/);
		assert.match(scatter, /Missing wages are omitted, not treated as zero/);
	});

	test('uses the restored pressure palette without colored card borders', () => {
		const css = source('src/app.css');
		const activeSurfaces = [
			'src/routes/compare/+page.svelte',
			'src/routes/global/+page.svelte',
			'src/routes/role/[slug]/+page.svelte',
			'src/routes/roles/+page.svelte'
		]
			.map(source)
			.join('\n');
		for (const color of ['#2a7f62', '#48a06c', '#d9a514', '#cf6a32', '#d6151c']) {
			assert.match(css, new RegExp(color));
		}
		assert.doesNotMatch(activeSurfaces, /style:border-left-color/);
		assert.doesNotMatch(activeSurfaces, /border-l-[248][^\n]*(?:primary|action|risk|family)/);
	});

	test('publishes semantic action lanes and 44-pixel default controls', () => {
		const css = source('src/app.css');
		const designSystem = source('src/lib/design-system.ts');
		const button = source('src/lib/components/ui/button/button.svelte');
		for (const action of ['try', 'verify', 'human-led', 'strengthen', 'monitor']) {
			assert.match(css, new RegExp(`--color-action-${action}`));
		}
		assert.match(designSystem, /export const actionCard/);
		assert.match(designSystem, /export const actionBadge/);
		assert.match(button, /default: 'h-11/);
		assert.match(button, /lg: 'h-12/);
	});
});
