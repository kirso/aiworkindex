/**
 * AI Work Index — "Signal" Design System
 *
 * The score IS the interface. Data-first, everything else supports it.
 * Single source of truth for all component styling.
 *
 * Typography: Inter (UI) + JetBrains Mono (numbers/data)
 * Colors: Full saturation risk palette via @theme tokens — never hardcoded
 * Cards: Shadow-separated, optional left-border accent
 * Layout: Tight density, tool-like
 *
 * All color helpers return token-based classes (bg-risk-*, text-impact-*, etc.)
 * NO hardcoded Tailwind colors (bg-emerald-50, text-amber-700) anywhere.
 */

import { tv, type VariantProps } from 'tailwind-variants';
import * as d3Scale from 'd3-scale';
import type { RiskBand, ImpactType } from './data';

// ============================================
// TYPOGRAPHY
//
// 5 levels. Sans for all UI. Mono for numbers.
// No serif — Signal is a tool, not a publication.
// ============================================

/** Display — hero numbers, the star of every page */
export const display = tv({
	base: 'font-mono tracking-display leading-display text-foreground stat-display',
	variants: {
		size: {
			xl: 'text-5xl sm:text-6xl font-bold', // Risk score hero
			lg: 'text-4xl sm:text-5xl font-bold', // Secondary callout
			md: 'text-2xl sm:text-3xl font-bold' // Inline stat
		}
	},
	defaultVariants: { size: 'lg' }
});

/** Title — page and section headings */
export const title = tv({
	base: 'font-sans font-bold text-foreground tracking-heading leading-heading',
	variants: {
		size: {
			page: 'text-xl sm:text-2xl',
			section: 'text-base font-semibold',
			subsection: 'text-sm font-semibold'
		}
	},
	defaultVariants: { size: 'page' }
});

