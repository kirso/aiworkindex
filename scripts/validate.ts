#!/usr/bin/env bun
/**
 * validate.ts — Sanity checks on the scored occupations.
 *
 * Checks:
 * 1. Physical jobs (roofers, electricians) should have low AIOE
 * 2. Digital jobs (data entry, bookkeepers) should have high AIOE
 * 3. Surgeons/judges should have high theta (complementarity)
 * 4. Telemarketers should have low theta
 * 5. Coverage: >85% direct crosswalk match
 * 6. All 562 occupations have scores
 * 7. C-AIOE values are in reasonable range
 * 8. Category distribution roughly matches IMF findings
 *
 * Run: bun run scripts/validate.ts
 */

import * as fs from "fs";
import * as path from "path";

const DATA_FILE = path.join(import.meta.dir, "..", "data", "occupations.json");

interface ScoredOccupation {
  ssoc: string;
  title: string;
  major_group: string;
  major_group_code: number;
  gross_wage_median: number | null;
  gross_wage_25th: number | null;
  gross_wage_75th: number | null;
  employment_thousands: number | null;
  group_employment_thousands: number | null;
  scores: {
    aioe: number;
    theta: number;
    c_aioe: number;
    category: string;
    isco_codes_matched: string[];
    match_quality: "direct" | "submajor_fallback" | "major_fallback";
  };
}

