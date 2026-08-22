import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type {
	V9CapabilityProfile,
	V9CapabilityStatus
} from '../src/lib/data/v9-capability-profiles';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactPath = path.join(ROOT, 'data', 'v9-capability-profiles.json');
const publicPath = path.join(ROOT, 'static', 'data', 'v9-capability-profiles.json');
const sourcePath = path.join(ROOT, 'data', 'raw', 'external', 'oecd-ai-capability-gap-2026.xlsx');

interface CapabilityArtifact {
	source: {
		sha256: string;
		occupation_rows: number;
		licence: { identifier: string };
	};
	coverage: {
		ssoc_occupations: number;
		raw_exact_candidate_coverage: number;
		available_reviewed_identity_profiles: number;
		available_automated_title_rule_profiles: number;
		available_manual_review_profiles: number;
		close_match_profiles_published: number;
	};
	profiles: Record<string, V9CapabilityProfile>;
	occupation_status: Record<string, V9CapabilityStatus>;
}

function read(): CapabilityArtifact {
	return JSON.parse(fs.readFileSync(artifactPath, 'utf8')) as CapabilityArtifact;
}

describe('V9 OECD capability profiles', () => {
	test('pins and validates the public workbook', () => {
		const artifact = read();
		const digest = createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
		assert.equal(digest, '11643c1e5aa002613a8652c15aa93975652089eda5d005017e7ea165ead24dcd');
		assert.equal(artifact.source.sha256, digest);
		assert.equal(artifact.source.occupation_rows, 879);
		assert.equal(artifact.source.licence.identifier, 'CC BY 4.0');
	});

	test('publishes only automated or explicitly reviewed detailed identities', () => {
		const artifact = read();
		assert.equal(artifact.coverage.ssoc_occupations, 1001);
		assert.equal(artifact.coverage.raw_exact_candidate_coverage, 698);
		assert.equal(artifact.coverage.available_reviewed_identity_profiles, 75);
		assert.equal(artifact.coverage.available_automated_title_rule_profiles, 68);
		assert.equal(artifact.coverage.available_manual_review_profiles, 7);
		assert.equal(Object.keys(artifact.profiles).length, 75);
		assert.equal(Object.keys(artifact.occupation_status).length, 1001);
		assert.equal(artifact.coverage.close_match_profiles_published, 3);
		for (const profile of Object.values(artifact.profiles)) {
			assert.equal(profile.status, 'available_reviewed_identity');
			assert.equal(profile.headline_effect, 'none');
			for (const candidate of profile.mapping.oecd_candidates) {
				assert.equal(candidate.detailed_title_identity, true);
				assert.ok(candidate.matched_ssoc_title_variant.length > 1);
				if (candidate.identity_basis === 'reviewed_title_and_definition') {
					assert.ok(candidate.reviewed_at);
					assert.ok(candidate.review_rationale);
				}
			}
		}
	});

	test('locks the small reviewed identity allow-list while rejecting a known false match', () => {
		const artifact = read();
		assert.deepEqual(
			Object.entries(artifact.profiles)
				.filter(([, profile]) =>
					profile.mapping.oecd_candidates.some(
						candidate => candidate.identity_basis === 'reviewed_title_and_definition'
					)
				)
				.map(([code]) => code)
				.sort(),
			['22200', '22621', '22640', '24214', '25111', '25113', '25213']
		);
		assert.equal(
			artifact.profiles['25213']?.mapping.oecd_candidates[0]?.onet_soc_code,
			'15-1243.01'
		);
		assert.equal(artifact.profiles['25143'], undefined);
	});

	test('blocks the known broad-group false match', () => {
		const artifact = read();
		assert.equal(artifact.profiles['25143'], undefined);
		assert.equal(
			artifact.occupation_status['25143']?.status,
			'unavailable_no_detailed_title_identity'
		);
	});

	test('keeps values in documented source ranges', () => {
		const artifact = read();
		for (const profile of Object.values(artifact.profiles)) {
			const proximity = profile.overall.ai_capability_proximity_0_1;
			assert.ok(proximity.min >= 0);
			assert.ok(proximity.max <= 1);
			for (const domain of Object.values(profile.domains)) {
				assert.ok(domain.capability_gap.min >= 0);
				assert.ok(domain.capability_gap.max <= domain.gap_scale.max);
				assert.ok(domain.job_demand.min >= 0);
				assert.ok(domain.job_demand.max <= 5);
			}
		}
	});

	test('ships byte-identical canonical copies', () => {
		assert.equal(fs.readFileSync(publicPath, 'utf8'), fs.readFileSync(artifactPath, 'utf8'));
		assert.equal(
			fs.readFileSync(path.join(ROOT, 'src', 'lib', 'data', 'v9-capability-profiles.json'), 'utf8'),
			fs.readFileSync(artifactPath, 'utf8')
		);
	});
});
