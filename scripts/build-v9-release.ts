#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import type {
	V9ExternalComparisonAudit,
	V9GenAiTaskExposure,
	V9IloExposureCategory,
	V9IloIscoEvidence,
	V9Occupation,
	V9WageEvidence
} from '../src/lib/data/v9-contract';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const REGISTRY_FILE = path.join(DATA_DIR, 'ssoc-2024-registry.json');
const ILO_FILE = path.join(DATA_DIR, 'raw', 'external', 'ilo_genai_scores_isco08_2025.xlsx');
const ILO_METADATA_FILE = path.join(
	DATA_DIR,
	'raw',
	'external',
	'ilo_genai_scores_isco08_2025.metadata.json'
);
const WAGE_FILE = path.join(
	DATA_DIR,
	'raw',
	'official',
	'mom-wages-2025',
	'mom-occupational-wages-2025.xlsx'
);
const WAGE_METADATA_FILE = path.join(
	DATA_DIR,
	'raw',
	'official',
	'mom-wages-2025',
	'source-metadata.json'
);
const OUTPUT_FILE = path.join(DATA_DIR, 'occupations-v9.json');

/**
 * These source snapshots are useful comparison inputs, but the repository does not contain a
 * release-grade, row-level ISCO-08 to US SOC correspondence artifact. The legacy table in
 * scripts/crosswalk.ts is hand-maintained, mixes SOC editions and manual additions, and cannot
 * be reconciled back to a checked-in official source row by row. Publishing occupation values
 * through it would overstate mapping precision, so V9 intentionally leaves every field null.
 */
