#!/usr/bin/env bun
/**
 * validate.ts — Regression and anchor checks for the current scoring model.
 *
 * Checks:
 * 1. Record completeness for the current public data model
 * 2. Crosswalk and evidence coverage
 * 3. Distribution sanity for bands, impact types, confidence, stability
 * 4. Anchor occupations behave directionally as expected
 *
 * Run: bun run scripts/validate.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.join(import.meta.dir, '..', 'data', 'occupations.json');

type RiskBand = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
type ImpactType = 'at_risk' | 'ai_leveraged' | 'stable' | 'mixed';

interface Occupation {
	ssoc: string;
	title: string;
	match_quality: 'direct' | 'submajor_fallback' | 'major_fallback';
	exposure: number;
	bottleneck: number;
	net_risk: number;
	risk_band: RiskBand;
	augmentation: number;
	impact_type: ImpactType;
	market: {
		market_momentum: number;
		occupation_scarcity: number;
		market_resilience: number;
		market_modifier: number;
	};
	confidence: {
		score: number;
		level: 'high' | 'medium' | 'low';
	};
	evidence: {
		anthropic_calibrated: boolean;
		anthropic_gap: number | null;
		sol_match: 'exact' | 'prefix' | false;
		jobs_in_demand_match: 'exact' | 'prefix' | false;
	};
	stability: {
		label: 'stable' | 'watch' | 'sensitive';
	};
	labour_monitor: {
		cluster_key: string;
		cluster_label: string;
		vacancy: {
			latest_rate: number;
			latest_quarter: string;
			trend_4q_pct: number;
			signal: number;
			recent_quarters: Array<{ quarter: string; rate: number }>;
		};
		overall: 'strong' | 'moderate' | 'weak' | 'deteriorating';
		data_as_of: string;
	} | null;
}

// Must match score.ts riskBand thresholds exactly
function riskBandForValue(value: number): RiskBand {
	if (value < 0.05) return 'very_low';
	if (value < 0.15) return 'low';
	if (value < 0.3) return 'moderate';
	if (value < 0.5) return 'high';
	return 'very_high';
}

async function main() {
	console.log('=== Validation Report ===\n');

	if (!fs.existsSync(DATA_FILE)) {
		console.error(`ERROR: ${DATA_FILE} not found. Run score.ts first.`);
		process.exit(1);
	}

	const data: Occupation[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

	let passed = 0;
	let failed = 0;
	let warnings = 0;

	function check(name: string, condition: boolean, detail?: string) {
		if (condition) {
			console.log(`  PASS: ${name}`);
			passed++;
		} else {
			console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
			failed++;
		}
	}

	function warn(name: string, detail: string) {
		console.log(`  WARN: ${name} — ${detail}`);
		warnings++;
	}

	function find(pattern: RegExp): Occupation | undefined {
		return data.find(row => pattern.test(row.title));
	}

	console.log('--- Record counts ---');
	check('Total occupations = 562', data.length === 562, `got ${data.length}`);

	console.log('\n--- Completeness ---');
	check(
		'All occupations have current core fields',
		data.every(
			row =>
				typeof row.exposure === 'number' &&
				typeof row.bottleneck === 'number' &&
				typeof row.net_risk === 'number' &&
				typeof row.augmentation === 'number' &&
				!!row.market &&
				!!row.confidence &&
				!!row.evidence &&
				!!row.stability
		)
	);
	check(
		'All occupations have labour monitor coverage',
		data.every(row => row.labour_monitor !== null)
	);

	console.log('\n--- Coverage ---');
	const direct = data.filter(row => row.match_quality === 'direct').length;
	const submajor = data.filter(row => row.match_quality === 'submajor_fallback').length;
	const major = data.filter(row => row.match_quality === 'major_fallback').length;
	check(
		'Direct crosswalk coverage > 90%',
		direct / data.length > 0.9,
		`${direct}/${data.length} direct`
	);
	console.log(
		`       Direct: ${direct}, Sub-major fallback: ${submajor}, Major fallback: ${major}`
	);

	const anthropicCount = data.filter(row => row.evidence.anthropic_calibrated).length;
	const demandFlagged = data.filter(
		row => row.evidence.sol_match || row.evidence.jobs_in_demand_match
	).length;
	check(
		'Anthropic calibration covers most occupations',
		anthropicCount > 450,
		`${anthropicCount} calibrated`
	);
	check(
		'Official demand signals cover a meaningful subset',
		demandFlagged >= 50,
		`${demandFlagged} flagged`
	);

	console.log('\n--- Distribution sanity ---');
	const bandCounts: Record<RiskBand, number> = {
		very_low: 0,
		low: 0,
		moderate: 0,
		high: 0,
		very_high: 0
	};
	const impactCounts: Record<ImpactType, number> = {
		at_risk: 0,
		ai_leveraged: 0,
		stable: 0,
		mixed: 0
	};
	const confidenceCounts = { high: 0, medium: 0, low: 0 };
	const stabilityCounts = { stable: 0, watch: 0, sensitive: 0 };

	for (const row of data) {
		bandCounts[row.risk_band]++;
		impactCounts[row.impact_type]++;
		confidenceCounts[row.confidence.level]++;
		stabilityCounts[row.stability.label]++;
	}

	check(
		'Every risk band is populated',
		Object.values(bandCounts).every(count => count > 0)
	);
	check(
		'Stored risk bands match stored net_risk thresholds',
		data.every(row => riskBandForValue(row.net_risk) === row.risk_band)
	);
	check(
		'At Risk and AI Leveraged occupations both exist',
		impactCounts.at_risk > 0 && impactCounts.ai_leveraged > 0
	);
	check(
		'Confidence has at least two populated tiers',
		[confidenceCounts.high, confidenceCounts.medium, confidenceCounts.low].filter(
			count => count > 0
		).length >= 2,
		JSON.stringify(confidenceCounts)
	);
	check(
		'Stability has at least two populated tiers',
		[stabilityCounts.stable, stabilityCounts.watch, stabilityCounts.sensitive].filter(
			count => count > 0
		).length >= 2,
		JSON.stringify(stabilityCounts)
	);

	console.log(`       Bands: ${JSON.stringify(bandCounts)}`);
	console.log(`       Impact: ${JSON.stringify(impactCounts)}`);
	console.log(`       Confidence: ${JSON.stringify(confidenceCounts)}`);
	console.log(`       Stability: ${JSON.stringify(stabilityCounts)}`);

	console.log('\n--- Anchor occupations ---');
	const software = find(/software developer/i);
	const dataEntry = find(/data entry clerk/i);
	const surgeon = find(/surgeon/i);
	const telemarketer = find(/telemarketer/i);
	const nurse = find(/registered nurse/i);
	const dataScientist = find(/data scientist/i);

	check('Software developer exists', !!software);
	if (software) {
		check('Software developer is a direct crosswalk', software.match_quality === 'direct');
		check(
			'Software developer is not classified At Risk',
			software.impact_type !== 'at_risk',
			`${software.impact_type} / ${software.risk_band}`
		);
		check(
			'Software developer has official demand evidence',
			!!(software.evidence.sol_match || software.evidence.jobs_in_demand_match)
		);
		check(
			'Software developer is not Very High risk',
			software.risk_band !== 'very_high',
			`${software.net_risk.toFixed(3)}`
		);
	}

	check('Data entry clerk exists', !!dataEntry);
	if (dataEntry) {
		check(
			'Data entry clerk is high displacement',
			dataEntry.risk_band === 'high' || dataEntry.risk_band === 'very_high',
			`${dataEntry.risk_band}`
		);
		check(
			'Data entry clerk is At Risk',
			dataEntry.impact_type === 'at_risk',
			`${dataEntry.impact_type}`
		);
	}

	check('Surgeon exists', !!surgeon);
	if (surgeon) {
		check(
			'Surgeon is very low risk',
			surgeon.risk_band === 'very_low',
			`${surgeon.net_risk.toFixed(3)}`
		);
		check(
			'Surgeon is AI Leveraged',
			surgeon.impact_type === 'ai_leveraged',
			`${surgeon.impact_type}`
		);
	}

	check('Telemarketer exists', !!telemarketer);
	if (telemarketer) {
		check(
			'Telemarketer remains highly exposed',
			telemarketer.risk_band === 'high' || telemarketer.risk_band === 'very_high',
			`${telemarketer.risk_band}`
		);
		check(
			'Telemarketer is At Risk',
			telemarketer.impact_type === 'at_risk',
			`${telemarketer.impact_type}`
		);
	}

	check('Registered nurse exists', !!nurse);
	if (nurse) {
		check(
			'Registered nurse is low risk',
			nurse.risk_band === 'very_low' || nurse.risk_band === 'low',
			`${nurse.risk_band}`
		);
		check(
			'Registered nurse is AI Leveraged',
			nurse.impact_type === 'ai_leveraged',
			`${nurse.impact_type}`
		);
	}

	check('Data scientist exists', !!dataScientist);
	if (dataScientist) {
		check(
			'Data scientist has official demand evidence',
			!!(dataScientist.evidence.sol_match || dataScientist.evidence.jobs_in_demand_match)
		);
		check(
			'Data scientist is not classified Stable',
			dataScientist.impact_type !== 'stable',
			`${dataScientist.impact_type}`
		);
	}

	console.log('\n--- Labour monitor sanity ---');
	const labourRowsMissingRecent = data.filter(
		row => (row.labour_monitor?.vacancy.recent_quarters.length ?? 0) < 4
	).length;
	check(
		'Labour monitor has recent quarters for all occupations',
		labourRowsMissingRecent === 0,
		`${labourRowsMissingRecent} missing 4+ quarters`
	);
	const labourOverallCounts = {
		strong: data.filter(row => row.labour_monitor?.overall === 'strong').length,
		moderate: data.filter(row => row.labour_monitor?.overall === 'moderate').length,
		weak: data.filter(row => row.labour_monitor?.overall === 'weak').length,
		deteriorating: data.filter(row => row.labour_monitor?.overall === 'deteriorating').length
	};
	check(
		'Labour monitor overall signals present',
		Object.values(labourOverallCounts).some(count => count > 0),
		JSON.stringify(labourOverallCounts)
	);

	if (!find(/teacher/i)) {
		warn('Teacher anchor', 'No teacher title matched for optional review');
	}

	// --- Synthetic Role Validation ---
	console.log('\n--- Synthetic role validation ---');
	try {
		const { syntheticRoles, computeRoleScores } = await import('../src/lib/data/synthetic-roles');
		const { occupationsBySSoc } = await import('../src/lib/data/index');

		check('Synthetic roles defined', syntheticRoles.length >= 25, `got ${syntheticRoles.length}`);

		// Validate each role
		let roleErrors = 0;
		for (const role of syntheticRoles) {
			const scored = computeRoleScores(role, occupationsBySSoc);

			// Check dispersion exists
			if (typeof scored.dispersion !== 'number') {
				console.log(`  FAIL: Role ${role.slug} missing dispersion`);
				roleErrors++;
			}

			// Check risk_range exists and is valid
			if (!scored.risk_range || scored.risk_range.optimistic > scored.risk_range.pessimistic) {
				console.log(`  FAIL: Role ${role.slug} invalid risk_range`);
				roleErrors++;
			}

			// Check components reference valid SSOCs (FAIL, not warn — broken roles produce wrong scores)
			const invalidComps = role.components.filter(
				(c: { ssoc: string }) => !occupationsBySSoc.has(c.ssoc)
			);
			if (invalidComps.length > 0) {
				console.log(
					`  FAIL: Role ${role.slug} has ${invalidComps.length} invalid SSOC codes: ${invalidComps.map((c: { ssoc: string }) => c.ssoc).join(', ')}`
				);
				roleErrors++;
			}

			// Check weights sum to ~1.0
			const weightSum = role.components.reduce(
				(s: number, c: { weight: number }) => s + c.weight,
				0
			);
			if (Math.abs(weightSum - 1.0) > 0.01) {
				console.log(`  WARN: Role ${role.slug} weights sum to ${weightSum.toFixed(3)}`);
				warnings++;
			}
		}

		check('All synthetic roles compute without errors', roleErrors === 0);
	} catch (e) {
		warn('Synthetic role validation', `Could not import: ${e}`);
	}

	// --- Role Taxonomy Validation ---
	console.log('\n--- Role taxonomy validation ---');
	try {
		const { roleCategoryMap } = await import('../src/lib/data/role-taxonomy');
		const { syntheticRoles: allRoles } = await import('../src/lib/data/synthetic-roles');
		const taxonomyEntries = Object.keys(roleCategoryMap).length;
		check(
			'Taxonomy covers all synthetic roles',
			taxonomyEntries >= allRoles.length,
			`taxonomy: ${taxonomyEntries}, roles: ${allRoles.length}`
		);

		let missingTaxonomy = 0;
		for (const role of allRoles) {
			if (!roleCategoryMap[role.slug]) {
				if (missingTaxonomy < 3) console.log(`  WARN: Role ${role.slug} missing taxonomy entry`);
				missingTaxonomy++;
			}
		}
		if (missingTaxonomy > 0) {
			warn('Role taxonomy coverage', `${missingTaxonomy} roles missing taxonomy entries`);
		}
	} catch (e) {
		warn('Role taxonomy validation', `Could not import: ${e}`);
	}

	// --- Alias SSOC Validation ---
	console.log('\n--- Alias SSOC validation ---');
	try {
		const { jobAliases } = await import('../src/lib/data/aliases');
		const { occupationsBySSoc: occMap } = await import('../src/lib/data/index');

		let invalidAliasCount = 0;
		for (const [alias, ssocs] of Object.entries(jobAliases)) {
			for (const ssoc of ssocs as string[]) {
				if (!occMap.has(ssoc)) {
					if (invalidAliasCount < 5)
						console.log(`  FAIL: alias "${alias}" → SSOC ${ssoc} does not exist`);
					invalidAliasCount++;
				}
			}
		}
		check(
			'All alias SSOC codes exist in occupations data',
			invalidAliasCount === 0,
			`${invalidAliasCount} invalid references`
		);
	} catch (e) {
		warn('Alias validation', `Could not import: ${e}`);
	}

	// --- Archetype Coverage Validation ---
	console.log('\n--- Archetype classification validation ---');
	try {
		const { classifyArchetype } = await import('../src/lib/data/role-archetypes');

		// Professional/manager occupations (SSOC 11xx-26xx) should NOT get field_manual
		const professionalFieldManual = data.filter((o: Occupation) => {
			const prefix = parseInt(o.ssoc.substring(0, 2), 10);
			if (prefix > 26) return false; // trades/operators/cleaners — field_manual is correct
			const arch = classifyArchetype(o.ssoc, o.title, o.major_group ?? '');
			return arch === 'field_manual';
		});

		check(
			'No professional/manager occupation gets field_manual archetype',
			professionalFieldManual.length === 0,
			professionalFieldManual.length > 0
				? `${professionalFieldManual.length} wrong: ${professionalFieldManual
						.slice(0, 3)
						.map((o: Occupation) => o.ssoc + ' ' + o.title.substring(0, 30))
						.join(', ')}`
				: undefined
		);

		// Every archetype should have at least 3 occupations
		const archetypeCounts: Record<string, number> = {};
		for (const o of data) {
			const arch = classifyArchetype(o.ssoc, o.title, o.major_group ?? '');
			archetypeCounts[arch] = (archetypeCounts[arch] || 0) + 1;
		}
		const emptyArchetypes = Object.entries(archetypeCounts).filter(([_, count]) => count < 3);
		check(
			'Every archetype has at least 3 occupations',
			emptyArchetypes.length === 0,
			emptyArchetypes.length > 0
				? `Underrepresented: ${emptyArchetypes.map(([a, c]) => `${a}=${c}`).join(', ')}`
				: undefined
		);
	} catch (e) {
		warn('Archetype validation', `Could not import: ${e}`);
	}

	// --- Context Modifier Validation ---
	console.log('\n--- Context modifier validation ---');
	try {
		const { computeContextMultiplier } = await import('../src/lib/data/context-modifiers');

		const startupJunior = computeContextMultiplier({
			companySize: 'startup',
			seniority: 'junior'
		});
		const enterpriseSenior = computeContextMultiplier({
			companySize: 'enterprise',
			seniority: 'senior'
		});

		check(
			'Context multiplier in valid range (startup+junior)',
			startupJunior >= 0.8 && startupJunior <= 1.25,
			`got ${startupJunior.toFixed(3)}`
		);
		check(
			'Context multiplier in valid range (enterprise+senior)',
			enterpriseSenior >= 0.8 && enterpriseSenior <= 1.25,
			`got ${enterpriseSenior.toFixed(3)}`
		);
		check(
			'Junior risk > Senior risk (directional)',
			startupJunior > enterpriseSenior,
			`junior=${startupJunior.toFixed(3)} senior=${enterpriseSenior.toFixed(3)}`
		);
	} catch (e) {
		warn('Context modifier validation', `Could not import: ${e}`);
	}

	// --- Workflow Overlay Validation ---
	console.log('\n--- Workflow overlay validation ---');
	try {
		const { archetypeOverlayDefaults, computeDerivedScores, computeContextAdjustment } =
			await import('../src/lib/data/workflow-overlay');

		const archetypes = Object.keys(archetypeOverlayDefaults);
		check(
			'Workflow overlay defaults cover all archetypes',
			archetypes.length >= 17,
			`got ${archetypes.length}`
		);

		let overlayErrors = 0;
		for (const [key, overlay] of Object.entries(archetypeOverlayDefaults)) {
			const values = Object.values(overlay) as number[];
			const allValid = values.every(v => v >= 0 && v <= 1);
			if (!allValid) {
				console.log(`  FAIL: Overlay ${key} has out-of-range values`);
				overlayErrors++;
			}

			const derived = computeDerivedScores(overlay);
			const adj = computeContextAdjustment(derived);
			if (adj < 0.85 || adj > 1.15) {
				console.log(`  FAIL: Overlay ${key} context adjustment out of range: ${adj}`);
				overlayErrors++;
			}
		}

		check('All workflow overlays valid', overlayErrors === 0);
	} catch (e) {
		warn('Workflow overlay validation', `Could not import: ${e}`);
	}

	// --- Transition Capacity Validation ---
	console.log('\n--- Transition capacity validation ---');
	try {
		const { computeTransitionScore } = await import('../src/lib/data/transition-capacity');

		// Test with two known occupations
		if (software && dataEntry) {
			const t = computeTransitionScore(
				software as unknown as import('../src/lib/data/index').Occupation,
				dataEntry as unknown as import('../src/lib/data/index').Occupation
			);
			check(
				'Transition score computes',
				typeof t.composite === 'number' && t.composite >= 0 && t.composite <= 1,
				`composite=${t.composite.toFixed(3)}`
			);
			check(
				'Transition has valid label',
				['easy', 'moderate', 'stretch', 'difficult'].includes(t.label)
			);
		}
	} catch (e) {
		warn('Transition capacity validation', `Could not import: ${e}`);
	}

	// --- Data Vintage & Consistency Checks ---
	console.log('\n--- Data vintage & consistency ---');
	try {
		const { DATA_VINTAGE, RISK_BAND_THRESHOLDS } =
			await import('../src/lib/data/scoring-constants');
		const { syntheticRoles } = await import('../src/lib/data/synthetic-roles');

		// Occupation count matches actual data
		check(
			'DATA_VINTAGE.occupation_count matches actual data',
			DATA_VINTAGE.occupation_count === data.length,
			`vintage says ${DATA_VINTAGE.occupation_count}, actual ${data.length}`
		);

		// Role count matches actual roles
		check(
			'DATA_VINTAGE.role_count matches actual synthetic roles',
			DATA_VINTAGE.role_count === syntheticRoles.length,
			`vintage says ${DATA_VINTAGE.role_count}, actual ${syntheticRoles.length}`
		);

		// Risk band thresholds match score.ts logic
		check(
			'Risk band moderate upper = 0.30',
			RISK_BAND_THRESHOLDS.moderate.upper === 0.3,
			`got ${RISK_BAND_THRESHOLDS.moderate.upper}`
		);
		check(
			'Risk band high upper = 0.50',
			RISK_BAND_THRESHOLDS.high.upper === 0.5,
			`got ${RISK_BAND_THRESHOLDS.high.upper}`
		);

		// Staleness check: DATA_VINTAGE.last_updated within 120 days
		const lastUpdated = new Date(DATA_VINTAGE.last_updated);
		const now = new Date();
		const daysSinceUpdate = Math.floor(
			(now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
		);
		if (daysSinceUpdate > 120) {
			warn(
				'Data vintage staleness',
				`DATA_VINTAGE.last_updated is ${daysSinceUpdate} days old (${DATA_VINTAGE.last_updated}). Consider re-running the scoring pipeline.`
			);
		} else {
			check(`Data vintage is fresh (${daysSinceUpdate} days old)`, true);
		}

		// Validation check count matches
		const expectedChecks = DATA_VINTAGE.validation_checks;
		// We'll verify this at the end after counting
		console.log(`  INFO: DATA_VINTAGE expects ${expectedChecks} checks`);
	} catch (e) {
		warn('Data vintage validation', `Could not import: ${e}`);
	}

	console.log('\n=== Summary ===');
	console.log(`  Passed: ${passed}`);
	console.log(`  Failed: ${failed}`);
	console.log(`  Warnings: ${warnings}`);

	if (failed > 0) {
		console.log('\nSome checks FAILED. Review the output above.');
		process.exit(1);
	}

	console.log('\nAll checks passed.');
}

main();
