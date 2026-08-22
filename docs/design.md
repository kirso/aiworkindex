# Design system — AI Work Index

This is the visual single source of truth. Variant constructors live in
`src/lib/design-system.ts`. Tokens live in `src/app.css`. Do not duplicate either
here as a second implementation.

The archived June 2026 Swiss spec in `docs/design/REDESIGN_SPEC.md` is historical.
V9 keeps its editorial intent (answer first, colour encodes one thing, chips mean
distinct jobs) and drops V8 risk-band chrome from consumer surfaces.

## What this product is

A compact, evidence-rich Singapore work explorer. A worker can search a familiar
job title, open the final occupation in one action, scan AI task pressure, pay,
named demand and available capability evidence, and decide what to inspect or
try next. It is not a job-loss meter or a methods appendix. Its data-workspace
density is intentional.

## Stack

- **shadcn-svelte** with the **Lyra** registry style (`components.json`:
  `style: "lyra"`, `baseColor: "neutral"`, `iconLibrary: "phosphor"`).
- **Bits UI** primitives. Do not replace them with another kit.
- **Tailwind CSS v4** via `@tailwindcss/vite`. No `tailwind.config.js`.
- **tailwind-variants** (`tv()`) for product variants. **clsx + tailwind-merge**
  via `cn()` in `src/lib/utils.ts` for class composition.

Keep Lyra’s square geometry and Phosphor icons. Override Lyra’s Outfit / Geist
Mono pairing: this product uses Schibsted Grotesk and IBM Plex Mono.

## Tailwind 4

Static tokens go in `@theme` so they generate utilities (`bg-pressure-80`,
`font-sans`, `shadow-sm`).

Mode-switchable surfaces (`--background`, `--primary`, `--sidebar-*`, …) are
defined on `:root` / `.dark` and **bridged only** through `@theme inline`:

```css
:root { --background: #f6f5f0; }
.dark { --background: oklch(0.145 0 0); }
@theme inline { --color-background: var(--background); }
```

Do not also declare those same `--color-*` aliases inside `@theme`. A static
`@theme` colour freezes the light value and breaks dark-mode utilities.

`shadcn-svelte/tailwind.css` stays imported so registry components keep their
base animation and slot styles.

## `cn` and variants

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

`tailwind-merge` v3 understands Tailwind v4. `tv()` already conflict-resolves
its own variant classes. Pass `tv()` output through `cn()` when a caller adds
classes: `cn(title({ size: 'page' }), className)`.

Do not hand-roll a second merge helper. Do not import `cn` from
`tailwind-variants` in app code; the project helper is `$lib/utils`.

## Typography

| Role | Face | Used for |
|---|---|---|
| Display / titles / body | **Schibsted Grotesk** (`font-sans`, `font-heading`) | H1–H6, UI, reading |
| Numbers / codes / labels | **IBM Plex Mono** (`font-mono`) | percentiles, wages, SSOC codes, `sectionLabel` |

H1s are Schibsted. Never set a job title in mono. `display()` is the number
style; `title()` is the name style.

Weights: Grotesk 400 / 500 / 700 / 900. Plex Mono 400 / 500 / 600 with
`tabular-nums`.

## Colour

Use white cards, cool-neutral subtle surfaces, near-black ink and cobalt for
links, focus and selected controls. Avoid warm paper as the dominant page tint.

**Pressure** is the primary sequential colour on V9 occupation surfaces. Restore
the compact green-to-gold-to-orange-to-red continuum from the earlier product,
with accessible foregrounds and text labels at every important reading. It
means lower-to-higher relative task pressure, never safe-to-doomed or a job-loss
probability.

Unranked uses `--color-pressure-unranked` plus `.unranked-hatch`. Never encode
missing evidence as a low-pressure colour.

Do not legend pressure as “Gradient 1–4”. Those are ILO codebook labels and
belong in How-calculated / methodology.

Family colours are categorical and never encode pressure. Keep them to small
badges, radar lines and legends rather than page chrome. Active V9 surfaces do
not use coloured left borders. Archive V8 `risk-*` / `impact-*` tokens remain
for dated reports; new V9 UI uses `pressureBadge`, not `riskBadge`.

No hardcoded Tailwind palette classes (`bg-teal-700`, `text-emerald-600`) on
pressure surfaces.

## Components

Installed Lyra primitives in `src/lib/components/ui/`:

alert, badge, breadcrumb, button, collapsible, command, dialog, input, label,
separator, sheet, slider, sonner, table, tabs, tooltip.

Product variants in `design-system.ts`: `display`, `title`, `sectionLabel`,
`body`, `caption`, `mono`, `pageLayout`, `card`, `badge`, `pill`, `chip`,
`formInput`, `pressureBadge`, `evidenceBadge`, `actionCard`, `actionBadge`,
`dataChip`, `linkPill`.

`riskBadge` / `impactBadge` are archive-only. Do not introduce them on `/`,
`/occupation`, `/roles`, `/explore`, or V9 rankings.

The homepage and Explore share a compact, connected flagship workspace with a
persistent filter rail and four tabs: Occupation map, Pressure & pay, Named
demand and Distribution. The map shows equal-area occupation leaves inside
spoken major-group boundaries. A visible occupation opens its final page in one
action. Do not size a leaf by employment, wage, task count or inferred risk.

Command palette: name the combobox (“Search occupations and pages”). Keep
dialog title/description **inside** `Dialog.Content` so closed chrome does not
paint into the page.

## Consumer copy (visual rules)

See `/human-product-copy`. The design implications:

- H1 is a spoken job name. Official SSOC title and definition sit under the
  number, collapsed.
- Number, pay, and demand come before the codebook.
- Consumer pressure words: Not exposed / Minimal overlap / Lower overlap /
  Moderate overlap / Higher overlap / Highest overlap.
- “Not named in the selected lists” ≠ weak demand. Unranked ≠ low pressure.
- One caveat. Buttons name the destination.

## Do / don’t (UX audit)

**Do**

- One search on the homepage body. Header ⌘K stays a site-wide palette.
- Keep the search, filters and start of the flagship workspace above the fold
  at 1,440 by 900.
- Let a visible occupation tile or known official alias reach its final
  occupation in one action.
- Sequential pressure colour with a word label. ILO strings in How-calculated.
- Withheld roles: no family radar pretending the title is a scored occupation.

**Don’t**

- `Exposed: Gradient N` in heroes, legends, or ranking H1s.
- Slash-dictionary H1s (`Managing director/Chief executive officer`).
- Outfit, Geist Mono, or Inter as the job-title face.
- Net-risk meters, employment-sized treemaps, or reconnecting archived V8
  Treemap / DriverWaterfall / DemandPressureMatrix / TransitionGraph unchanged.
- Coloured left-border decoration on active V9 cards, lists or results.
- Selection panels that ask a visitor to confirm an occupation they already
  selected.
- Changing the V9 headline formula.

## Page signature

Occupation pages: spoken H1, then the percentile as the page (Plex Mono), with
Compare/Save/Share beside it and pay plus named demand as supporting facts. The
official definition sits behind a disclosure. Home opens on the detailed
occupation workspace with equal-area leaves grouped by nine labelled major
groups, direct links and persistent filters. The memorable thing is the large
number, compact evidence hierarchy and meaningful pressure colour.