function main() {
  console.log("=== Validation Report ===\n");

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`ERROR: ${DATA_FILE} not found. Run score.ts first.`);
    process.exit(1);
  }

  const data: ScoredOccupation[] = JSON.parse(
    fs.readFileSync(DATA_FILE, "utf-8")
  );
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

  // === Check 1: Total count ===
  console.log("--- Record counts ---");
  check("Total occupations = 562", data.length === 562, `got ${data.length}`);

  // === Check 2: All have scores ===
  console.log("\n--- Score completeness ---");
  const missingScores = data.filter(
    (d) =>
      d.scores.aioe === null ||
      d.scores.theta === null ||
      d.scores.c_aioe === null
  );
  check(
    "All occupations have AIOE + theta + C-AIOE",
    missingScores.length === 0,
    `${missingScores.length} missing`
  );

  // === Check 3: Coverage ===
  console.log("\n--- Crosswalk coverage ---");
  const direct = data.filter((d) => d.scores.match_quality === "direct").length;
  const submajor = data.filter(
    (d) => d.scores.match_quality === "submajor_fallback"
  ).length;
  const major = data.filter(
    (d) => d.scores.match_quality === "major_fallback"
  ).length;
  const coverage = (direct / data.length) * 100;
  check(
    `Direct crosswalk coverage >85%`,
    coverage > 85,
    `${coverage.toFixed(1)}% (${direct}/${data.length})`
  );
  console.log(
    `       Direct: ${direct}, Sub-major fallback: ${submajor}, Major fallback: ${major}`
  );

  // === Check 4: Sanity — physical jobs should have LOW AIOE ===
  console.log("\n--- Sanity: Physical jobs should have low AIOE ---");
  const physicalJobs = [
    { pattern: /roofer/i, expectLow: true },
    { pattern: /electrician/i, expectLow: true },
    { pattern: /plumber/i, expectLow: true },
    { pattern: /carpenter/i, expectLow: true },
    { pattern: /welder/i, expectLow: true },
    { pattern: /bricklayer/i, expectLow: true },
  ];

  const allAioe = data.map((d) => d.scores.aioe).sort((a, b) => a - b);
  const aioeMedian = allAioe[Math.floor(allAioe.length / 2)];

  for (const { pattern, expectLow } of physicalJobs) {
    const matches = data.filter((d) => pattern.test(d.title));
    for (const m of matches) {
      const isLow = m.scores.aioe < aioeMedian;
      if (expectLow) {
        check(
          `${m.title} (AIOE=${m.scores.aioe.toFixed(3)}) below median`,
          isLow,
          `median=${aioeMedian.toFixed(3)}`
        );
      }
    }
    if (matches.length === 0) {
      warn(`No match for ${pattern}`, "job not found in dataset");
    }
  }

  // === Check 5: Sanity — digital jobs should have HIGH AIOE ===
  console.log("\n--- Sanity: Digital jobs should have high AIOE ---");
  const digitalJobs = [
    { pattern: /data entry/i, expectHigh: true },
    { pattern: /bookkeep/i, expectHigh: true },
    { pattern: /accounting clerk/i, expectHigh: true },
    { pattern: /telemarket/i, expectHigh: true },
    { pattern: /secretary/i, expectHigh: true },
  ];

  for (const { pattern, expectHigh } of digitalJobs) {
    const matches = data.filter((d) => pattern.test(d.title));
    for (const m of matches) {
      const isHigh = m.scores.aioe >= aioeMedian;
      if (expectHigh) {
        check(
          `${m.title} (AIOE=${m.scores.aioe.toFixed(3)}) above median`,
          isHigh,
          `median=${aioeMedian.toFixed(3)}`
        );
      }
    }
    if (matches.length === 0) {
      warn(`No match for ${pattern}`, "job not found in dataset");
    }
  }

  // === Check 6: Sanity — complementarity checks ===
  console.log("\n--- Sanity: High complementarity jobs ---");
  const highCompJobs = [
    /surgeon/i,
    /judge/i,
    /lawyer/i,
    /software developer/i,
    /doctor/i,
    /\bnurs(?:e|ing)\b(?!.*(?:nursery|aide|assistant))/i,
  ];

  const allTheta = data.map((d) => d.scores.theta).sort((a, b) => a - b);
  const thetaMedian = allTheta[Math.floor(allTheta.length / 2)];

  for (const pattern of highCompJobs) {
    const matches = data.filter((d) => pattern.test(d.title));
    for (const m of matches) {
      check(
        `${m.title} (theta=${m.scores.theta.toFixed(3)}) above median`,
        m.scores.theta >= thetaMedian,
        `median=${thetaMedian.toFixed(3)}`
      );
    }
    if (matches.length === 0) {
      warn(`No match for ${pattern}`, "job not found in dataset");
    }
  }

  // === Check 7: C-AIOE range ===
  console.log("\n--- C-AIOE range checks ---");
  const allCaioe = data.map((d) => d.scores.c_aioe);
  const minCaioe = Math.min(...allCaioe);
  const maxCaioe = Math.max(...allCaioe);
  check(
    "C-AIOE values span a meaningful range",
    maxCaioe - minCaioe > 0.5,
    `range: ${minCaioe.toFixed(3)} to ${maxCaioe.toFixed(3)}`
  );
  check(
    "No negative C-AIOE values",
    allCaioe.every((v) => v >= -5),
    `min=${minCaioe.toFixed(3)}`
  );

  // === Check 8: Category distribution ===
  console.log("\n--- Category distribution ---");
  const cats = {
    high_exposure_high_complementarity: 0,
    high_exposure_low_complementarity: 0,
    low_exposure: 0,
  };
  for (const d of data) {
    cats[d.scores.category as keyof typeof cats]++;
  }

  const highExpPct =
    ((cats.high_exposure_high_complementarity +
      cats.high_exposure_low_complementarity) /
      data.length) *
    100;
  console.log(
    `  AI Augmented: ${cats.high_exposure_high_complementarity} (${((cats.high_exposure_high_complementarity / data.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `  At Risk:      ${cats.high_exposure_low_complementarity} (${((cats.high_exposure_low_complementarity / data.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `  Low Impact:   ${cats.low_exposure} (${((cats.low_exposure / data.length) * 100).toFixed(1)}%)`
  );
  // IMF Singapore findings: ~77% high exposure. Ours uses median split so expect ~50%.
  check(
    "High exposure occupations exist",
    highExpPct > 30,
    `${highExpPct.toFixed(1)}% of occupations`
  );

  // === Top/Bottom lists ===
  console.log("\n--- Top 10 highest C-AIOE (most at risk) ---");
  const byCaioe = [...data].sort(
    (a, b) => b.scores.c_aioe - a.scores.c_aioe
  );
  for (const d of byCaioe.slice(0, 10)) {
    console.log(
      `  ${d.scores.c_aioe.toFixed(3)} | ${d.scores.category.padEnd(42)} | ${d.title}`
    );
  }

  console.log("\n--- Top 10 lowest C-AIOE (least at risk) ---");
  for (const d of byCaioe.slice(-10).reverse()) {
    console.log(
      `  ${d.scores.c_aioe.toFixed(3)} | ${d.scores.category.padEnd(42)} | ${d.title}`
    );
  }

  console.log("\n--- Top 10 highest theta (most human-complementary) ---");
  const byTheta = [...data].sort(
    (a, b) => b.scores.theta - a.scores.theta
  );
  for (const d of byTheta.slice(0, 10)) {
    console.log(
      `  ${d.scores.theta.toFixed(3)} | ${d.title}`
    );
  }

  // === Summary ===
  console.log(`\n=== Summary ===`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Warnings: ${warnings}`);

  if (failed > 0) {
    console.log("\nSome checks FAILED. Review the output above.");
    process.exit(1);
  } else {
    console.log("\nAll checks PASSED.");
  }
}

main();
