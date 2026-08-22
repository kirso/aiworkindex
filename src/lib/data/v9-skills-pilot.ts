import skillsPilotData from './v9-skills-pilot.json';

export interface V9OfficialSkill {
	name: string;
	proficiency: string;
}

export interface V9SkillsSectorProfile {
	sector_key: 'ict' | 'financial_services' | 'healthcare';
	sector: string;
	source_job_role: string;
	mapping: {
		quality: 'exact_title' | 'reviewed_definition_equivalent';
		rationale: string;
		reviewed_at: string;
	};
	technical_skills: V9OfficialSkill[];
	core_skills: V9OfficialSkill[];
	source: {
		publisher: string;
		title: string;
		url: string;
		sector_page: string;
		verification: string;
	};
}

export interface V9SkillsPilotProfile {
	occupation: { code: string; title: string };
	status: 'available_pilot';
	headline_effect: 'none';
	sector_profiles: V9SkillsSectorProfile[];
}

interface V9SkillsPilotArtifact {
	schema_version: '9.0';
	release: 'V9';
	generated_at: string;
	reviewed_at: string;
	construct: 'official_sector_role_skills_pilot';
	headline_effect: 'none';
	claim_boundary: string;
	publication_rule: Record<string, unknown>;
	rights_boundary: string;
	training_discovery_url: string;
	coverage: {
		ssoc_occupations: 1001;
		sectors: 3;
		unique_occupations: number;
		sector_role_profiles: number;
		exact_title_profiles: number;
		reviewed_definition_equivalent_profiles: number;
		unavailable_outside_pilot: number;
	};
	occupation_status: Record<string, 'available_pilot' | 'unavailable_outside_pilot'>;
	profiles: Record<string, V9SkillsPilotProfile>;
}

export const v9SkillsPilot = skillsPilotData as V9SkillsPilotArtifact;
export const v9SkillsPilotCoverage = v9SkillsPilot.coverage;

export function getV9SkillsPilotProfile(ssoc: string): V9SkillsPilotProfile | null {
	return v9SkillsPilot.profiles[ssoc] ?? null;
}
