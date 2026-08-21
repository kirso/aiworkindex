import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { V9ResearchSignalProfile } from '../src/lib/data/v9-research-signals';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactPath = path.join(ROOT, 'data', 'v9-research-signals.json');
const occupationsPath = path.join(ROOT, 'data', 'occupations-v9.json');

interface ResearchArtifact {
	headline_effect: 'none';
	claim_boundary: string;
	publication_rule: {
		relations_allowed: string[];
		detailed_identity_required: boolean;
		unreviewed_close_broad_narrow_relations_allowed: boolean;
		missingness: string;
	};
	coverage: {
		ssoc_occupations: number;
		reviewed_identity_profiles: number;
		eloundou_theoretical_exposure_available: number;
		anthropic_observed_exposure_available: number;
		both_signals_available: number;
		unavailable_without_reviewed_identity: number;
		anthropic_unavailable_source_rows_after_identity: number;
	};
	occupation_status: Record<string, Record<string, string>>;
	profiles: Record<string, V9ResearchSignalProfile>;
}

function read(): ResearchArtifact {
	return JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as ResearchArtifact;
}

function sha256(file: string): string {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function sourceValues(file: string, codeField: string, valueField: string): Map<string, number> {
	const [headerLine, ...lines] = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
	const parseCsvRow = (line: string): string[] => {
		const fields: string[] = [];
		let value = '';
		let quoted = false;
		for (let index = 0; index < line.length; index += 1) {
			const character = line[index]!;
			if (character === '"') {
				if (quoted && line[index + 1] === '"') {
					value += '"';
					index += 1;
				} else quoted = !quoted;
			} else if (character === ',' && !quoted) {
				fields.push(value);
				value = '';
			} else value += character;
		}
		fields.push(value);
		return fields;
	};
	const header = parseCsvRow(headerLine!);
	const codeIndex = header.indexOf(codeField);
	const valueIndex = header.indexOf(valueField);
	return new Map(
		lines.map(line => {
			const fields = parseCsvRow(line);
			return [fields[codeIndex]!, Number(fields[valueIndex])];
		})
	);
}

describe('V9 separate research signals', () => {
	test('publishes a conservative identity-gated subset with explicit missingness', () => {
		const artifact = read();
		assert.equal(artifact.headline_effect, 'none');
		assert.match(artifact.claim_boundary, /cannot change the ILO headline/);
		assert.deepEqual(artifact.publication_rule.relations_allowed, [
			'exactMatch',
			'explicitly reviewed closeMatch'
		]);
		assert.equal(artifact.publication_rule.detailed_identity_required, true);
		assert.equal(artifact.publication_rule.unreviewed_close_broad_narrow_relations_allowed, false);
		assert.equal(artifact.publication_rule.missingness, 'unavailable_never_zero');
		assert.deepEqual(artifact.coverage, {
			ssoc_occupations: 1001,
			reviewed_identity_profiles: 75,
			eloundou_theoretical_exposure_available: 75,
			anthropic_observed_exposure_available: 73,
			both_signals_available: 73,
			unavailable_without_reviewed_identity: 926,
			anthropic_unavailable_source_rows_after_identity: 2
		});
		assert.equal(Object.keys(artifact.occupation_status).length, 1001);
		assert.equal(Object.keys(artifact.profiles).length, 75);
	});

	test('reuses only the reviewed capability identity owner', () => {
		const artifact = read();
		const capability = JSON.parse(
			fs.readFileSync(path.join(ROOT, 'data', 'v9-capability-profiles.json'), 'utf8')
		) as {
			profiles: Record<string, { mapping: { oecd_candidates: Array<{ onet_soc_code: string }> } }>;
		};
		assert.deepEqual(
			Object.keys(artifact.profiles).sort(),
			Object.keys(capability.profiles).sort()
		);
		for (const [code, profile] of Object.entries(artifact.profiles)) {
			assert.equal(profile.status, 'available_reviewed_identity');
			assert.equal(profile.headline_effect, 'none');
			assert.equal(
				profile.mapping.onet_soc_code,
				capability.profiles[code]!.mapping.oecd_candidates[0]!.onet_soc_code
			);
		}
	});

	test('reconciles every published value to the frozen upstream rows', () => {
		const artifact = read();
		const eloundou = sourceValues(
			path.join(ROOT, 'data', 'raw', 'external', 'eloundou_gpts_occ_level.csv'),
			'O*NET-SOC Code',
			'dv_rating_beta'
		);
		const anthropic = sourceValues(
			path.join(ROOT, 'data', 'raw', 'external', 'anthropic_job_exposure.csv'),
			'occ_code',
			'observed_exposure'
		);
		for (const profile of Object.values(artifact.profiles)) {
			assert.equal(
				profile.eloundou_theoretical_exposure.value_0_1,
				Number(eloundou.get(profile.mapping.onet_soc_code)!.toFixed(4))
			);
			if (profile.anthropic_observed_exposure) {
				assert.equal(
					profile.anthropic_observed_exposure.value_0_1,
					Number(anthropic.get(profile.mapping.onet_soc_code.slice(0, 7))!.toFixed(4))
				);
				assert.equal(
					profile.derived_theory_use_gap?.value_0_1,
					Number(
						(
							profile.eloundou_theoretical_exposure.value_0_1 -
							profile.anthropic_observed_exposure.value_0_1
						).toFixed(4)
					)
				);
			}
		}
	});

	test('ships identical copies and cannot mutate the headline release', () => {
		const before = sha256(occupationsPath);
		const result = spawnSync('bun', ['run', 'scripts/build-v9-research-signals.ts'], {
			cwd: ROOT,
			encoding: 'utf8'
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(sha256(occupationsPath), before);
		for (const copy of [
			path.join(ROOT, 'src', 'lib', 'data', 'v9-research-signals.json'),
			path.join(ROOT, 'static', 'data', 'v9-research-signals.json')
		]) {
			assert.equal(fs.readFileSync(copy, 'utf8'), fs.readFileSync(artifactPath, 'utf8'));
		}
	});
});
