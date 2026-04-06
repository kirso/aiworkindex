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

