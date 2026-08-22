export interface V9IloTaskEvidenceRow {
	task_id: number;
	text: string;
	score_2025: number;
	score_source: string;
}

export interface V9IloTaskEvidenceGroup {
	isco08_code: string;
	title: string;
	tasks: V9IloTaskEvidenceRow[];
}

export interface V9IloTaskEvidenceDocument {
	schema_version: '9.0';
	release: string;
	generated_at: '2026-08-19';
	construct: 'task_level_potential_to_perform_with_generative_ai';
	headline_effect: 'none';
	grain: 'ISCO-08 four-digit occupation group';
	mapping_rule: string;
	score_scale: string;
	selection_rule: string;
	adaptation_notice: string;
	source: {
		publisher: string;
		title: string;
		url: string;
		repository_url: string;
		doi: string;
		license: 'CC BY 4.0';
		license_url: string;
		sha256: string;
	};
	counts: { isco08_groups: number; tasks: number };
	by_isco08: Record<string, V9IloTaskEvidenceGroup>;
}

export interface V9MappedTaskExamples {
	isco08Code: string;
	isco08Title: string;
	higher: V9IloTaskEvidenceRow[];
	lower: V9IloTaskEvidenceRow[];
}