export const V9_EXTERNAL_COMPARISON_AUDIT = {
	headline_effect: 'none',
	mapping_policy: 'official_ssoc_2024_to_isco08_then_verified_isco08_to_soc_then_exact_source_soc',
	reviewed_mapping_artifact: {
		path: 'scripts/crosswalk.ts',
		status: 'rejected_for_v9',
		reasons: [
			'No row-level official ISCO-08 to US SOC source snapshot, version, checksum, or retrieval metadata is checked in.',
			'The table combines claimed SOC 2010 correspondence with manual Singapore-specific additions and a hand-maintained SOC 2010 to 2018 bridge.',
			'Inline comments identify semantic mismatches between several ISCO occupations and their assigned SOC codes.'
		]
	},
	sidecars: {
		aioe: {
			target_field: 'comparison_evidence.aioe',
			construct: 'general_ai_ability_exposure',
			status: 'withheld_unverified_isco08_soc_crosswalk',
			checked_in_source: {
				artifact: 'data/raw/external/AIOE_DataAppendix.xlsx',
				value_field: 'Appendix A.AIOE',
				occupation_code_system: 'US SOC 2010',
				observation_vintage: null,
				source: {
					id: 'felten_raj_seamans_aioe_2021',
					publisher: 'Strategic Management Journal',
					title:
						'Occupational, industry, and geographic exposure to artificial intelligence: A novel dataset and its potential uses',
					url: 'https://doi.org/10.1002/smj.3286',
					release_date: '2021'
				}
			},
			mapping: {
				method: 'official_ssoc_2024_to_isco08_then_verified_isco08_to_soc_then_exact_source_soc',
				quality: 'rejected_unverified_provenance',
				aggregation: 'not_applied'
			},
			published_coverage: { occupations: 0, denominator: 1001, percent: 0 },
			limitations: [
				'US ability-based theoretical AI exposure is not observed GenAI use, Singapore adoption, or a labour-market outcome.',
				'The checked-in workbook records a 2021 publication source but does not identify an occupation-observation period.',
				'Occupation values cannot be joined to SSOC 2024 until a reproducible ISCO-08 to SOC crosswalk is checked in and validated.'
			]
		},
		eloundou: {
			target_field: 'comparison_evidence.eloundou',
			construct: 'gpt_task_exposure',
			status: 'withheld_unverified_isco08_soc_crosswalk',
			checked_in_source: {
				artifact: 'data/raw/external/eloundou_gpts_occ_level.csv',
				value_field: 'dv_rating_beta',
				occupation_code_system: 'O*NET-SOC',
				observation_vintage: null,
				source: {
					id: 'eloundou_gpts_are_gpts_2023',
					publisher: 'OpenAI',
					title:
						'GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models',
					url: 'https://arxiv.org/abs/2303.10130',
					release_date: '2023-03-17'
				}
			},
			mapping: {
				method: 'official_ssoc_2024_to_isco08_then_verified_isco08_to_soc_then_exact_source_soc',
				quality: 'rejected_unverified_provenance',
				aggregation: 'not_applied'
			},
			published_coverage: { occupations: 0, denominator: 1001, percent: 0 },
			limitations: [
				'The GPT-4 beta rating is an early US O*NET-based capability judgement, not observed use, adoption, job loss, or a Singapore outcome.',
				'The checked-in file is a 2023 model-rating artifact rather than an observed-use period.',
				'Occupation values cannot be joined to SSOC 2024 until a reproducible ISCO-08 to SOC crosswalk is checked in and validated.'
			]
		},
		observed_ai_use: {
			target_field: 'comparison_evidence.observed_ai_use',
			construct: 'observed_claude_occupation_use',
			status: 'withheld_unverified_isco08_soc_crosswalk',
			checked_in_source: {
				artifact: 'data/raw/external/anthropic_job_exposure.csv',
				value_field: 'observed_exposure',
				occupation_code_system: 'US SOC',
				observation_vintage: '2025-11',
				source: {
					id: 'anthropic_economic_index_2026',
					publisher: 'Anthropic',
					title: 'Anthropic Economic Index report: Economic primitives',
					url: 'https://www.anthropic.com/research/anthropic-economic-index-january-2026-report',
					release_date: '2026-01-15'
				}
			},
			mapping: {
				method: 'official_ssoc_2024_to_isco08_then_verified_isco08_to_soc_then_exact_source_soc',
				quality: 'rejected_unverified_provenance',
				aggregation: 'not_applied'
			},
			published_coverage: { occupations: 0, denominator: 1001, percent: 0 },
			limitations: [
				'Claude usage is platform-selected and is not a representative census of workers, employers, geographies, occupations, or all AI tools.',
				'Observed platform use is not the share of a job automated, Singapore adoption, or a causal labour-market outcome.',
				'Occupation values cannot be joined to SSOC 2024 until a reproducible ISCO-08 to SOC crosswalk is checked in and validated.'
			]
		},
		potential_complementarity: {
			target_field: 'comparison_evidence.potential_complementarity',
			construct: 'potential_human_ai_complementarity',
			status: 'withheld_unverified_crosswalk_and_construct_replication',
			checked_in_source: {
				artifact: 'data/intermediate/theta_by_soc.json',
				value_field: 'theta',
				occupation_code_system: 'US SOC',
				observation_vintage: null,
				source: {
					id: 'pizzinelli_etal_2023',
					publisher: 'International Monetary Fund',
					title:
						'Labor Market Exposure to AI: Cross-country Differences and Distributional Implications',
					url: 'https://www.imf.org/en/Publications/WP/Issues/2023/10/04/Labor-Market-Exposure-to-AI-Cross-country-Differences-and-Distributional-Implications-539656',
					release_date: '2023-10-04'
				}
			},
			mapping: {
				method: 'official_ssoc_2024_to_isco08_then_verified_isco08_to_soc_then_exact_source_soc',
				quality: 'rejected_unverified_provenance_and_construct_replication',
				aggregation: 'not_applied'
			},
			published_coverage: { occupations: 0, denominator: 1001, percent: 0 },
			limitations: [
				'The checked-in theta file is a repository-derived O*NET proxy, not a frozen occupation-level IMF source table.',
				'The O*NET observation vintage and a row-level replication against the published IMF construct are not recorded.',
				'Potential complementarity is cross-country context, not realised augmentation, job protection, or a Singapore outcome.',
				'Occupation values also require a reproducible ISCO-08 to SOC crosswalk.'
			]
		}
	}
} as const satisfies V9ExternalComparisonAudit;

interface RegistryEntry {
	code: string;
	title: string;
	entry_kind: 'occupation' | 'residual';
	hierarchy: V9Occupation['taxonomy']['hierarchy'];
	detailed_definition: string | null;
	tasks: string[];
	search_synonyms: string[];
	isco08: {
		quality: V9Occupation['evidence']['mapping_quality'];
		candidates: { code: string; title: string; part: string | null }[];
	};
}

