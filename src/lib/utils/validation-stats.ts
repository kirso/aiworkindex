/**
 * Shared deterministic statistics primitives for validation artifacts.
 *
 * These are faithful moves of previously-private helpers (scripts/backtest.ts,
 * src/lib/data/uncertainty-core.ts) so that backtests, the uncertainty engine,
 * and the sensitivity-analysis pipeline share one implementation. Any change
 * here must keep backtest and uncertainty outputs byte-identical.
 */

/**
 * Average tied ranks (1-based) so a column of identical values does not produce
 * a spurious monotonic ordering (matches the BLS-crosswalk validator).
 */
export function averageRanks(arr: number[]): number[] {
	const n = arr.length;
	const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
	const ranks = new Array<number>(n);
	let i = 0;
	while (i < n) {
		const current = sorted[i];
		if (!current) break;
		let j = i;
		while (j + 1 < n && sorted[j + 1]?.v === current.v) j++;
		const avgRank = (i + j) / 2 + 1;
		for (let k = i; k <= j; k++) {
			const item = sorted[k];
			if (item) ranks[item.i] = avgRank;
		}
		i = j + 1;
	}
	return ranks;
}

/**
 * Tie-corrected Spearman rank correlation (Pearson on tie-averaged ranks).
 * Returns NaN for n < 3 or zero-variance columns (undefined, not 0).
 */
export function spearmanCorrelation(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length < 3) return NaN;
	const n = x.length;

	const rx = averageRanks(x);
	const ry = averageRanks(y);

	const meanX = rx.reduce((s, v) => s + v, 0) / n;
	const meanY = ry.reduce((s, v) => s + v, 0) / n;
	let cov = 0;
	let varX = 0;
	let varY = 0;
	for (let i = 0; i < n; i++) {
		const dx = (rx[i] ?? 0) - meanX;
		const dy = (ry[i] ?? 0) - meanY;
		cov += dx * dy;
		varX += dx * dx;
		varY += dy * dy;
	}
	if (varX === 0 || varY === 0) return NaN;
	return cov / Math.sqrt(varX * varY);
}

/** Jaccard overlap |A ∩ B| / |A ∪ B| between two sets of keys. */
export function jaccard(a: Set<string>, b: Set<string>): number {
	if (a.size === 0 && b.size === 0) return 1;
	let intersection = 0;
	for (const key of a) if (b.has(key)) intersection++;
	const union = a.size + b.size - intersection;
	return union === 0 ? 1 : intersection / union;
}

/**
 * Nearest-rank quantile over a pre-sorted ascending array
 * (faithful move from uncertainty-core; floor-index convention).
 */
export function quantile(sortedValues: number[], probability: number): number {
	if (sortedValues.length === 0) return 0;
	const index = Math.max(
		0,
		Math.min(sortedValues.length - 1, Math.floor(probability * (sortedValues.length - 1)))
	);
	return sortedValues[index] ?? 0;
}

/** FNV-style deterministic seed from numeric inputs (move from uncertainty-core). */
export function seedFromInputs(values: number[]): number {
	let seed = 2166136261;
	for (const value of values) {
		const scaled = Math.round(value * 10000);
		seed ^= scaled;
		seed = Math.imul(seed, 16777619);
	}
	return seed >>> 0;
}

/** Mulberry32 seeded PRNG in [0, 1) (move from uncertainty-core). */
export function mulberry32(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
