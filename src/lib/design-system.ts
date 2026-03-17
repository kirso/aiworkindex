/**
 * SG AI Jobs Design System
 *
 * Single source of truth for all visual decisions.
 * Every component should import from here instead of writing raw Tailwind classes.
 *
 * Built on: tailwind-variants (tv) + Tailwind CSS v4 oklch tokens
 *
 * Typography: 4 levels (title, heading, body, caption)
 * Colors: semantic only (risk, impact, surface) — no arbitrary hex
 * Spacing: consistent padding/gap per component type
 * Layout: page containers, card patterns, section spacing
 */

import { tv, type VariantProps } from "tailwind-variants";

// ============================================
// TYPOGRAPHY
// ============================================

/** Page titles — h1 on each page */
export const title = tv({
	base: "font-bold tracking-tight text-foreground",
	variants: {
		size: {
			page: "text-2xl sm:text-3xl", // Main page title
			section: "text-base font-semibold", // Section/card headings
		},
	},
	defaultVariants: { size: "page" },
});

/** Section labels — small uppercase above content blocks */
export const sectionLabel = tv({
	base: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
});

/** Body text */
export const body = tv({
	base: "text-sm",
	variants: {
		tone: {
			default: "text-foreground",
			muted: "text-muted-foreground",
			subtle: "text-foreground/80",
		},
		size: {
			base: "text-base", // For prominent text (summaries)
			sm: "text-sm", // Default body
		},
	},
	defaultVariants: { tone: "default", size: "sm" },
});

/** Caption / metadata text */
export const caption = tv({
	base: "text-xs text-muted-foreground",
	variants: {
		weight: {
			normal: "",
			medium: "font-medium",
			semibold: "font-semibold",
		},
	},
	defaultVariants: { weight: "normal" },
});

// ============================================
// LAYOUT
// ============================================

/** Full-width page container (max-w-screen-2xl) */
export const pageContainer = tv({
	base: "mx-auto max-w-screen-2xl px-5 sm:px-6",
});

/** Narrow content container for prose pages (max-w-3xl) */
export const contentContainer = tv({
	base: "mx-auto max-w-3xl px-4 py-8 sm:px-6",
});

/** Section spacing within a page */
export const section = tv({
	base: "",
	variants: {
		spacing: {
			tight: "mb-4",
			normal: "mb-6",
			loose: "mb-8",
		},
	},
	defaultVariants: { spacing: "normal" },
});

// ============================================
// CARDS
// ============================================

/** Card component — surface with border and optional hover */
export const card = tv({
	base: "rounded-xl border border-border bg-card",
	variants: {
		padding: {
			none: "",
			sm: "p-3",
			md: "p-5",
			lg: "p-6",
		},
		hover: {
			true: "transition-shadow hover:shadow-md cursor-pointer",
			false: "",
		},
		variant: {
			default: "",
			muted: "bg-muted",
			highlight: "border-2",
		},
	},
	defaultVariants: {
		padding: "md",
		hover: false,
		variant: "default",
	},
});

// ============================================
// BADGES
// ============================================

/** Risk band badge */
export const riskBadge = tv({
	base: "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white",
	variants: {
		band: {
			very_low: "bg-risk-very-low",
			low: "bg-risk-low",
			moderate: "bg-risk-moderate",
			high: "bg-risk-high",
			very_high: "bg-risk-very-high",
		},
	},
});

/** Impact type badge */
export const impactBadge = tv({
	base: "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white",
	variants: {
		type: {
			ai_leveraged: "bg-impact-leveraged",
			at_risk: "bg-impact-at-risk",
			stable: "bg-impact-stable",
			mixed: "bg-impact-mixed",
		},
	},
});

/** Confidence badge — outline style */
export const confidenceBadge = tv({
	base: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
	variants: {
		level: {
			high: "border-risk-very-low text-risk-very-low",
			medium: "border-risk-moderate text-risk-moderate",
			low: "border-risk-very-high text-risk-very-high",
		},
	},
});

/** Generic badge for labels */
export const badge = tv({
	base: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
	variants: {
		variant: {
			default: "bg-secondary text-secondary-foreground",
			outline: "border border-border text-foreground",
			success: "bg-risk-very-low/15 text-risk-very-low",
			warning: "bg-risk-moderate/15 text-risk-moderate",
			danger: "bg-risk-very-high/15 text-risk-very-high",
			info: "bg-impact-leveraged/15 text-impact-leveraged",
		},
	},
	defaultVariants: { variant: "default" },
});

// ============================================
// SCORE BARS
// ============================================

/** Progress bar for scores (exposure, bottleneck, etc.) */
export const scoreBar = tv({
	slots: {
		container: "h-2 w-full overflow-hidden rounded-full bg-muted",
		fill: "h-full rounded-full transition-all duration-300",
	},
	variants: {
		color: {
			risk: { fill: "bg-risk-high" },
			safe: { fill: "bg-risk-very-low" },
			neutral: { fill: "bg-primary/50" },
			exposure: { fill: "bg-risk-high" },
			bottleneck: { fill: "bg-risk-very-low" },
			market: { fill: "bg-impact-leveraged" },
		},
	},
	defaultVariants: { color: "neutral" },
});

// ============================================
// INTERACTIVE ELEMENTS
// ============================================

/** Filter chip / toggle button */
export const chip = tv({
	base: "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
	variants: {
		active: {
			true: "chip-active border-primary bg-primary text-primary-foreground shadow-sm",
			false:
				"border-border bg-card text-muted-foreground hover:border-border hover:shadow-sm",
		},
	},
	defaultVariants: { active: false },
});

/** Evidence trail item */
export const evidenceItem = tv({
	base: "flex items-start gap-2",
	variants: {
		signal: {
			positive: "",
			negative: "",
			neutral: "",
		},
	},
});

// ============================================
// TYPE EXPORTS
// ============================================

export type TitleVariants = VariantProps<typeof title>;
export type CardVariants = VariantProps<typeof card>;
export type RiskBadgeVariants = VariantProps<typeof riskBadge>;
export type ImpactBadgeVariants = VariantProps<typeof impactBadge>;
export type ConfidenceBadgeVariants = VariantProps<typeof confidenceBadge>;
export type BadgeVariants = VariantProps<typeof badge>;
export type ChipVariants = VariantProps<typeof chip>;
export type ScoreBarVariants = VariantProps<typeof scoreBar>;
