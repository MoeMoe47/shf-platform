// MET-7 — deterministic curriculum-to-place mapping (build brief §4).
//
// Pure function: same input always resolves to the same district/
// facility/activity. Reads only the MET-2 registry (apps/shs-api/src/
// domain/metaverse/registry/city-registry.ts) — never invents a
// district, facility, or activity that isn't already declared there.
import { SILICON_HEARTLAND_CITY_ID, SILICON_HEARTLAND_CITY_REGISTRY, METAVERSE_DISTRICT_IDS } from "../registry/city-registry.js";
import type { MissionLocation } from "./mission-contract.js";

export interface MissionLocationHint {
  courseStableKey: string | null;
  courseTitle: string | null;
  unitStableKey: string | null;
  lessonStableKey: string | null;
  lessonTitle: string | null;
  assignmentType: string;
}

type Rule = { keywords: string[]; districtId: string; facilityId: string };

// Each rule's facility must be a real facility belonging to the paired
// district in SILICON_HEARTLAND_CITY_REGISTRY — asserted at module load
// below so a typo here fails loudly instead of silently mis-routing a
// mission (build brief §4: "Do not invent mappings where no educational
// relationship exists").
const RULES: Rule[] = [
  { keywords: ["data-center", "data center", "datacenter", "network-operations", "cooling", "power-electrical", "ai-compute", "security-operations"], districtId: METAVERSE_DISTRICT_IDS.dataCenter, facilityId: "data-center-training-lab" },
  { keywords: ["civic", "government", "election", "council", "proposal", "public-works", "community-development"], districtId: METAVERSE_DISTRICT_IDS.civic, facilityId: "city-hall" },
  { keywords: ["career", "workforce", "credential", "pathway"], districtId: METAVERSE_DISTRICT_IDS.careerEducation, facilityId: "career-center" },
  { keywords: ["financial-literacy", "financial literacy", "entrepreneur", "budgeting", "treasury", "commerce"], districtId: METAVERSE_DISTRICT_IDS.treasuryCommerce, facilityId: "financial-literacy-lab" },
  { keywords: ["community", "nonprofit", "service-learning", "service learning"], districtId: METAVERSE_DISTRICT_IDS.community, facilityId: "community-center" },
  { keywords: ["web development", "web-dev", "software", "programming", "ai", "artificial intelligence", "agent", "autonomous", "oas"], districtId: METAVERSE_DISTRICT_IDS.technologyInnovation, facilityId: "builder-studio" },
];

const FALLBACK: Rule = { keywords: [], districtId: METAVERSE_DISTRICT_IDS.careerEducation, facilityId: "learning-center" };

for (const rule of [...RULES, FALLBACK]) {
  const district = SILICON_HEARTLAND_CITY_REGISTRY.districts.find((d) => d.id === rule.districtId);
  const facility = SILICON_HEARTLAND_CITY_REGISTRY.facilities.find((f) => f.id === rule.facilityId);
  if (!district) throw new Error(`MET-7 location-resolver misconfigured: unknown district "${rule.districtId}"`);
  if (!facility || facility.district_id !== rule.districtId) throw new Error(`MET-7 location-resolver misconfigured: facility "${rule.facilityId}" does not belong to district "${rule.districtId}"`);
}

function haystack(hint: MissionLocationHint): string {
  return [hint.courseStableKey, hint.courseTitle, hint.unitStableKey, hint.lessonStableKey, hint.lessonTitle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// A mission maps to a specific MET-2 MetaverseActivity only when its
// bound lesson's stable key matches an activity id already declared in
// the registry (currently just data-center-foundations-introduction).
// MET-7 never fabricates a new activity id to force a 1:1 match.
function matchRegistryActivity(hint: MissionLocationHint, districtId: string, facilityId: string): string | null {
  if (!hint.lessonStableKey) return null;
  const activity = SILICON_HEARTLAND_CITY_REGISTRY.activities.find(
    (item) => item.district_id === districtId && item.facility_id === facilityId && item.id === hint.lessonStableKey,
  );
  return activity ? activity.id : null;
}

export function resolveMissionLocation(hint: MissionLocationHint): MissionLocation {
  const text = haystack(hint);
  const matched = RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword))) || FALLBACK;
  const metaverseActivityId = matchRegistryActivity(hint, matched.districtId, matched.facilityId);
  return {
    cityId: SILICON_HEARTLAND_CITY_ID,
    districtId: matched.districtId,
    facilityId: matched.facilityId,
    metaverseActivityId,
    matchedRule: matched === FALLBACK ? "fallback:learning-center" : matched.keywords[0],
  };
}
