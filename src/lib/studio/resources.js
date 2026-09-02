// Presentation adapter for the canonical Studio project-resource read model.
// It deliberately preserves only student-safe fields and never adds progress
// or completion semantics to resource viewing.
export function normalizeStudioResources(data) {
  const items = Array.isArray(data?.resources) ? data.resources : [];
  return items.filter((item) => item && item.id && item.title).map((item) => ({
    id: String(item.id),
    title: String(item.title),
    description: item.description ? String(item.description) : null,
    type: item.type ? String(item.type) : "RESOURCE",
    href: item.href ? String(item.href) : null,
    origin: item.origin || null,
    sourceLabel: item.sourceLabel || null,
  }));
}

export function groupStudioResources(resources, project) {
  const items = Array.isArray(resources) ? resources : [];
  return {
    assignment: project?.origin === "ASSIGNMENT" ? items.filter((item) => item.origin === "ASSIGNMENT") : [],
    other: project?.origin === "ASSIGNMENT" ? items.filter((item) => item.origin !== "ASSIGNMENT") : items,
  };
}
