import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { V9SkillsPilotProfile } from '../src/lib/data/v9-skills-pilot';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactPath = path.join(ROOT, 'data', 'v9-skills-pilot.json');

interface Artifact {
	headline_effect: 'none';
	claim_boundary: string;
	coverage: {
		ssoc_occupations: number;
		sectors: number;
		unique_occupations: number;
		sector_role_profiles: number;
		exact_title_profiles: number;
		reviewed_definition_equivalent_profiles: number;
		unavailable_outside_pilot: number;
	};
	occupation_status: Record<string, string>;
	profiles: Record<string, V9SkillsPilotProfile>;
}

function read(): Artifact {
	return JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as Artifact;
}

describe('V9 official skills pilot', () => {
	test('publishes a bounded three-sector pilot with explicit missingness', () => {
		const artifact = read();
		assert.equal(artifact.headline_effect, 'none');
		assert.match(artifact.claim_boundary, /not a measured worker skill level/);
		assert.deepEqual(artifact.coverage, {
			ssoc_occupations: 1001,
			sectors: 3,
			unique_occupations: 6,
			sector_role_profiles: 7,
			exact_title_profiles: 5,
			reviewed_definition_equivalent_profiles: 2,
			unavailable_outside_pilot: 995
		});
		assert.equal(Object.keys(artifact.occupation_status).length, 1001);
		assert.equal(Object.keys(artifact.profiles).length, 6);
	});

	test('locks the reviewed occupation and sector identities', () => {
		const artifact = read();
		assert.deepEqual(Object.keys(artifact.profiles).sort(), [
			'22640',
			'22680',
			'24160',
			'25121',
			'25143',
			'25213'
		]);
		assert.equal(artifact.profiles['25213']?.sector_profiles.length, 2);
		assert.equal(
			artifact.profiles['24160']?.sector_profiles[0]?.mapping.quality,
			'reviewed_definition_equivalent'
		);
	});

	test('contains distinct named skills and identical canonical copies', () => {
		const artifact = read();
		for (const profile of Object.values(artifact.profiles)) {
			for (const sector of profile.sector_profiles) {
				for (const skills of [sector.technical_skills, sector.core_skills]) {
					assert.ok(skills.length >= 5);
					assert.equal(new Set(skills.map(skill => skill.name)).size, skills.length);
					assert(skills.every(skill => skill.name.length > 2 && skill.proficiency.length > 2));
				}
			}
		}
		for (const copy of [
			path.join(ROOT, 'src', 'lib', 'data', 'v9-skills-pilot.json'),
			path.join(ROOT, 'static', 'data', 'v9-skills-pilot.json')
		]) {
			assert.equal(fs.readFileSync(copy, 'utf8'), fs.readFileSync(artifactPath, 'utf8'));
		}
	});
});
