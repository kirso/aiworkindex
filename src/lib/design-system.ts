/**
 * AI Work Index — warm evidence-editorial design system.
 *
 * Schibsted Grotesk carries the reading experience; IBM Plex Mono is reserved
 * for provenance, codes and tabular values. Pressure, occupation family,
 * evidence status and action guidance are independent semantic channels.
 */

import { tv, type VariantProps } from 'tailwind-variants';
import * as d3Scale from 'd3-scale';

// ============================================
// TYPOGRAPHY
//
// 5 levels. Sans for all UI. Mono for numbers.
// No serif — Signal is a tool, not a publication.
// ============================================

/** Display — hero numbers, the star of every page */
export const display = tv({
	base: 'font-sans font-black tracking-display leading-display text-foreground tabular-nums',
	variants: {
		size: {
			xl: 'text-6xl sm:text-7xl lg:text-8xl',
			lg: 'text-4xl sm:text-5xl',
			md: 'text-2xl sm:text-3xl' // Inline stat
		}
	},
	defaultVariants: { size: 'lg' }
});

/** Title — page and section headings */
export const title = tv({
	base: 'font-sans font-bold text-foreground tracking-display leading-heading',
	variants: {
		size: {
			page: 'text-[2.375rem] sm:text-5xl lg:text-6xl',
			section: 'text-2xl sm:text-3xl',
			subsection: 'text-lg sm:text-xl font-semibold'
		}
	},
	defaultVariants: { size: 'page' }
});

/** Section label — marker above content blocks. Normal-case by default, uppercase only for minor metadata. */
export const sectionLabel = tv({
	base: 'font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground',
	variants: {
		case: {
			normal: '',
			upper: ''
		}
	},
	defaultVariants: { case: 'normal' }
});

/** Body text */
export const body = tv({
	base: 'font-sans leading-[1.55]',
	variants: {
		tone: {
			default: 'text-foreground',
			muted: 'text-muted-foreground',
			subtle: 'text-text-secondary'
		},
		size: {
			lg: 'text-lg',
			md: 'text-base',
			sm: 'text-sm'
		}
	},
	defaultVariants: { tone: 'default', size: 'md' }
});

/** Caption — metadata */
export const caption = tv({
	base: 'text-xs text-muted-foreground leading-normal',
	variants: {
		weight: {
			normal: 'font-normal',
			medium: 'font-medium',
			semibold: 'font-semibold'
		}
	},
	defaultVariants: { weight: 'normal' }
});

/**
 * Micro-label — uppercase metadata markers above metrics.
 * Replaces all text-[10px] patterns. Uses text-xs (12px) as the floor.
 */
export const microLabel = tv({
	base: 'font-mono text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground'
});

/** Mono — tabular numbers for data alignment */
export const mono = tv({
	base: 'font-mono tabular-nums',
	variants: {
		size: {
			lg: 'text-lg',
			md: 'text-sm',
			sm: 'text-xs'
		}
	},
	defaultVariants: { size: 'md' }
});

// ============================================
// LAYOUT
// ============================================

export const pageLayout = tv({
	base: 'mx-auto px-4 py-7 sm:px-6 sm:py-9 lg:px-8',
	variants: {
		width: {
			wide: 'max-w-[90rem]',
			data: 'max-w-[90rem]',
			feature: 'max-w-7xl',
			content: 'max-w-5xl',
			prose: 'max-w-3xl'
		}
	},
	defaultVariants: { width: 'feature' }
});

/** Section spacing */
export const section = tv({
	base: '',
	variants: {
		spacing: {
			tight: 'mb-4',
			normal: 'mb-5',
			loose: 'mb-8'
		}
	},
	defaultVariants: { spacing: 'normal' }
});

// ============================================
// CARDS — Signal Style
//
// Every card gets: rounded-md + border + bg.
// Default cards: white bg + border + shadow-sm (clear on gray canvas).
// Variant cards: tinted bg + border + no shadow (lighter feel).
// Inset is borderless (lives inside a parent card).
//
// Usage:
//   card()                          — standard (white, border, shadow-sm)
//   card({ hover: true })           — clickable (hover:shadow-md)
//   card({ variant: 'metric' })     — stat grouping (tinted bg, border, no shadow)
//   card({ variant: 'inset' })      — nested muted area (no border)
//   card({ accent: 'very_high' })   — colored border by risk band
// ============================================

