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

/** Section label — uppercase marker above content blocks */
export const sectionLabel = tv({
	base: 'text-xs font-semibold uppercase tracking-label text-muted-foreground'
});

/** Body text */
export const body = tv({
	base: 'font-sans text-sm leading-relaxed',
	variants: {
		tone: {
			default: 'text-foreground',
			muted: 'text-muted-foreground',
			subtle: 'text-foreground/70'
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
// Every card: rounded-lg + border + shadow-sm.
// Border provides structure, shadow adds depth.
// 3-layer depth: background → card → inset.
//
// Usage:
//   card()                          — standard content card
//   card({ hover: true })           — clickable (adds hover:shadow-md)
//   card({ variant: 'inset' })      — nested muted area inside a card
//   card({ padding: 'lg' })         — hero/feature sections
//   card({ accent: 'very_high' })   — colored border by risk band (all sides)
// ============================================

export const card = tv({
	base: 'rounded-lg border bg-card shadow-sm',
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
			elevated: 'shadow-md'
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
	.domain([0, 0.15, 0.35, 0.6])
	.range(['#34d399', '#fbbf24', '#f97316', '#ef4444'])
	.clamp(true);

// ============================================
// SEMANTIC COLOR HELPERS
//
// Return Tailwind token classes. NEVER hardcode
// bg-emerald-50 or similar — always use these.
// ============================================

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
export type ScoreBarVariants = VariantProps<typeof scoreBar>;
export type FormInputVariants = VariantProps<typeof formInput>;
