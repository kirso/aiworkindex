# Redesign Spec — "Swiss Editorial" (approved June 2026)

Decision: the site moves from the current shadcn-default look to the **V2 Swiss editorial
direction** — approved against three mockups (`docs/design/v2-swiss.html` is the reference;
v1/v3 retained for the record). The goal: look like a citable publication (Economist/OWID
register), not an internal dashboard, and fix the information-architecture problems that make
pages feel cluttered.

## Why (diagnosis from the June 2026 UX review)

1. Six interchangeable chip primitives (`pill`, `badge`, `chip`, `riskBadge`, `impactBadge`,
   `confidenceBadge`) render near-identically while meaning different things: classification,
   taxonomy, null signals, comparisons, links, method notes, skills. Readers cannot tell what
   is what.
2. `caption()` is used 51× on the occupation page — everything below the hero is small gray
   text with no hierarchy.
3. Color carries meaning (risk bands) AND decoration (section accents, six border colors on
   rankings cards) simultaneously, so it stops carrying meaning.
4. The worker story and the audit trail (sources, confidence caps, V6 deltas, caveats) are
   interleaved; every section hedges separately in italic gray.

## Design tokens

### Typography
- **Display + UI**: Schibsted Grotesk (via `@fontsource/schibsted-grotesk`; weights 400/500/700/900).
- **Data + labels**: IBM Plex Mono (via `@fontsource/ibm-plex-mono`; weights 400/500/600).
  ALL numerals, stats, micro-labels, breadcrumbs render in mono with `tnum`.
- Type scale (replaces caption-everywhere): display 64/900 (page h1), score 104/900,
  section 24/700, body 15/400, small 13.5, mono-label 11 uppercase tracked.

### Color (strict reservation)
- Neutrals: `--bg #ffffff`, `--ink #0c0c0c`, `--ink-2 #444`, `--ink-3 #8b8b8b`,
  `--rule #e3e3e3`, `--rule-strong #0c0c0c`.
- **Signal accent**: `#e3120b` — the only brand color. Used for: top rule, section numbers,
  the underline device in verdict sentences, links on hover. Never for data.
- **Risk scale** (the only other chromatic system): vh `#d6151c`, h `#e8702a`, m `#d9a514`,
  l `#48a06c`, vl `#2a7f62`. Used ONLY when encoding risk/direction semantics.
- Everything decorative that is currently colored (section accents, ranking card borders,
  programme pill green/blue) becomes neutral.

### Structure
- Hairline rules (`--rule`) and strong rules (`--rule-strong`) replace card borders wherever
  content is sequential. Cards survive only where true grouping is needed.
- Numbered sections (mono `01`, `02` in signal red + grotesque section title).
- Stat strips: columns separated by rules, mono micro-label over big numeral over one-line note.

## The 3-chip contract (deletes the six-primitive zoo)

| Type | Look | Allowed content | Cap |
|---|---|---|---|
| **Status badge** | filled band-color block / 5-segment band mark | risk band, impact type | ≤2 per page |
| **Data chip** | neutral `#f4f4f4` bg, mono 11.5px uppercase | comparisons, skills, method tags | use sparingly |
| **Link pill** | 1.5px ink border, grotesque 600, trailing `→` | navigation only (programmes, related) | — |

Everything else becomes prose, table cells, or disappears:
- Taxonomy (group name, SSOC) → mono breadcrumb line.
- Null signals ("No shortage listing") → never rendered as chips; a sentence in the demand
  section if worth saying at all.
- Method notes ("Similarity-based") → mono micro-label or footnote.

## One caveat device

A single "how to read this" pattern: `※` in signal red + 13px `--ink-3` text. Used once in the
hero (structural-pressure-not-prediction) and at most once per section where a real
interpretive caveat exists. All per-section italic hedging is deleted; detailed caveats live in
Technical Details / methodology.

## Occupation page IA (reference: v2-swiss.html)

1. **Hero**: breadcrumb (mono) → h1 → verdict panel split: left = score label, 104px numeral,
   5-segment band mark + band word, P10–P90 range (mono); right = one verdict sentence with the
   key fact underlined in signal red, one mono meta line (wage · workers · rank · vs-group ·
   updated), the single hero caveat.
2. **01 Why this score**: driver table (name+sub | bar | mono value | direction in risk color),
   then two columns: "AI already does" (top observed tasks) / "Still needs a person"
   (insulation channels + protected tasks + one-line absence-of-evidence note).
3. **02 Singapore now**: 4-column stat strip.
4. **03 What you can do**: quadrant alert (left risk-red bar + bold lead) when applicable;
   transitions as a table (move | Δrisk | feasibility | wage); programme link pills; skill
   data chips.
5. **Technical Details (collapsed)**: absorbs role-profile radar, sources, confidence
   breakdown, V6 baseline delta, evidence bars, career-stage table.
6. FAQ stays last; compare/related links inline at section ends.

## Implementation slices (each ends green: `bun run check && bun run lint && bun run build`)

- **S1 — tokens**: install fontsource packages, rewrite `src/app.css` `@theme` tokens +
  `src/lib/design-system.ts` to the contract above (new variants; old ones aliased then
  removed), global masthead/topline.
- **S2 — occupation page**: restructure to the IA above; role page follows the same template.
- **S3 — home / explore / rankings**: homepage hero + treemap framing, explore list rows
  (rule-separated rows, band mark instead of filled badges), rankings index (neutral cards,
  numbered).
- **S4 — methodology / data / calculator / compare sweep** + delete dead design-system
  variants; verify no `rounded-lg border bg-card` raw usage remains.

Mockups carry real Secretary (SSOC 41201) data and demonstrate every pattern above.
