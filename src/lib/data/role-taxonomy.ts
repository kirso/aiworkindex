/**
 * Role Taxonomy — Family system for familiar-title guides.
 *
 * Provides parent-child relationships and variant tracking
 * for exact titles, reviewed aliases, composites and withheld mappings.
 */

export interface RoleCategory {
	key: string;
	label: string;
	description: string;
}

export const roleCategories: RoleCategory[] = [
	{ key: 'engineering', label: 'Engineering', description: 'Software, infrastructure, and platform roles' },
	{ key: 'data', label: 'Data & AI', description: 'Data engineering, analytics, and ML roles' },
	{ key: 'product', label: 'Product & Design', description: 'Product management, UX, and design roles' },
	{ key: 'design', label: 'Design & Creative', description: 'Design, visual craft, and independent creative roles' },
	{ key: 'marketing', label: 'Marketing & Growth', description: 'Marketing, content, and growth roles' },
	{ key: 'sales', label: 'Sales & Business Development', description: 'Sales, partnerships, and BD roles' },
	{ key: 'finance', label: 'Finance & Legal', description: 'Finance, accounting, compliance, and legal roles' },
	{ key: 'people', label: 'People & HR', description: 'HR, recruiting, and people operations roles' },
	{ key: 'operations', label: 'Operations', description: 'Operations, supply chain, and procurement roles' },
	{ key: 'strategy', label: 'Strategy & Advisory', description: 'Strategy, consulting, policy, and executive support roles' },
	{ key: 'leadership', label: 'Leadership & New Ventures', description: 'Founders, executives, and emerging leadership roles' },
	{ key: 'customer', label: 'Customer & Service', description: 'Customer success, support, and community roles' }
];

export const roleCategoryByKey = new Map(roleCategories.map((c) => [c.key, c]));

/**
 * Maps each familiar-title slug to its family and optional variant_of parent.
 * variant_of indicates this role is a variant of another role (e.g., "technical-product-manager" is a variant of "product-manager").
 */
