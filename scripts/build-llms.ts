#!/usr/bin/env bun

import * as fs from 'node:fs';
import * as path from 'node:path';

import { SITE } from '../src/lib/data/scoring-constants';
import { getRoleFamilyPresentation } from '../src/lib/data/role-presentation';
import { syntheticRolesV9, syntheticRoleV9Counts } from '../src/lib/data/synthetic-roles-v9';
import type { V9PublicOccupation } from './v9-public-export';
import { buildV9PublicRelease, ROOT } from './v9-public-export';

const STATIC_DIR = path.join(ROOT, 'static');
const release = buildV9PublicRelease();
const economicObservatory = JSON.parse(
	fs.readFileSync(path.join(ROOT, 'data', 'v9-economic-observatory.json'), 'utf8')
) as {
	coverage: {
		broad_employment_context: number;
		detailed_ai_adoption: number;
		detailed_output_or_price_elasticity: number;
		detailed_new_task_creation: number;
		causal_ai_labour_outcomes: number;
		classified_economic_scenarios: number;
	};
};
const capabilityProfiles = JSON.parse(
	fs.readFileSync(path.join(ROOT, 'data', 'v9-capability-profiles.json'), 'utf8')
) as {
	coverage: {
		ssoc_occupations: number;
		raw_exact_candidate_coverage: number;
		available_reviewed_identity_profiles: number;
		unavailable_without_published_profile: number;
	};
};
const researchSignals = JSON.parse(
	fs.readFileSync(path.join(ROOT, 'data', 'v9-research-signals.json'), 'utf8')
) as {
	coverage: {
		eloundou_theoretical_exposure_available: number;
		anthropic_observed_exposure_available: number;
	};
};
const skillsPilot = JSON.parse(
	fs.readFileSync(path.join(ROOT, 'data', 'v9-skills-pilot.json'), 'utf8')
) as {
	coverage: {
		sectors: number;
		unique_occupations: number;
		sector_role_profiles: number;
	};
};
const evidenceVector = JSON.parse(
	fs.readFileSync(path.join(ROOT, 'data', 'v9-evidence-vector.json'), 'utf8')
) as {
	snapshot_id: string;
	coverage: {
		shared_pressure_capability_subset: number;
		dimensions: Record<string, number>;
		pattern_counts: Record<string, number>;
	};
};
const signalChange = JSON.parse(
	fs.readFileSync(path.join(ROOT, 'data', 'v9-signal-change.json'), 'utf8')
) as {
	pressure_change: { status: string; previous_comparable_snapshot: null; reason: string };
	observed_changes: unknown[];
};
const scored = release.occupations
	.filter(
		(
			occupation
		): occupation is V9PublicOccupation & {
			genai_task_exposure: NonNullable<V9PublicOccupation['genai_task_exposure']>;
		} => occupation.genai_task_exposure !== null
	)
	.sort(
		(a, b) =>
			b.genai_task_exposure.pressure_rank.percentile -
				a.genai_task_exposure.pressure_rank.percentile ||
			a.taxonomy.code.localeCompare(b.taxonomy.code)
	);
const unscored = release.occupations.filter(occupation => occupation.genai_task_exposure === null);
const officialRoleMatches = syntheticRolesV9.filter(
	role => role.official_status === 'official_occupation_match'
);
const exactOfficialTitles = officialRoleMatches.filter(
	role => role.resolution_basis === 'normalized_exact_title'
);
const familiarTitleGuides = officialRoleMatches.filter(
	role => role.resolution_basis !== 'normalized_exact_title'
);
const nonOfficialRoles = syntheticRolesV9.filter(
	role => role.official_status === 'non_official_role_query'
);

const interpretation = `The AI Work Pressure Rank is a midrank percentile across ${release.counts.scored} scored SSOC 2024 occupations. A rank of 72 places an occupation at the 72nd midrank percentile for ILO 2025 mean task exposure in that comparison population. Tied exposure values share the same position. The rank is not a 72% probability of job loss, a forecast of employment decline, or the share of tasks that will be automated.`;

