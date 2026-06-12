/**
 * AI Work Index — "Signal" Design System
 *
 * The score IS the interface. Data-first, everything else supports it.
 * Single source of truth for all component styling.
 *
 * Typography: Schibsted Grotesk (display/UI) + IBM Plex Mono (data/labels)
 * Colors: ink neutrals + cobalt signal accent + risk scale ONLY (docs/design/REDESIGN_SPEC.md)
 * Structure: hairline rules over shadows; sharp corners; Swiss editorial
 * Chips: 3-type contract — statusBadge (riskBadge/impactBadge), dataChip, linkPill
 *
 * All color helpers return token-based classes (bg-risk-*, text-impact-*, etc.)
 * NO hardcoded Tailwind colors (bg-emerald-50, text-amber-700) anywhere.
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
			xl: 'text-6xl sm:text-7xl', // Risk score hero
			lg: 'text-4xl sm:text-5xl', // Secondary callout
			md: 'text-2xl sm:text-3xl' // Inline stat
		}
	},
	defaultVariants: { size: 'lg' }
});

/** Title — page and section headings */
export const title = tv({
	base: 'font-sans font-black text-foreground tracking-display leading-heading',
	variants: {
		size: {
			page: 'text-3xl sm:text-5xl',
			section: 'text-xl sm:text-2xl font-bold',
			subsection: 'text-sm font-bold'
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
	base: 'font-sans text-sm leading-relaxed',
	variants: {
		tone: {
			default: 'text-foreground',
			muted: 'text-muted-foreground',
			subtle: 'text-text-secondary'
		},
		size: {
			lg: 'text-base',
			md: 'text-sm',
			sm: 'text-xs'
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
	base: 'mx-auto px-5 sm:px-6 py-6',
	variants: {
		width: {
			wide: 'max-w-screen-2xl',
			feature: 'max-w-6xl',
			content: 'max-w-4xl',
			prose: 'max-w-3xl'
		}
	},
	defaultVariants: { width: 'content' }
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
	base: 'border border-border bg-card',
	variants: {
		padding: {
			none: '',
			sm: 'p-3',
			md: 'px-5 py-4',
			lg: 'p-6'
		},
		hover: {
			true: 'transition-colors duration-150 ease-snappy hover:border-foreground cursor-pointer',
			false: ''
		},
		variant: {
			default: '',
			flat: '',
			inset: 'bg-inset border-transparent',
			elevated: 'border-foreground',
			/** Subtle surface — section panels. */
			subtle: 'bg-surface-subtle',
			/** Metric surface — stat grouping cards. */
			metric: 'bg-surface-metric',
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
	base: 'inline-flex items-center px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide',
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
	base: 'inline-flex items-center px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide',
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
	base: 'inline-flex items-center px-2 py-0.5 text-xs font-medium',
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
	base: 'inline-flex items-center font-medium',
	variants: {
		size: {
			sm: 'px-1.5 py-0.5 text-[10px]',
			md: 'px-2.5 py-1 text-[11px]',
			lg: 'px-3 py-1.5 text-xs'
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
			true: 'transition-colors hover:opacity-80',
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
	base: 'border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-snappy',
	variants: {
		active: {
			true: 'chip-active border-foreground bg-foreground text-background',
			false: 'border-border bg-card text-muted-foreground hover:border-foreground hover:bg-accent'
		}
	},
	defaultVariants: { active: false }
});

export const formInput = tv({
	base: 'w-full border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors duration-150 focus:border-ring focus:ring-1 focus:ring-ring',
	variants: {
		size: {
			sm: 'px-2.5 py-1.5 text-xs',
			md: 'px-3 py-2 text-sm',
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
	.range(['#2a7f62', '#48a06c', '#a07a0a', '#a85f00', '#7c3aed'])
	.clamp(true);

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
	base: 'inline-block bg-muted px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-text-secondary'
});

/** Link pill — navigation only. Ink border, trailing arrow added by caller. */
export const linkPill = tv({
	base: 'inline-flex items-center gap-1.5 border-[1.5px] border-foreground px-3.5 py-1.5 text-[13.5px] font-semibold text-foreground no-underline transition-colors hover:bg-foreground hover:text-background'
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