/** Section label — marker above content blocks. Normal-case by default, uppercase only for minor metadata. */
export const sectionLabel = tv({
	base: 'text-xs font-semibold text-muted-foreground',
	variants: {
		case: {
			normal: '',
			upper: 'uppercase tracking-label'
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
	base: 'text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground'
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

/** @deprecated Use pageLayout */
export const pageContainer = tv({
	base: 'mx-auto max-w-screen-2xl px-5 sm:px-6'
});
/** @deprecated Use pageLayout */
export const contentContainer = tv({
	base: 'mx-auto max-w-3xl px-5 sm:px-6 py-6'
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
	base: 'rounded-md border border-border bg-card shadow-sm',
	variants: {
		padding: {
			none: '',
			sm: 'p-3',
			md: 'px-5 py-4',
			lg: 'p-6'
		},
		hover: {
			true: 'transition-shadow duration-150 ease-snappy hover:shadow-md cursor-pointer',
			false: ''
		},
		variant: {
			default: '',
			flat: 'shadow-none',
			inset: 'bg-inset border-transparent shadow-none rounded-md',
			elevated: 'shadow-md',
			/** Subtle surface — section panels. Full border for definition. */
			subtle: 'bg-surface-subtle shadow-none rounded-md',
			/** Metric surface — stat grouping cards. Full border for definition. */
			metric: 'bg-surface-metric shadow-none rounded-md',
			/** Notice — contextual callout with tinted background. Pair with accent for semantic color. */
			notice: 'shadow-none rounded-md'
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
	base: 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
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

export const riskBadgeSubtle = tv({
	base: 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
	variants: {
		band: {
			very_low: 'bg-risk-very-low-subtle text-risk-very-low border-risk-very-low-border',
			low: 'bg-risk-low-subtle text-risk-low border-risk-low-border',
			moderate: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border',
			high: 'bg-risk-high-subtle text-risk-high border-risk-high-border',
			very_high: 'bg-risk-very-high-subtle text-risk-very-high border-risk-very-high-border'
		}
	}
});

export const impactBadge = tv({
	base: 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
	variants: {
		type: {
			ai_leveraged: 'bg-impact-leveraged text-white',
			at_risk: 'bg-impact-at-risk text-white',
			stable: 'bg-impact-stable text-white',
			mixed: 'bg-impact-mixed text-white'
		}
	}
});

export const impactBadgeSubtle = tv({
	base: 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
	variants: {
		type: {
			ai_leveraged:
				'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border',
			at_risk: 'bg-impact-at-risk-subtle text-impact-at-risk border-impact-at-risk-border',
			stable: 'bg-impact-stable-subtle text-impact-stable border-impact-stable-border',
			mixed: 'bg-impact-mixed-subtle text-impact-mixed border-impact-mixed-border'
		}
	}
});

export const confidenceBadge = tv({
	base: 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
	variants: {
		level: {
			high: 'border-risk-very-low text-risk-very-low',
			medium: 'border-risk-moderate text-risk-moderate',
			low: 'border-risk-very-high text-risk-very-high'
		}
	}
});

export const badge = tv({
	base: 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
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
// SCORE BARS — Thinner, more precise
// ============================================

export const scoreBar = tv({
	slots: {
		container: 'h-1.5 w-full overflow-hidden rounded-full bg-inset',
		fill: 'h-full rounded-full transition-all duration-200 ease-snappy'
	},
	variants: {
		color: {
			risk: { fill: 'bg-risk-high' },
			safe: { fill: 'bg-risk-very-low' },
			neutral: { fill: 'bg-primary/40' },
			exposure: { fill: 'bg-risk-high' },
			bottleneck: { fill: 'bg-risk-very-low' },
			market: { fill: 'bg-impact-leveraged' }
		}
	},
	defaultVariants: { color: 'neutral' }
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
	base: 'inline-flex items-center rounded-full font-medium',
	variants: {
		size: {
			sm: 'px-1.5 py-0.5 text-[10px]',
			md: 'px-2.5 py-1 text-[11px]',
			lg: 'px-3 py-1.5 text-xs'
		},
		tone: {
			muted: 'bg-muted text-muted-foreground',
			primary: 'bg-primary/10 text-primary',
			positive: 'bg-risk-very-low/10 text-risk-very-low',
			warning: 'bg-risk-moderate/10 text-risk-moderate',
			danger: 'bg-risk-high/10 text-risk-high',
			neutral: 'bg-background text-muted-foreground',
			outline: 'border border-border bg-background text-foreground'
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

/** Subpanel — titled subsection within a card (e.g., "Labour Now", "Top Industries") */
export const subpanel = tv({
	base: 'rounded-lg border border-border/60 bg-card',
	variants: {
		padding: {
			sm: 'p-3',
			md: 'px-4 py-3',
			lg: 'p-5'
		}
	},
	defaultVariants: { padding: 'md' }
});

/** Utility action — quiet link-style action (Compare, Save, Share) */
export const utilityAction = tv({
	base: 'inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
	variants: {
		variant: {
			link: 'hover:text-primary',
			button:
				'rounded-md border border-border px-2.5 py-1.5 hover:bg-accent hover:border-primary/30'
		}
	},
	defaultVariants: { variant: 'link' }
});

// ============================================
// INTERACTIVE ELEMENTS
// ============================================

export const chip = tv({
	base: 'rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-snappy',
	variants: {
		active: {
			true: 'chip-active border-primary bg-primary text-primary-foreground',
			false: 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-accent'
		}
	},
	defaultVariants: { active: false }
});

export const evidenceItem = tv({
	base: 'flex items-start gap-2',
	variants: {
		signal: {
			positive: '',
			negative: '',
			neutral: ''
		}
	}
});

export const formInput = tv({
	base: 'w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors duration-150 focus:border-ring focus:ring-1 focus:ring-ring',
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
// Signal palette — full saturation
// ============================================

export const riskColorScale = d3Scale
	.scaleLinear<string>()
	.domain([0, 0.15, 0.35, 0.6, 1.0])
	.range(['#34d399', '#fbbf24', '#f97316', '#ef4444', '#991b1b'])
	.clamp(true);

// ============================================
// SEMANTIC COLOR HELPERS
//
// Return Tailwind token classes. NEVER hardcode
// bg-emerald-50 or similar — always use these.
// ============================================

/** Score tile — gradient + border classes keyed to risk band */
export function scoreTileClasses(band: RiskBand): string {
	const map: Record<RiskBand, string> = {
		very_low:
			'border-risk-very-low/20 bg-gradient-to-b from-risk-very-low/10 via-background to-background',
		low: 'border-risk-low/20 bg-gradient-to-b from-risk-low/10 via-background to-background',
		moderate:
			'border-risk-moderate/20 bg-gradient-to-b from-risk-moderate/10 via-background to-background',
		high: 'border-risk-high/20 bg-gradient-to-b from-risk-high/10 via-background to-background',
		very_high:
			'border-risk-very-high/20 bg-gradient-to-b from-risk-very-high/10 via-background to-background'
	};
	return map[band];
}

/** Risk band → subtle bg/text/border classes */
export function riskTone(band: RiskBand): string {
	const map: Record<RiskBand, string> = {
		very_low: 'bg-risk-very-low-subtle text-risk-very-low border-risk-very-low-border',
		low: 'bg-risk-low-subtle text-risk-low border-risk-low-border',
		moderate: 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border',
		high: 'bg-risk-high-subtle text-risk-high border-risk-high-border',
		very_high: 'bg-risk-very-high-subtle text-risk-very-high border-risk-very-high-border'
	};
	return map[band];
}

/** Impact type → subtle bg/text/border classes */
export function impactTone(type: ImpactType): string {
	const map: Record<ImpactType, string> = {
		ai_leveraged: 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border',
		at_risk: 'bg-impact-at-risk-subtle text-impact-at-risk border-impact-at-risk-border',
		stable: 'bg-impact-stable-subtle text-impact-stable border-impact-stable-border',
		mixed: 'bg-impact-mixed-subtle text-impact-mixed border-impact-mixed-border'
	};
	return map[type];
}

/** Demand match → subtle tone */
export function demandMatchTone(match: 'exact' | 'prefix' | false): string {
	if (match === 'exact')
		return 'bg-risk-very-low-subtle text-risk-very-low border-risk-very-low-border';
	if (match === 'prefix')
		return 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border';
	return 'bg-secondary text-muted-foreground border-border';
}

/** Stability → subtle tone */
export function stabilityTone(label: string): string {
	if (label === 'stable')
		return 'bg-risk-very-low-subtle border-risk-very-low-border text-risk-very-low';
	if (label === 'watch')
		return 'bg-risk-moderate-subtle border-risk-moderate-border text-risk-moderate';
	return 'bg-risk-very-high-subtle border-risk-very-high-border text-risk-very-high';
}

/** Overall signal → subtle tone */
export function overallSignalTone(overall: string): string {
	if (overall === 'strong')
		return 'bg-risk-very-low-subtle text-risk-very-low border-risk-very-low-border';
	if (overall === 'moderate')
		return 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border';
	if (overall === 'weak')
		return 'bg-risk-moderate-subtle text-risk-moderate border-risk-moderate-border';
	return 'bg-risk-very-high-subtle text-risk-very-high border-risk-very-high-border';
}

/** Vacancy trend → subtle tone */
export function vacancySignalTone(trend: number): string {
	if (trend > 0) return 'bg-risk-very-low-subtle text-risk-very-low border-risk-very-low-border';
	if (trend < 0) return 'bg-risk-very-high-subtle text-risk-very-high border-risk-very-high-border';
	return 'bg-impact-leveraged-subtle text-impact-leveraged border-impact-leveraged-border';
}

/** Confidence → oklch color string (for inline styles) */
export function confidenceColor(level: string): string {
	if (level === 'high') return 'oklch(0.60 0.16 155)';
	if (level === 'medium') return 'oklch(0.70 0.16 75)';
	return 'oklch(0.55 0.22 25)';
}

/** Direction → text color class */
export function directionTone(direction: string): string {
	if (direction === 'up' || direction === 'improving') return 'text-risk-very-low';
	if (direction === 'down' || direction === 'worsening') return 'text-risk-very-high';
	return 'text-muted-foreground';
}

// ============================================
// TYPE EXPORTS
// ============================================

export type DisplayVariants = VariantProps<typeof display>;
export type TitleVariants = VariantProps<typeof title>;
export type CardVariants = VariantProps<typeof card>;
export type RiskBadgeVariants = VariantProps<typeof riskBadge>;
export type ImpactBadgeVariants = VariantProps<typeof impactBadge>;
export type ConfidenceBadgeVariants = VariantProps<typeof confidenceBadge>;
export type BadgeVariants = VariantProps<typeof badge>;
export type ChipVariants = VariantProps<typeof chip>;
export type PillVariants = VariantProps<typeof pill>;
export type SubpanelVariants = VariantProps<typeof subpanel>;
export type UtilityActionVariants = VariantProps<typeof utilityAction>;
export type ScoreBarVariants = VariantProps<typeof scoreBar>;
export type FormInputVariants = VariantProps<typeof formInput>;
