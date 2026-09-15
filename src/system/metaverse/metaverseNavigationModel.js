import {
  METAVERSE_PRODUCTION_BACKGROUND_SET,
  METAVERSE_REFERENCE_ASSETS,
} from "./metaverseVisualAssets.js";

export const METAVERSE_ROUTE = "/metaverse";

export const METAVERSE_NAVIGATION_MODEL_META = {
  canonicalSource: "apps/shs-api/src/domain/metaverse/registry/city-registry.ts#getMetaverseCityProjection",
  projectionPhase: "MET-4 frontend-safe navigation projection",
  duplicatesCanonicalRegistry: false,
  authorizationAuthority: false,
  cameraGrantsAccess: false,
};

export const METAVERSE_CITY = {
  id: "silicon-heartland-city",
  label: "Silicon Heartland",
  description: "Bounded city-scale educational metaverse.",
};

export const METAVERSE_DISTRICT_MARKERS = [
  { id: "civic-district", label: "Civic", fullLabel: "Civic District", x: 28, y: 39 },
  { id: "career-education-district", label: "Career & Education", fullLabel: "Career & Education District", x: 40, y: 29 },
  { id: "data-center-district", label: "Data Center", fullLabel: "Data Center District", x: 65, y: 36 },
  { id: "learning-arcade-district", label: "Learning Arcade", fullLabel: "Learning Arcade District", x: 52, y: 58 },
  { id: "treasury-commerce-district", label: "Treasury & Commerce", fullLabel: "Treasury & Commerce District", x: 34, y: 57 },
  { id: "technology-innovation-district", label: "Technology & Innovation", fullLabel: "Technology & Innovation District", x: 70, y: 59 },
  { id: "community-district", label: "Community", fullLabel: "Community District", x: 25, y: 70 },
  { id: "student-life-district", label: "Student Life", fullLabel: "Residential / Student Life District", x: 50, y: 76 },
  { id: "public-realm", label: "Public Realm", fullLabel: "Public Realm", x: 48, y: 44 },
];

export const METAVERSE_FACILITIES = [
  { id: "city-hall", districtId: "civic-district", label: "City Hall", x: 32, y: 44 },
  { id: "council-chamber", districtId: "civic-district", label: "Council Chamber", x: 50, y: 38 },
  { id: "clerk-office", districtId: "civic-district", label: "Clerk Office", x: 62, y: 53 },
  { id: "planning-department", districtId: "civic-district", label: "Planning Department", x: 42, y: 63 },
  { id: "public-works", districtId: "civic-district", label: "Public Works", x: 72, y: 67 },
  { id: "community-development-office", districtId: "civic-district", label: "Community Development Office", x: 24, y: 67 },
  { id: "career-center", districtId: "career-education-district", label: "Career Center", x: 34, y: 50 },
  { id: "learning-center", districtId: "career-education-district", label: "Learning Center", x: 52, y: 37 },
  { id: "credential-portfolio-center", districtId: "career-education-district", label: "Credential / Portfolio Center", x: 65, y: 58 },
  { id: "career-pathway-center", districtId: "career-education-district", label: "Career Pathway Center", x: 45, y: 68 },
  { id: "main-data-center", districtId: "data-center-district", label: "Main Data Center", x: 44, y: 45 },
  { id: "network-operations-center", districtId: "data-center-district", label: "Network Operations Center", x: 63, y: 38 },
  { id: "power-electrical-facility", districtId: "data-center-district", label: "Power & Electrical Facility", x: 27, y: 60 },
  { id: "cooling-mechanical-plant", districtId: "data-center-district", label: "Cooling / Mechanical Plant", x: 60, y: 62 },
  { id: "security-operations-center", districtId: "data-center-district", label: "Security Operations Center", x: 74, y: 52 },
  { id: "ai-compute-facility", districtId: "data-center-district", label: "AI Compute Facility", x: 50, y: 76 },
  { id: "data-center-training-lab", districtId: "data-center-district", label: "Data Center Training Lab", x: 35, y: 35 },
  { id: "arcade-hub", districtId: "learning-arcade-district", label: "Arcade Hub", x: 42, y: 48 },
  { id: "simulation-hall", districtId: "learning-arcade-district", label: "Simulation Hall", x: 59, y: 42 },
  { id: "skills-challenge-center", districtId: "learning-arcade-district", label: "Skills Challenge Center", x: 52, y: 64 },
  { id: "treasury", districtId: "treasury-commerce-district", label: "Treasury", x: 40, y: 42 },
  { id: "student-economy-center", districtId: "treasury-commerce-district", label: "Student Economy Center", x: 58, y: 40 },
  { id: "store-marketplace", districtId: "treasury-commerce-district", label: "Store / Marketplace", x: 47, y: 62 },
  { id: "financial-literacy-lab", districtId: "treasury-commerce-district", label: "Financial Literacy Lab", x: 66, y: 66 },
  { id: "oas-center", districtId: "technology-innovation-district", label: "OAS Center", x: 33, y: 44 },
  { id: "ai-agent-lab", districtId: "technology-innovation-district", label: "AI / Agent Lab", x: 56, y: 36 },
  { id: "builder-studio", districtId: "technology-innovation-district", label: "Builder / Studio", x: 45, y: 62 },
  { id: "innovation-lab", districtId: "technology-innovation-district", label: "Innovation Lab", x: 68, y: 58 },
  { id: "community-center", districtId: "community-district", label: "Community Center", x: 38, y: 43 },
  { id: "nonprofit-network-center", districtId: "community-district", label: "Nonprofit Network Center", x: 57, y: 52 },
  { id: "program-incubator", districtId: "community-district", label: "Program Incubator", x: 47, y: 68 },
  { id: "student-hub", districtId: "student-life-district", label: "Student Hub", x: 43, y: 45 },
  { id: "student-profile-access", districtId: "student-life-district", label: "Portfolio / Profile Access Point", x: 61, y: 58 },
  { id: "central-plaza", districtId: "public-realm", label: "Central Plaza", x: 44, y: 42 },
  { id: "park", districtId: "public-realm", label: "Park", x: 62, y: 54 },
  { id: "transit-wayfinding-hub", districtId: "public-realm", label: "Transit / Wayfinding Hub", x: 38, y: 68 },
];

