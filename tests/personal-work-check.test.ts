import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
	buildPersonalWorkGuidance,
	defaultPersonalWorkAnswers,
	parsePersonalWorkAnswers
} from '../src/lib/personal-work-check';

describe('personal work check', () => {
	test('keeps malformed or retired local answers out of the current profile', () => {
		assert.deepEqual(parsePersonalWorkAnswers('not json'), defaultPersonalWorkAnswers);
		assert.deepEqual(
			parsePersonalWorkAnswers(
				JSON.stringify({
					activities: ['drafting', 'retired-score-input'],
					aiUse: 'always',
					errorImpact: 'serious',
					reviewResponsibility: 'final'
				})
			),
			{
				activities: ['drafting'],
				aiUse: 'not_yet',
				errorImpact: 'serious',
				reviewResponsibility: 'final'
			}
		);
	});

	test('turns high-consequence final responsibility into explicit review guidance', () => {
		const guidance = buildPersonalWorkGuidance({
			activities: ['research', 'people', 'judgment'],
			aiUse: 'sometimes',
			errorImpact: 'serious',
			reviewResponsibility: 'final'
		});
		assert.deepEqual(
			guidance.map(group => group.label),
			['Try', 'Verify carefully', 'Keep human-led', 'Strengthen', 'Ask at work', 'Monitor']
		);
		assert.match(
			guidance
				.find(group => group.id === 'verify')
				?.items.map(item => item.title)
				.join(' ') ?? '',
			/named reviewer/i
		);
		assert.match(
			guidance
				.find(group => group.id === 'human')
				?.items.map(item => item.title)
				.join(' ') ?? '',
			/relationship|judgment/i
		);
	});

	test('never emits a score, probability or risk classification from personal answers', () => {
		const output = JSON.stringify(
			buildPersonalWorkGuidance({
				activities: ['drafting', 'routine'],
				aiUse: 'often',
				errorImpact: 'limited',
				reviewResponsibility: 'support'
			})
		);
		assert.doesNotMatch(output, /percentile|probability|risk band|score/i);
	});
});