export const roleCategoryMap: Record<string, { category: string; variant_of?: string }> = {
	// Engineering
	'frontend-engineer': { category: 'engineering' },
	'backend-engineer': { category: 'engineering' },
	'full-stack-developer': { category: 'engineering' },
	'mobile-engineer': { category: 'engineering' },
	'devops-engineer': { category: 'engineering' },
	'platform-engineer': { category: 'engineering', variant_of: 'devops-engineer' },
	'site-reliability-engineer': { category: 'engineering', variant_of: 'devops-engineer' },
	'security-engineer': { category: 'engineering' },
	'qa-engineer': { category: 'engineering' },
	'game-developer': { category: 'engineering' },
	'systems-analyst': { category: 'engineering' },
	'solutions-engineer': { category: 'engineering' },
	'sales-engineer': { category: 'engineering', variant_of: 'solutions-engineer' },
	'engineering-manager': { category: 'engineering' },
	'startup-cto': { category: 'engineering', variant_of: 'engineering-manager' },

	// Data & AI
	'data-engineer': { category: 'data' },
	'ml-engineer': { category: 'data' },
	'operations-analyst': { category: 'data' },

	// Product & Design
	'product-manager': { category: 'product' },
	'technical-product-manager': { category: 'product', variant_of: 'product-manager' },
	'ux-designer': { category: 'product' },

	// Marketing & Growth
	'brand-manager': { category: 'marketing' },
	'growth-marketer': { category: 'marketing' },
	'content-strategist': { category: 'marketing' },
	'community-manager': { category: 'marketing' },
	'developer-advocate': { category: 'marketing' },

	// Sales & BD
	'account-executive': { category: 'sales' },
	'partnerships-manager': { category: 'sales' },

	// Finance & Legal
	'venture-capitalist': { category: 'finance' },
	'investment-banker': { category: 'finance' },
	'private-equity-associate': { category: 'finance', variant_of: 'investment-banker' },
	'quant-researcher': { category: 'finance' },
	'fpa-analyst': { category: 'finance' },
	'treasury-analyst': { category: 'finance' },
	'compliance-officer': { category: 'finance' },
	'financial-adviser': { category: 'finance' },
	'insurance-underwriter': { category: 'finance' },
	'auditor': { category: 'finance' },

	// People & HR
	'recruiter': { category: 'people' },
	'hr-business-partner': { category: 'people' },
	'people-partner': { category: 'people', variant_of: 'hr-business-partner' },

	// Operations
	'project-manager': { category: 'operations' },
	'supply-chain-analyst': { category: 'operations' },
	'procurement-manager': { category: 'operations' },
	'revops-manager': { category: 'operations' },

	// Strategy & Leadership
	'chief-of-staff': { category: 'strategy' },
	'founder-associate': { category: 'strategy' },
	'policy-analyst': { category: 'strategy' },

	// Customer
	'customer-success-manager': { category: 'customer' },
	'customer-support-specialist': { category: 'customer' },

	// Batch 2 additions
	'data-analyst': { category: 'data' },
	'data-scientist': { category: 'data' },
	'business-analyst': { category: 'data', variant_of: 'data-analyst' },
	'management-consultant': { category: 'strategy' },
	'scrum-master': { category: 'operations', variant_of: 'project-manager' },
	'technical-writer': { category: 'marketing' },
	'seo-specialist': { category: 'marketing', variant_of: 'growth-marketer' },
	'social-media-manager': { category: 'marketing', variant_of: 'community-manager' },
	'product-designer': { category: 'product', variant_of: 'ux-designer' },
	'graphic-designer': { category: 'product' },
	'cloud-architect': { category: 'engineering', variant_of: 'platform-engineer' },
	'it-manager': { category: 'engineering' },
	'database-administrator': { category: 'data' },
	'network-engineer': { category: 'engineering' },
	'business-development-manager': { category: 'sales', variant_of: 'partnerships-manager' },
	'marketing-manager': { category: 'marketing', variant_of: 'brand-manager' },
	'sales-manager': { category: 'sales', variant_of: 'account-executive' },
	'hr-manager': { category: 'people', variant_of: 'hr-business-partner' },
	'talent-acquisition-lead': { category: 'people', variant_of: 'recruiter' },
	'legal-counsel': { category: 'finance' },
	'finance-manager': { category: 'finance' },
	'accountant': { category: 'finance' },
	'executive-assistant': { category: 'operations' },
	'office-manager': { category: 'operations' },
	'event-manager': { category: 'marketing' },

	// Batch 3: AI & security roles
	'ai-engineer': { category: 'data' },
	'prompt-engineer': { category: 'data' },
	'ai-product-manager': { category: 'product', variant_of: 'product-manager' },
	'data-architect': { category: 'data', variant_of: 'data-engineer' },
	'it-security-manager': { category: 'engineering', variant_of: 'security-engineer' },

	// Batch 4: Gig economy, entrepreneurial, emerging roles
	'delivery-rider': { category: 'operations' },
	'ride-hail-driver': { category: 'operations' },
	'freelance-designer': { category: 'design', variant_of: 'ux-designer' },
	'startup-founder': { category: 'leadership' },
	'e-commerce-seller': { category: 'sales' },
	'sustainability-manager': { category: 'leadership' },
	'content-creator': { category: 'marketing' },
	'virtual-assistant': { category: 'operations' }
};

/**
 * Get the category for a role slug.
 */
export function getRoleCategory(slug: string): RoleCategory | null {
	const entry = roleCategoryMap[slug];
	if (!entry) return null;
	return roleCategoryByKey.get(entry.category) ?? null;
}

/**
 * Get the parent role slug if this is a variant.
 */
export function getVariantParent(slug: string): string | null {
	return roleCategoryMap[slug]?.variant_of ?? null;
}

/**
 * Get all roles in a category.
 */
export function getRolesByCategory(category: string): string[] {
	return Object.entries(roleCategoryMap)
		.filter(([, v]) => v.category === category)
		.map(([slug]) => slug);
}
