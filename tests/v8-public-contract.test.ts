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

describe('V8 public display contract', () => {
	test('all occupations use one of the five public pathways and counts are complete', () => {
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

	test('source percentile charts can only receive values in the 0 to 100 range', () => {
		for (const occupation of occupations) {
			for (const [source, value] of Object.entries(
				occupation.evidence.exposure_source_pctiles ?? {}
			)) {
				assert.ok(value >= 0 && value <= 1, `${occupation.ssoc} ${source} percentile is ${value}`);
			}
		}
	});

	test('the stored quarterly comparison is not represented as a comparable V8 pair', () => {
		const comparable =
			quarterlyReport.current_snapshot.includes('v8') &&
			Boolean(quarterlyReport.previous_snapshot?.includes('v8'));
		assert.equal(comparable, false);
		assert.match(
			routeSource('src/routes/rankings/quarterly-movers/+page.svelte'),
			/Comparable V8 movement is not available yet/
		);
	});

	test('active V8 overview surfaces do not restore retired public labels', () => {
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

	test('the reports index identifies V8 as current and V7 as archived', () => {
		const reports = routeSource('src/routes/reports/+page.svelte');
		assert.match(reports, /V8 Methodology and Public Contract/);
		assert.match(reports, /V7 Release Note/);
		assert.match(reports, /Archived documentation for the former V7/);
	});

	test('high-exposure in-demand chart uses occupation-level evidence rather than a synthetic demand axis', () => {
		const selected = occupations.filter(
			occupation =>
				occupation.v8.ai_exposure_rank.points >= 60 &&
				occupation.v8.market_context.demand === 'strong'
		);
		const sol = selected.filter(occupation => occupation.evidence.sol_match !== false);
		const jid = selected.filter(
			occupation => occupation.evidence.jobs_in_demand_match !== false
		);
		const both = selected.filter(
			occupation =>
				occupation.evidence.sol_match !== false &&
				occupation.evidence.jobs_in_demand_match !== false
		);

		assert.equal(selected.length, 15);
		assert.equal(sol.length, 13);
		assert.equal(jid.length, 5);
		assert.equal(both.length, 3);
		assert.ok(
			selected.every(
				occupation =>
					occupation.evidence.sol_match === 'exact' ||
					occupation.evidence.jobs_in_demand_match === 'exact'
			)
		);

		const page = routeSource('src/routes/rankings/high-exposure-in-demand/+page.svelte');
		assert.match(page, /HighDemandExposurePlot/);
		assert.doesNotMatch(page, /DemandPressureMatrix/);
	});
});