export interface V9HeadlineRegistryEntry {
	code: string;
	official_isco08_codes: string[];
}

export interface IloOccupationEvidence {
	mean_score_2025: number;
	task_score_sd_2025: number;
	potential25: V9IloExposureCategory;
}

type Cell = string | number | boolean | Date | null;

const ILO_EXPOSURE_CATEGORIES = [
	'Not Exposed',
	'Minimal Exposure',
	'Exposed: Gradient 1',
	'Exposed: Gradient 2',
	'Exposed: Gradient 3',
	'Exposed: Gradient 4'
] as const satisfies readonly V9IloExposureCategory[];

const ILO_EXPOSURE_CATEGORY_ORDER = new Map<V9IloExposureCategory, number>(
	ILO_EXPOSURE_CATEGORIES.map((category, index) => [category, index])
);

function round(value: number, decimals: number): number {
	const multiplier = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function median(values: number[]): number {
	if (values.length === 0) throw new Error('Cannot calculate the median of an empty array');
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function isIloExposureCategory(value: unknown): value is V9IloExposureCategory {
	return ILO_EXPOSURE_CATEGORIES.includes(value as V9IloExposureCategory);
}

function loadIloMetadata() {
	const metadata = JSON.parse(fs.readFileSync(ILO_METADATA_FILE, 'utf8')) as {
		file: string;
		size_bytes: number;
		sha256: string;
		worksheet: string;
		[key: string]: unknown;
	};
	const bytes = fs.readFileSync(ILO_FILE);
	const digest = createHash('sha256').update(bytes).digest('hex');
	if (metadata.file !== path.basename(ILO_FILE)) throw new Error('ILO metadata filename mismatch');
	if (metadata.size_bytes !== bytes.length) throw new Error('ILO source size mismatch');
	if (metadata.sha256 !== digest) throw new Error('ILO source checksum mismatch');
	if (metadata.worksheet !== 'Sheet1') throw new Error('ILO source worksheet metadata mismatch');
	return metadata;
}

function loadIloScores(): Map<string, IloOccupationEvidence> {
	const workbook = XLSX.readFile(ILO_FILE);
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) throw new Error('ILO workbook has no worksheet');
	const sheet = workbook.Sheets[sheetName];
	if (!sheet) throw new Error(`ILO workbook worksheet ${sheetName} is unavailable`);
	const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
	const valuesByIsco = new Map<
		string,
		{
			mean: Set<number>;
			sd: Set<number>;
			category: Set<V9IloExposureCategory>;
		}
	>();
	for (const row of rows) {
		const isco = String(row.ISCO_08 ?? '').trim();
		if (!/^\d{4}$/.test(isco)) continue;
		const mean = row.mean_score_2025;
		const sd = row.SD_2025;
		const category = row.potential25;
		if (typeof mean !== 'number' || !Number.isFinite(mean) || mean < 0 || mean > 1) {
			throw new Error(`${isco}: invalid mean_score_2025`);
		}
		if (typeof sd !== 'number' || !Number.isFinite(sd) || sd < 0 || sd > 1) {
			throw new Error(`${isco}: invalid SD_2025`);
		}
		if (!isIloExposureCategory(category)) {
			throw new Error(`${isco}: invalid potential25 category ${String(category)}`);
		}
		const values = valuesByIsco.get(isco) ?? {
			mean: new Set<number>(),
			sd: new Set<number>(),
			category: new Set<V9IloExposureCategory>()
		};
		values.mean.add(mean);
		values.sd.add(sd);
		values.category.add(category);
		valuesByIsco.set(isco, values);
	}
	const result = new Map<string, IloOccupationEvidence>();
	for (const [isco, values] of valuesByIsco) {
		if (values.mean.size !== 1) throw new Error(`${isco}: inconsistent mean_score_2025 values`);
		if (values.sd.size !== 1) throw new Error(`${isco}: inconsistent SD_2025 values`);
		if (values.category.size !== 1) throw new Error(`${isco}: inconsistent potential25 values`);
		const mean = [...values.mean][0]!;
		const sd = [...values.sd][0]!;
		const category = [...values.category][0]!;
		result.set(isco, {
			mean_score_2025: mean,
			task_score_sd_2025: sd,
			potential25: category
		});
	}
	if (result.size !== 427) throw new Error(`expected 427 ILO ISCO groups, found ${result.size}`);
	return result;
}

function wageNumber(row: Cell[], column: number, code: string): number {
	const value = row[column];
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(`${code}: invalid wage value in column ${column}`);
	}
	return value;
}

