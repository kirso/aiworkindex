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

## Complete coverage matrix (audited June 2026: 43 routes, 38 UI components, 11 viz components)

### Routes → template families

| Family | Routes | Treatment | Slice |
|---|---|---|---|
| Detail | `/occupation/[ssoc]`, `/[country]/occupation/[code]`, `/global/occupation/[code]`, `/role/[slug]`, `/us/role/[slug]` | The reference IA (hero verdict panel, numbered sections, Technical Details) — one template, five consumers | S2 |
| Home | `/`, `/[country]`, `/global` | Masthead + search-first hero; treemap reframed under a numbered section; the four list columns become two rule-separated tables | S3 |
| List/browse | `/explore`, `/roles`, `/groups`, `/group/[slug]`, `/watchlist` | Rule-separated rows; filled band badges → 5-segment band mark + mono % | S3 |
| Rankings | `/rankings` + 9 views | Index: neutral cards, numbered, color only in band marks. Views: tables per V2; dumbbell/graph views keep their viz restyled to tokens | S3 |
| Tools | `/calculator`, `/compare` | Form controls restyled (mono values, ink focus rings); result panels use the verdict-panel pattern | S4 |
| Reference | `/methodology`, `/methodology/appendix`, `/about`, `/data`, `/research`, `/changelog` | Long-form editorial: numbered sections, tables over cards; validation cards become ruled blocks | S4 |
| Reports | `/reports` + q4-2024, v4-3-shadow, v5-experimental, v5-roadmap, v6-release, v7-release, wage-exposure | Same long-form treatment; older report pages get tokens-only pass (no re-layout) | S4 |
| Editorial/SEO | `/ai-job-loss`, `/ai-proof-jobs`, `/will-ai-take-my-job` | Article template: serifless editorial, verdict panels reused | S4 |
| Chrome | `+layout.svelte` (masthead, footer, command menu), `+error.svelte` (MISSING — create) | Signal-red topline, mono breadcrumbs, ruled footer; designed 404 | S1/S5 |

### UI components (38) — disposition

- **Restyle to contract (S1, used everywhere)**: `button`, `input`, `label`, `slider`,
  `separator`, `table`, `tabs`, `tooltip`, `dialog`, `sheet`, `collapsible`, `alert`,
  `command`/`CommandMenu` (search), `sonner` (toasts), `breadcrumb`/`PageBreadcrumb`,
  `PageFooterNav`.
- **Merge into the 3-chip contract (S1)**: `badge` component + design-system `pill`, `chip`,
  `riskBadge`, `impactBadge`, `confidenceBadge` → `statusBadge` / `dataChip` / `linkPill`.
  `RankingNavPills` becomes link-pill row.
- **Restyle per detail-page IA (S2)**: `OccupationHero`, `OccupationCard`,
  `OccupationCardList`, `ScoreMetricGrid`, `DemandOutlookCard`, `WageCard`,
  `WorkContextCard`, `TaskListCard`, `RequirementsList`, `OccupationSupportBundle`,
  `EvidenceModuleGrid`, `ContextItemGrid`, `PostingsSignalSummary`, `FaqList`.
- **Restyle (S3)**: `HeroSearch`, `FilterPanel`, `RankingTable`.
- **No visual change**: `Seo`.

### Viz components (11) — token mapping (S2/S3 alongside their host pages)

All D3 components consume the new tokens: risk scale = the 5 reserved colors; everything else
ink/rule neutrals; axis/annotation text → IBM Plex Mono 10–11px; gridlines `--rule`.

| Component | Notes |
|---|---|
| `Treemap` | band colors only; labels mono; remove gradients/shadows |
| `DriverWaterfall` | aligns with the driver-table aesthetic (flat bars, mono values) |
| `Histogram`, `DemandPressureMatrix` | neutral bars + band-colored highlights |
| `QuarterlyMoversDumbbell`, `TheoryPracticeDumbbell` | ink dots, signal-red delta lines |
| `TransitionGraph` | ink edges, band-colored nodes |
| `WorkflowRadar` | moves inside Technical Details; neutral ink stroke |
| `EvidenceBar`, `SignalProfileGrid` | mono labels, neutral fills |
| `Tooltip` (viz) | white, 1px ink border, mono text |

### Typography migration (S1, enforced by deletion)

Old `design-system.ts` text variants are deleted, forcing migration:
`display`→`display`, `title`→`heading`, `sectionLabel`→`sectionNumber`+`sectionTitle`,
`body` stays, `caption`+`microLabel`→`monoLabel` (11px tracked) or plain `small` (13.5px),
`mono`→`dataValue` (Plex Mono, tnum). Rule: numerals are NEVER grotesque.

### OG share cards (S5)

`scripts/generate-og.ts` currently draws Inter + ink-blue cards — a different brand than the
site. Redesign cards to the Swiss identity (white, ink, Schibsted Grotesk bold, band mark,
signal-red rule); ship the font file to `static/fonts/`. The freshness guard signs scores, not
pixels, so the redesign itself cannot trip it — but all SG + role + US PNGs must be
regenerated in the same slice.

### States & odds-and-ends (S5)

Mobile nav (sheet) and responsive collapse of the verdict panel; command-menu styling; toast
styling; focus-visible rings (2px ink); selection color (signal red, white text); favicon +
logo lockup (wordmark in Schibsted Grotesk 900); designed `+error.svelte`; print stylesheet
(editorial design should print well — cheap win).

### Dark mode — explicit decision

`app.css` has `.dark` token plumbing but the editorial identity is print-light. Decision:
**light-only at launch**; keep the `.dark` custom-variant plumbing dormant. Revisit only after
the light identity ships everywhere.

## Implementation slices (revised; each ends green: `bun run check && bun run lint && bun run build`)

- **S1 — foundation**: fontsource packages, `app.css` `@theme` rewrite, `design-system.ts`
  rewrite (3-chip contract + new type scale, old variants deleted), shared chrome (masthead,
  topline, footer, breadcrumbs, buttons/inputs/tabs/dialogs/toasts). Site-wide but mechanical.
- **S2 — detail family**: occupation/role/country detail template + their 14 components +
  their viz (waterfall, radar, evidence bar).
- **S3 — discovery**: home ×3, explore/list family, rankings index + 9 views, treemap/
  histogram/dumbbells/graph, HeroSearch/FilterPanel/RankingTable.
- **S4 — reading surfaces**: methodology + appendix, about, data, research, changelog,
  reports ×8, calculator, compare, editorial/SEO pages ×3.
- **S5 — chrome & identity**: OG card redesign + full regeneration, error page, favicon/logo,
  mobile/responsive audit, print stylesheet, dead-code sweep (no raw `rounded-lg border
  bg-card`, no orphaned variants).

Mockups carry real Secretary (SSOC 41201) data and demonstrate every pattern above.
