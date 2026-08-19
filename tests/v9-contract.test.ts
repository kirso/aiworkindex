import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, test } from 'node:test';
import * as XLSX from 'xlsx';
import release from '../data/occupations-v9.json';
import registry from '../data/ssoc-2024-registry.json';
import {
	buildHeadlineExposure,
	type IloOccupationEvidence,
	V9_EXTERNAL_COMPARISON_AUDIT,
	type V9HeadlineRegistryEntry
} from '../scripts/build-v9-release';

const occupations = release.occupations;
const officialCategories = [
	'Not Exposed',
	'Minimal Exposure',
	'Exposed: Gradient 1',
	'Exposed: Gradient 2',
	'Exposed: Gradient 3',
	'Exposed: Gradient 4'
] as const;
const categoryOrder = new Map(officialCategories.map((category, index) => [category, index]));

function round(value: number, decimals: number): number {
	const multiplier = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

describe('V9 evidence-first occupation contract', () => {
	test('covers the complete numeric SSOC 2024 occupation registry', () => {
		assert.equal(release.schema_version, '9.0');
		assert.deepEqual(release.counts, {
			occupations: 1001,
			scored: 987,
			insufficient_evidence: 14,
			direct_wages: 523
		});
		assert.equal(new Set(occupations.map(occupation => occupation.taxonomy.code)).size, 1001);
		assert.ok(occupations.every(occupation => occupation.taxonomy.edition === '2024'));
	});

	test('pins the headline ILO workbook to source metadata and checksum', () => {
		const metadata = JSON.parse(
			fs.readFileSync('data/raw/external/ilo_genai_scores_isco08_2025.metadata.json', 'utf8')
		) as { sha256: string; size_bytes: number; url: string };
		const workbook = fs.readFileSync('data/raw/external/ilo_genai_scores_isco08_2025.xlsx');
		assert.equal(metadata.size_bytes, workbook.length);
		assert.equal(createHash('sha256').update(workbook).digest('hex'), metadata.sha256);
		assert.equal(release.sources.exposure.sha256, metadata.sha256);
		assert.equal(release.sources.exposure.url, metadata.url);
	});

	test('publishes the official SSOC 2024 source files and checksums', () => {
		assert.equal(release.sources.taxonomy?.artifact, 'data/ssoc-2024-registry.json');
		assert.equal(release.sources.taxonomy?.publisher, 'Singapore Department of Statistics');
		assert.equal(release.sources.taxonomy?.source_page, registry.source.source_page);
		assert.deepEqual(release.sources.taxonomy?.files, registry.source.files);
		assert.equal(release.sources.taxonomy?.files.length, 3);
		assert.equal(
			release.sources.taxonomy?.files.every(file => /^[a-f0-9]{64}$/.test(file.sha256)),
			true
		);
	});

	test('states the source score scale used by machine-readable fields', () => {
		assert.match(release.method.source_score_scale, /0 to 1 scale/);
		assert.match(release.method.source_score_scale, /multiplied by 100/);
	});

	test('withholds ranks when the official mapping has no usable ILO score', () => {
		const missing = occupations
			.filter(occupation => occupation.score_status === 'insufficient_evidence')
			.map(occupation => occupation.taxonomy.code);
		assert.deepEqual(missing, [
			'14391',
			'14392',
			'14399',
			'31391',
			'31392',
			'31399',
			'33491',
			'33492',
			'33493',
			'33499',
			'34391',
			'34399',
			'52499',
			'81890'
		]);
		for (const occupation of occupations.filter(
			item => item.score_status === 'insufficient_evidence'
		)) {
			assert.equal(occupation.genai_task_exposure, null);
			assert.ok(
				occupation.evidence.support === 'official_crosswalk_without_ilo_score' ||
					occupation.evidence.support === 'unmatched'
			);
		}
	});

	test('recomputes the headline as the midrank of ILO mean-score medians', () => {
		const scored = occupations.filter(occupation => occupation.genai_task_exposure !== null);
		const sorted = scored
			.map(occupation => ({
				code: occupation.taxonomy.code,
				mean: occupation.genai_task_exposure!.mean_score_2025.median,
				rank: occupation.genai_task_exposure!.pressure_rank
			}))
			.sort((a, b) => a.mean - b.mean || a.code.localeCompare(b.code));
		let start = 0;
		while (start < sorted.length) {
			const current = sorted[start]!;
			let end = start;
			while (end + 1 < sorted.length && sorted[end + 1]!.mean === current.mean) end += 1;
			const averageZeroBasedRank = (start + end) / 2;
			const expectedPercentile = round((averageZeroBasedRank / (sorted.length - 1)) * 100, 1);
			for (let index = start; index <= end; index += 1) {
				const row = sorted[index]!;
				assert.equal(row.rank.percentile, expectedPercentile);
				assert.equal(row.rank.midrank_position, averageZeroBasedRank + 1);
				assert.equal(row.rank.population_size, 987);
				assert.equal(row.rank.method, 'midrank_percentile');
			}
			start = end + 1;
		}
	});

	test('preserves official ILO categories, task dispersion, and mapping uncertainty', () => {
		for (const occupation of occupations.filter(item => item.genai_task_exposure !== null)) {
			const exposure = occupation.genai_task_exposure!;
			assert.equal(exposure.source, 'ilo_genai_2025');
			assert.equal(exposure.aggregation, 'median_across_scored_official_isco_matches');
			assert.deepEqual(exposure.official_isco08_codes, occupation.evidence.official_isco08_codes);
			assert.ok(exposure.mean_score_2025.min <= exposure.mean_score_2025.median);
			assert.ok(exposure.mean_score_2025.max >= exposure.mean_score_2025.median);
			assert.ok(exposure.task_score_sd_2025.min <= exposure.task_score_sd_2025.median);
			assert.ok(exposure.task_score_sd_2025.max >= exposure.task_score_sd_2025.median);
			assert.equal(
				exposure.task_score_sd_2025.meaning,
				'within_isco_occupation_task_score_dispersion'
			);
			assert.ok(
				exposure.potential25.categories.every(category =>
					officialCategories.includes(category as (typeof officialCategories)[number])
				)
			);
			assert.ok(
				(categoryOrder.get(
					exposure.potential25.least_exposed as (typeof officialCategories)[number]
				) ?? 99) <=
					(categoryOrder.get(
						exposure.potential25.most_exposed as (typeof officialCategories)[number]
					) ?? -1)
			);
			assert.equal(
				exposure.scored_isco08_matches.length + exposure.unscored_official_isco08_codes.length,
				exposure.official_isco08_codes.length
			);
		}

		const partial = occupations.find(occupation => occupation.taxonomy.code === '75490');
		assert.deepEqual(partial?.genai_task_exposure?.official_isco08_codes, ['7549', '7542', '7319']);
		assert.deepEqual(partial?.genai_task_exposure?.unscored_official_isco08_codes, ['7319']);
	});

	test('reconciles every published mapping and ILO field to the frozen source files', () => {
		const registryByCode = new Map(
			registry.entries
				.filter(entry => entry.entry_kind === 'occupation')
				.map(entry => [entry.code, entry])
		);
		const workbook = XLSX.readFile('data/raw/external/ilo_genai_scores_isco08_2025.xlsx');
		const sheetName = workbook.SheetNames[0];
		assert.ok(sheetName);
		const sheet = workbook.Sheets[sheetName];
		assert.ok(sheet);
		const sourceRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
		const sourceByIsco = new Map<
			string,
			{ mean_score_2025: number; task_score_sd_2025: number; potential25: string }
		>();
		for (const row of sourceRows) {
			const code = String(row.ISCO_08 ?? '').trim();
			if (!/^\d{4}$/.test(code) || sourceByIsco.has(code)) continue;
			assert.equal(typeof row.mean_score_2025, 'number');
			assert.equal(typeof row.SD_2025, 'number');
			assert.equal(typeof row.potential25, 'string');
			sourceByIsco.set(code, {
				mean_score_2025: row.mean_score_2025 as number,
				task_score_sd_2025: row.SD_2025 as number,
				potential25: row.potential25 as string
			});
		}

		for (const occupation of occupations) {
			const registryEntry = registryByCode.get(occupation.taxonomy.code);
			assert.ok(registryEntry);
			assert.deepEqual(
				occupation.evidence.official_isco08_codes,
				registryEntry.isco08.candidates.map(candidate => candidate.code)
			);
			for (const match of occupation.genai_task_exposure?.scored_isco08_matches ?? []) {
				assert.deepEqual(match, {
					isco08_code: match.isco08_code,
					...sourceByIsco.get(match.isco08_code)
				});
			}
		}
	});

	test('publishes direct 2025 MOM wages as a nullable evidence block', () => {
		const administrationManager = occupations.find(
			occupation => occupation.taxonomy.code === '12112'
		);
		const wages = administrationManager?.singapore_market.wages;
		assert.equal(wages?.value.gross_monthly_sgd.median, 8050);
		assert.equal(wages?.reference_period, '2025-06');
		assert.equal(wages?.evidence_kind, 'observed');
		assert.equal(wages?.mapping?.quality, 'direct');
		assert.equal(occupations.filter(occupation => occupation.singapore_market.wages).length, 523);
	});

	test('keeps every non-headline evidence surface independent and nullable', () => {
		for (const occupation of occupations) {
			assert.deepEqual(occupation.comparison_evidence, {
				eloundou: null,
				aioe: null,
				observed_ai_use: null,
				potential_complementarity: null
			});
			assert.equal(occupation.singapore_market.demand, null);
			assert.equal(occupation.singapore_market.labour_context, null);
			assert.equal(occupation.singapore_market.entry_level, null);
		}
	});

	test('withholds external sidecars when the checked-in ISCO to SOC mapping is not auditable', () => {
		assert.deepEqual(release.method.external_comparison_audit, V9_EXTERNAL_COMPARISON_AUDIT);
		assert.equal(V9_EXTERNAL_COMPARISON_AUDIT.headline_effect, 'none');
		assert.equal(V9_EXTERNAL_COMPARISON_AUDIT.reviewed_mapping_artifact.status, 'rejected_for_v9');
		assert.ok(V9_EXTERNAL_COMPARISON_AUDIT.reviewed_mapping_artifact.reasons.length >= 3);

		for (const [key, disposition] of Object.entries(V9_EXTERNAL_COMPARISON_AUDIT.sidecars)) {
			assert.deepEqual(disposition.published_coverage, {
				occupations: 0,
				denominator: 1001,
				percent: 0
			});
			assert.ok(disposition.status.startsWith('withheld_'));
			assert.equal(disposition.mapping.aggregation, 'not_applied');
			assert.ok(disposition.mapping.quality.startsWith('rejected_'));
			assert.ok(fs.existsSync(disposition.checked_in_source.artifact), `${key} source missing`);
		}

		for (const occupation of occupations) {
			assert.equal(occupation.comparison_evidence.aioe, null);
			assert.equal(occupation.comparison_evidence.eloundou, null);
			assert.equal(occupation.comparison_evidence.observed_ai_use, null);
			assert.equal(occupation.comparison_evidence.potential_complementarity, null);
		}
	});

	test('reconciles withheld source identities and exact value fields to checked-in artifacts', () => {
		const aioeWorkbook = XLSX.readFile(
			V9_EXTERNAL_COMPARISON_AUDIT.sidecars.aioe.checked_in_source.artifact
		);
		const aioeSheet = aioeWorkbook.Sheets['Appendix A'];
		assert.ok(aioeSheet);
		const aioeRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(aioeSheet);
		assert.ok(
			aioeRows.some(row => typeof row.AIOE === 'number' && typeof row['SOC Code'] === 'string')
		);

		const eloundouHeader = fs
			.readFileSync(
				V9_EXTERNAL_COMPARISON_AUDIT.sidecars.eloundou.checked_in_source.artifact,
				'utf8'
			)
			.split(/\r?\n/, 1)[0];
		assert.ok(eloundouHeader?.includes('O*NET-SOC Code'));
		assert.ok(eloundouHeader?.includes('dv_rating_beta'));

		const anthropicHeader = fs
			.readFileSync(
				V9_EXTERNAL_COMPARISON_AUDIT.sidecars.observed_ai_use.checked_in_source.artifact,
				'utf8'
			)
			.split(/\r?\n/, 1)[0];
		assert.equal(anthropicHeader, 'occ_code,title,observed_exposure');

		const theta = JSON.parse(
			fs.readFileSync(
				V9_EXTERNAL_COMPARISON_AUDIT.sidecars.potential_complementarity.checked_in_source.artifact,
				'utf8'
			)
		) as Record<string, unknown>;
		assert.ok(Object.keys(theta).length > 0);
		assert.ok(Object.values(theta).every(value => typeof value === 'number'));
		assert.equal(
			V9_EXTERNAL_COMPARISON_AUDIT.sidecars.potential_complementarity.checked_in_source
				.observation_vintage,
			null
		);
	});

	test('calculates pressure without accepting sidecar inputs', () => {
		const registry: V9HeadlineRegistryEntry[] = [
			{ code: 'a', official_isco08_codes: ['1000'] },
			{ code: 'b', official_isco08_codes: ['2000'] },
			{ code: 'c', official_isco08_codes: ['3000', '4000'] },
			{ code: 'd', official_isco08_codes: ['9999'] }
		];
		const ilo = new Map<string, IloOccupationEvidence>([
			['1000', { mean_score_2025: 0.1, task_score_sd_2025: 0.02, potential25: 'Not Exposed' }],
			[
				'2000',
				{
					mean_score_2025: 0.5,
					task_score_sd_2025: 0.1,
					potential25: 'Exposed: Gradient 2'
				}
			],
			[
				'3000',
				{
					mean_score_2025: 0.4,
					task_score_sd_2025: 0.08,
					potential25: 'Exposed: Gradient 1'
				}
			],
			[
				'4000',
				{
					mean_score_2025: 0.6,
					task_score_sd_2025: 0.12,
					potential25: 'Exposed: Gradient 3'
				}
			]
		]);

		const headline = buildHeadlineExposure(registry, ilo);
		const headlineWithIgnoredExternalEvidence = (
			buildHeadlineExposure as unknown as (
				registryInput: readonly V9HeadlineRegistryEntry[],
				iloInput: ReadonlyMap<string, IloOccupationEvidence>,
				externalEvidence: unknown
			) => ReturnType<typeof buildHeadlineExposure>
		)(registry, ilo, {
			aioe: 1,
			eloundou: 0,
			observed_ai_use: 0.99,
			potential_complementarity: 0.01
		});
		assert.deepEqual([...headlineWithIgnoredExternalEvidence], [...headline]);
		assert.equal(headline.get('a')?.pressure_rank.percentile, 0);
		assert.equal(headline.get('b')?.pressure_rank.percentile, 75);
		assert.equal(headline.get('c')?.pressure_rank.percentile, 75);
		assert.equal(headline.get('d'), null);
		assert.deepEqual(headline.get('c')?.potential25, {
			categories: ['Exposed: Gradient 1', 'Exposed: Gradient 3'],
			least_exposed: 'Exposed: Gradient 1',
			most_exposed: 'Exposed: Gradient 3'
		});
	});

	test('does not publish custom bands or revive V8 outcome-like fields', () => {
		const serialized = JSON.stringify(release);
		assert.equal('bands' in release.method, false);
		for (const forbidden of [
			'"band"',
			'jobs_affected',
			'wage_pool',
			'substitution_score',
			'augmentation_score',
			'likely_pathway',
			'employment_estimate'
		]) {
			assert.equal(serialized.includes(forbidden), false);
		}
	});
});
