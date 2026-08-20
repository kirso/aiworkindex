import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	categoryLabel,
	formatIloCodebookCategory,
	spokenOccupationTitle
} from '../src/lib/data/v9-display';
import type { V9GenAiTaskExposure } from '../src/lib/data/v9-contract';

describe('V9 consumer display labels', () => {
	test('uses spoken titles instead of slash dictionary H1s', () => {
		assert.equal(
			spokenOccupationTitle('Managing director/Chief executive officer', ['CEO']),
			'CEO'
		);
		assert.equal(spokenOccupationTitle('Accounting/Bookkeeping clerk n.e.c.'), 'Accounting');
		assert.equal(spokenOccupationTitle('Software developer'), 'Software developer');
	});

	test('keeps ILO codebook strings out of consumer category words', () => {
		assert.equal(categoryLabel('Exposed: Gradient 4'), 'Highest overlap');
		assert.equal(categoryLabel('Exposed: Gradient 1'), 'Lower overlap');
		assert.equal(categoryLabel('Not Exposed'), 'Not exposed');
	});

	test('preserves the ILO codebook for How-calculated', () => {
		const exposure = {
			potential25: {
				least_exposed: 'Exposed: Gradient 2',
				most_exposed: 'Exposed: Gradient 4',
				categories: ['Exposed: Gradient 2', 'Exposed: Gradient 4']
			}
		} as V9GenAiTaskExposure;
		assert.equal(formatIloCodebookCategory(exposure), 'Exposed: Gradient 2 to Exposed: Gradient 4');
	});
});
