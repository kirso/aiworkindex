/**
 * Workflow Overlay — 8 role-specific dimensions → 4 derived sub-scores → context_adjustment multiplier.
 *
 * Each occupation/role can have an optional workflow overlay that captures
 * how the job actually works day-to-day, beyond what AIOE and theta measure.
 */

export interface WorkflowOverlay {
	/** How much of the role involves generating novel output vs processing existing input (0–1) */
	creative_generation: number;
	/** How much requires real-time human coordination (0–1) */
	real_time_coordination: number;
	/** Degree of ambiguity in typical tasks (0–1) */
	ambiguity_tolerance: number;
	/** How much the role depends on institutional/tacit knowledge (0–1) */
	institutional_knowledge: number;
	/** Client/stakeholder relationship intensity (0–1) */
	relationship_intensity: number;
	/** Regulatory or compliance burden (0–1) */
	regulatory_weight: number;
	/** Physical presence or environment-specific requirements (0–1) */
	physical_presence: number;
	/** How rapidly the role's tools/methods evolve (0–1) */
	tool_velocity: number;
}

export interface DerivedOverlayScores {
	/** How much pressure to execute fast vs thoughtfully (higher = more pressure, more AI-automatable) */
	execution_pressure: number;
	/** Strength of human-only moat (higher = harder to automate) */
	human_moat: number;
	/** Upside from AI augmentation (higher = more benefit) */
	augmentation_upside: number;
	/** How much scores vary by context (higher = more sensitive to company/seniority) */
	variant_sensitivity: number;
}

/**
 * Compute 4 derived sub-scores from 8 raw workflow dimensions.
 */
export function computeDerivedScores(overlay: WorkflowOverlay): DerivedOverlayScores {
	const execution_pressure =
		0.4 * (1 - overlay.ambiguity_tolerance) +
		0.3 * (1 - overlay.creative_generation) +
		0.3 * overlay.tool_velocity;

	const human_moat =
		0.25 * overlay.real_time_coordination +
		0.25 * overlay.relationship_intensity +
		0.20 * overlay.institutional_knowledge +
		0.15 * overlay.physical_presence +
		0.15 * overlay.regulatory_weight;

	const augmentation_upside =
		0.35 * overlay.creative_generation +
		0.25 * overlay.tool_velocity +
		0.20 * overlay.ambiguity_tolerance +
		0.20 * (1 - overlay.physical_presence);

	const variant_sensitivity =
		0.30 * overlay.institutional_knowledge +
		0.25 * overlay.relationship_intensity +
		0.25 * overlay.regulatory_weight +
		0.20 * overlay.real_time_coordination;

	return { execution_pressure, human_moat, augmentation_upside, variant_sensitivity };
}

/**
 * Compute a context_adjustment multiplier (0.85–1.15) from the derived scores.
 * Values > 1.0 increase risk; < 1.0 decrease risk.
 */
export function computeContextAdjustment(derived: DerivedOverlayScores): number {
	// execution_pressure pushes risk UP, human_moat pushes risk DOWN
	const raw = 1.0 + 0.15 * (derived.execution_pressure - derived.human_moat);
	return Math.max(0.85, Math.min(1.15, raw));
}

/**
 * Generate a human-readable narrative from the 8 workflow dimensions.
 * Describes what the role involves and how AI interacts with it.
 */
export function generateWorkflowNarrative(overlay: WorkflowOverlay): string {
	const derived = computeDerivedScores(overlay);
	const traits: string[] = [];
	const protections: string[] = [];

	// Identify top traits (high dimensions)
	if (overlay.creative_generation > 0.6) traits.push('creative output');
	if (overlay.tool_velocity > 0.7) traits.push('rapid tool adoption');
	if (overlay.ambiguity_tolerance > 0.6) traits.push('ambiguous problem-solving');
	if (overlay.real_time_coordination > 0.7) traits.push('real-time coordination');
	if (overlay.relationship_intensity > 0.7) traits.push('strong client relationships');
	if (overlay.regulatory_weight > 0.7) traits.push('regulatory compliance');
	if (overlay.physical_presence > 0.7) traits.push('physical presence');
	if (overlay.institutional_knowledge > 0.6) traits.push('institutional knowledge');

	// What protects the role
	if (derived.human_moat > 0.5) protections.push('coordination and judgment');
	if (overlay.physical_presence > 0.6) protections.push('physical presence');
	if (overlay.relationship_intensity > 0.6) protections.push('relationship depth');
	if (overlay.regulatory_weight > 0.6) protections.push('regulatory oversight');

	// Build narrative
	const traitStr = traits.length > 0
		? traits.slice(0, 3).join(', ')
		: 'structured execution';

	const augStr = derived.augmentation_upside > 0.5
		? 'AI can augment'
		: derived.augmentation_upside > 0.3
			? 'AI can partially support'
			: 'AI has limited application to';

	const protectStr = protections.length > 0
		? protections.slice(0, 2).join(' and ')
		: 'the overall task structure';

	if (derived.human_moat > 0.6) {
		return `This role involves ${traitStr}. ${augStr} some of the technical and analytical work, but can't replace the ${protectStr} required.`;
	} else if (derived.execution_pressure > 0.6) {
		return `This role involves ${traitStr} with high execution pressure. ${augStr} much of the routine work, and ${protectStr} provides limited protection against automation.`;
	} else {
		return `This role balances ${traitStr}. ${augStr} the more structured tasks, while ${protectStr} anchors the human contribution.`;
	}
}

/**
 * Default workflow overlays for each archetype.
 * These serve as starting points — individual roles can override.
 */
