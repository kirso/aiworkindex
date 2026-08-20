import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { occupations } from '../src/lib/data';
import quarterlyReport from '../src/lib/data/quarterly-report.json';
import { likelyPathwayOrder } from '../src/lib/data/v8-display';

const root = path.resolve(import.meta.dirname, '..');

function routeSource(relativePath: string): string {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('archived V8 regression and current V9 route boundary', () => {
	test('the V8 field map is archived and cannot look like a current V9 artifact', () => {
		const currentLookingPaths = [
			'data/public-field-source-map.json',
			'src/lib/data/public-field-source-map.json',
			'static/data/public-field-source-map.json'
		];
		for (const relativePath of currentLookingPaths) {
			assert.equal(fs.existsSync(path.join(root, relativePath)), false, relativePath);
		}

		const archivePath = path.join(root, 'static/data/archive/v8/public-field-source-map.json');
		assert.equal(fs.existsSync(archivePath), true);
		const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8')) as {
			version: string;
			status: string;
			current: boolean;
			superseded_by: string;
		};
		assert.equal(archive.version, 'V8');
		assert.equal(archive.status, 'archived_superseded');
		assert.equal(archive.current, false);
		assert.equal(archive.superseded_by, '/data/sg-ai-occupations-v9.json');

		const manifest = JSON.parse(
			fs.readFileSync(path.join(root, 'static/data/release-manifest-v8.json'), 'utf8')
		) as { artifacts: Array<{ file: string; public_path?: string }> };
		const sourceMap = manifest.artifacts.find(artifact =>
			artifact.file.endsWith('public-field-source-map.json')
		);
		assert.equal(sourceMap?.file, 'archive/v8/public-field-source-map.json');
		assert.equal(sourceMap?.public_path, '/data/archive/v8/public-field-source-map.json');
	});

	test('archived V8 occupations retain five pathways and complete counts', () => {
		const counts = new Map(likelyPathwayOrder.map(pathway => [pathway, 0]));
		for (const occupation of occupations) {
			const pathway = occupation.v8.likely_pathway;
			assert.ok(counts.has(pathway), `${occupation.ssoc} has unknown pathway ${pathway}`);
			counts.set(pathway, (counts.get(pathway) ?? 0) + 1);
		}

		assert.equal(
			[...counts.values()].reduce((sum, count) => sum + count, 0),
			562
		);
		assert.deepEqual(Object.fromEntries(counts), {
			limited_direct_change: 222,
			workflow_redesign: 285,
			augmentation_led_growth: 14,
			demand_buffered_redesign: 10,
			hiring_or_substitution_pressure: 31
		});
	});

	test('archived V8 source percentile charts receive values in the 0 to 100 range', () => {
		for (const occupation of occupations) {
			for (const [source, value] of Object.entries(
				occupation.evidence.exposure_source_pctiles ?? {}
			)) {
				assert.ok(value >= 0 && value <= 1, `${occupation.ssoc} ${source} percentile is ${value}`);
			}
		}
	});

	test('the stored quarterly comparison is not represented as a comparable current pair', () => {
		const comparable =
			quarterlyReport.current_snapshot.includes('v8') &&
			Boolean(quarterlyReport.previous_snapshot?.includes('v8'));
		assert.equal(comparable, false);
		assert.match(
			routeSource('src/routes/rankings/quarterly-movers/+page.svelte'),
			/There is no comparable V9 quarterly movement ranking yet/
		);
	});

	test('current V9 overview surfaces do not restore retired V8 public labels', () => {
		const activeSources = [
			'src/routes/+page.svelte',
			'src/routes/about/+page.svelte',
			'src/routes/compare/+page.svelte',
			'src/routes/rankings/+page.svelte',
			'src/routes/will-ai-take-my-job/+page.svelte'
		].map(routeSource);
		const combined = activeSources.join('\n');

		assert.doesNotMatch(combined, />Impact Type</);
		assert.doesNotMatch(combined, /headline_risk\s*=/);
		assert.doesNotMatch(combined, /AI augments rather than replaces/);
	});

	test('the reports index identifies V9 as current and prior releases as archives', () => {
		const reports = routeSource('src/routes/reports/+page.svelte');
		assert.match(reports, /V9: Singapore AI Work Pressure/);
		assert.match(reports, /V8 Wage Exposure Analysis/);
		assert.match(reports, /V7 Release Note/);
		assert.match(reports, /Older reports remain accessible as dated/);
	});

	test('named-demand ranking uses reviewed occupation evidence rather than a synthetic demand axis', () => {
		const page = routeSource('src/routes/rankings/high-exposure-in-demand/+page.svelte');
		const server = routeSource('src/routes/rankings/high-exposure-in-demand/+page.server.ts');
		assert.match(server, /namedDemandRanking/);
		assert.match(page, /OccupationResultList/);
		assert.match(page, /selected MOM demand or shortage source/);
		assert.doesNotMatch(page, /DemandPressureMatrix/);
	});
});
