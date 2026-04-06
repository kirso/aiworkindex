import supportData from './support.json';

export interface UnitedStatesSupportTaskPrimitive {
  matched_task_weight_share: number | null;
  task_effective_coverage: number | null;
  task_exposure_concentration: number | null;
  method: 'anthropic_task_penetration_v1' | null;
}

export interface UnitedStatesSupportTask {
  task: string;
  score: number;
  penetration: number | null;
}

export interface UnitedStatesSupportTechnology {
  name: string;
  category: string;
  hot: boolean;
  inDemand: boolean;
}

export interface UnitedStatesSupportWorkContext {
  label: string;
  value: number;
}

export interface UnitedStatesSupportWageProfile {
  employment: number | null;
  jobsPer1000: number | null;
  meanAnnual: number | null;
  medianAnnual: number | null;
  medianHourly: number | null;
  p10Annual: number | null;
  p25Annual: number | null;
  p75Annual: number | null;
  p90Annual: number | null;
  p10Hourly: number | null;
  p25Hourly: number | null;
  p75Hourly: number | null;
  p90Hourly: number | null;
}

export interface UnitedStatesSupportDemandProfile {
  employment2024: number | null;
  employment2034: number | null;
  projectedChange: number | null;
  projectedChangePct: number | null;
  openings2024_2034: number | null;
  medianWage2024: number | null;
  education: string | null;
  workExperience: string | null;
  onTheJobTraining: string | null;
  outlook: string | null;
  relatedOOHContent: string | null;
}

export interface UnitedStatesSupportRequirement {
  label: string;
  value: string;
  detail: string | null;
  tone: 'support' | 'neutral' | 'pressure' | 'protective';
}

export interface UnitedStatesSupportNarrativeProfile {
  description: string | null;
  whatTheyDo: string | null;
  workEnvironment: string | null;
  howToBecomeOne: string | null;
  pay: string | null;
  outlook: string | null;
  similarOccupations: string[];
  entryLevelEducation: string | null;
  workExperience: string | null;
  onTheJobTraining: string | null;
  medianPayAnnual: string | null;
  medianPayHourly: string | null;
  numberOfJobs: string | null;
  employmentOutlook: string | null;
  employmentOpenings: string | null;
}

export interface UnitedStatesSupportSkillsProfile {
  topSkills: string[];
}

export interface UnitedStatesSupportAgeProfile {
  totalEmployment: number | null;
  medianAge: number | null;
  under25Share: number | null;
  primeAgeShare: number | null;
  olderShare: number | null;
  matchScore: number | null;
}

export interface UnitedStatesOccupationSupport {
  localCode: string;
  localTitle: string;
  occupationDescription: string | null;
  jobZone: number | null;
  jobZoneLabel: string | null;
  jobZoneSummary: string | null;
  wageProfile: UnitedStatesSupportWageProfile;
  demandProfile: UnitedStatesSupportDemandProfile;
  requirementProfile: UnitedStatesSupportRequirement[];
  narrativeProfile: UnitedStatesSupportNarrativeProfile;
  skillsProfile: UnitedStatesSupportSkillsProfile;
  taskPrimitives: UnitedStatesSupportTaskPrimitive;
  topTasks: UnitedStatesSupportTask[];
  topTechnologies: UnitedStatesSupportTechnology[];
  topWorkContext: UnitedStatesSupportWorkContext[];
  ageProfile: UnitedStatesSupportAgeProfile;
  note: string;
  sourceVintage: string;
}

type SupportPayload = {
  generated_at: string;
  version: string;
  source_vintage: string;
  note: string;
  entries: UnitedStatesOccupationSupport[];
};

const support = supportData as SupportPayload;
const supportByCode = new Map(support.entries.map(entry => [entry.localCode, entry] as const));

export const usSupportEntries = support.entries;
export const usSupportByCode = supportByCode;

export function getUnitedStatesSupport(localCode: string): UnitedStatesOccupationSupport | null {
  return supportByCode.get(localCode) ?? null;
}