const llms = `# AI Work Index

> Evidence on AI work pressure and job risk across Singapore's SSOC 2024 occupations. Current public release: V9, dated ${release.generated_at}.

AI Work Index covers ${release.counts.occupations} official numeric SSOC 2024 occupations. ${release.counts.scored} have an AI Work Pressure Rank, ${release.counts.insufficient_evidence} are explicitly unranked, and ${release.counts.direct_wages} have a direct MOM 2025 wage observation.

The modern-title lookup covers ${syntheticRoleV9Counts.roles} familiar titles: ${syntheticRoleV9Counts.exact_title_matches} exact official titles, ${syntheticRoleV9Counts.reviewed_alias_matches} reviewed familiar-title guides that reuse an official score unchanged, ${syntheticRoleV9Counts.composite_roles} disclosed cross-occupation estimates, and ${syntheticRoleV9Counts.mapping_withheld} titles that need more work context before comparison.

## What the headline means

${interpretation}

The headline uses only ILO 2025 mean_score_2025 values connected through the official SSOC 2024 to ISCO-08 correspondence. Multiple official matches use the median; the minimum, maximum, task-score dispersion, official ILO categories, and unmatched candidates remain visible. There is no occupation-group fallback.

Wages, named demand evidence, external comparisons, adoption, and labour-market conditions are separate evidence. They do not change the pressure rank. The current release publishes direct wages and reviewed named demand where available. A separate identity-gated artifact publishes Eloundou theoretical exposure for ${researchSignals.coverage.eloundou_theoretical_exposure_available} occupations and Anthropic observed use for ${researchSignals.coverage.anthropic_observed_exposure_available}; the four fields in the headline artifact remain null. AIOE, complementarity and broader transfers remain unavailable. Missing evidence is not zero.

The Singapore AI labour observatory follows six separate channels between task pressure and jobs: displacement; productivity and demand expansion; new work; human responsibility and complementarity; employer adoption and organisation; and worker adjustment. It publishes broad official observations at their source grain. It does not assign occupation-level job outcomes or a Jevons-style rebound effect without adoption, price, output and causal labour evidence.

The separate OECD 2026 capability layer publishes nine-domain profiles for ${capabilityProfiles.coverage.available_reviewed_identity_profiles} occupations. Most pass a conservative title rule; a small published allow-list records additional title-and-definition reviews. The other ${capabilityProfiles.coverage.unavailable_without_published_profile} occupations stay unavailable; they are not scored lower. Capability profiles do not change the pressure rank.

The official Skills Framework pilot publishes selected skill names for ${skillsPilot.coverage.unique_occupations} occupations across ${skillsPilot.coverage.sectors} sectors and ${skillsPilot.coverage.sector_role_profiles} reviewed sector-role profiles. It supports practical gap checks and training discovery. It does not infer a person's skills, recommend a transition or change the pressure rank.

The multi-signal evidence vector aligns pressure, OECD capability proximity, Eloundou theoretical scope, Anthropic observed use, direct pay, named demand, broad labour context and official skills by SSOC 2024 code. It does not average them into a score. Pressure and capability are compared only across the ${evidenceVector.coverage.shared_pressure_capability_subset} occupations that have both measures. The ${evidenceVector.snapshot_id} release is the first comparable V9 baseline, so pressure movers remain unavailable. The separate change ledger reports ${signalChange.observed_changes.length} compatible public labour changes at their own source grain.

## Primary pages and data

- Methodology: ${SITE.url}/methodology
- Research: ${SITE.url}/research
- Data and licences: ${SITE.url}/data
- Occupation explorer: ${SITE.url}/explore
- Familiar job-title lookup: ${SITE.url}/roles
- Rankings: ${SITE.url}/rankings
- Job pressure calculator: ${SITE.url}/will-ai-take-my-job
- Comparison tool: ${SITE.url}/compare
- Current JSON: ${SITE.url}/data/sg-ai-occupations-v9.json
- Current CSV: ${SITE.url}/data/sg-ai-occupations-v9.csv
- Singapore market context: ${SITE.url}/data/v9-market-context.json
- Singapore AI labour observatory: ${SITE.url}/reports/labour-observatory
- Labour observatory data: ${SITE.url}/data/v9-economic-observatory.json
- AI capability report: ${SITE.url}/reports/ai-capabilities
- AI capability profile data: ${SITE.url}/data/v9-capability-profiles.json
- Theoretical scope vs observed use: ${SITE.url}/reports/research-signals
- Research signal data: ${SITE.url}/data/v9-research-signals.json
- Official skills pilot: ${SITE.url}/reports/skills-pilot
- Official skills pilot data: ${SITE.url}/data/v9-skills-pilot.json
- Evidence pattern report: ${SITE.url}/reports/evidence-patterns
- Multi-signal evidence vector: ${SITE.url}/data/v9-evidence-vector.json
- Signal-specific change ledger: ${SITE.url}/data/v9-signal-change.json
- Mapped ILO task evidence: ${SITE.url}/data/ilo-isco-task-evidence-v9.json
- Full machine-readable guide: ${SITE.url}/llms-full.txt
- Source repository: ${SITE.github}
`;

