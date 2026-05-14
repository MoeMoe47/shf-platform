/**
 * Crosswalk maps micro (student) slugs → master slugs.
 * Add entries for each curriculum where slugs differ.
 */
export const crosswalk = {
  asl: {
    // Unit 1
    "asl-1-combined": "asl-1-foundations",
    "asl-1-daily-routines": "asl-1-foundations",

    // Unit 2
    "asl-2-clarification": "asl-2-communication-basics",
    "asl-2-past-routines": "asl-2-communication-basics",

    // Unit 3
    "asl-3-facial-expressions": "asl-3-expressive-grammar",
    "asl-3-grammar-basics": "asl-3-expressive-grammar",

    // Unit 4
    "asl-4-community": "asl-4-deaf-culture",
    "asl-4-history": "asl-4-deaf-culture",

    // Unit 5
    "asl-5-storytelling": "asl-5-narratives",
    "asl-5-role-shift": "asl-5-narratives",

    // Unit 6
    "asl-6-questions": "asl-6-interactive-conversations",
    "asl-6-responses": "asl-6-interactive-conversations",

    // Unit 7
    "asl-7-descriptions": "asl-7-classifiers",
    "asl-7-space-use": "asl-7-classifiers",

    // Unit 8
    "asl-8-dialogs": "asl-8-discourse-strategies",
    "asl-8-turn-taking": "asl-8-discourse-strategies",

    // Unit 9
    "asl-9-narratives": "asl-9-advanced-signing",
    "asl-9-storytelling": "asl-9-advanced-signing",

    // Unit 10 (Capstone)
    "asl-10-showcase": "asl-10-capstone",
    "asl-10-final": "asl-10-capstone"
  },

  cdl: {
    "cdl-1-intro": "cdl-1-safety"
    // Add CDL mappings here...
  }

  // Add other curricula: cosmo, barber, stna, etc.
};

/**
 * Look up the master slug for a given curriculum + student slug.
 * If no mapping exists, falls back to the student slug.
 *
 * @param {string} curriculum - e.g. "asl" or "cdl"
 * @param {string} studentSlug - e.g. "asl-1-combined"
 * @returns {string} - the mapped master slug, or studentSlug if no mapping
 */
export function getMasterSlug(curriculum, studentSlug) {
  const id = (curriculum || "").toLowerCase();
  const mapping = crosswalk[id] || {};
  return mapping[studentSlug] || studentSlug;
}

/**
 * Reverse lookup: given a master slug, find the first student slug.
 * Useful if someone visits /asl/admin/asl-1-foundations
 * and you want to line up micro lessons.
 */
export function getStudentSlug(curriculum, masterSlug) {
  const id = (curriculum || "").toLowerCase();
  const mapping = crosswalk[id] || {};
  for (const [student, master] of Object.entries(mapping)) {
    if (master === masterSlug) return student;
  }
  return masterSlug; // fallback
}
