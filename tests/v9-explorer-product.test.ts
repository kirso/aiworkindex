import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function source(relativePath: string): string {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('V9 consumer occupation explorer', () => {
	test('uses one equal-weight leaf for every mapped occupation tile', () => {
		const map = source('src/lib/components/v9-browser/EqualAreaOccupationMap.svelte');
		assert.match(map, /datum\.kind === 'occupation' \? 1 : 0/);
		assert.match(map, /Each equal tile represents one occupation record/);
		assert.match(map, /Tile area carries no worker count/);
		assert.match(map, /Unranked occupations stay visible with a hatch and an Unknown label/);
		assert.match(map, /occupation-map-unranked/);
		assert.doesNotMatch(map, /employment|jobs affected|wage pool/i);
	});

	test('shares bounded URL state across map, scatter and list', () => {
		const explorer = source('src/lib/components/v9-browser/OccupationExplorer.svelte');
		for (const parameter of ['q', 'category', 'group', 'evidence', 'sort', 'view', 'job']) {
			assert.match(explorer, new RegExp(`params\\.set\\('${parameter}'`));
		}
		assert.match(explorer, /EqualAreaOccupationMap/);
		assert.match(explorer, /PressureWageScatter/);
		assert.match(explorer, /OccupationResultList/);
		assert.match(explorer, /replaceState/);
		assert.match(explorer, /browser_occupations/);
		assert.match(source('src/routes/+page.server.ts'), /occupations: \[\] as V9BrowserItem\[\]/);
		assert.match(
			source('src/routes/explore/+page.server.ts'),
			/occupations: \[\] as V9BrowserItem\[\]/
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
		assert.match(scatter, /Use arrow keys to inspect plotted occupations/);
		assert.match(scatter, /Missing wages are omitted, not treated as zero/);
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
