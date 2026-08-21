import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	categoryLabel,
	formatIloCodebookCategory,
	formatPressureNumber,
	spokenMajorGroupTitle,
	spokenOccupationTitle,
	toneFromPercentile
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

	test('shortens official major-group names for maps and filters', () => {
		assert.equal(
			spokenMajorGroupTitle('1', 'Legislators, senior officials and managers'),
			'Managers'
		);
		assert.equal(spokenMajorGroupTitle('5', 'Services and sales workers'), 'Services and sales');
		assert.equal(spokenMajorGroupTitle('X', 'Some other group'), 'Some other group');
	});

	test('maps percentiles onto a consumer pressure tone without custom risk bands', () => {
		assert.equal(toneFromPercentile(null), 'moderate');
		assert.equal(toneFromPercentile(12), 'very_low');
		assert.equal(toneFromPercentile(88), 'very_high');
		assert.equal(formatPressureNumber(32), '32');
		assert.equal(formatPressureNumber(89.1), '89.1');
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
