import { v9SkillsPilot } from '$lib/data/v9-skills-pilot';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	coverage: v9SkillsPilot.coverage,
	claimBoundary: v9SkillsPilot.claim_boundary,
	rightsBoundary: v9SkillsPilot.rights_boundary,
	trainingUrl: v9SkillsPilot.training_discovery_url,
	profiles: Object.values(v9SkillsPilot.profiles)
		.flatMap(profile =>
			profile.sector_profiles.map(sector => ({
				code: profile.occupation.code,
				title: profile.occupation.title,
				sector: sector.sector,
				sourceRole: sector.source_job_role,
				mappingQuality: sector.mapping.quality,
				technicalSkills: sector.technical_skills.map(skill => skill.name),
				coreSkills: sector.core_skills.map(skill => skill.name),
				source: sector.source
			}))
		)
		.sort((a, b) => a.sector.localeCompare(b.sector) || a.title.localeCompare(b.title))
});