function loadWages(): Map<string, V9WageEvidence> {
	const workbook = XLSX.readFile(WAGE_FILE);
	const sheet = workbook.Sheets.T4;
	if (!sheet) throw new Error('MOM wages workbook has no T4 worksheet');
	const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null });
	const result = new Map<string, V9WageEvidence>();
	for (const row of rows) {
		const code = String(row[1] ?? '').trim();
		if (!/^\d{5}$/.test(code)) continue;
		if (result.has(code)) throw new Error(`${code}: duplicate MOM wage row`);
		result.set(code, {
			construct: 'observed_monthly_occupation_wages',
			evidence_kind: 'observed',
			geography: 'Singapore',
			reference_period: '2025-06',
			source: {
				id: 'mom_occupational_wages_2025',
				publisher: 'Singapore Ministry of Manpower',
				title: 'Occupational Wages 2025, Table 4',
				url: 'https://stats.mom.gov.sg/Pages/Occupational-Wages-Tables2025.aspx',
				release_date: null
			},
			mapping: { method: 'exact_ssoc_2024_code', quality: 'direct' },
			limitations: [
				'Coverage is limited to full-time resident employees in establishments with at least 25 employees.'
			],
			value: {
				basic_monthly_sgd: {
					p25: wageNumber(row, 3, code),
					median: wageNumber(row, 4, code),
					p75: wageNumber(row, 5, code)
				},
				gross_monthly_sgd: {
					p25: wageNumber(row, 6, code),
					median: wageNumber(row, 7, code),
					p75: wageNumber(row, 8, code)
				}
			}
		});
	}
	if (result.size !== 523) throw new Error(`expected 523 MOM wage rows, found ${result.size}`);
	if (result.get('12112')?.value.gross_monthly_sgd.median !== 8050) {
		throw new Error('Administration manager wage sentinel changed');
	}
	return result;
}

interface MidrankResult {
	percentile: number;
	position: number;
}

export function midrankPercentiles(
	valuesByCode: ReadonlyMap<string, number>
): Map<string, MidrankResult> {
	const rows = [...valuesByCode].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
	const result = new Map<string, MidrankResult>();
	let start = 0;
	while (start < rows.length) {
		const current = rows[start]!;
		let end = start;
		while (end + 1 < rows.length && rows[end + 1]![1] === current[1]) end += 1;
		const averageZeroBasedRank = (start + end) / 2;
		const percentile = rows.length === 1 ? 50 : (averageZeroBasedRank / (rows.length - 1)) * 100;
		for (let index = start; index <= end; index += 1)
			result.set(rows[index]![0], {
				percentile: round(percentile, 1),
				position: averageZeroBasedRank + 1
			});
		start = end + 1;
	}
	return result;
}

function categoryRange(categories: readonly V9IloExposureCategory[]) {
	const sorted = [...new Set(categories)].sort(
		(a, b) =>
			(ILO_EXPOSURE_CATEGORY_ORDER.get(a) ?? Number.POSITIVE_INFINITY) -
			(ILO_EXPOSURE_CATEGORY_ORDER.get(b) ?? Number.POSITIVE_INFINITY)
	);
	const leastExposed = sorted[0];
	const mostExposed = sorted.at(-1);
	if (!leastExposed || !mostExposed)
		throw new Error('Cannot calculate an empty ILO category range');
	return { categories: sorted, leastExposed, mostExposed };
}

/**
 * Sole owner of V9 headline scores. Its inputs deliberately exclude wages, demand,
 * observed use, complementarity, labour context, and every other sidecar.
 */
