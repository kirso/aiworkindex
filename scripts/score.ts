#!/usr/bin/env bun
/**
 * score.ts — V3.1 scoring pipeline for Singapore AI Job Exposure Map.
 *
 * Computes Felten AIOE, Pizzinelli theta, market resilience layer,
 * and net displacement risk for each of 562 Singapore SSOC occupations.
 *
 * V3.1 additions:
 *   - Anthropic Economic Index observed AI usage calibration
 *   - MOM Shortage Occupation List (SOL) 2026 demand bonus
 *   - Crosswalk dispersion penalty for confidence
 *   - Variable confidence factors based on data match quality
 *
 * V3 formula:
 *   exposure     = pctile(aioe)
 *   bottleneck   = pctile(theta)
 *   market_modifier = 1 - 0.35 * market_resilience
 *   net_risk     = exposure_calibrated * (1 - bottleneck) * market_modifier
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

interface MarketScores {
  market_momentum: number;
  occupation_scarcity: number;
  market_resilience: number;
  market_modifier: number;
}

interface ConfidenceScores {
  score: number;
  level: "high" | "medium" | "low";
  crosswalk_quality: number;
  market_data_granularity: number;
  source_freshness: number;
}

interface RawScores {
  aioe: number;
  theta: number;
  c_aioe: number;
  log_wage_spread: number | null;
  wage_position: number | null;
}

type RiskBand = "very_low" | "low" | "moderate" | "high" | "very_high";

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
  exposure: number;
  bottleneck: number;
  market: MarketScores;
  net_risk: number;
  risk_band: RiskBand;
  augmentation: number;
  augmentation_band: RiskBand;
  impact_type: "at_risk" | "ai_leveraged" | "stable" | "mixed";
  confidence: ConfidenceScores;
  raw: RawScores;
  isco_codes_matched: string[];
  match_quality: "direct" | "submajor_fallback" | "major_fallback";
  // Backward-compat: keep scores object for frontend
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
  "AGRICULTURAL AND FISHERY WORKERS": 6,
};

// ===== Mapping from major_group to employment CSV row names =====
const MAJOR_GROUP_TO_EMPL_CSV: Record<string, string> = {
  MANAGERS: "Managers & Administrators (Including Working Proprietors)",
  PROFESSIONALS: "Professionals",
  "ASSOCIATE PROFESSIONALS AND TECHNICIANS": "Associate Professionals & Technicians",
  "CLERICAL SUPPORT WORKERS": "Clerical Support Workers",
  "SERVICE AND SALES WORKERS": "Service & Sales Workers",
  "CRAFTSMEN AND RELATED TRADES WORKERS": "Craftsmen & Related Trade Workers",
  "PLANT AND MACHINE OPERATORS AND ASSEMBLERS": "Plant & Machine Operators & Assemblers",
  "CLEANERS, LABOURERS AND RELATED WORKERS": "Cleaners, Labourers & Related Workers",
  "AGRICULTURAL AND FISHERY WORKERS": "Others",
};

// ===== Mapping from major_group to income CSV row name prefix =====
const MAJOR_GROUP_TO_INCOME_CSV: Record<string, string> = {
  MANAGERS: "Managers & Administrators (Including Working Proprietors)",
  PROFESSIONALS: "Professionals",
  "ASSOCIATE PROFESSIONALS AND TECHNICIANS": "Associate Professionals & Technicians",
  "CLERICAL SUPPORT WORKERS": "Clerical Support Workers",
  "SERVICE AND SALES WORKERS": "Service & Sales Workers",
  "CRAFTSMEN AND RELATED TRADES WORKERS": "Craftsmen & Related Trades Workers",
  "PLANT AND MACHINE OPERATORS AND ASSEMBLERS": "Plant & Machine Operators & Assemblers",
  "CLEANERS, LABOURERS AND RELATED WORKERS": "Cleaners, Labourers & Related Workers",
  "AGRICULTURAL AND FISHERY WORKERS": "Cleaners, Labourers & Related Workers",
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

  // Map: SOC code -> element ID -> value
  const wcMap = new Map<string, Map<string, number>>();

  // Parse tab-delimited, filter to CX scale only (context mean)
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split("\t");
    if (parts.length < 6) continue;

    const [socFull, elementId, , scaleId, , dataValueStr] = parts;
    if (scaleId !== "CX") continue;

    const dataValue = parseFloat(dataValueStr);
    if (isNaN(dataValue)) continue;

    // Normalize SOC code: "11-1011.00" -> "11-1011"
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

// ===== Step 3b: Load Anthropic Economic Index (observed AI usage) =====
function loadAnthropicExposure(): Map<string, number> {
  console.log("Loading Anthropic Economic Index...");
  const filePath = path.join(EXT_DIR, "anthropic_job_exposure.csv");
  if (!fs.existsSync(filePath)) {
    console.log("  WARNING: anthropic_job_exposure.csv not found, skipping");
    return new Map();
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  const exposureMap = new Map<string, number>();

  // Parse CSV: occ_code,title,observed_exposure
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length < 3) continue;
    const socCode = parts[0].trim();
    // Handle quoted title field
    const rawExposure = parts[parts.length - 1].trim();
    const exposure = parseFloat(rawExposure);
    if (socCode && !isNaN(exposure)) {
      exposureMap.set(socCode, exposure);
    }
  }

  const nonZero = [...exposureMap.values()].filter(v => v > 0);
  console.log(`  Loaded ${exposureMap.size} SOC codes, ${nonZero.length} with non-zero exposure`);
  console.log(`  Max observed exposure: ${Math.max(...exposureMap.values()).toFixed(4)}`);
  return exposureMap;
}

// ===== Step 3c: Load MOM Shortage Occupation List (SOL) 2026 =====
interface SolEntry {
  sn: number;
  shortage_occupation: string;
  sector: string;
  ssoc_matches: string[];
  match_notes: string;
}

function loadMomSol(): { exactCodes: Set<string>; prefixes: Set<string> } {
  console.log("Loading MOM Shortage Occupation List 2026...");
  const filePath = path.join(EXT_DIR, "mom_sol_2026.json");
  if (!fs.existsSync(filePath)) {
    console.log("  WARNING: mom_sol_2026.json not found, skipping");
    return { exactCodes: new Set(), prefixes: new Set() };
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const exactCodes = new Set<string>();
  const prefixes = new Set<string>();

  for (const entry of data.occupations as SolEntry[]) {
    for (const ssoc of entry.ssoc_matches) {
      exactCodes.add(ssoc);
      // Also add 4-digit prefix for broader matching
      prefixes.add(ssoc.substring(0, 4));
    }
  }

  console.log(`  Loaded ${data.occupations.length} SOL occupations mapping to ${exactCodes.size} exact SSOC codes (${prefixes.size} 4-digit prefixes)`);
  return { exactCodes, prefixes };
}

function isSolMatch(ssoc: string, sol: { exactCodes: Set<string>; prefixes: Set<string> }): boolean {
  // Exact 5-digit match first
  if (sol.exactCodes.has(ssoc)) return true;
  // Fall back to 4-digit prefix match (covers entire SSOC unit group)
  return sol.prefixes.has(ssoc.substring(0, 4));
}

// ===== Step 3d: Compute crosswalk dispersion for SOC code groups =====
function computeDispersion(
  values: number[]
): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
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

    // Skills: Job Zone (1-5) -> scale to 0-1
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

// ===== Percentile Rank =====
// For each value in `values`, compute its rank / N (0 = lowest, 1 = highest)
// Uses average rank for ties.
function percentileRanks(values: number[]): number[] {
  const n = values.length;
  if (n === 0) return [];
  if (n === 1) return [0.5]; // single value gets 0.5

  // Create indexed pairs, sort by value
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(n);

  // Assign average ranks for ties
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && indexed[j].v === indexed[i].v) j++;
    // Positions i..j-1 are tied; average rank = mean of (i..j-1) / (n-1)
    const avgRank = (i + j - 1) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = n > 1 ? avgRank / (n - 1) : 0.5;
    }
    i = j;
  }
  return ranks;
}

// ===== Winsorize =====
function winsorize(values: number[], lowerPctile: number, upperPctile: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const lowerIdx = Math.floor(n * lowerPctile);
  const upperIdx = Math.min(Math.floor(n * upperPctile), n - 1);
  const lowerBound = sorted[lowerIdx];
  const upperBound = sorted[upperIdx];
  return values.map(v => Math.max(lowerBound, Math.min(upperBound, v)));
}

// ===== Step 6: Load Market Data =====
interface GroupMarketData {
  employment_2015: number;
  employment_2025: number;
  employment_cagr: number;
  wage_2015: number; // average of male+female median
  wage_2023: number;
  wage_cagr: number;
}

function parseCSVValue(val: string): number | null {
  if (!val) return null;
  const cleaned = val.trim().replace(/"/g, "").replace(/,/g, "");
  if (cleaned === "na" || cleaned === "-" || cleaned === "") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseCSVRow(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function loadEmploymentData(): Map<string, { e2015: number; e2025: number }> {
  console.log("Loading employment by occupation data...");
  const filePath = path.join(RAW_DIR, "employment_by_occupation.csv");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());

  // Parse header to find year column indices
  const headerFields = parseCSVRow(lines[0]);
  const yearIdx2025 = headerFields.indexOf("2025");
  const yearIdx2015 = headerFields.indexOf("2015");

  if (yearIdx2025 < 0 || yearIdx2015 < 0) {
    throw new Error("Cannot find 2025 or 2015 columns in employment CSV");
  }

  // We only want the top-level rows (Total Employed Residents section, lines 2-10 roughly)
  // These are the indented rows directly under the "All Occupation Groups" row
  const result = new Map<string, { e2015: number; e2025: number }>();

  // The top-level group rows are lines 3-10 (0-indexed: 2-9)
  // They have 4-space indent and are under "All Occupation Groups"
  for (let i = 2; i <= 10 && i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    const name = fields[0].trim();
    if (!name || name.startsWith("All ") || name.startsWith("Employed Residents")) continue;

    const e2025 = parseCSVValue(fields[yearIdx2025]);
    const e2015 = parseCSVValue(fields[yearIdx2015]);

    if (e2025 !== null && e2015 !== null) {
      result.set(name, { e2015, e2025 });
    }
  }

  console.log(`  Loaded employment data for ${result.size} groups`);
  for (const [name, data] of result) {
    console.log(`    ${name}: 2015=${data.e2015}, 2025=${data.e2025}`);
  }
  return result;
}

function loadIncomeData(): Map<string, { w2015: number; w2023: number }> {
  console.log("Loading median income by occupation data...");
  const filePath = path.join(RAW_DIR, "median_income_by_occupation.csv");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());

  const headerFields = parseCSVRow(lines[0]);
  const yearIdx2023 = headerFields.indexOf("2023");
  const yearIdx2015 = headerFields.indexOf("2015");

  if (yearIdx2023 < 0 || yearIdx2015 < 0) {
    throw new Error("Cannot find 2023 or 2015 columns in income CSV");
  }

  // Income CSV has Male and Female rows for each group; average them
  const maleData = new Map<string, { w2015: number; w2023: number }>();
  const femaleData = new Map<string, { w2015: number; w2023: number }>();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVRow(lines[i]);
    const rawName = fields[0].trim();

    const w2023 = parseCSVValue(fields[yearIdx2023]);
    const w2015 = parseCSVValue(fields[yearIdx2015]);

    if (w2023 === null || w2015 === null) continue;

    // Parse group name and gender
    const isMale = rawName.endsWith("- Male");
    const isFemale = rawName.endsWith("- Female");
    const groupName = rawName.replace(/ - (Male|Female)$/, "").trim();

    if (isMale) {
      maleData.set(groupName, { w2015, w2023 });
    } else if (isFemale) {
      femaleData.set(groupName, { w2015, w2023 });
    }
  }

  // Average male + female
  const result = new Map<string, { w2015: number; w2023: number }>();
  for (const [group, male] of maleData) {
    const female = femaleData.get(group);
    if (female) {
      result.set(group, {
        w2015: (male.w2015 + female.w2015) / 2,
        w2023: (male.w2023 + female.w2023) / 2,
      });
    } else {
      result.set(group, male);
    }
  }

  console.log(`  Loaded income data for ${result.size} groups`);
  for (const [name, data] of result) {
    console.log(`    ${name}: 2015=${data.w2015}, 2023=${data.w2023}`);
  }
  return result;
}

function findBestMatch<T>(
  needle: string,
  haystack: Map<string, T>
): T | undefined {
  // 1. Exact match
  const exact = haystack.get(needle);
  if (exact) return exact;

  // 2. Case-insensitive exact
  for (const [name, data] of haystack) {
    if (name.toLowerCase() === needle.toLowerCase()) return data;
  }

  // 3. Longest substring match (prefer more specific matches)
  let bestMatch: T | undefined;
  let bestLen = 0;
  for (const [name, data] of haystack) {
    const nl = needle.toLowerCase();
    const hl = name.toLowerCase();
    if (nl.includes(hl) || hl.includes(nl)) {
      const matchLen = Math.min(nl.length, hl.length);
      if (matchLen > bestLen) {
        bestLen = matchLen;
        bestMatch = data;
      }
    }
  }
  return bestMatch;
}

function computeGroupMarketData(
  emplData: Map<string, { e2015: number; e2025: number }>,
  incomeData: Map<string, { w2015: number; w2023: number }>
): Map<string, GroupMarketData> {
  console.log("Computing group-level market data...");

  const result = new Map<string, GroupMarketData>();

  for (const [majorGroup, csvName] of Object.entries(MAJOR_GROUP_TO_EMPL_CSV)) {
    // Find employment data
    const emplEntry = findBestMatch(csvName, emplData);

    // Find income data
    const incomeCsvName = MAJOR_GROUP_TO_INCOME_CSV[majorGroup];
    const incomeEntry = findBestMatch(incomeCsvName, incomeData);

    if (emplEntry && incomeEntry) {
      // 10-year employment CAGR
      const emplCagr = Math.pow(emplEntry.e2025 / emplEntry.e2015, 1 / 10) - 1;
      // 8-year wage CAGR
      const wageCagr = Math.pow(incomeEntry.w2023 / incomeEntry.w2015, 1 / 8) - 1;

      result.set(majorGroup, {
        employment_2015: emplEntry.e2015,
        employment_2025: emplEntry.e2025,
        employment_cagr: emplCagr,
        wage_2015: incomeEntry.w2015,
        wage_2023: incomeEntry.w2023,
        wage_cagr: wageCagr,
      });

      console.log(
        `  ${majorGroup}: empl_cagr=${(emplCagr * 100).toFixed(2)}%, wage_cagr=${(wageCagr * 100).toFixed(2)}%`
      );
    } else {
      console.warn(`  WARNING: Missing market data for ${majorGroup} (empl=${!!emplEntry}, income=${!!incomeEntry})`);
    }
  }

  return result;
}

// ===== Risk Band Classification =====
function riskBand(netRisk: number): RiskBand {
  if (netRisk < 0.05) return "very_low";
  if (netRisk < 0.15) return "low";
  if (netRisk < 0.30) return "moderate";
  if (netRisk < 0.50) return "high";
  return "very_high";
}

// Impact type from displacement × augmentation 2×2 matrix
function impactType(
  displacement: number,
  augmentation: number
): "at_risk" | "ai_leveraged" | "stable" | "mixed" {
  const highDisplacement = displacement >= 0.25;
  const highAugmentation = augmentation >= 0.15;

  if (highDisplacement && !highAugmentation) return "at_risk";
  if (highDisplacement && highAugmentation) return "mixed";
  if (!highDisplacement && highAugmentation) return "ai_leveraged";
  return "stable";
}

// Map impact_type to legacy category for backward compatibility
function impactTypeToCategory(
  impact: "at_risk" | "ai_leveraged" | "stable" | "mixed"
): string {
  switch (impact) {
    case "ai_leveraged":
      return "high_exposure_high_complementarity";
    case "at_risk":
      return "high_exposure_low_complementarity";
    case "stable":
      return "low_exposure";
    case "mixed":
      return "high_exposure_high_complementarity";
  }
}

// ===== Step 7: Score all occupations (V3.1) =====
function scoreOccupations(
  sgOccs: SgOccupation[],
  aioeMap: Map<string, number>,
  thetaMap: Map<string, number>,
  groupMarket: Map<string, GroupMarketData>,
  anthropicExposure: Map<string, number>,
  solData: { exactCodes: Set<string>; prefixes: Set<string> }
): ScoredOccupation[] {
  console.log("\nScoring occupations (V3.1)...");

  // Pre-compute theta_MIN for C-AIOE formula
  const allTheta = [...thetaMap.values()];
  const thetaMin = Math.min(...allTheta);
  console.log(
    `  Theta range: min=${thetaMin.toFixed(4)}, max=${Math.max(
      ...allTheta
    ).toFixed(4)}, median=${medianFn(allTheta).toFixed(4)}`
  );

  // Pre-compute AIOE stats
  const allAioe = [...aioeMap.values()];
  console.log(
    `  AIOE range: min=${Math.min(...allAioe).toFixed(4)}, max=${Math.max(
      ...allAioe
    ).toFixed(4)}, median=${medianFn(allAioe).toFixed(4)}`
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

  // First pass: compute raw aioe/theta per occupation (same crosswalk logic as before)
  interface IntermediateResult {
    occ: SgOccupation;
    avgAioe: number;
    avgTheta: number;
    matchQuality: "direct" | "submajor_fallback" | "major_fallback";
    iscoMatched: string[];
    majorGroupCode: number;
    anthropicMatch: boolean;
    anthropicObservedExposure: number | null;
    solMatch: boolean;
    aioeDispersion: number;
    thetaDispersion: number;
  }

  const intermediates: IntermediateResult[] = [];

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
    if (avgAioe === null) avgAioe = medianFn(allAioe);
    if (avgTheta === null) avgTheta = medianFn(allTheta);

    if (matchQuality === "direct" && socCodes.length > 0) {
      directMatches++;
    } else if (matchQuality === "submajor_fallback") {
      subMajorFallbacks++;
    } else {
      majorFallbacks++;
    }

    const majorGroupCode =
      MAJOR_GROUP_CODES[occ.major_group] || parseInt(occ.ssoc[0]) || 0;

    // === Anthropic observed exposure for matched SOC codes ===
    let anthropicMatch = false;
    let anthropicObservedExposure: number | null = null;
    if (socCodes.length > 0 && anthropicExposure.size > 0) {
      const anthropicValues: number[] = [];
      for (const soc of socCodes) {
        const val = anthropicExposure.get(soc);
        if (val !== undefined) {
          anthropicValues.push(val);
        }
      }
      if (anthropicValues.length > 0) {
        anthropicMatch = true;
        anthropicObservedExposure = anthropicValues.reduce((a, b) => a + b, 0) / anthropicValues.length;
      }
    }

    // === MOM SOL match ===
    const solMatch = isSolMatch(occ.ssoc, solData);

    // === Crosswalk dispersion (std dev of AIOE/theta across matched SOC codes) ===
    let aioeDispersion = 0;
    let thetaDispersion = 0;
    if (socCodes.length > 1) {
      const aioeVals: number[] = [];
      const thetaVals: number[] = [];
      for (const soc of socCodes) {
        const a = aioeMap.get(soc);
        if (a !== undefined) aioeVals.push(a);
        const t = thetaMap.get(soc);
        if (t !== undefined) thetaVals.push(t);
      }
      aioeDispersion = computeDispersion(aioeVals);
      thetaDispersion = computeDispersion(thetaVals);
    }

    intermediates.push({
      occ,
      avgAioe,
      avgTheta,
      matchQuality,
      iscoMatched,
      majorGroupCode,
      anthropicMatch,
      anthropicObservedExposure,
      solMatch,
      aioeDispersion,
      thetaDispersion,
    });
  }

  const coverage = (directMatches / sgOccs.length) * 100;
  console.log(`  Direct crosswalk matches: ${directMatches}/${sgOccs.length} (${coverage.toFixed(1)}%)`);
  console.log(`  Sub-major group fallbacks: ${subMajorFallbacks}`);
  console.log(`  Major group fallbacks: ${majorFallbacks}`);

  // ===== Second pass: compute percentile ranks across all matched occupations =====
  console.log("\n  Computing percentile ranks...");
  const rawAioeValues = intermediates.map(r => r.avgAioe);
  const rawThetaValues = intermediates.map(r => r.avgTheta);
  const aioeRanks = percentileRanks(rawAioeValues);
  const thetaRanks = percentileRanks(rawThetaValues);

  // ===== Market Momentum: group-level =====
  console.log("  Computing market momentum...");
  const allGroups = [...new Set(intermediates.map(r => r.occ.major_group))];
  const groupCagrEmpl: number[] = [];
  const groupCagrWage: number[] = [];
  const groupToIdx = new Map<string, number>();

  for (const g of allGroups) {
    const mkt = groupMarket.get(g);
    groupToIdx.set(g, groupCagrEmpl.length);
    groupCagrEmpl.push(mkt ? mkt.employment_cagr : 0);
    groupCagrWage.push(mkt ? mkt.wage_cagr : 0);
  }

  const emplCagrRanks = percentileRanks(groupCagrEmpl);
  const wageCagrRanks = percentileRanks(groupCagrWage);

  // Market momentum per group
  const groupMomentum = new Map<string, number>();
  for (const g of allGroups) {
    const idx = groupToIdx.get(g)!;
    const mm = (emplCagrRanks[idx] + wageCagrRanks[idx]) / 2;
    groupMomentum.set(g, mm);
  }

  // ===== Occupation Scarcity =====
  console.log("  Computing occupation scarcity...");

  // Compute log(q75/q25) for each occupation
  const logWageSpreads: number[] = [];
  const logWageSpreadMap: (number | null)[] = [];
  for (const r of intermediates) {
    const q25 = r.occ.gross_wage_25th;
    const q75 = r.occ.gross_wage_75th;
    if (q25 !== null && q75 !== null && q25 > 0 && q75 > 0) {
      logWageSpreads.push(Math.log(q75 / q25));
      logWageSpreadMap.push(Math.log(q75 / q25));
    } else {
      logWageSpreadMap.push(null);
    }
  }

  // Winsorize log wage spreads at 1st/99th percentile
  const winsorizedSpreads = winsorize(logWageSpreads, 0.01, 0.99);
  // Map winsorized values back
  let wIdx = 0;
  const finalLogSpreads: (number | null)[] = logWageSpreadMap.map(v => {
    if (v !== null) return winsorizedSpreads[wIdx++];
    return null;
  });

  // Compute within-group median ratio: occupation gross_wage_median / group median
  // Group median = median of gross_wage_median values within the group
  const groupWageMedians = new Map<string, number[]>();
  for (const r of intermediates) {
    if (r.occ.gross_wage_median !== null) {
      if (!groupWageMedians.has(r.occ.major_group)) {
        groupWageMedians.set(r.occ.major_group, []);
      }
      groupWageMedians.get(r.occ.major_group)!.push(r.occ.gross_wage_median);
    }
  }
  // Use official group_median_income from MOM source data (not recomputed)
  // Fall back to computed median only if source field is missing
  const groupMedianWage = new Map<string, number>();
  for (const r of intermediates) {
    if (r.occ.group_median_income !== null && r.occ.group_median_income > 0) {
      groupMedianWage.set(r.occ.major_group, r.occ.group_median_income);
    }
  }
  // Fill any missing groups with computed median
  for (const [g, wages] of groupWageMedians) {
    if (!groupMedianWage.has(g)) {
      groupMedianWage.set(g, medianFn(wages));
    }
  }

  const withinGroupRatios: (number | null)[] = intermediates.map(r => {
    if (r.occ.gross_wage_median !== null) {
      const gm = groupMedianWage.get(r.occ.major_group);
      if (gm && gm > 0) return r.occ.gross_wage_median / gm;
    }
    return null;
  });

  // Percentile-rank both components, using only non-null values
  // For null values, assign the median rank (0.5)
  const validLogSpreads = finalLogSpreads.filter(v => v !== null) as number[];
  const validRatios = withinGroupRatios.filter(v => v !== null) as number[];
  const logSpreadRanksValid = percentileRanks(validLogSpreads);
  const ratioRanksValid = percentileRanks(validRatios);

  // Map back to full arrays
  let lsIdx = 0;
  let rrIdx = 0;
  const logSpreadRanks = finalLogSpreads.map(v => v !== null ? logSpreadRanksValid[lsIdx++] : 0.5);
  const ratioRanks = withinGroupRatios.map(v => v !== null ? ratioRanksValid[rrIdx++] : 0.5);

  // Occupation scarcity = mean of two percentile ranks
  const occScarcity = intermediates.map((_, i) => (logSpreadRanks[i] + ratioRanks[i]) / 2);

  // ===== V3.1: Anthropic exposure calibration =====
  // Compute percentile ranks of Anthropic observed exposure for calibration
  console.log("  Applying Anthropic exposure calibration...");
  const anthropicValues = intermediates.map(r => r.anthropicObservedExposure);
  const validAnthropicValues = anthropicValues.filter(v => v !== null) as number[];
  let anthropicPctiles: number[] = [];
  if (validAnthropicValues.length > 0) {
    const anthropicRanksValid = percentileRanks(validAnthropicValues);
    let aIdx = 0;
    anthropicPctiles = anthropicValues.map(v => v !== null ? anthropicRanksValid[aIdx++] : -1);
  } else {
    anthropicPctiles = intermediates.map(() => -1);
  }

  let anthropicCalibrationCount = 0;
  let solMatchCount = 0;

  // ===== Assemble final results =====
  console.log("  Assembling final results...");
  const results: ScoredOccupation[] = [];

  for (let i = 0; i < intermediates.length; i++) {
    const r = intermediates[i];
    let exposure = aioeRanks[i];
    const bottleneck = thetaRanks[i];

    // === 4a: Anthropic exposure calibration ===
    // If we have observed usage data, adjust exposure by up to ±30%
    if (anthropicPctiles[i] >= 0) {
      const observedPctile = anthropicPctiles[i];
      const exposureCalibrated = exposure + 0.3 * (observedPctile - exposure);
      exposure = Math.max(0, Math.min(1, exposureCalibrated));
      anthropicCalibrationCount++;
    }

    const mm = groupMomentum.get(r.occ.major_group) ?? 0.5;
    const os = occScarcity[i];
    let marketResilience = 0.6 * mm + 0.4 * os;

    // === 4b: MOM SOL demand bonus ===
    // SOL occupations get a 15% boost to market_resilience
    let marketResilienceAdjusted = marketResilience;
    if (r.solMatch) {
      marketResilienceAdjusted = Math.min(1.0, marketResilience + 0.15);
      solMatchCount++;
    }
    const marketModifier = 1 - 0.35 * marketResilienceAdjusted;

    const netRisk = exposure * (1 - bottleneck) * marketModifier;
    const band = riskBand(netRisk);

    // C-AIOE for backward compat
    const cAioe = r.avgAioe * (1 - (r.avgTheta - thetaMin));

    // === 4c: Crosswalk dispersion penalty for confidence ===
    let crosswalkQuality = r.matchQuality === "direct" ? 1.0
      : r.matchQuality === "submajor_fallback" ? 0.6 : 0.3;

    if (r.aioeDispersion > 0 || r.thetaDispersion > 0) {
      const dispersionPenalty = Math.max(0, 1 - (r.aioeDispersion + r.thetaDispersion) * 2);
      crosswalkQuality = crosswalkQuality * dispersionPenalty;
    }

    // === 4d: Variable confidence factors ===
    const marketDataGranularity = r.solMatch ? 0.8 : 0.6;
    const sourceFreshness = r.anthropicMatch ? 0.9 : 0.7;

    const confidenceScore = (crosswalkQuality + marketDataGranularity + sourceFreshness) / 3;
    const confidenceLevel: "high" | "medium" | "low" =
      confidenceScore >= 0.7 ? "high" : confidenceScore >= 0.4 ? "medium" : "low";

    results.push({
      ssoc: r.occ.ssoc,
      title: r.occ.title,
      major_group: r.occ.major_group,
      major_group_code: r.majorGroupCode,
      gross_wage_median: r.occ.gross_wage_median,
      gross_wage_25th: r.occ.gross_wage_25th,
      gross_wage_75th: r.occ.gross_wage_75th,
      employment_thousands: r.occ.estimated_employment_thousands,
      group_employment_thousands: r.occ.group_employment_thousands,
      exposure: round(exposure, 4),
      bottleneck: round(bottleneck, 4),
      market: {
        market_momentum: round(mm, 4),
        occupation_scarcity: round(os, 4),
        market_resilience: round(marketResilienceAdjusted, 4),
        market_modifier: round(marketModifier, 4),
      },
      net_risk: round(netRisk, 4),
      risk_band: band,
      augmentation: round(exposure * bottleneck * marketResilienceAdjusted, 4),
      augmentation_band: riskBand(exposure * bottleneck * marketResilienceAdjusted),
      impact_type: impactType(netRisk, exposure * bottleneck * marketResilienceAdjusted),
      confidence: {
        score: round(confidenceScore, 4),
        level: confidenceLevel,
        crosswalk_quality: round(crosswalkQuality, 4),
        market_data_granularity: marketDataGranularity,
        source_freshness: sourceFreshness,
      },
      raw: {
        aioe: round(r.avgAioe, 4),
        theta: round(r.avgTheta, 4),
        c_aioe: round(cAioe, 4),
        log_wage_spread: finalLogSpreads[i] !== null ? round(finalLogSpreads[i]!, 4) : null,
        wage_position: withinGroupRatios[i] !== null ? round(withinGroupRatios[i]!, 4) : null,
      },
      isco_codes_matched: r.iscoMatched,
      match_quality: r.matchQuality,
      // Backward-compat scores object for frontend
      scores: {
        aioe: round(r.avgAioe, 4),
        theta: round(r.avgTheta, 4),
        c_aioe: round(cAioe, 4),
        category: impactTypeToCategory(impactType(netRisk, exposure * bottleneck * marketResilienceAdjusted)),
        isco_codes_matched: r.iscoMatched,
        match_quality: r.matchQuality,
      },
    });
  }

  console.log(`  Anthropic calibration applied to ${anthropicCalibrationCount} occupations`);
  console.log(`  MOM SOL match bonus applied to ${solMatchCount} occupations`);

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

// ===== Helpers =====
function medianFn(arr: number[]): number {
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

// ===== Distribution Analysis =====
function printDistributionAnalysis(results: ScoredOccupation[]) {
  console.log("\n=== V3 Risk Band Distribution ===");
  const bands: RiskBand[] = ["very_low", "low", "moderate", "high", "very_high"];
  const bandLabels: Record<RiskBand, string> = {
    very_low: "Very Low  (0.00-0.05)",
    low: "Low       (0.05-0.15)",
    moderate: "Moderate  (0.15-0.30)",
    high: "High      (0.30-0.50)",
    very_high: "Very High (0.50+)    ",
  };

  const bandCounts = new Map<RiskBand, number>();
  for (const b of bands) bandCounts.set(b, 0);
  for (const r of results) {
    bandCounts.set(r.risk_band, (bandCounts.get(r.risk_band) ?? 0) + 1);
  }

  for (const b of bands) {
    const count = bandCounts.get(b) ?? 0;
    const pct = ((count / results.length) * 100).toFixed(1);
    const bar = "#".repeat(Math.round(count / 5));
    console.log(`  ${bandLabels[b]}: ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  }

  // Impact type distribution
  console.log("\n=== Impact Type Distribution ===");
  const impactTypes = { at_risk: 0, ai_leveraged: 0, stable: 0, mixed: 0 };
  for (const r of results) impactTypes[r.impact_type]++;
  console.log(`  At Risk:      ${String(impactTypes.at_risk).padStart(4)} (${((impactTypes.at_risk / results.length) * 100).toFixed(1)}%)`);
  console.log(`  AI Leveraged: ${String(impactTypes.ai_leveraged).padStart(4)} (${((impactTypes.ai_leveraged / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Stable:       ${String(impactTypes.stable).padStart(4)} (${((impactTypes.stable / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Mixed:        ${String(impactTypes.mixed).padStart(4)} (${((impactTypes.mixed / results.length) * 100).toFixed(1)}%)`);

  // Anchor check
  console.log("\n=== Anchor Check ===");
  const anchors = [
    { pattern: /software developer/i, label: "Software Developer" },
    { pattern: /data entry/i, label: "Data Entry Clerk" },
    { pattern: /surgeon/i, label: "Surgeon" },
    { pattern: /cashier/i, label: "Cashier" },
    { pattern: /teacher/i, label: "Teacher (first match)" },
    { pattern: /accountant/i, label: "Accountant" },
    { pattern: /data scientist/i, label: "Data Scientist (SOL)" },
    { pattern: /cyber.*architect/i, label: "Cybersec Architect (SOL)" },
    { pattern: /registered nurse/i, label: "Registered Nurse (SOL)" },
    { pattern: /physiotherapist/i, label: "Physiotherapist (SOL)" },
    { pattern: /cloud specialist/i, label: "Cloud Specialist (SOL)" },
  ];

  for (const anchor of anchors) {
    const match = results.find(r => anchor.pattern.test(r.title));
    if (match) {
      console.log(
        `  ${anchor.label.padEnd(25)} | ${match.title.substring(0, 40).padEnd(40)} | ` +
        `exp=${match.exposure.toFixed(3)} bot=${match.bottleneck.toFixed(3)} ` +
        `mkt=${match.market.market_modifier.toFixed(3)} net=${match.net_risk.toFixed(3)} ` +
        `aug=${match.augmentation.toFixed(3)} [${match.risk_band}] [${match.impact_type}]`
      );
    } else {
      console.log(`  ${anchor.label.padEnd(25)} | NOT FOUND`);
    }
  }

  // Histogram of net_risk in 0.05 bins
  console.log("\n=== Net Risk Histogram (0.05 bins) ===");
  const binSize = 0.05;
  const bins = new Map<string, number>();
  for (let b = 0; b < 1.0; b += binSize) {
    const label = `${b.toFixed(2)}-${(b + binSize).toFixed(2)}`;
    bins.set(label, 0);
  }

  for (const r of results) {
    const binIdx = Math.min(Math.floor(r.net_risk / binSize), 19);
    const b = binIdx * binSize;
    const label = `${b.toFixed(2)}-${(b + binSize).toFixed(2)}`;
    bins.set(label, (bins.get(label) ?? 0) + 1);
  }

  for (const [label, count] of bins) {
    if (count === 0) continue;
    const bar = "#".repeat(Math.round(count / 3));
    console.log(`  ${label}: ${String(count).padStart(4)} ${bar}`);
  }
}

// ===== Main =====
async function main() {
  console.log("=== Singapore AI Job Exposure Scoring Pipeline (V3.1) ===\n");

  // Load all data sources
  const aioeMap = loadAioe();
  const wcMap = loadWorkContext();
  const jzMap = loadJobZones();
  const thetaMap = computeTheta(wcMap, jzMap);
  const sgOccs = loadSgOccupations();

  // Load market data
  const emplData = loadEmploymentData();
  const incomeData = loadIncomeData();
  const groupMarket = computeGroupMarketData(emplData, incomeData);

  // Load V3.1 data sources
  const anthropicExposure = loadAnthropicExposure();
  const solData = loadMomSol();

  // Score all occupations
  const results = scoreOccupations(sgOccs, aioeMap, thetaMap, groupMarket, anthropicExposure, solData);

  // Distribution analysis
  printDistributionAnalysis(results);

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
