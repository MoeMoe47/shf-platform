// Transitional presentation adapter. Career API data is authoritative;
// legacy pathway fields are deliberately empty rather than sourced from
// static wage, employer, or readiness data.
export function careerToPathway(career, requirements = []) {
  if (!career) return null;
  return {
    id: career.career_id,
    slug: career.slug,
    title: career.title,
    description: career.description,
    cluster: career.family_name || "Uncategorized",
    careerFamilyId: career.career_family_id,
    canonicalCareer: true,
    curriculumRequirements: requirements,
    modules: [],
    jobsMeta: {},
    skills: [],
  };
}