export function buildHeadlineExposure(
	registry: readonly V9HeadlineRegistryEntry[],
	iloScores: ReadonlyMap<string, IloOccupationEvidence>
): Map<string, V9GenAiTaskExposure | null> {
	const matchedByCode = new Map<string, V9IloIscoEvidence[]>();
	const meanByCode = new Map<string, number>();

	for (const entry of registry) {
		const matches = entry.official_isco08_codes.flatMap(isco08Code => {
			const evidence = iloScores.get(isco08Code);
			return evidence
				? [
						{
							isco08_code: isco08Code,
							...evidence
						} satisfies V9IloIscoEvidence
					]
				: [];
		});
		matchedByCode.set(entry.code, matches);
		if (matches.length > 0) {
			meanByCode.set(entry.code, round(median(matches.map(match => match.mean_score_2025)), 4));
		}
	}

	const ranks = midrankPercentiles(meanByCode);
	const result = new Map<string, V9GenAiTaskExposure | null>();
	for (const entry of registry) {
		const matches = matchedByCode.get(entry.code) ?? [];
		const rank = ranks.get(entry.code);
		if (matches.length === 0 || !rank) {
			result.set(entry.code, null);
			continue;
		}

		const means = matches.map(match => match.mean_score_2025);
		const standardDeviations = matches.map(match => match.task_score_sd_2025);
		const categories = categoryRange(matches.map(match => match.potential25));
		const scoredCodes = new Set(matches.map(match => match.isco08_code));
		result.set(entry.code, {
			source: 'ilo_genai_2025',
			mean_score_2025: {
				median: round(median(means), 4),
				min: round(Math.min(...means), 4),
				max: round(Math.max(...means), 4)
			},
			task_score_sd_2025: {
				median: round(median(standardDeviations), 4),
				min: round(Math.min(...standardDeviations), 4),
				max: round(Math.max(...standardDeviations), 4),
				meaning: 'within_isco_occupation_task_score_dispersion'
			},
			potential25: {
				categories: categories.categories,
				least_exposed: categories.leastExposed,
				most_exposed: categories.mostExposed
			},
			pressure_rank: {
				percentile: rank.percentile,
				midrank_position: rank.position,
				method: 'midrank_percentile',
				comparison_population: 'scored_ssoc_2024_occupations',
				population_size: meanByCode.size,
				direction: 'higher_means_more_genai_task_exposure'
			},
			official_isco08_codes: [...entry.official_isco08_codes],
			scored_isco08_matches: matches,
			unscored_official_isco08_codes: entry.official_isco08_codes.filter(
				code => !scoredCodes.has(code)
			),
			aggregation: 'median_across_scored_official_isco_matches'
		});
	}

	return result;
}

