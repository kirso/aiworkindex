import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';

const root = path.resolve(import.meta.dirname, '..');

function readJson(relativePath: string) {
	return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

describe('SSOC 2024 canonical registry', () => {
	const registry = readJson('data/ssoc-2024-registry.json');
	const entries = registry.entries as Array<{
		code: string;
		entry_kind: 'occupation' | 'residual';
		search_synonyms: string[];
		isco08: { quality: string; candidates: Array<{ code: string }> };
	}>;

	test('contains the complete official five-digit classification', () => {
		assert.deepEqual(registry.counts, { total: 1006, occupations: 1001, residual: 5 });
		assert.equal(entries.length, 1006);
		assert.equal(new Set(entries.map(entry => entry.code)).size, entries.length);
		assert.equal(entries.filter(entry => /^\d{5}$/.test(entry.code)).length, 1001);
		assert.deepEqual(
			entries.filter(entry => entry.entry_kind === 'residual').map(entry => entry.code),
			['X1000', 'X2000', 'X3000', 'X4000', 'X5000']
		);
	});

	test('keeps all official ISCO candidates and current synonyms', () => {
		const interactionDesigner = entries.find(entry => entry.code === '25124');
		assert.ok(interactionDesigner);
		assert.ok(interactionDesigner.search_synonyms.includes('Interaction designer'));

		const chiefProductOfficer = entries.find(entry => entry.code === '13305');
		assert.ok(chiefProductOfficer);
		assert.notEqual(chiefProductOfficer.isco08.quality, 'unmatched');
		assert.ok(chiefProductOfficer.isco08.candidates.length > 0);
	});
});

describe('SSOC 2020 URL continuity isolation', () => {
	const continuity = readJson('data/compat/ssoc-2020-url-continuity.json') as {
		redirects: Array<{ ssoc2020: string; successors: Array<{ ssoc2024: string }> }>;
		ambiguous: Array<{ ssoc2020: string; successors: Array<{ ssoc2024: string }> }>;
	};

	test('has only the official retired-code route cases', () => {
		assert.equal(continuity.redirects.length, 43);
		assert.equal(continuity.ambiguous.length, 4);
		assert.deepEqual(
			continuity.ambiguous.map(entry => entry.ssoc2020),
			['24220', '26375', '33121', '33129']
		);
		assert.ok(continuity.redirects.every(entry => entry.successors.length === 1));
	});

	test('is emitted only as edge redirects and never imported by active model modules', () => {
		const redirects = fs.readFileSync(path.join(root, 'static', '_redirects'), 'utf8');
		for (const entry of continuity.redirects) {
			assert.ok(
				redirects.includes(
					`/occupation/${entry.ssoc2020} /occupation/${entry.successors[0]!.ssoc2024} 308`
				)
			);
		}

		const activeModelFiles = [
			'scripts/score.ts',
			'scripts/crosswalk.ts',
			'src/lib/data/index.ts',
			'src/lib/data/ssoc-2024.ts'
		];
		for (const file of activeModelFiles) {
			const contents = fs.readFileSync(path.join(root, file), 'utf8');
			assert.equal(contents.includes('ssoc-2020-url-continuity'), false, file);
		}
		assert.equal(
			fs.existsSync(
				path.join(root, 'data/raw/official/ssoc-2024/ssoc-2020-2024-correspondence.xlsx')
			),
			false
		);
	});
});
