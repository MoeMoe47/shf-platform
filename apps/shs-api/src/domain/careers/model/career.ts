export const CAREER_STATUSES = ["active", "inactive"] as const;
export type CareerStatus = typeof CAREER_STATUSES[number];

export const CAREER_REQUIREMENT_TYPES = ["required", "recommended"] as const;
export type CareerRequirementType = typeof CAREER_REQUIREMENT_TYPES[number];

export const CAREER_DEVELOPMENTAL_STAGES = [
  "DISCOVER", "EXPLORE", "PREPARE_PROVE", "TRANSITION", "ADULT_ACCELERATED",
] as const;
export type CareerDevelopmentalStage = typeof CAREER_DEVELOPMENTAL_STAGES[number];

export type GradeBand = {
  min_grade: number;
  max_grade: number;
  developmental_stage: CareerDevelopmentalStage;
};

export type CareerFamily = {
  career_family_id: string;
  slug: string;
  name: string;
  status: CareerStatus;
};

export type Career = {
  career_id: string;
  slug: string;
  title: string;
  description: string;
  status: CareerStatus;
  career_family_id: string;
  family_slug?: string;
  family_name?: string;
  sector?: string | null;
};

export type CareerCurriculumRequirement = GradeBand & {
  career_curriculum_requirement_id: string;
  career_id: string;
  curriculum_id: string;
  lesson_id: string;
  requirement_type: CareerRequirementType;
};

export function validateGradeBand(input: Partial<GradeBand>): GradeBand {
  const min = Number(input.min_grade);
  const max = Number(input.max_grade);
  const stage = input.developmental_stage;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 6 || max > 12 || min > max) {
    throw new Error("invalid_grade_band");
  }
  if (!CAREER_DEVELOPMENTAL_STAGES.includes(stage as CareerDevelopmentalStage)) {
    throw new Error("invalid_developmental_stage");
  }
  return { min_grade: min, max_grade: max, developmental_stage: stage as CareerDevelopmentalStage };
}
