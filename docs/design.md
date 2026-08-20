# Design system — AI Work Index

This is the visual single source of truth. Variant constructors live in
`src/lib/design-system.ts`. Tokens live in `src/app.css`. Do not duplicate either
here as a second implementation.

The archived June 2026 Swiss spec in `docs/design/REDESIGN_SPEC.md` is historical.
V9 keeps its editorial intent (answer first, colour encodes one thing, chips mean
distinct jobs) and drops V8 risk-band chrome from consumer surfaces.

## What this product is

A Singapore worker looking up a job. The page answers how much AI task overlap
that occupation has, then shows pay and named demand as separate facts. It is
not a job-loss meter, a dashboard, or a methods appendix.

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

Warm paper (`#f6f5f0` / card `#fffefb`), ink `#171714`, cobalt primary `#2457d6`.
`--accent` is a warm mute (`#ece8dc`) so `hover:bg-accent` is a quiet chrome
change, not a primary fill.

**Pressure** is the only sequential colour on V9 occupation surfaces. Teal steps
must stay separable at a glance:

`0 #f1f7f5 → 20 #b7ddd3 → 40 #5fafa0 → 60 #2c8073 → 80 #155a52 → 100 #0b3532`

Unranked uses `--color-pressure-unranked` plus `.unranked-hatch`. Never encode
missing evidence as a low-pressure colour.

Do not legend pressure as “Gradient 1–4”. Those are ILO codebook labels and
belong in How-calculated / methodology.

Family colours are categorical and never encode pressure. Evidence and action
colours are separate channels. Archive V8 `risk-*` / `impact-*` tokens remain
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
- Grouped occupation overview on home; 1,001-tile map stays in Explore.
- Sequential teal with a word label. ILO strings in How-calculated.
- Withheld roles: no family radar pretending the title is a scored occupation.

**Don’t**

- `Exposed: Gradient N` in heroes, legends, or ranking H1s.
- Slash-dictionary H1s (`Managing director/Chief executive officer`).
- Outfit, Geist Mono, or Inter as the job-title face.
- Net-risk meters, employment-sized treemaps, or reconnecting archived V8
  Treemap / DriverWaterfall / DemandPressureMatrix / TransitionGraph unchanged.
- Changing the V9 headline formula.

## Page signature

Occupation pages: spoken H1, then a three-part evidence strip (pressure
percentile in Plex Mono, pay, named demand), then the official definition
behind a disclosure. The memorable thing is the large number on warm paper
with a teal mark — not a dashboard card wall.
