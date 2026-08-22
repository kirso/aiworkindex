import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { describe, test } from 'node:test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import roleRelease from '../data/synthetic-roles-v9.json';
import { buildV9PublicRelease } from '../scripts/v9-public-export';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = path.join(root, 'static');

function collectKeys(value: unknown, result = new Set<string>()): Set<string> {
	if (Array.isArray(value)) {
		for (const item of value) collectKeys(item, result);
		return result;
	}
	if (!value || typeof value !== 'object') return result;
	for (const [key, child] of Object.entries(value)) {
		result.add(key);
		collectKeys(child, result);
	}
	return result;
}

describe('V9 release and discovery pipeline', () => {
	test('builds the current public contract from V9 and joins reviewed market references', () => {
		const release = buildV9PublicRelease();
		assert.equal(release.public_contract.current, true);
		assert.equal(release.public_contract.taxonomy, 'SSOC 2024');
		assert.deepEqual(release.counts, {
			occupations: 1001,
			scored: 987,
			insufficient_evidence: 14,
			direct_wages: 523
		});
		assert.equal(release.occupations.length, 1001);
		assert.equal(
			release.occupations
				.find(occupation => occupation.taxonomy.code === '25143')
				?.market_evidence.demand_signals.some(signal => signal.source_occupation === 'AI engineer'),
			true
		);
		assert.equal(
			release.occupations.every(
				occupation =>
					occupation.market_evidence.labour_context_ref === null ||
					(occupation.market_evidence.labour_context_ref.grain ===
						'published_broad_occupation_group' &&
						typeof occupation.market_evidence.labour_context_ref.cluster_key === 'string')
			),
			true
		);

		const keys = collectKeys(release);
		for (const retired of [
			'net_risk',
			'risk_band',
			'ai_exposure_rank',
			'jobs_affected',
			'wage_pool',
			'substitution_score',
			'augmentation_score',
			'likely_pathway',
			'employment_estimate'
		]) {
			assert.equal(keys.has(retired), false, retired);
		}
	});

	test('publishes one canonical sitemap URL for every occupation and non-duplicate title guide', () => {
		const release = buildV9PublicRelease();
		const sitemap = fs.readFileSync(path.join(staticDir, 'sitemap.xml'), 'utf8');
		const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]!);
		const set = new Set(urls);
		assert.equal(urls.length, set.size);
		for (const occupation of release.occupations) {
			assert(set.has(`https://aiworkindex.com/occupation/${occupation.taxonomy.code}`));
		}
		for (const role of roleRelease.roles) {
			assert.equal(
				set.has(`https://aiworkindex.com/role/${role.slug}`),
				role.resolution_basis !== 'normalized_exact_title'
			);
		}
		assert.equal(
			urls.some(url => url.includes('?')),
			false
		);
		assert.equal(set.has('https://aiworkindex.com/reports/v7-release'), false);
		assert.equal(set.has('https://aiworkindex.com/reports/labour-observatory'), true);
		assert.equal(set.has('https://aiworkindex.com/reports/ai-capabilities'), true);
		assert.equal(set.has('https://aiworkindex.com/reports/research-signals'), true);
		assert.equal(set.has('https://aiworkindex.com/reports/skills-pilot'), true);
		assert.equal(set.has('https://aiworkindex.com/reports/evidence-patterns'), true);
		assert.equal(set.has('https://aiworkindex.com/rankings/quarterly-movers'), false);
		assert.equal(set.has('https://aiworkindex.com/rankings/best-transitions'), false);
	});

	test('makes V9 the machine-readable current release while retaining V8 history', () => {
		const dataDir = path.join(staticDir, 'data');
		const manifest = JSON.parse(
			fs.readFileSync(path.join(dataDir, 'release-manifest-v9.json'), 'utf8')
		) as {
			version: string;
			generated_at: string;
			artifacts: Array<{ file: string; generated_at: string }>;
		};
		const research = JSON.parse(
			fs.readFileSync(path.join(dataDir, 'research-library.json'), 'utf8')
		) as { generated_at: string; review_cutoff: string };
		const csvHeader = fs
			.readFileSync(path.join(dataDir, 'sg-ai-occupations-v9.csv'), 'utf8')
			.split('\n')[0];
		const llms = fs.readFileSync(path.join(staticDir, 'llms.txt'), 'utf8');
		assert.equal(manifest.version, 'V9');
		assert(manifest.artifacts.some(artifact => artifact.file === 'sg-ai-occupations-v9.json'));
		assert(manifest.artifacts.some(artifact => artifact.file === 'v9-economic-observatory.json'));
		assert(manifest.artifacts.some(artifact => artifact.file === 'v9-capability-profiles.json'));
		assert(manifest.artifacts.some(artifact => artifact.file === 'v9-research-signals.json'));
		assert(manifest.artifacts.some(artifact => artifact.file === 'v9-skills-pilot.json'));
		assert(manifest.artifacts.some(artifact => artifact.file === 'v9-evidence-vector.json'));
		assert(manifest.artifacts.some(artifact => artifact.file === 'v9-signal-change.json'));
		assert.equal(
			manifest.artifacts.every(artifact => artifact.generated_at === manifest.generated_at),
			true
		);
		assert.equal(research.generated_at, research.review_cutoff);
		assert(csvHeader?.includes('ai_work_pressure_percentile'));
		assert.equal(csvHeader?.includes('likely_pathway'), false);
		assert(llms.includes('Current public release: V9'));
		assert(fs.existsSync(path.join(dataDir, 'sg-ai-occupations-v8.json')));
	});

	test('redirects only literal official-title duplicates', () => {
		const redirects = fs.readFileSync(path.join(staticDir, '_redirects'), 'utf8');
		assert.match(redirects, /^\/calculator \/will-ai-take-my-job 308$/m);
		for (const role of roleRelease.roles.filter(
			role => role.resolution_basis === 'normalized_exact_title'
		)) {
			assert.ok(role.official_occupation);
			assert.match(
				redirects,
				new RegExp(`^/role/${role.slug} /occupation/${role.official_occupation.ssoc2024} 308$`, 'm')
			);
		}
		for (const role of roleRelease.roles.filter(
			role =>
				role.official_status === 'official_occupation_match' &&
				role.resolution_basis !== 'normalized_exact_title'
		)) {
			assert.doesNotMatch(redirects, new RegExp(`^/role/${role.slug} `, 'm'));
		}
	});

	test('makes every familiar title discoverable with one coherent destination', () => {
		const search = JSON.parse(
			fs.readFileSync(path.join(staticDir, 'data', 'v9-search-index.json'), 'utf8')
		) as {
			role_queries: Array<{
				slug: string;
				journey_kind: string;
				official_ssoc2024: string | null;
				href: string;
				pressure_rank: number | null;
				pressure_kind: string;
				family_key: string;
			}>;
			role_query_counts: Record<string, number>;
		};
		assert.equal(search.role_queries.length, 88);
		assert.deepEqual(search.role_query_counts, {
			all: 88,
			exact_official_titles: 11,
			reviewed_official_matches: 56,
			composite_estimates: 18,
			mapping_withheld: 3
		});
		assert.equal(new Set(search.role_queries.map(role => role.slug)).size, 88);
		for (const query of search.role_queries) {
			const source = roleRelease.roles.find(role => role.slug === query.slug);
			assert(source, query.slug);
			assert(query.family_key.length > 0);
			if (source.resolution_basis === 'normalized_exact_title') {
				assert.equal(query.href, `/occupation/${source.official_occupation?.ssoc2024}`);
				assert.equal(query.journey_kind, 'exact_official_title');
			} else {
				assert.equal(query.href, `/role/${source.slug}`);
			}
			if (source.official_occupation) {
				assert.equal(query.pressure_rank, source.official_occupation.pressure_rank);
				assert.equal(query.pressure_kind, 'official');
			}
		}
	});

	test('resolves reviewed modern-title aliases to canonical official UI entities', () => {
		const index = JSON.parse(
			fs.readFileSync(path.join(staticDir, 'data', 'v9-ui-index.json'), 'utf8')
		) as {
			query_aliases: Record<string, string>;
			checker_entries: Array<{ id: string; searchText: string; queryAliases: string[] }>;
			compare_entities: Array<{ id: string; searchText: string; queryAliases: string[] }>;
		};

		assert.equal(
			Object.keys(index.query_aliases).length,
			roleRelease.counts.official_query_matches
		);
		assert.equal(index.query_aliases['role:ai-engineer'], 'occupation:25143');
		assert.equal(
			index.checker_entries.some(entry => entry.id === 'role:ai-engineer'),
			false
		);
		const canonical = index.checker_entries.find(entry => entry.id === 'occupation:25143');
		assert(canonical);
		assert(canonical.searchText.includes('ai engineer'));
		assert(canonical.queryAliases.includes('AI Engineer'));
		assert.equal(index.compare_entities.length, index.checker_entries.length);
	});
});