function main() {
	for (const file of [REGISTRY_FILE, ILO_FILE, WAGE_FILE, WAGE_METADATA_FILE]) {
		if (!fs.existsSync(file)) throw new Error(`${file} missing`);
	}
	const registryDocument = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8')) as {
		counts: { total: number; occupations: number; residual: number };
		source: {
			publisher: string;
			taxonomy: string;
			source_page: string;
			terms_url: string;
			retrieved_at: string;
			files: Array<{
				key: string;
				purpose: string;
				filename: string;
				url: string;
				published: string;
				bytes: number;
				sha256: string;
			}>;
		};
		entries: RegistryEntry[];
	};
	if (
		registryDocument.counts.total !== 1006 ||
		registryDocument.counts.occupations !== 1001 ||
		registryDocument.counts.residual !== 5
	) {
		throw new Error('SSOC 2024 registry count contract changed');
	}
	const registry = registryDocument.entries.filter(entry => entry.entry_kind === 'occupation');
	const iloMetadata = loadIloMetadata();
	const iloScores = loadIloScores();
	const headlineExposure = buildHeadlineExposure(
		registry.map(entry => ({
			code: entry.code,
			official_isco08_codes: entry.isco08.candidates.map(candidate => candidate.code)
		})),
		iloScores
	);
	const wages = loadWages();

	const occupations: V9Occupation[] = registry.map(entry => {
		const exposure = headlineExposure.get(entry.code) ?? null;
		const limitations = [
			'Exposure measures task overlap with current GenAI capabilities; it is not a job-loss probability or forecast.'
		];
		if (entry.isco08.candidates.length > 1) {
			limitations.push(
				'SSOC maps to multiple ISCO groups without official employment weights; the median and range are shown.'
			);
		}
		if (!exposure)
			limitations.push('No usable ILO 2025 score exists for the official ISCO mapping.');
		if (exposure && exposure.unscored_official_isco08_codes.length > 0) {
			limitations.push(
				'At least one official ISCO match has no ILO 2025 score; the point estimate uses only the scored official matches.'
			);
		}
		if (!wages.has(entry.code)) {
			limitations.push('MOM does not publish a 2025 detailed wage row for this occupation.');
		}
		return {
			schema_version: '9.0',
			taxonomy: {
				system: 'SSOC',
				edition: '2024',
				code: entry.code,
				title: entry.title,
				hierarchy: entry.hierarchy,
				detailed_definition: entry.detailed_definition,
				tasks: entry.tasks,
				search_synonyms: entry.search_synonyms
			},
			score_status: exposure ? 'scored' : 'insufficient_evidence',
			genai_task_exposure: exposure,
			comparison_evidence: {
				eloundou: null,
				aioe: null,
				observed_ai_use: null,
				potential_complementarity: null
			},
			singapore_market: {
				wages: wages.get(entry.code) ?? null,
				demand: null,
				labour_context: null,
				entry_level: null
			},
			evidence: {
				mapping_quality: entry.isco08.quality,
				support: exposure
					? 'official_crosswalk'
					: entry.isco08.candidates.length > 0
						? 'official_crosswalk_without_ilo_score'
						: 'unmatched',
				official_isco08_codes: entry.isco08.candidates.map(candidate => candidate.code),
				sources: [
					'Singapore Department of Statistics SSOC 2024',
					...(exposure ? ['ILO Generative AI and Jobs refined index (2025)'] : []),
					...(wages.has(entry.code)
						? ['Singapore Ministry of Manpower Occupational Wages 2025']
						: [])
				],
				limitations,
				data_as_of: '2026-08-19'
			}
		} satisfies V9Occupation;
	});

	const scored = occupations.filter(occupation => occupation.score_status === 'scored');
	const insufficient = occupations.filter(
		occupation => occupation.score_status === 'insufficient_evidence'
	);
	if (scored.length !== 987 || insufficient.length !== 14) {
		throw new Error(
			`expected 987 scored / 14 insufficient, found ${scored.length} / ${insufficient.length}`
		);
	}
	const wageCoverage = occupations.filter(occupation => occupation.singapore_market.wages).length;
	if (wageCoverage !== 523)
		throw new Error(`expected 523 matched wage rows, found ${wageCoverage}`);

	const wageMetadata = JSON.parse(fs.readFileSync(WAGE_METADATA_FILE, 'utf8'));
	fs.writeFileSync(
		OUTPUT_FILE,
		`${JSON.stringify(
			{
				schema_version: '9.0',
				release: 'SSOC 2024 AI Work Pressure V9',
				generated_at: '2026-08-19',
				method: {
					headline_construct:
						'AI Work Pressure Rank: relative GenAI task exposure, not an outcome probability',
					headline_owner: 'ILO 2025 mean_score_2025',
					multi_mapping:
						'Median of scored official ISCO-08 matches; all official candidates, scored values, ranges, SD_2025 and potential25 categories retained',
					source_score_scale:
						'ILO mean_score_2025 and task_score_sd_2025 are stored on a 0 to 1 scale; the UI may display the same values multiplied by 100 and labelled /100.',
					ranking: 'Midrank percentile among scored SSOC 2024 occupations, rounded to one decimal',
					official_categories: [...ILO_EXPOSURE_CATEGORIES],
					fallbacks: 'No occupation-group or demand fallback',
					sidecars:
						'Nullable independent evidence blocks; none can change the AI Work Pressure Rank',
					detailed_tasks:
						'Withheld at five-digit occupation grain. SSOC 2024 publishes task statements at four-digit unit-group grain, and V9 does not copy them down to detailed occupations.',
					external_comparison_audit: V9_EXTERNAL_COMPARISON_AUDIT
				},
				sources: {
					taxonomy:
						registryDocument.entries.length === 1006
							? { artifact: 'data/ssoc-2024-registry.json', ...registryDocument.source }
							: null,
					exposure: iloMetadata,
					wages: wageMetadata
				},
				counts: {
					occupations: occupations.length,
					scored: scored.length,
					insufficient_evidence: insufficient.length,
					direct_wages: wageCoverage
				},
				occupations
			},
			null,
			2
		)}\n`
	);
	console.log(
		`V9: ${occupations.length} occupations, ${scored.length} scored, ${insufficient.length} insufficient, ${wageCoverage} direct wages`
	);
}

if (import.meta.main) main();