export const card = tv({
	base: 'rounded-xl border border-border bg-card shadow-xs',
	variants: {
		padding: {
			none: '',
			sm: 'p-3',
			md: 'px-5 py-4',
			lg: 'p-6'
		},
		hover: {
			true: 'cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-editorial hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm active:translate-y-0',
			false: ''
		},
		variant: {
			default: '',
			flat: 'shadow-none',
			inset: 'rounded-lg border-transparent bg-inset shadow-none',
			elevated: 'border-transparent bg-white shadow-md',
			/** Subtle surface — section panels. */
			subtle: 'bg-surface-subtle shadow-none',
			/** Metric surface — stat grouping cards. */
			metric: 'rounded-lg bg-surface-metric shadow-none',
			/** Notice — contextual callout. Pair with accent for semantic color. */
			notice: ''
		},
		accent: {
			none: 'border-border',
			very_low: 'border-risk-very-low',
			low: 'border-risk-low',
			moderate: 'border-risk-moderate',
			high: 'border-risk-high',
			very_high: 'border-risk-very-high',
			leveraged: 'border-impact-leveraged',
			at_risk: 'border-impact-at-risk',
			stable: 'border-impact-stable',
			mixed: 'border-impact-mixed',
			primary: 'border-primary'
		}
	},
	compoundVariants: [
		{
			variant: 'notice',
			accent: 'moderate',
			class: 'border-risk-moderate-border bg-risk-moderate-subtle'
		},
		{ variant: 'notice', accent: 'primary', class: 'border-primary/20 bg-primary/5' },
		{
			variant: 'notice',
			accent: 'leveraged',
			class: 'border-impact-leveraged-border bg-impact-leveraged-subtle'
		},
		{
			variant: 'notice',
			accent: 'very_low',
			class: 'border-risk-very-low-border bg-risk-very-low-subtle'
		},
		{
			variant: 'notice',
			accent: 'very_high',
			class: 'border-risk-very-high-border bg-risk-very-high-subtle'
		}
	],
	defaultVariants: {
		padding: 'md',
		hover: false,
		variant: 'default',
		accent: 'none'
	}
});

// ============================================
// BADGES — Risk & Status
//
// Two styles per badge type:
// Solid: colored bg + white text (primary indicator)
// Subtle: tinted bg + colored text + border (secondary)
// ============================================

export const riskBadge = tv({
	base: 'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide',
	variants: {
		band: {
			very_low: 'bg-risk-very-low text-white',
			low: 'bg-risk-low text-white',
			moderate: 'bg-risk-moderate text-white',
			high: 'bg-risk-high text-white',
			very_high: 'bg-risk-very-high text-white'
		}
	}
});

export const impactBadge = tv({
	base: 'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide',
	variants: {
		type: {
			ai_leveraged: 'bg-impact-leveraged text-white',
			at_risk: 'bg-impact-at-risk text-white',
			stable: 'bg-impact-stable text-white',
			mixed: 'bg-impact-mixed text-white'
		}
	}
});

export const badge = tv({
	base: 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
	variants: {
		variant: {
			default: 'bg-secondary text-secondary-foreground',
			outline: 'border border-border text-foreground',
			success: 'bg-risk-very-low-subtle text-risk-very-low border border-risk-very-low-border',
			warning: 'bg-risk-moderate-subtle text-risk-moderate border border-risk-moderate-border',
			danger: 'bg-risk-very-high-subtle text-risk-very-high border border-risk-very-high-border',
			info: 'bg-impact-leveraged-subtle text-impact-leveraged border border-impact-leveraged-border'
		}
	},
	defaultVariants: { variant: 'default' }
});

// ============================================
// PILLS — Inline contextual indicators
//
// Rounded-full, smaller than badges, used for
// demand signals, education, policy flags, skills,
// evidence labels, programme links.
//
// Size: sm (metadata), md (default), lg (CTA pills)
// Tone: semantic color or muted fallback
// Interactive: adds hover state for clickable pills
// ============================================

export const pill = tv({
	base: 'inline-flex items-center rounded-lg font-medium',
	variants: {
		size: {
			sm: 'px-2 py-1 text-xs',
			md: 'px-2.5 py-1.5 text-xs',
			lg: 'min-h-11 px-4 py-2 text-sm'
		},
		tone: {
			muted: 'bg-muted text-text-secondary',
			primary: 'bg-muted text-foreground font-semibold',
			positive: 'bg-risk-very-low-subtle text-risk-very-low',
			warning: 'bg-risk-moderate-subtle text-risk-moderate',
			danger: 'bg-risk-high-subtle text-risk-high',
			neutral: 'bg-background text-muted-foreground',
			outline: 'border-[1.5px] border-foreground bg-background text-foreground font-semibold'
		},
		interactive: {
			true: 'transition-[transform,background-color,color,border-color] duration-200 ease-editorial hover:-translate-y-0.5 active:translate-y-0',
			false: ''
		}
	},
	defaultVariants: { size: 'md', tone: 'muted', interactive: false }
});

// ============================================
// LAYOUT PRIMITIVES — Semantic surfaces
// ============================================

// ============================================
// INTERACTIVE ELEMENTS
// ============================================

export const chip = tv({
	base: 'min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ease-editorial',
	variants: {
		active: {
			true: 'chip-active border-foreground bg-foreground text-background',
			false: 'border-border bg-card text-muted-foreground hover:border-foreground hover:bg-accent'
		}
	},
	defaultVariants: { active: false }
});

export const formInput = tv({
	base: 'min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground shadow-xs placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-ring focus:ring-2 focus:ring-ring/20',
	variants: {
		size: {
			sm: 'px-2.5 py-1.5 text-sm',
			md: 'px-3 py-2 text-base',
			lg: 'px-4 py-2.5 text-base'
		}
	},
	defaultVariants: { size: 'md' }
});