export const archetypeOverlayDefaults: Record<string, WorkflowOverlay> = {
	writing_editorial: {
		creative_generation: 0.85,
		real_time_coordination: 0.30,
		ambiguity_tolerance: 0.75,
		institutional_knowledge: 0.50,
		relationship_intensity: 0.60,
		regulatory_weight: 0.25,
		physical_presence: 0.10,
		tool_velocity: 0.80
	},
	teaching_learning: {
		creative_generation: 0.55,
		real_time_coordination: 0.85,
		ambiguity_tolerance: 0.65,
		institutional_knowledge: 0.60,
		relationship_intensity: 0.80,
		regulatory_weight: 0.45,
		physical_presence: 0.75,
		tool_velocity: 0.40
	},
	software_engineering: {
		creative_generation: 0.70,
		real_time_coordination: 0.45,
		ambiguity_tolerance: 0.70,
		institutional_knowledge: 0.55,
		relationship_intensity: 0.40,
		regulatory_weight: 0.15,
		physical_presence: 0.05,
		tool_velocity: 0.95
	},
	data_analytics: {
		creative_generation: 0.50,
		real_time_coordination: 0.30,
		ambiguity_tolerance: 0.65,
		institutional_knowledge: 0.50,
		relationship_intensity: 0.45,
		regulatory_weight: 0.20,
		physical_presence: 0.05,
		tool_velocity: 0.80
	},
	product_strategy: {
		creative_generation: 0.65,
		real_time_coordination: 0.70,
		ambiguity_tolerance: 0.80,
		institutional_knowledge: 0.65,
		relationship_intensity: 0.75,
		regulatory_weight: 0.15,
		physical_presence: 0.10,
		tool_velocity: 0.60
	},
	sales_gtm: {
		creative_generation: 0.35,
		real_time_coordination: 0.75,
		ambiguity_tolerance: 0.60,
		institutional_knowledge: 0.55,
		relationship_intensity: 0.90,
		regulatory_weight: 0.20,
		physical_presence: 0.30,
		tool_velocity: 0.55
	},
	finance_investing: {
		creative_generation: 0.30,
		real_time_coordination: 0.40,
		ambiguity_tolerance: 0.55,
		institutional_knowledge: 0.60,
		relationship_intensity: 0.65,
		regulatory_weight: 0.80,
		physical_presence: 0.10,
		tool_velocity: 0.50
	},
	people_recruiting: {
		creative_generation: 0.30,
		real_time_coordination: 0.65,
		ambiguity_tolerance: 0.60,
		institutional_knowledge: 0.70,
		relationship_intensity: 0.85,
		regulatory_weight: 0.40,
		physical_presence: 0.20,
		tool_velocity: 0.50
	},
	healthcare_clinical: {
		creative_generation: 0.20,
		real_time_coordination: 0.80,
		ambiguity_tolerance: 0.70,
		institutional_knowledge: 0.65,
		relationship_intensity: 0.85,
		regulatory_weight: 0.90,
		physical_presence: 0.95,
		tool_velocity: 0.35
	},
	design_creative: {
		creative_generation: 0.90,
		real_time_coordination: 0.40,
		ambiguity_tolerance: 0.80,
		institutional_knowledge: 0.40,
		relationship_intensity: 0.55,
		regulatory_weight: 0.10,
		physical_presence: 0.10,
		tool_velocity: 0.85
	},
	operations_logistics: {
		creative_generation: 0.20,
		real_time_coordination: 0.70,
		ambiguity_tolerance: 0.40,
		institutional_knowledge: 0.65,
		relationship_intensity: 0.60,
		regulatory_weight: 0.55,
		physical_presence: 0.50,
		tool_velocity: 0.40
	},
	legal_compliance: {
		creative_generation: 0.40,
		real_time_coordination: 0.35,
		ambiguity_tolerance: 0.75,
		institutional_knowledge: 0.80,
		relationship_intensity: 0.65,
		regulatory_weight: 0.95,
		physical_presence: 0.15,
		tool_velocity: 0.30
	},
	field_manual: {
		creative_generation: 0.10,
		real_time_coordination: 0.50,
		ambiguity_tolerance: 0.30,
		institutional_knowledge: 0.45,
		relationship_intensity: 0.25,
		regulatory_weight: 0.40,
		physical_presence: 0.95,
		tool_velocity: 0.20
	},
	service_hospitality: {
		creative_generation: 0.15,
		real_time_coordination: 0.80,
		ambiguity_tolerance: 0.45,
		institutional_knowledge: 0.40,
		relationship_intensity: 0.85,
		regulatory_weight: 0.25,
		physical_presence: 0.90,
		tool_velocity: 0.25
	},
	general_professional: {
		creative_generation: 0.45,
		real_time_coordination: 0.50,
		ambiguity_tolerance: 0.55,
		institutional_knowledge: 0.55,
		relationship_intensity: 0.55,
		regulatory_weight: 0.35,
		physical_presence: 0.15,
		tool_velocity: 0.50
	},
	general_technical: {
		creative_generation: 0.30,
		real_time_coordination: 0.45,
		ambiguity_tolerance: 0.40,
		institutional_knowledge: 0.50,
		relationship_intensity: 0.35,
		regulatory_weight: 0.30,
		physical_presence: 0.40,
		tool_velocity: 0.45
	},
	general_clerical: {
		creative_generation: 0.10,
		real_time_coordination: 0.35,
		ambiguity_tolerance: 0.25,
		institutional_knowledge: 0.55,
		relationship_intensity: 0.40,
		regulatory_weight: 0.30,
		physical_presence: 0.20,
		tool_velocity: 0.40
	}
};
