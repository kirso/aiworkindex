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

import * as fs from "fs";
import * as path from "path";

const DATA_FILE = path.join(import.meta.dir, "..", "data", "occupations.json");

type RiskBand = "very_low" | "low" | "moderate" | "high" | "very_high";
type ImpactType = "at_risk" | "ai_leveraged" | "stable" | "mixed";

interface Occupation {
  ssoc: string;
  title: string;
  match_quality: "direct" | "submajor_fallback" | "major_fallback";
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
    level: "high" | "medium" | "low";
  };
  evidence: {
    anthropic_calibrated: boolean;
    anthropic_gap: number | null;
    sol_match: "exact" | "prefix" | false;
    jobs_in_demand_match: "exact" | "prefix" | false;
  };
  stability: {
    label: "stable" | "watch" | "sensitive";
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
    overall: "strong" | "moderate" | "weak" | "deteriorating";
    data_as_of: string;
  } | null;
}

function riskBandForValue(value: number): RiskBand {
  if (value < 0.05) return "very_low";
  if (value < 0.15) return "low";
  if (value < 0.30) return "moderate";
  if (value < 0.50) return "high";
  return "very_high";
}

function main() {
  console.log("=== Validation Report ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`ERROR: ${DATA_FILE} not found. Run score.ts first.`);
    process.exit(1);
  }

  const data: Occupation[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  function check(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  PASS: ${name}`);
      passed++;
    } else {
      console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  function warn(name: string, detail: string) {
    console.log(`  WARN: ${name} — ${detail}`);
    warnings++;
  }

  function find(pattern: RegExp): Occupation | undefined {
    return data.find((row) => pattern.test(row.title));
  }

  console.log("--- Record counts ---");
  check("Total occupations = 562", data.length === 562, `got ${data.length}`);

  console.log("\n--- Completeness ---");
  check(
    "All occupations have current core fields",
    data.every(
      (row) =>
        typeof row.exposure === "number" &&
        typeof row.bottleneck === "number" &&
        typeof row.net_risk === "number" &&
        typeof row.augmentation === "number" &&
        !!row.market &&
        !!row.confidence &&
        !!row.evidence &&
        !!row.stability
    )
  );
  check(
    "All occupations have labour monitor coverage",
    data.every((row) => row.labour_monitor !== null)
  );

  console.log("\n--- Coverage ---");
  const direct = data.filter((row) => row.match_quality === "direct").length;
  const submajor = data.filter(
    (row) => row.match_quality === "submajor_fallback"
  ).length;
  const major = data.filter(
    (row) => row.match_quality === "major_fallback"
  ).length;
  check(
    "Direct crosswalk coverage > 90%",
    direct / data.length > 0.9,
    `${direct}/${data.length} direct`
  );
  console.log(
    `       Direct: ${direct}, Sub-major fallback: ${submajor}, Major fallback: ${major}`
  );

  const anthropicCount = data.filter(
    (row) => row.evidence.anthropic_calibrated
  ).length;
  const demandFlagged = data.filter(
    (row) => row.evidence.sol_match || row.evidence.jobs_in_demand_match
  ).length;
  check(
    "Anthropic calibration covers most occupations",
    anthropicCount > 450,
    `${anthropicCount} calibrated`
  );
  check(
    "Official demand signals cover a meaningful subset",
    demandFlagged >= 50,
    `${demandFlagged} flagged`
  );

  console.log("\n--- Distribution sanity ---");
  const bandCounts: Record<RiskBand, number> = {
    very_low: 0,
    low: 0,
    moderate: 0,
    high: 0,
    very_high: 0,
  };
  const impactCounts: Record<ImpactType, number> = {
    at_risk: 0,
    ai_leveraged: 0,
    stable: 0,
    mixed: 0,
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
    "Every risk band is populated",
    Object.values(bandCounts).every((count) => count > 0)
  );
  check(
    "Stored risk bands match stored net_risk thresholds",
    data.every((row) => riskBandForValue(row.net_risk) === row.risk_band)
  );
  check(
    "At Risk and AI Leveraged occupations both exist",
    impactCounts.at_risk > 0 && impactCounts.ai_leveraged > 0
  );
  check(
    "Confidence has at least two populated tiers",
    [confidenceCounts.high, confidenceCounts.medium, confidenceCounts.low].filter(
      (count) => count > 0
    ).length >= 2,
    JSON.stringify(confidenceCounts)
  );
  check(
    "Stability has at least two populated tiers",
    [stabilityCounts.stable, stabilityCounts.watch, stabilityCounts.sensitive].filter(
      (count) => count > 0
    ).length >= 2,
    JSON.stringify(stabilityCounts)
  );

  console.log(`       Bands: ${JSON.stringify(bandCounts)}`);
  console.log(`       Impact: ${JSON.stringify(impactCounts)}`);
  console.log(`       Confidence: ${JSON.stringify(confidenceCounts)}`);
  console.log(`       Stability: ${JSON.stringify(stabilityCounts)}`);

  console.log("\n--- Anchor occupations ---");
  const software = find(/software developer/i);
  const dataEntry = find(/data entry clerk/i);
  const surgeon = find(/surgeon/i);
  const telemarketer = find(/telemarketer/i);
  const nurse = find(/registered nurse/i);
  const dataScientist = find(/data scientist/i);

  check("Software developer exists", !!software);
  if (software) {
    check("Software developer is a direct crosswalk", software.match_quality === "direct");
    check(
      "Software developer is not classified At Risk",
      software.impact_type !== "at_risk",
      `${software.impact_type} / ${software.risk_band}`
    );
    check(
      "Software developer has official demand evidence",
      !!(software.evidence.sol_match || software.evidence.jobs_in_demand_match)
    );
    check(
      "Software developer is not Very High risk",
      software.risk_band !== "very_high",
      `${software.net_risk.toFixed(3)}`
    );
  }

  check("Data entry clerk exists", !!dataEntry);
  if (dataEntry) {
    check(
      "Data entry clerk is high displacement",
      dataEntry.risk_band === "high" || dataEntry.risk_band === "very_high",
      `${dataEntry.risk_band}`
    );
    check(
      "Data entry clerk is At Risk",
      dataEntry.impact_type === "at_risk",
      `${dataEntry.impact_type}`
    );
  }

  check("Surgeon exists", !!surgeon);
  if (surgeon) {
    check(
      "Surgeon is very low risk",
      surgeon.risk_band === "very_low",
      `${surgeon.net_risk.toFixed(3)}`
    );
    check(
      "Surgeon is AI Leveraged",
      surgeon.impact_type === "ai_leveraged",
      `${surgeon.impact_type}`
    );
  }

  check("Telemarketer exists", !!telemarketer);
  if (telemarketer) {
    check(
      "Telemarketer remains highly exposed",
      telemarketer.risk_band === "high" || telemarketer.risk_band === "very_high",
      `${telemarketer.risk_band}`
    );
    check(
      "Telemarketer is At Risk",
      telemarketer.impact_type === "at_risk",
      `${telemarketer.impact_type}`
    );
  }

  check("Registered nurse exists", !!nurse);
  if (nurse) {
    check(
      "Registered nurse is low risk",
      nurse.risk_band === "very_low" || nurse.risk_band === "low",
      `${nurse.risk_band}`
    );
    check(
      "Registered nurse is AI Leveraged",
      nurse.impact_type === "ai_leveraged",
      `${nurse.impact_type}`
    );
  }

  check("Data scientist exists", !!dataScientist);
  if (dataScientist) {
    check(
      "Data scientist has official demand evidence",
      !!(dataScientist.evidence.sol_match || dataScientist.evidence.jobs_in_demand_match)
    );
    check(
      "Data scientist is not classified Stable",
      dataScientist.impact_type !== "stable",
      `${dataScientist.impact_type}`
    );
  }

  console.log("\n--- Labour monitor sanity ---");
  const labourRowsMissingRecent = data.filter(
    (row) => (row.labour_monitor?.vacancy.recent_quarters.length ?? 0) < 4
  ).length;
  check(
    "Labour monitor has recent quarters for all occupations",
    labourRowsMissingRecent === 0,
    `${labourRowsMissingRecent} missing 4+ quarters`
  );
  const labourOverallCounts = {
    strong: data.filter((row) => row.labour_monitor?.overall === "strong").length,
    moderate: data.filter((row) => row.labour_monitor?.overall === "moderate").length,
    weak: data.filter((row) => row.labour_monitor?.overall === "weak").length,
    deteriorating: data.filter((row) => row.labour_monitor?.overall === "deteriorating").length,
  };
  check(
    "Labour monitor overall signals present",
    Object.values(labourOverallCounts).some((count) => count > 0),
    JSON.stringify(labourOverallCounts)
  );

  if (!find(/teacher/i)) {
    warn("Teacher anchor", "No teacher title matched for optional review");
  }

  console.log("\n=== Summary ===");
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Warnings: ${warnings}`);

  if (failed > 0) {
    console.log("\nSome checks FAILED. Review the output above.");
    process.exit(1);
  }

  console.log("\nAll checks passed.");
}

main();
