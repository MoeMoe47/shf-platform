// src/utils/resumeSchema.js
export const RESUME_SCHEMA_VERSION = 1;

export const emptyResume = () => ({
  $schema: "sh.resume/v1",
  version: RESUME_SCHEMA_VERSION,
  meta: { title: "My Resume", updatedAt: new Date().toISOString() },
  contact: { name: "", email: "", phone: "", city: "", links: [] }, // {label,url}
  summary: "",
  skills: [], // ["JavaScript", "ASL", "Customer Support"]
  sections: [
    { type: "experience", items: [] }, // item: { company, role, start, end, bullets: [] }
    { type: "projects", items: [] },   // item: { name, link, stack: [], bullets: [] }
    { type: "education", items: [] },  // item: { school, degree, start, end, bullets: [] }
    { type: "certs", items: [] },      // item: { name, org, year }
  ],
  settings: {
    template: "ats-clean", // "ats-clean" | "modern" | "compact"
    accent: "#111827",
    fontSize: 14,
    lineHeight: 1.4,
    showIcons: false,
  }
});

export function validateResume(doc) {
  const ok = doc && doc.$schema === "sh.resume/v1" && doc.version === RESUME_SCHEMA_VERSION;
  return { ok, errors: ok ? [] : ["Invalid schema or version"] };
}

export function migrateResume(doc) {
  // future-proof: bump versions here
  return doc;
}