export const METAVERSE_ACTIVITY_PLACEHOLDERS = [
  {
    id: "data-center-foundations-introduction",
    facilityId: "data-center-training-lab",
    districtId: "data-center-district",
    label: "What Is a Data Center?",
    mountPoint: "curriculum-read-only-lesson",
    canonicalOwner: "curriculum-domain",
  },
  {
    id: "data-center-cooling-simulation",
    facilityId: "cooling-mechanical-plant",
    districtId: "data-center-district",
    label: "Data Center Cooling Simulation",
    mountPoint: "future-simulation",
  },
  {
    id: "data-center-safety-simulation",
    facilityId: "main-data-center",
    districtId: "data-center-district",
    label: "Data Center Safety Simulation",
    mountPoint: "future-simulation",
  },
  {
    id: "civic-council-session",
    facilityId: "council-chamber",
    districtId: "civic-district",
    label: "Civic Council Session",
    mountPoint: "future-civic-session",
  },
  {
    id: "capstone-project-room",
    facilityId: "builder-studio",
    districtId: "technology-innovation-district",
    label: "Capstone Project Room",
    mountPoint: "future-project-experience",
  },
];

export const METAVERSE_DISTRICTS = METAVERSE_DISTRICT_MARKERS.map((district) => ({
  ...district,
  description: districtDescription(district.id),
  facilities: METAVERSE_FACILITIES.filter((facility) => facility.districtId === district.id),
}));

function districtDescription(districtId) {
  const descriptions = {
    "civic-district": "SHF Civic-backed simulation spaces for council, planning, and civic learning.",
    "career-education-district": "Career, curriculum, pathway, and portfolio navigation.",
    "data-center-district": "Technical learning and future data center operations simulations.",
    "learning-arcade-district": "Practice, games, and curriculum-linked challenges.",
    "treasury-commerce-district": "Projection-only Treasury and commerce navigation.",
    "technology-innovation-district": "Studio, AI, OAS, and innovation learning spaces.",
    "community-district": "Community programs and service-learning concepts.",
    "student-life-district": "Student hub and portfolio access without social-network behavior.",
    "public-realm": "Orientation, wayfinding, events, and accessible city navigation.",
  };
  return descriptions[districtId] || "Silicon Heartland district.";
}

export function publicAssetUrl(targetPath) {
  const baseUrl = import.meta.env?.BASE_URL || "/";
  return `${baseUrl}${String(targetPath).replace(/^public\//, "")}`;
}

export function findProductionEnvironmentAsset({ cameraLevel, districtId = null, facilityId = null }) {
  const asset = METAVERSE_PRODUCTION_BACKGROUND_SET.find((item) => (
    item.cameraLevel === cameraLevel &&
    (districtId === undefined || item.district === districtId) &&
    (facilityId === undefined || item.facility === facilityId)
  ));
  if (asset) return { ...asset, url: publicAssetUrl(asset.targetPath) };
  if (facilityId && districtId) {
    const districtAsset = METAVERSE_PRODUCTION_BACKGROUND_SET.find((item) => item.cameraLevel === "DISTRICT_VIEW" && item.district === districtId && item.productionBackground);
    if (districtAsset) return { ...districtAsset, facilityFallback: true, url: publicAssetUrl(districtAsset.targetPath) };
  }
  return null;
}

export function isReferenceOnlyAssetPath(path) {
  return METAVERSE_REFERENCE_ASSETS.some((asset) => asset.targetPath === path || publicAssetUrl(asset.targetPath) === path);
}

export function getDistrictById(id) {
  return METAVERSE_DISTRICTS.find((district) => district.id === id) || null;
}

export function getFacilityById(id) {
  return METAVERSE_FACILITIES.find((facility) => facility.id === id) || null;
}

export function getActivitiesForFacility(facilityId) {
  return METAVERSE_ACTIVITY_PLACEHOLDERS.filter((activity) => activity.facilityId === facilityId);
}

export function getBreadcrumbs({ level, districtId, facilityId, activityId }) {
  const crumbs = [{ level: "CITY_OVERVIEW", id: METAVERSE_CITY.id, label: METAVERSE_CITY.label }];
  const district = districtId ? getDistrictById(districtId) : null;
  if (district && level !== "CITY_OVERVIEW") crumbs.push({ level: "DISTRICT_VIEW", id: district.id, label: district.label });
  const facility = facilityId ? getFacilityById(facilityId) : null;
  if (facility && ["FACILITY_VIEW", "ACTIVITY_SIMULATION_VIEW"].includes(level)) crumbs.push({ level: "FACILITY_VIEW", id: facility.id, label: facility.label });
  const activity = activityId ? METAVERSE_ACTIVITY_PLACEHOLDERS.find((item) => item.id === activityId) : null;
  if (activity && level === "ACTIVITY_SIMULATION_VIEW") crumbs.push({ level: "ACTIVITY_SIMULATION_VIEW", id: activity.id, label: activity.label });
  return crumbs;
}
