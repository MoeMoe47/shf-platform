// Auto-load every JSON file in src/content/lessons/asl-instructor/*.json
// Each file should include at least: { slug, title, ... }

const files = import.meta.glob("./asl-instructor/*.json", {
  eager: true,
  import: "default",
});

const instructorUnits = Object.values(files);
const bySlug = new Map(instructorUnits.map((u) => [u.slug, u]));

export function allInstructorUnits() {
  return instructorUnits;
}
export function getInstructorUnit(slug) {
  return bySlug.get(slug) || null;
}