function exposureCategory(occupation: (typeof scored)[number]): string {
	const category = occupation.genai_task_exposure.potential25;
	return category.least_exposed === category.most_exposed
		? category.least_exposed
		: `${category.least_exposed} to ${category.most_exposed}`;
}

function scoreRange(occupation: (typeof scored)[number]): string {
	const score = occupation.genai_task_exposure.mean_score_2025;
	return score.min === score.max
		? score.median.toFixed(2)
		: `${score.median.toFixed(2)} (${score.min.toFixed(2)} to ${score.max.toFixed(2)})`;
}

function wage(occupation: V9PublicOccupation): string {
	const value = occupation.singapore_market.wages?.value.gross_monthly_sgd.median;
	return typeof value === 'number' ? `SGD ${value.toLocaleString('en-SG')}` : 'Not available';
}

function occupationRow(occupation: (typeof scored)[number]): string {
	return `| [${occupation.taxonomy.title}](${SITE.url}/occupation/${occupation.taxonomy.code}) | ${occupation.taxonomy.code} | ${occupation.genai_task_exposure.pressure_rank.percentile.toFixed(1)} | ${exposureCategory(occupation)} | ${scoreRange(occupation)} | ${wage(occupation)} |`;
}

const llmsFull = `# AI Work Index V9 full reference

## Direct answer

AI Work Index measures relative generative-AI task pressure. It does not estimate the probability that a person will lose a job. Risk depends on capability, actual use, human responsibility, adoption, demand, regulation, and organisational choices. V9 keeps those constructs separate.

${interpretation}

## Release coverage

- Taxonomy: Singapore Standard Occupational Classification 2024
- Official numeric occupations: ${release.counts.occupations}
- Ranked occupations: ${release.counts.scored}
- Unranked because evidence is insufficient: ${release.counts.insufficient_evidence}
- Direct MOM 2025 wage rows: ${release.counts.direct_wages}
- Modern role queries: ${syntheticRoleV9Counts.roles}; ${syntheticRoleV9Counts.official_query_matches} resolve to official occupations (${syntheticRoleV9Counts.exact_title_matches} exact titles and ${syntheticRoleV9Counts.reviewed_alias_matches} reviewed aliases), ${syntheticRoleV9Counts.composite_roles} use disclosed composites, and ${syntheticRoleV9Counts.mapping_withheld} are withheld because a fixed mapping would create false precision
- Release date: ${release.generated_at}

## Headline method

1. Start with ILO 2025 mean_score_2025 at ISCO-08 unit-group grain.
2. Connect SSOC 2024 occupations through the official Singapore correspondence.
3. When an SSOC occupation has several scored official matches, use their median. Do not infer employment weights.
4. Rank the resulting medians with midrank percentiles across the ${release.counts.scored} scored SSOC occupations.
5. Publish the underlying minimum and maximum, SD_2025 range, ILO potential25 category range, mapping quality, and any unscored official match.

ILO potential25 categories are: Not Exposed; Minimal Exposure; Exposed: Gradient 1; Exposed: Gradient 2; Exposed: Gradient 3; Exposed: Gradient 4. These are the source's categories, not custom percentile bands.

## Separate evidence

- The attributed ILO task artifact retains all 3,265 task rows across 427 four-digit ISCO-08 groups. Occupation pages show bounded examples only through official SSOC-to-ISCO mappings. They are mapped examples, not exact five-digit SSOC duties, and they never change the headline rank.
- The OECD capability artifact publishes nine capability domains for ${capabilityProfiles.coverage.available_reviewed_identity_profiles} occupations. Raw crosswalk candidates are only candidate generation; publication also requires the conservative title rule or an explicit reviewed title-and-definition decision. Missing profiles stay unavailable and do not change the ILO headline.
- MOM wages are direct observations for full-time resident employees in establishments with at least 25 employees. Missing rows stay null.
- MOM named-demand signals are reviewed against SSOC 2024 titles and synonyms. Absence from a named list does not mean weak demand.
- Q1 2026 labour evidence is broad occupation-group context. Q2 2026 figures are preliminary national context.
- The labour observatory supplies broad employment context to ${economicObservatory.coverage.broad_employment_context} detailed records by reference only. It publishes ${economicObservatory.coverage.causal_ai_labour_outcomes} causal occupation outcomes and ${economicObservatory.coverage.classified_economic_scenarios} classified economic scenarios.
- Productivity-led demand expansion, sometimes described as rebound or a Jevons-style effect, is a mechanism to test rather than an assumed outcome. Detailed adoption, output or price elasticity, and new-task coverage are currently ${economicObservatory.coverage.detailed_ai_adoption}, ${economicObservatory.coverage.detailed_output_or_price_elasticity}, and ${economicObservatory.coverage.detailed_new_task_creation} occupations respectively.
- External comparison blocks inside the headline occupation artifact remain null. A separate identity-gated artifact publishes Eloundou theoretical exposure for ${researchSignals.coverage.eloundou_theoretical_exposure_available} occupations and Anthropic observed use for ${researchSignals.coverage.anthropic_observed_exposure_available}. Each published profile uses one reviewed detailed-title identity and one exact source occupation; broader and many-to-many transfers remain unavailable.
- AIOE still lacks a verified SOC-edition bridge, and the complementarity proxy lacks a frozen source-level construct replication. The research-signal artifact and external crosswalk audit are available at ${SITE.url}/data/v9-research-signals.json and ${SITE.url}/data/v9-external-crosswalk-audit.json. Neither can change the headline rank.
- The official Skills Framework pilot covers ${skillsPilot.coverage.unique_occupations} occupations across ${skillsPilot.coverage.sectors} sectors. It republishes selected skill names and source proficiency labels only; it does not infer worker skill levels or alter the headline.
- The multi-signal evidence vector aligns eight separately sourced dimensions by SSOC 2024 code and publishes descriptive disagreement flags. It never averages the dimensions. Pressure-versus-capability ranks use only the ${evidenceVector.coverage.shared_pressure_capability_subset}-occupation shared subset; absent values stay null.
- The ${evidenceVector.snapshot_id} evidence snapshot is the first longitudinal V9 baseline. The change ledger publishes ${signalChange.observed_changes.length} same-construct, same-grain labour changes. ${signalChange.pressure_change.reason}
- Stale convenience-sample job postings are withheld from current-demand interpretation.
- The 11 exact SSOC title duplicates use the official occupation URL. The 56 reviewed familiar-title guides have their own explanatory URL but quote the matched occupation's official score unchanged. The remaining role pages are either disclosed editorial composites or deliberately withheld queries. None is a government classification.

## All ranked official occupations

The score column is ILO mean_score_2025. A parenthesised range appears when the official mapping has several scored ISCO matches.

| Occupation | SSOC 2024 | AI Work Pressure Rank | ILO category or range | ILO mean score | MOM median gross monthly wage |
|---|---:|---:|---|---:|---:|
${scored.map(occupationRow).join('\n')}

## Official occupations without a pressure rank

These pages remain useful classification records. Missing exposure is not zero.

| Occupation | SSOC 2024 | Official ISCO-08 candidates | Reason |
|---|---:|---|---|
${unscored
	.map(
		occupation =>
			`| [${occupation.taxonomy.title}](${SITE.url}/occupation/${occupation.taxonomy.code}) | ${occupation.taxonomy.code} | ${occupation.evidence.official_isco08_codes.join(', ') || 'None'} | No usable ILO 2025 score through the official mapping |`
	)
	.join('\n')}

## Cross-occupation estimates and titles needing context

The estimated pages below use disclosed, reviewed SSOC 2024 composites. The withheld pages publish no score because a fixed occupational mapping would create false precision. None is an official SSOC occupation.

${nonOfficialRoles.map(role => `- [${role.title}](${SITE.url}/role/${role.slug})`).join('\n')}

## Familiar-title guides with a reviewed official match

These ${familiarTitleGuides.length} guides explain why a familiar title maps to one SSOC 2024 occupation. Each page shows the official occupation's rank verbatim, keeps pay and demand separate, and labels family-level actions as guidance rather than score input.

${familiarTitleGuides
	.map(role => {
		const family = getRoleFamilyPresentation(role.slug);
		const rank = role.official_occupation?.pressure_rank;
		return `- [${role.title}](${SITE.url}/role/${role.slug}) — ${family.label}; SSOC ${role.official_occupation?.ssoc2024}; official pressure rank ${rank == null ? 'not ranked' : rank.toFixed(1)}`;
	})
	.join('\n')}

## Exact modern titles that use the official occupation URL

These ${exactOfficialTitles.length} query labels normalize to an official SSOC 2024 title. Their role URLs redirect to the official record; no duplicate guide or score is published.

${exactOfficialTitles.map(role => `- [${role.title}](${SITE.url}/occupation/${role.official_occupation?.ssoc2024})`).join('\n')}

## Source and citation links

- ILO refined exposure index: https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure
- Singapore methodology: ${SITE.url}/methodology
- Research register: ${SITE.url}/research
- Current JSON: ${SITE.url}/data/sg-ai-occupations-v9.json
- Current CSV: ${SITE.url}/data/sg-ai-occupations-v9.csv
- Market sidecar: ${SITE.url}/data/v9-market-context.json
- Singapore AI labour observatory: ${SITE.url}/reports/labour-observatory
- Labour observatory data: ${SITE.url}/data/v9-economic-observatory.json
- AI capability report: ${SITE.url}/reports/ai-capabilities
- AI capability profile data: ${SITE.url}/data/v9-capability-profiles.json
- Theoretical scope vs observed use: ${SITE.url}/reports/research-signals
- Research signal data: ${SITE.url}/data/v9-research-signals.json
- Official skills pilot: ${SITE.url}/reports/skills-pilot
- Official skills pilot data: ${SITE.url}/data/v9-skills-pilot.json
- Evidence pattern report: ${SITE.url}/reports/evidence-patterns
- Multi-signal evidence vector: ${SITE.url}/data/v9-evidence-vector.json
- Signal-specific change ledger: ${SITE.url}/data/v9-signal-change.json
- Mapped ILO task evidence: ${SITE.url}/data/ilo-isco-task-evidence-v9.json

Suggested citation: AI Work Index, Singapore AI Work Pressure V9, ${release.generated_at}, ${SITE.url}.
`;

fs.writeFileSync(path.join(STATIC_DIR, 'llms.txt'), llms, 'utf8');
fs.writeFileSync(path.join(STATIC_DIR, 'llms-full.txt'), llmsFull, 'utf8');
console.log(`Wrote V9 llms.txt and llms-full.txt for ${release.counts.occupations} occupations`);