// ============================================
// RISK COLOR SCALE (D3)
// sRGB hex equivalents of the --color-risk-* band tokens in app.css, so
// D3 visualizations (Treemap, Histogram) match the risk badges exactly. D3 needs
// concrete color strings, so these are kept in sync with the tokens by value:
// If the tokens change, recompute these hex values.
// ============================================

export const riskColorScale = d3Scale
	.scaleLinear<string>()
	.domain([0, 0.15, 0.35, 0.6, 1.0])
	.range(['#2a7f62', '#48a06c', '#d9a514', '#c05a1d', '#d6151c'])
	.clamp(true);

/** Continuous V9 percentile scale. Nulls use a hatch, never a numeric fallback. */
export const pressureColorScale = d3Scale
	.scaleLinear<string>()
	.domain([0, 20, 40, 60, 80, 100])
	.range(['#eaf4f1', '#cfe5df', '#a7cec5', '#77aea5', '#3e8984', '#155f64'])
	.clamp(true);

export const evidenceBadge = tv({
	base: 'inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs font-medium',
	variants: {
		status: {
			source: 'border-evidence-source/30 text-evidence-source',
			official: 'border-evidence-official/35 text-evidence-official',
			calculated: 'border-evidence-calculated/35 text-evidence-calculated',
			estimate: 'border-evidence-estimate/35 text-evidence-estimate',
			editorial: 'border-evidence-editorial/35 text-evidence-editorial',
			visitor: 'border-evidence-visitor/35 text-evidence-visitor',
			unavailable: 'border-dashed border-evidence-unavailable/45 text-evidence-unavailable'
		}
	}
});

/** Action-lane container for PersonalWorkCheck and occupation guidance. */
export const actionCard = tv({
	base: 'rounded-lg border px-4 py-3',
	variants: {
		action: {
			try: 'border-action-try-border bg-action-try-subtle text-action-try',
			verify: 'border-action-verify-border bg-action-verify-subtle text-action-verify',
			human_led: 'border-action-human-led-border bg-action-human-led-subtle text-action-human-led',
			strengthen:
				'border-action-strengthen-border bg-action-strengthen-subtle text-action-strengthen',
			monitor: 'border-action-monitor-border bg-action-monitor-subtle text-action-monitor'
		}
	}
});

/** Compact word label for the same action lanes. Always keep the text visible. */
export const actionBadge = tv({
	base: 'inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold',
	variants: {
		action: {
			try: 'border-action-try-border bg-action-try-subtle text-action-try',
			verify: 'border-action-verify-border bg-action-verify-subtle text-action-verify',
			human_led: 'border-action-human-led-border bg-action-human-led-subtle text-action-human-led',
			strengthen:
				'border-action-strengthen-border bg-action-strengthen-subtle text-action-strengthen',
			monitor: 'border-action-monitor-border bg-action-monitor-subtle text-action-monitor'
		}
	}
});

// ============================================
// SEMANTIC COLOR HELPERS
//
// Return Tailwind token classes. NEVER hardcode
// bg-emerald-50 or similar — always use these.
// ============================================

// ============================================
// SWISS EDITORIAL PRIMITIVES (REDESIGN_SPEC.md)
// ============================================

/** Data chip — neutral mono tag for comparisons, skills, method notes. */
export const dataChip = tv({
	base: 'inline-block rounded-md bg-muted px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-text-secondary'
});

/** Link pill — navigation only. Ink border, trailing arrow added by caller. */
export const linkPill = tv({
	base: 'inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-foreground px-4 py-2 text-sm font-semibold text-foreground no-underline transition-[transform,background-color,color] duration-200 ease-editorial hover:-translate-y-0.5 hover:bg-foreground hover:text-background active:translate-y-0'
});

/** Numbered section header: mono signal-accent number + bold title. */
export const sectionNumber = tv({
	base: 'font-mono text-[11px] font-semibold tracking-[0.1em] text-primary'
});

/** Data value — mono numerals with tnum, for stats and table cells. */
export const dataValue = tv({
	base: 'font-mono tabular-nums font-medium text-foreground',
	variants: {
		size: { lg: 'text-lg', md: 'text-sm', sm: 'text-xs' }
	},
	defaultVariants: { size: 'md' }
});

// ============================================
// TYPE EXPORTS
// ============================================

export type DisplayVariants = VariantProps<typeof display>;
export type TitleVariants = VariantProps<typeof title>;
export type CardVariants = VariantProps<typeof card>;
export type RiskBadgeVariants = VariantProps<typeof riskBadge>;
export type ImpactBadgeVariants = VariantProps<typeof impactBadge>;
export type BadgeVariants = VariantProps<typeof badge>;
export type ChipVariants = VariantProps<typeof chip>;
export type PillVariants = VariantProps<typeof pill>;
export type FormInputVariants = VariantProps<typeof formInput>;
export type EvidenceBadgeVariants = VariantProps<typeof evidenceBadge>;
export type ActionCardVariants = VariantProps<typeof actionCard>;
export type ActionBadgeVariants = VariantProps<typeof actionBadge>;
