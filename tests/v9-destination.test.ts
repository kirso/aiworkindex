import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	v9DestinationEntityKind,
	v9OccupationDestination,
	v9RoleDestination
} from '../src/lib/data/v9-destination';

describe('V9 customer destinations', () => {
	test('opens official occupations and preserves a familiar-title context', () => {
		assert.equal(v9OccupationDestination('25143'), '/occupation/25143');
		assert.equal(
			v9RoleDestination({
				slug: 'ai-engineer',
				journey_kind: 'reviewed_official_match',
				official_ssoc2024: '25143'
			}),
			'/occupation/25143?as=ai-engineer'
		);
		assert.equal(
			v9RoleDestination({
				slug: 'data-scientist',
				journey_kind: 'exact_official_title',
				official_ssoc2024: '21222'
			}),
			'/occupation/21222?as=data-scientist'
		);
	});

	test('keeps composite and withheld queries on their useful role pages', () => {
		assert.equal(
			v9RoleDestination({
				slug: 'ai-product-manager',
				journey_kind: 'composite_estimate',
				official_ssoc2024: null
			}),
			'/role/ai-product-manager'
		);
		assert.equal(
			v9RoleDestination({
				slug: 'prompt-engineer',
				journey_kind: 'mapping_withheld',
				official_ssoc2024: null
			}),
			'/role/prompt-engineer'
		);
	});

	test('classifies analytics by final destination rather than result vocabulary', () => {
		assert.equal(
			v9DestinationEntityKind({ journey_kind: 'reviewed_official_match' }),
			'occupation'
		);
		assert.equal(v9DestinationEntityKind({ journey_kind: 'composite_estimate' }), 'role');
	});
});
