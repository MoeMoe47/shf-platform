import partners from "@/data/partners.json";

/** Find a partner course by id */
export function getPartnerCourseById(id) {
  return partners.find(p => p.id === id) || null;
}

/** Return a filtered list by provider or tag (optional) */
export function listPartnerCourses({ provider, tag } = {}) {
  return partners.filter(p => {
    if (provider && p.provider !== provider) return false;
    if (tag && !(p.tags || []).includes(tag)) return false;
    return true;
  });
}

/** Build a launch URL with optional UTM/affiliate codes */
export function buildLaunchUrl(course, extra = {}) {
  if (!course?.launch?.url) return null;
  try {
    const url = new URL(course.launch.url);
    if (extra.utm) url.search += (url.search ? "&" : "") + extra.utm;
    if (extra.aff) url.search += (url.search ? "&" : "") + `aff=${extra.aff}`;
    return url.toString();
  } catch {
    return course.launch.url;
  }
}
