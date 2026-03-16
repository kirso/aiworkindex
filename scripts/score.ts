#!/usr/bin/env bun
/**
 * score.ts — Main scoring pipeline for Singapore AI Job Exposure Map.
 *
 * Computes Felten AIOE, Pizzinelli theta, and combined C-AIOE for each
 * of 562 Singapore SSOC occupations using peer-reviewed academic indices.
 *
 * Run: bun run scripts/score.ts
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import {
  ssocToIsco,
  iscoToSoc,
  iscoSubMajorGroup,
  socCodesForIscoPrefix,
  ISCO_TO_SOC,
} from "./crosswalk";

// ===== Configuration =====
const DATA_DIR = path.join(import.meta.dir, "..", "data");
const RAW_DIR = path.join(DATA_DIR, "raw");
const EXT_DIR = path.join(RAW_DIR, "external");
const INT_DIR = path.join(DATA_DIR, "intermediate");
const OUT_FILE = path.join(DATA_DIR, "occupations.json");
const SRC_OUT_FILE = path.join(
  import.meta.dir,
  "..",
  "src",
  "lib",
  "data",
  "occupations.json"
);

// ===== Types =====
interface SgOccupation {
  ssoc: string;
  title: string;
  major_group: string;
  basic_wage_25th: number | null;
  basic_wage_median: number | null;
  basic_wage_75th: number | null;
  gross_wage_25th: number | null;
  gross_wage_median: number | null;
  gross_wage_75th: number | null;
  estimated_employment_thousands: number | null;
  group_employment_thousands: number | null;
  group_median_income: number | null;
}

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

// ===== Major group code mapping =====
const MAJOR_GROUP_CODES: Record<string, number> = {
  MANAGERS: 1,
  PROFESSIONALS: 2,
  "ASSOCIATE PROFESSIONALS AND TECHNICIANS": 3,
  "CLERICAL SUPPORT WORKERS": 4,
  "SERVICE AND SALES WORKERS": 5,
  "CRAFTSMEN AND RELATED TRADES WORKERS": 7,
  "PLANT AND MACHINE OPERATORS AND ASSEMBLERS": 8,
  "CLEANERS, LABOURERS AND RELATED WORKERS": 9,
  // Alternative names that might appear
  "SKILLED AGRICULTURAL AND FISHERY WORKERS": 6,
};

// ===== Pizzinelli Theta Variables =====
// From Pizzinelli et al. (2023), IMF Working Paper
// 6 dimensions, 12 variables total (11 Work Context + 1 Job Zone)
const THETA_DIMENSIONS = {
  communication: {
    elements: ["4.C.1.a.2.l", "4.C.1.a.2.c"], // Face-to-face, Public Speaking
    scale: 5, // 1-5 context scale
  },
  responsibility: {
    elements: ["4.C.1.c.2", "4.C.1.c.1"], // Outcomes/Results, Health/Safety
    scale: 5,
  },
  physical: {
    elements: ["4.C.2.a.1.c", "4.C.2.a.3"], // Outdoors, Physical Proximity
    scale: 5,
  },
  criticality: {
    elements: ["4.C.3.a.1", "4.C.3.a.4", "4.C.3.a.2.b"], // Consequence of Error, Freedom, Frequency
    scale: 5,
  },
  routine_inverted: {
    elements: ["4.C.3.b.2", "4.C.3.b.8"], // Automation (inverted), Structured (not inverted)
    scale: 5,
  },
  skills: {
    elements: ["job_zone"], // Job Zone (1-5), scaled to 20-100 then to 0-1
    scale: 5,
  },
};

// ===== Step 1: Load AIOE scores =====
function loadAioe(): Map<string, number> {
  console.log("Loading AIOE scores...");
  const wb = XLSX.readFile(path.join(EXT_DIR, "AIOE_DataAppendix.xlsx"));
  const ws = wb.Sheets["Appendix A"];
  const data = XLSX.utils.sheet_to_json<{ "SOC Code": string; AIOE: number }>(
    ws
  );

  const aioeMap = new Map<string, number>();
  for (const row of data) {
    const soc = row["SOC Code"];
    const aioe = row["AIOE"];
    if (soc && typeof aioe === "number") {
      aioeMap.set(soc, aioe);
    }
  }

  console.log(`  Loaded ${aioeMap.size} AIOE scores`);
  return aioeMap;
}

// ===== Step 2: Load O*NET Work Context =====
function loadWorkContext(): Map<string, Map<string, number>> {
  console.log("Loading O*NET Work Context...");
  const filePath = path.join(EXT_DIR, "Work_Context.txt");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // Map: SOC code → element ID → value
  const wcMap = new Map<string, Map<string, number>>();

  // Parse tab-delimited, filter to CX scale only (context mean)
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split("\t");
    if (parts.length < 6) continue;

    const [socFull, elementId, , scaleId, , dataValueStr] = parts;
    if (scaleId !== "CX") continue;

    const dataValue = parseFloat(dataValueStr);
    if (isNaN(dataValue)) continue;

    // Normalize SOC code: "11-1011.00" → "11-1011"
    const soc = socFull.split(".")[0];

    if (!wcMap.has(soc)) {
      wcMap.set(soc, new Map());
    }
    // If multiple detailed codes (e.g. 11-1011.00 and 11-1011.03), take the base
    const existing = wcMap.get(soc)!;
    if (!existing.has(elementId)) {
      existing.set(elementId, dataValue);
    } else {
      // Average with existing (handles multiple detailed SOC entries)
      const current = existing.get(elementId)!;
      const count =
        (existing.get(`${elementId}_count`) || 1) + 1;
      existing.set(elementId, (current * (count - 1) + dataValue) / count);
      existing.set(`${elementId}_count`, count);
    }
  }

  console.log(`  Loaded Work Context for ${wcMap.size} SOC codes`);
  return wcMap;
}

// ===== Step 3: Load Job Zones =====
function loadJobZones(): Map<string, number> {
  console.log("Loading O*NET Job Zones...");
  const wb = XLSX.readFile(path.join(EXT_DIR, "Job_Zones.xlsx"));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<{
    "O*NET-SOC Code": string;
    "Job Zone": number;
  }>(ws);

  const jzMap = new Map<string, number>();
  for (const row of data) {
    const socFull = row["O*NET-SOC Code"];
    const jz = row["Job Zone"];
    if (!socFull || typeof jz !== "number") continue;

    const soc = socFull.split(".")[0];
    if (!jzMap.has(soc)) {
      jzMap.set(soc, jz);
    } else {
      // Average for multiple detailed codes
      jzMap.set(soc, (jzMap.get(soc)! + jz) / 2);
    }
  }

  console.log(`  Loaded Job Zones for ${jzMap.size} SOC codes`);
  return jzMap;
}

// ===== Step 4: Compute theta for each SOC code =====
function computeTheta(
  wcMap: Map<string, Map<string, number>>,
  jzMap: Map<string, number>
): Map<string, number> {
  console.log("Computing Pizzinelli theta...");
  const thetaMap = new Map<string, number>();

  // Collect all SOC codes that have both WC and JZ data
  const allSocCodes = new Set([...wcMap.keys(), ...jzMap.keys()]);

  for (const soc of allSocCodes) {
    const wc = wcMap.get(soc);
    const jz = jzMap.get(soc);

    if (!wc && !jz) continue;

    const dimensionMeans: number[] = [];

    // Communication: face-to-face + public speaking
    const comm = getElementMean(wc, ["4.C.1.a.2.l", "4.C.1.a.2.c"], 5);
    if (comm !== null) dimensionMeans.push(comm);

    // Responsibility: outcomes + health/safety
    const resp = getElementMean(wc, ["4.C.1.c.2", "4.C.1.c.1"], 5);
    if (resp !== null) dimensionMeans.push(resp);

    // Physical: outdoors + proximity
    const phys = getElementMean(wc, ["4.C.2.a.1.c", "4.C.2.a.3"], 5);
    if (phys !== null) dimensionMeans.push(phys);

    // Criticality: consequence of error + freedom + frequency
    const crit = getElementMean(
      wc,
      ["4.C.3.a.1", "4.C.3.a.4", "4.C.3.a.2.b"],
      5
    );
    if (crit !== null) dimensionMeans.push(crit);

    // Routine (inverted): automation is inverted (high = routine = low complementarity)
    // Structured work is NOT inverted (high = unstructured = high complementarity)
    const automation = wc?.get("4.C.3.b.2");
    const structured = wc?.get("4.C.3.b.8");
    if (automation !== undefined && structured !== undefined) {
      // Invert automation: (scale_max + 1 - value) / scale_max
      const automationInv = (5 + 1 - automation) / 5;
      const structuredNorm = structured / 5;
      dimensionMeans.push((automationInv + structuredNorm) / 2);
    } else if (automation !== undefined) {
      dimensionMeans.push((5 + 1 - automation) / 5);
    } else if (structured !== undefined) {
      dimensionMeans.push(structured / 5);
    }

    // Skills: Job Zone (1-5) → scale to 0-1
    if (jz !== undefined) {
      dimensionMeans.push(jz / 5);
    }

    if (dimensionMeans.length >= 3) {
      // theta = mean of dimension means (already normalized to ~0-1)
      const theta =
        dimensionMeans.reduce((a, b) => a + b, 0) / dimensionMeans.length;
      thetaMap.set(soc, theta);
    }
  }

  console.log(`  Computed theta for ${thetaMap.size} SOC codes`);
  return thetaMap;
}

function getElementMean(
  wc: Map<string, number> | undefined,
  elementIds: string[],
  scale: number
): number | null {
  if (!wc) return null;
  const values: number[] = [];
  for (const id of elementIds) {
    const v = wc.get(id);
    if (v !== undefined) values.push(v / scale);
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ===== Step 5: Load Singapore occupations =====
function loadSgOccupations(): SgOccupation[] {
  console.log("Loading Singapore occupations...");
  const filePath = path.join(RAW_DIR, "sg_occupations_complete_2024.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SgOccupation[];
  console.log(`  Loaded ${data.length} occupations`);
  return data;
}

// ===== Step 6: Score all occupations =====
function scoreOccupations(
  sgOccs: SgOccupation[],
  aioeMap: Map<string, number>,
  thetaMap: Map<string, number>
): ScoredOccupation[] {
  console.log("Scoring occupations...");

  // Pre-compute theta_MIN for C-AIOE formula
  const allTheta = [...thetaMap.values()];
  const thetaMin = Math.min(...allTheta);
  console.log(
    `  Theta range: min=${thetaMin.toFixed(4)}, max=${Math.max(
      ...allTheta
    ).toFixed(4)}, median=${median(allTheta).toFixed(4)}`
  );

  // Pre-compute AIOE stats
  const allAioe = [...aioeMap.values()];
  console.log(
    `  AIOE range: min=${Math.min(...allAioe).toFixed(4)}, max=${Math.max(
      ...allAioe
    ).toFixed(4)}, median=${median(allAioe).toFixed(4)}`
  );

  // Pre-compute sub-major group averages for fallback
  const subMajorAioe = new Map<string, number[]>();
  const subMajorTheta = new Map<string, number[]>();

  for (const [isco, socCodes] of Object.entries(ISCO_TO_SOC)) {
    const prefix = iscoSubMajorGroup(isco);
    const { avgAioe, avgTheta } = averageScoresForSocCodes(
      socCodes,
      aioeMap,
      thetaMap
    );
    if (avgAioe !== null) {
      if (!subMajorAioe.has(prefix)) subMajorAioe.set(prefix, []);
      subMajorAioe.get(prefix)!.push(avgAioe);
    }
    if (avgTheta !== null) {
      if (!subMajorTheta.has(prefix)) subMajorTheta.set(prefix, []);
      subMajorTheta.get(prefix)!.push(avgTheta);
    }
  }

  // Also pre-compute major group (1-digit) averages for last-resort fallback
  const majorAioe = new Map<string, number[]>();
  const majorTheta = new Map<string, number[]>();
  for (const [prefix, values] of subMajorAioe) {
    const major = prefix[0];
    if (!majorAioe.has(major)) majorAioe.set(major, []);
    majorAioe.get(major)!.push(...values);
  }
  for (const [prefix, values] of subMajorTheta) {
    const major = prefix[0];
    if (!majorTheta.has(major)) majorTheta.set(major, []);
    majorTheta.get(major)!.push(...values);
  }

  let directMatches = 0;
  let subMajorFallbacks = 0;
  let majorFallbacks = 0;

  const results: ScoredOccupation[] = [];

  for (const occ of sgOccs) {
    const isco = ssocToIsco(occ.ssoc);
    const socCodes = iscoToSoc(isco);

    let avgAioe: number | null = null;
    let avgTheta: number | null = null;
    let matchQuality: "direct" | "submajor_fallback" | "major_fallback" =
      "direct";
    let iscoMatched: string[] = [isco];

    if (socCodes.length > 0) {
      const scores = averageScoresForSocCodes(socCodes, aioeMap, thetaMap);
      avgAioe = scores.avgAioe;
      avgTheta = scores.avgTheta;
    }

    // Fallback 1: sub-major group average
    if (avgAioe === null || avgTheta === null) {
      const prefix = iscoSubMajorGroup(isco);
      if (avgAioe === null && subMajorAioe.has(prefix)) {
        const vals = subMajorAioe.get(prefix)!;
        avgAioe = vals.reduce((a, b) => a + b, 0) / vals.length;
        matchQuality = "submajor_fallback";
      }
      if (avgTheta === null && subMajorTheta.has(prefix)) {
        const vals = subMajorTheta.get(prefix)!;
        avgTheta = vals.reduce((a, b) => a + b, 0) / vals.length;
        matchQuality = "submajor_fallback";
      }
    }

    // Fallback 2: major group average
    if (avgAioe === null || avgTheta === null) {
      const major = isco[0];
      if (avgAioe === null && majorAioe.has(major)) {
        const vals = majorAioe.get(major)!;
        avgAioe = vals.reduce((a, b) => a + b, 0) / vals.length;
        matchQuality = "major_fallback";
      }
      if (avgTheta === null && majorTheta.has(major)) {
        const vals = majorTheta.get(major)!;
        avgTheta = vals.reduce((a, b) => a + b, 0) / vals.length;
        matchQuality = "major_fallback";
      }
    }

    // Final fallback: use global median
    if (avgAioe === null) avgAioe = median(allAioe);
    if (avgTheta === null) avgTheta = median(allTheta);

    if (matchQuality === "direct" && socCodes.length > 0) {
      directMatches++;
    } else if (matchQuality === "submajor_fallback") {
      subMajorFallbacks++;
    } else {
      majorFallbacks++;
    }

    // Compute C-AIOE = AIOE × (1 - (theta - theta_MIN))
    const cAioe = avgAioe * (1 - (avgTheta - thetaMin));

    // Classify
    const category = classify(avgAioe, avgTheta, allAioe, allTheta);

    const majorGroupCode =
      MAJOR_GROUP_CODES[occ.major_group] || parseInt(occ.ssoc[0]) || 0;

    results.push({
      ssoc: occ.ssoc,
      title: occ.title,
      major_group: occ.major_group,
      major_group_code: majorGroupCode,
      gross_wage_median: occ.gross_wage_median,
      gross_wage_25th: occ.gross_wage_25th,
      gross_wage_75th: occ.gross_wage_75th,
      employment_thousands: occ.estimated_employment_thousands,
      group_employment_thousands: occ.group_employment_thousands,
      scores: {
        aioe: round(avgAioe, 4),
        theta: round(avgTheta, 4),
        c_aioe: round(cAioe, 4),
        category,
        isco_codes_matched: iscoMatched,
        match_quality: matchQuality,
      },
    });
  }

  const coverage = (directMatches / sgOccs.length) * 100;
  console.log(`  Direct crosswalk matches: ${directMatches}/${sgOccs.length} (${coverage.toFixed(1)}%)`);
  console.log(`  Sub-major group fallbacks: ${subMajorFallbacks}`);
  console.log(`  Major group fallbacks: ${majorFallbacks}`);

  return results;
}

function averageScoresForSocCodes(
  socCodes: string[],
  aioeMap: Map<string, number>,
  thetaMap: Map<string, number>
): { avgAioe: number | null; avgTheta: number | null } {
  const aioeValues: number[] = [];
  const thetaValues: number[] = [];

  for (const soc of socCodes) {
    const aioe = aioeMap.get(soc);
    if (aioe !== undefined) aioeValues.push(aioe);
    const theta = thetaMap.get(soc);
    if (theta !== undefined) thetaValues.push(theta);
  }

  return {
    avgAioe:
      aioeValues.length > 0
        ? aioeValues.reduce((a, b) => a + b, 0) / aioeValues.length
        : null,
    avgTheta:
      thetaValues.length > 0
        ? thetaValues.reduce((a, b) => a + b, 0) / thetaValues.length
        : null,
  };
}

// ===== Classification =====
function classify(
  aioe: number,
  theta: number,
  allAioe: number[],
  allTheta: number[]
): string {
  const aioeMedian = median(allAioe);
  const thetaMedian = median(allTheta);

  if (aioe >= aioeMedian) {
    if (theta >= thetaMedian) {
      return "high_exposure_high_complementarity"; // AI Augmented
    } else {
      return "high_exposure_low_complementarity"; // At Risk
    }
  } else {
    return "low_exposure"; // Low Impact
  }
}

// ===== Helpers =====
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ===== Main =====
async function main() {
  console.log("=== Singapore AI Job Exposure Scoring Pipeline ===\n");

  // Load all data sources
  const aioeMap = loadAioe();
  const wcMap = loadWorkContext();
  const jzMap = loadJobZones();
  const thetaMap = computeTheta(wcMap, jzMap);
  const sgOccs = loadSgOccupations();

  // Score all occupations
  const results = scoreOccupations(sgOccs, aioeMap, thetaMap);

  // Output statistics
  const categories = {
    high_exposure_high_complementarity: 0,
    high_exposure_low_complementarity: 0,
    low_exposure: 0,
  };
  for (const r of results) {
    categories[r.scores.category as keyof typeof categories]++;
  }

  console.log("\n=== Category Distribution ===");
  console.log(
    `  AI Augmented (high exp + high comp): ${categories.high_exposure_high_complementarity} (${((categories.high_exposure_high_complementarity / results.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `  At Risk (high exp + low comp):       ${categories.high_exposure_low_complementarity} (${((categories.high_exposure_low_complementarity / results.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `  Low Impact (low exp):                ${categories.low_exposure} (${((categories.low_exposure / results.length) * 100).toFixed(1)}%)`
  );

  // Save intermediate theta data
  const thetaData: Record<string, number> = {};
  for (const [soc, theta] of thetaMap) {
    thetaData[soc] = round(theta, 4);
  }
  fs.writeFileSync(
    path.join(INT_DIR, "theta_by_soc.json"),
    JSON.stringify(thetaData, null, 2)
  );

  // Save output
  const output = JSON.stringify(results, null, 2);
  fs.writeFileSync(OUT_FILE, output);
  console.log(`\nWrote ${OUT_FILE} (${results.length} occupations)`);

  // Copy to src/lib/data/
  fs.mkdirSync(path.dirname(SRC_OUT_FILE), { recursive: true });
  fs.writeFileSync(SRC_OUT_FILE, output);
  console.log(`Copied to ${SRC_OUT_FILE}`);

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
