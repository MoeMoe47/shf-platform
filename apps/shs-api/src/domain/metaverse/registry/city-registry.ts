import {
  ECONOMY_BOUNDARY,
  METAVERSE_CANONICAL_OWNER,
} from "../model/metaverse-contract.js";

export type MetaverseRouteStatus = "LIVE" | "PARTIAL" | "PLACEHOLDER" | "REGISTRY_ONLY" | "PLANNED";
export type MetaverseRegistryStatus = "ACTIVE" | "PLANNED" | "REGISTRY_ONLY";

export type MetaverseRouteReference = {
  status: MetaverseRouteStatus;
  path: string | null;
  source: string;
  notes: string;
};

export type MetaverseAlignment = {
  canonical_owner: string;
  refs: string[];
  notes: string;
};

export type MetaverseEconomyParticipation = {
  category: "none" | "experience_rewards" | "learning_credits" | "shf_dollars" | "real_money";
  authority_status: "not_applicable" | "projection_only" | "unresolved_blocked";
  notes: string;
};

export type MetaverseDestination = {
  id: string;
  version: string;
  city_id: string;
  district_id: string;
  facility_id: string | null;
  label: string;
  description: string;
  status: MetaverseRouteStatus;
  destination_type: "app_route" | "registry_node" | "future_task_hook" | "external_public_route";
  experience_type: "navigation" | "learning" | "practice" | "simulation" | "portfolio" | "economy_projection" | "orientation";
  route_reference: MetaverseRouteReference;
  curriculum_alignment: MetaverseAlignment;
  career_alignment: MetaverseAlignment;
  civic_alignment: MetaverseAlignment;
  economy_participation: MetaverseEconomyParticipation;
  unlock_requirement_reference: string | null;
  evidence_capability: string;
  accessibility_alternative: string;
  tags: string[];
};

export type MetaverseFacility = {
  id: string;
  version: string;
  city_id: string;
  district_id: string;
  label: string;
  purpose: string;
  status: MetaverseRegistryStatus;
  visual_asset_slot: string;
  destination_ids: string[];
};

export type MetaverseActivity = {
  id: string;
  version: string;
  city_id: string;
  district_id: string;
  facility_id: string;
  label: string;
  description: string;
  status: "ACTIVE" | "PLANNED" | "CLOSED";
  activity_type: "lesson_mount" | "simulation" | "civic_session" | "project_room";
  canonical_owner: string;
  canonical_ref: string;
  route_reference: MetaverseRouteReference;
  unlock_requirement_reference: string | null;
  completion_authority: string;
  evidence_capability: string;
  tags: string[];
};

export type MetaverseDistrict = {
  id: string;
  version: string;
  city_id: string;
  label: string;
  purpose: string;
  status: MetaverseRegistryStatus;
  visual_asset_slot: string;
  facility_ids: string[];
  tags: string[];
};

export type MetaverseCityRegistry = {
  city_id: string;
  version: string;
  label: string;
  description: string;
  status: MetaverseRegistryStatus;
  canonical_owner: typeof METAVERSE_CANONICAL_OWNER;
  scope: "bounded_city_scale_learning_environment";
  real_government_authority: false;
  state_or_national_simulation: false;
  declarative_only: true;
  authorization_authority: false;
  universe_relationship: string;
  civic_sure_boundary: string;
  economy_boundary: string;
  districts: MetaverseDistrict[];
  facilities: MetaverseFacility[];
  destinations: MetaverseDestination[];
  activities: MetaverseActivity[];
  access_requirements: string[];
  career_alignment: MetaverseAlignment;
  curriculum_alignment: MetaverseAlignment;
  civic_alignment: MetaverseAlignment;
  economy_participation: MetaverseEconomyParticipation;
  accessibility_alternatives: string[];
  evidence_capabilities: string[];
};

export const SILICON_HEARTLAND_CITY_ID = "silicon-heartland-city" as const;

export const METAVERSE_KNOWN_LIVE_ROUTE_REFERENCES = [
  "/career.html#/",
  "/career.html#/pathways",
  "/career.html#/pathways/data-center-ai-infrastructure",
  "/career.html#/portfolio",
  "/career.html#/marketplace",
  "/curriculum.html#/curriculum/learning",
  "/curriculum.html#/curriculum/asl/portfolio",
  "/curriculum.html#/studio",
  "/arcade.html#/dashboard",
  "/arcade.html#/classical-arcade",
  "/arcade.html#/games",
  "/civic.html#/dashboard",
  "/civic.html#/elections",
  "/civic.html#/proposals",
  "/civic.html#/treasury-sim",
  "/treasury.html#/dashboard",
  "/store.html#/catalog",
  "/oas.html",
] as const;

const noneAlignment = (owner: string, notes: string): MetaverseAlignment => ({
  canonical_owner: owner,
  refs: [],
  notes,
});

const curriculum = (refs: string[], notes: string): MetaverseAlignment => ({
  canonical_owner: "curriculum-domain",
  refs,
  notes,
});

const career = (refs: string[], notes: string): MetaverseAlignment => ({
  canonical_owner: "career-pathways-credentials-career-events-domains",
  refs,
  notes,
});

const civic = (refs: string[], notes: string): MetaverseAlignment => ({
  canonical_owner: "shf-civic",
  refs,
  notes,
});

const economy = (
  category: MetaverseEconomyParticipation["category"],
  authority_status: MetaverseEconomyParticipation["authority_status"],
  notes: string,
): MetaverseEconomyParticipation => ({ category, authority_status, notes });

const route = (
  status: MetaverseRouteStatus,
  path: string | null,
  source: string,
  notes: string,
): MetaverseRouteReference => ({ status, path, source, notes });

const destination = (
  id: string,
  district_id: string,
  facility_id: string | null,
  label: string,
  description: string,
  status: MetaverseRouteStatus,
  destination_type: MetaverseDestination["destination_type"],
  experience_type: MetaverseDestination["experience_type"],
  route_reference: MetaverseRouteReference,
  options: {
    curriculum_alignment?: MetaverseAlignment;
    career_alignment?: MetaverseAlignment;
    civic_alignment?: MetaverseAlignment;
    economy_participation?: MetaverseEconomyParticipation;
    unlock_requirement_reference?: string | null;
    evidence_capability?: string;
    accessibility_alternative?: string;
    tags?: string[];
  } = {},
): MetaverseDestination => ({
  id,
  version: "1.0.0",
  city_id: SILICON_HEARTLAND_CITY_ID,
  district_id,
  facility_id,
  label,
  description,
  status,
  destination_type,
  experience_type,
  route_reference,
  curriculum_alignment: options.curriculum_alignment ?? noneAlignment("curriculum-domain", "No curriculum alignment in MET-2."),
  career_alignment: options.career_alignment ?? noneAlignment("career-pathways-credentials-career-events-domains", "No career alignment in MET-2."),
  civic_alignment: options.civic_alignment ?? noneAlignment("shf-civic", "No SHF Civic alignment in MET-2."),
  economy_participation: options.economy_participation ?? economy("none", "not_applicable", "No economy participation in MET-2."),
  unlock_requirement_reference: options.unlock_requirement_reference ?? null,
  evidence_capability: options.evidence_capability ?? "none",
  accessibility_alternative: options.accessibility_alternative ?? "List-based navigation and non-spatial destination selection.",
  tags: options.tags ?? [],
});

const district = (
  id: string,
  label: string,
  purpose: string,
  visual_asset_slot: string,
  facility_ids: string[],
  tags: string[],
): MetaverseDistrict => ({
  id,
  version: "1.0.0",
  city_id: SILICON_HEARTLAND_CITY_ID,
  label,
  purpose,
  status: "ACTIVE",
  visual_asset_slot,
  facility_ids,
  tags,
});

const facility = (
  id: string,
  district_id: string,
  label: string,
  purpose: string,
  visual_asset_slot: string,
  destination_ids: string[],
): MetaverseFacility => ({
  id,
  version: "1.0.0",
  city_id: SILICON_HEARTLAND_CITY_ID,
  district_id,
  label,
  purpose,
  status: "ACTIVE",
  visual_asset_slot,
  destination_ids,
});

const activity = (
  id: string,
  district_id: string,
  facility_id: string,
  label: string,
  description: string,
  options: {
    canonical_ref: string;
    route_reference: MetaverseRouteReference;
    activity_type?: MetaverseActivity["activity_type"];
    unlock_requirement_reference?: string | null;
    tags?: string[];
  },
): MetaverseActivity => ({
  id,
  version: "1.0.0",
  city_id: SILICON_HEARTLAND_CITY_ID,
  district_id,
  facility_id,
  label,
  description,
  status: "ACTIVE",
  activity_type: options.activity_type ?? "lesson_mount",
  canonical_owner: "curriculum-domain",
  canonical_ref: options.canonical_ref,
  route_reference: options.route_reference,
  unlock_requirement_reference: options.unlock_requirement_reference ?? "data-center-foundations-enrollment",
  completion_authority: "curriculum-domain",
  evidence_capability: "none; read-only metaverse mount does not create completion, assessment pass, verified outcome, or credential",
  tags: options.tags ?? [],
});

export const METAVERSE_DISTRICT_IDS = {
  civic: "civic-district",
  careerEducation: "career-education-district",
  dataCenter: "data-center-district",
  learningArcade: "learning-arcade-district",
  treasuryCommerce: "treasury-commerce-district",
  technologyInnovation: "technology-innovation-district",
  community: "community-district",
  studentLife: "student-life-district",
  publicRealm: "public-realm",
} as const;

const destinations: MetaverseDestination[] = [
  destination("city-hall", METAVERSE_DISTRICT_IDS.civic, "city-hall", "City Hall", "SHF Civic-backed civic learning entry for simulated city participation.", "LIVE", "app_route", "simulation", route("LIVE", "/civic.html#/dashboard", "src/router/CivicRoutes.jsx", "Civic dashboard route is live; SHF Civic remains canonical."), { civic_alignment: civic(["civic-dashboard"], "SHF Civic dashboard is the civic-learning authority."), evidence_capability: "future operational events only", tags: ["civic", "government", "orientation"] }),
  destination("council-chamber", METAVERSE_DISTRICT_IDS.civic, "council-chamber", "Council Chamber", "Simulated council and election participation destination.", "LIVE", "app_route", "simulation", route("LIVE", "/civic.html#/elections", "src/router/CivicRoutes.jsx", "Elections route is live as SHF Civic surface."), { civic_alignment: civic(["elections"], "Reusable for simulated elections without real public office claims."), tags: ["civic", "elections", "council"] }),
  destination("clerk-office", METAVERSE_DISTRICT_IDS.civic, "clerk-office", "Clerk Office", "Future simulated records, minutes, and clerk workflow destination.", "PLANNED", "future_task_hook", "simulation", route("PLANNED", null, "MET-2 registry", "No dedicated Clerk route exists."), { civic_alignment: civic(["future-clerk-office"], "Future SHF Civic-governed clerk simulation."), tags: ["civic", "clerk", "planned"] }),
  destination("planning-department", METAVERSE_DISTRICT_IDS.civic, "planning-department", "Planning Department", "Proposal and planning exercise destination.", "LIVE", "app_route", "simulation", route("LIVE", "/civic.html#/proposals", "src/router/CivicRoutes.jsx", "Proposals route is live."), { civic_alignment: civic(["proposals"], "SHF Civic proposals can back simulated planning exercises."), tags: ["civic", "planning", "proposals"] }),
  destination("public-works-office", METAVERSE_DISTRICT_IDS.civic, "public-works", "Public Works", "Future simulated public works planning and service-learning destination.", "PLANNED", "future_task_hook", "simulation", route("PLANNED", null, "MET-2 registry", "No dedicated Public Works route exists."), { civic_alignment: civic(["future-public-works"], "Future SHF Civic-governed public works exercise."), tags: ["civic", "public-works", "planned"] }),
  destination("community-development-office", METAVERSE_DISTRICT_IDS.civic, "community-development-office", "Community Development Office", "Future community development proposal and program coordination destination.", "PLANNED", "future_task_hook", "simulation", route("PLANNED", null, "MET-2 registry", "No dedicated Community Development route exists."), { civic_alignment: civic(["future-community-development"], "Future SHF Civic/community learning exercise."), tags: ["civic", "community-development", "planned"] }),

  destination("career-center", METAVERSE_DISTRICT_IDS.careerEducation, "career-center", "Career Center", "Existing Career Center entry for exploration and learner career state.", "LIVE", "app_route", "navigation", route("LIVE", "/career.html#/", "src/router/CareerRoutes.jsx", "Career home route is live."), { career_alignment: career(["career-home"], "Career domain remains canonical for career surfaces."), tags: ["career"] }),
  destination("learning-center", METAVERSE_DISTRICT_IDS.careerEducation, "learning-center", "Learning Center", "Existing Curriculum learning workspace entry.", "LIVE", "app_route", "learning", route("LIVE", "/curriculum.html#/curriculum/learning", "src/router/CurriculumRoutes.jsx", "Curriculum learning route is live."), { curriculum_alignment: curriculum(["curriculum-learning"], "Curriculum remains canonical for courses and lessons."), tags: ["curriculum", "learning"] }),
  destination("credential-portfolio-center", METAVERSE_DISTRICT_IDS.careerEducation, "credential-portfolio-center", "Credential / Portfolio Center", "Portfolio-facing destination for future metaverse evidence projections.", "LIVE", "app_route", "portfolio", route("LIVE", "/career.html#/portfolio", "src/router/CareerRoutes.jsx", "Career portfolio route is live."), { career_alignment: career(["portfolio"], "Portfolio/career domains remain canonical for learner profile outputs."), evidence_capability: "future verified evidence projection only", tags: ["portfolio", "credentials"] }),
  destination("career-pathway-center", METAVERSE_DISTRICT_IDS.careerEducation, "career-pathway-center", "Career Pathway Center", "Career pathway navigation including Data Center & AI Infrastructure.", "LIVE", "app_route", "navigation", route("LIVE", "/career.html#/pathways", "src/router/CareerRoutes.jsx", "Career pathways route is live."), { career_alignment: career(["pathways"], "Career pathway domain remains canonical."), tags: ["career", "pathways"] }),

  destination("main-data-center", METAVERSE_DISTRICT_IDS.dataCenter, "main-data-center", "Main Data Center", "Flagship registry node for future Data Center district experiences.", "REGISTRY_ONLY", "registry_node", "simulation", route("REGISTRY_ONLY", null, "MET-2 registry", "No visual Data Center facility route exists yet."), { curriculum_alignment: curriculum(["data-center-foundations-student", "data-center-systems-7-student", "data-center-design-8-student"], "Data Center curriculum exists in repository content."), career_alignment: career(["data-center-ai-infrastructure", "career_data_center_technician"], "Existing canonical Data Center Technician alignment; no fabricated job claim."), evidence_capability: "future task events; existing prepare-prove evidence remains external authority", tags: ["data-center", "flagship"] }),
  destination("network-operations-center", METAVERSE_DISTRICT_IDS.dataCenter, "network-operations-center", "Network Operations Center", "Future networking and troubleshooting task hook.", "REGISTRY_ONLY", "future_task_hook", "simulation", route("REGISTRY_ONLY", null, "MET-2 registry", "No NOC route exists yet."), { curriculum_alignment: curriculum(["data-center-specialization-11-student", "data-center-specialization-12-student"], "Networking/fiber proof activities exist in Data Center pathway evidence."), career_alignment: career(["Network Technician: needs separate career phase"], "Planned role only; not a credential or employment claim."), evidence_capability: "future networking task evidence candidate", tags: ["data-center", "networking", "operations"] }),
  destination("power-electrical-facility", METAVERSE_DISTRICT_IDS.dataCenter, "power-electrical-facility", "Power & Electrical Facility", "Future low-risk classroom simulation hook for power and electrical infrastructure reasoning.", "REGISTRY_ONLY", "future_task_hook", "simulation", route("REGISTRY_ONLY", null, "MET-2 registry", "No Power/Electrical route exists yet."), { curriculum_alignment: curriculum(["electrical-infrastructure specialization"], "Repository pathway emphasizes classroom simulation and no professional electrical work."), career_alignment: career(["Electrical Technician: needs separate career phase"], "Planned role only."), evidence_capability: "future power/facilities evidence candidate", tags: ["data-center", "power", "safety"] }),
  destination("cooling-mechanical-plant", METAVERSE_DISTRICT_IDS.dataCenter, "cooling-mechanical-plant", "Cooling / Mechanical Plant", "Future cooling and mechanical systems simulation hook.", "REGISTRY_ONLY", "future_task_hook", "simulation", route("REGISTRY_ONLY", null, "MET-2 registry", "No Cooling/Mechanical route exists yet."), { curriculum_alignment: curriculum(["mechanical-hvac specialization"], "HVAC/mechanical Data Center specialization exists as curriculum/proof alignment."), career_alignment: career(["HVAC/Mechanical Technician: needs separate career phase"], "Planned role only."), evidence_capability: "future cooling systems evidence candidate", tags: ["data-center", "cooling", "mechanical"] }),
  destination("security-operations-center", METAVERSE_DISTRICT_IDS.dataCenter, "security-operations-center", "Security Operations Center", "Future physical/cybersecurity operations simulation hook.", "REGISTRY_ONLY", "future_task_hook", "simulation", route("REGISTRY_ONLY", null, "MET-2 registry", "No SOC route exists yet."), { curriculum_alignment: curriculum(["cybersecurity-security specialization"], "Cybersecurity/security proof activities exist in Data Center pathway."), career_alignment: career(["Cybersecurity Technician: needs separate career phase"], "Planned role only."), evidence_capability: "future security operations evidence candidate", tags: ["data-center", "cybersecurity", "security"] }),
  destination("ai-compute-facility", METAVERSE_DISTRICT_IDS.dataCenter, "ai-compute-facility", "AI Compute Facility", "Future AI/cloud infrastructure simulation hook.", "REGISTRY_ONLY", "future_task_hook", "simulation", route("REGISTRY_ONLY", null, "MET-2 registry", "No AI Compute facility route exists yet."), { curriculum_alignment: curriculum(["ai-cloud-infrastructure specialization"], "AI/cloud specialization exists in Data Center pathway."), career_alignment: career(["Cloud/AI Infrastructure Technician: needs separate career phase"], "Planned role only."), evidence_capability: "future AI infrastructure evidence candidate", tags: ["data-center", "ai", "cloud"] }),
  destination("data-center-training-lab", METAVERSE_DISTRICT_IDS.dataCenter, "data-center-training-lab", "Data Center Training Lab", "Live curriculum/pathway entry for Data Center & AI Infrastructure learning.", "LIVE", "app_route", "learning", route("LIVE", "/career.html#/pathways/data-center-ai-infrastructure", "src/router/CareerRoutes.jsx and docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json", "Career pathway route pattern is live; pathway record exists."), { curriculum_alignment: curriculum(["168 data-center lesson JSON files", "41 prepare-prove proof activities"], "Existing Data Center curriculum and proof activity evidence."), career_alignment: career(["data-center-ai-infrastructure", "career_data_center_technician"], "Data Center Technician exists as canonical career; adjacent roles remain planned."), evidence_capability: "existing prepare-prove evidence outside metaverse; future metaverse task event source", tags: ["data-center", "training", "pathway"] }),

  destination("arcade-hub", METAVERSE_DISTRICT_IDS.learningArcade, "arcade-hub", "Arcade Hub", "Existing Learning Arcade dashboard entry.", "LIVE", "app_route", "practice", route("LIVE", "/arcade.html#/dashboard", "src/router/ArcadeRoutes.jsx", "Arcade dashboard route is live."), { curriculum_alignment: curriculum(["arcade-links-future"], "Arcade backend remains canonical for activity/result authority."), tags: ["arcade", "practice"] }),
  destination("simulation-hall", METAVERSE_DISTRICT_IDS.learningArcade, "simulation-hall", "Simulation Hall", "Existing classical arcade route for practice/game space.", "LIVE", "app_route", "practice", route("LIVE", "/arcade.html#/classical-arcade", "src/router/ArcadeRoutes.jsx", "Classical Arcade route is live."), { evidence_capability: "arcade result authority remains external", tags: ["arcade", "simulation"] }),
  destination("skills-challenge-center", METAVERSE_DISTRICT_IDS.learningArcade, "skills-challenge-center", "Skills Challenge Center", "Existing game catalog route for future task-to-practice alignment.", "LIVE", "app_route", "practice", route("LIVE", "/arcade.html#/games", "src/router/ArcadeRoutes.jsx", "Arcade games route is live."), { tags: ["arcade", "skills"] }),

  destination("treasury", METAVERSE_DISTRICT_IDS.treasuryCommerce, "treasury", "Treasury", "Existing Treasury dashboard destination; no metaverse ledger authority.", "LIVE", "app_route", "economy_projection", route("LIVE", "/treasury.html#/dashboard", "src/router/TreasuryRoutes.jsx", "Treasury dashboard route exists."), { economy_participation: economy("shf_dollars", "unresolved_blocked", ECONOMY_BOUNDARY.categories.find((item) => item.id === "shf_dollars")?.reported.toString() ?? "SHF dollars unresolved."), tags: ["treasury", "projection"] }),
  destination("student-economy-center", METAVERSE_DISTRICT_IDS.treasuryCommerce, "student-economy-center", "Student Economy Center", "Future economy projection node; transactions blocked until authority is resolved.", "PLANNED", "future_task_hook", "economy_projection", route("PLANNED", null, "MET-2 registry", "No canonical student economy route exists."), { economy_participation: economy("learning_credits", "unresolved_blocked", "Learning credits need canonical authority before earning/spending."), tags: ["economy", "planned"] }),
  destination("store-marketplace", METAVERSE_DISTRICT_IDS.treasuryCommerce, "store-marketplace", "Store / Marketplace", "Existing Store catalog destination, registry-only economy integration.", "LIVE", "app_route", "navigation", route("LIVE", "/store.html#/catalog", "src/router/StoreRoutes.jsx", "Store catalog route is live."), { economy_participation: economy("none", "not_applicable", "MET-2 does not connect store purchases to metaverse balances."), tags: ["store", "marketplace"] }),
  destination("financial-literacy-lab", METAVERSE_DISTRICT_IDS.treasuryCommerce, "financial-literacy-lab", "Financial Literacy Lab", "Future financial-literacy learning destination.", "PLANNED", "future_task_hook", "learning", route("PLANNED", null, "MET-2 registry", "No dedicated financial literacy route exists."), { curriculum_alignment: curriculum(["future-financial-literacy"], "Future curriculum alignment only."), economy_participation: economy("none", "not_applicable", "No wallet, balance, or transaction authority."), tags: ["financial-literacy", "planned"] }),

  destination("oas-center", METAVERSE_DISTRICT_IDS.technologyInnovation, "oas-center", "OAS Center", "Public Open Autonomous Standard entry for autonomy standards context.", "LIVE", "external_public_route", "navigation", route("LIVE", "/oas.html", "src/pages/oas/OASLandingPage.jsx", "OAS public page exists; OAS is not a student credential authority."), { tags: ["oas", "standards"] }),
  destination("ai-agent-lab", METAVERSE_DISTRICT_IDS.technologyInnovation, "ai-agent-lab", "AI / Agent Lab", "Future student-safe AI/agent learning lab.", "PLANNED", "future_task_hook", "learning", route("PLANNED", null, "MET-2 registry", "Existing admin agent workbench is not a student metaverse lab."), { curriculum_alignment: curriculum(["future-ai-agent-learning"], "Future learning alignment only."), tags: ["ai", "agents", "planned"] }),
  destination("builder-studio", METAVERSE_DISTRICT_IDS.technologyInnovation, "builder-studio", "Builder / Studio", "Existing Studio student project environment entry.", "LIVE", "app_route", "learning", route("LIVE", "/curriculum.html#/studio", "src/router/CurriculumRoutes.jsx", "Studio route tree is live in Curriculum entry."), { curriculum_alignment: curriculum(["studio-projects"], "Studio remains its own project/evidence domain."), evidence_capability: "Studio delivery evidence remains external authority", tags: ["studio", "builder"] }),
  destination("innovation-lab", METAVERSE_DISTRICT_IDS.technologyInnovation, "innovation-lab", "Innovation Lab", "Future technical project and innovation destination.", "PLANNED", "future_task_hook", "learning", route("PLANNED", null, "MET-2 registry", "No dedicated innovation lab route exists."), { tags: ["innovation", "planned"] }),

  destination("community-center", METAVERSE_DISTRICT_IDS.community, "community-center", "Community Center", "Future community program and service-learning destination.", "PLANNED", "future_task_hook", "learning", route("PLANNED", null, "MET-2 registry", "No dedicated community center route exists."), { civic_alignment: civic(["future-community-programs"], "Future SHF Civic/community learning alignment."), tags: ["community", "service-learning"] }),
  destination("nonprofit-network-center", METAVERSE_DISTRICT_IDS.community, "nonprofit-network-center", "Nonprofit Network Center", "Future nonprofit/community initiative navigation node.", "PLANNED", "future_task_hook", "navigation", route("PLANNED", null, "MET-2 registry", "No dedicated nonprofit network route exists."), { tags: ["community", "nonprofit", "planned"] }),
  destination("program-incubator", METAVERSE_DISTRICT_IDS.community, "program-incubator", "Program Incubator", "Future program coordination and incubator concept node.", "PLANNED", "future_task_hook", "simulation", route("PLANNED", null, "MET-2 registry", "No dedicated program incubator route exists."), { tags: ["community", "incubator", "planned"] }),

  destination("student-hub", METAVERSE_DISTRICT_IDS.studentLife, "student-hub", "Student Hub", "Future safe learner home-base concept without social-network implementation.", "REGISTRY_ONLY", "registry_node", "orientation", route("REGISTRY_ONLY", null, "MET-2 registry", "No metaverse student hub route exists yet."), { tags: ["student-life", "home-base"] }),
  destination("student-profile-portfolio-access", METAVERSE_DISTRICT_IDS.studentLife, "student-profile-access", "Portfolio / Profile Access", "Existing portfolio access point; profile authority remains external.", "LIVE", "app_route", "portfolio", route("LIVE", "/curriculum.html#/curriculum/asl/portfolio", "src/router/CurriculumRoutes.jsx", "Curriculum portfolio route exists and renders CareerPortfolio."), { career_alignment: career(["portfolio"], "Career/portfolio domains remain canonical."), tags: ["student-life", "portfolio"] }),

  destination("central-plaza", METAVERSE_DISTRICT_IDS.publicRealm, "central-plaza", "Central Plaza", "Future accessible orientation and public learning space.", "REGISTRY_ONLY", "registry_node", "orientation", route("REGISTRY_ONLY", null, "MET-2 registry", "No city plaza route exists yet."), { tags: ["public-realm", "orientation"] }),
  destination("city-park", METAVERSE_DISTRICT_IDS.publicRealm, "park", "Park", "Future public learning and event space.", "REGISTRY_ONLY", "registry_node", "orientation", route("REGISTRY_ONLY", null, "MET-2 registry", "No park route exists yet."), { tags: ["public-realm", "events"] }),
  destination("transit-wayfinding-hub", METAVERSE_DISTRICT_IDS.publicRealm, "transit-wayfinding-hub", "Transit / Wayfinding Hub", "Future non-spatial and spatial navigation bridge.", "REGISTRY_ONLY", "registry_node", "orientation", route("REGISTRY_ONLY", null, "MET-2 registry", "No transit/wayfinding route exists yet."), { accessibility_alternative: "Primary list, search, keyboard shortcuts, and screen-reader landmark navigation for all districts.", tags: ["public-realm", "wayfinding", "accessibility"] }),
];

const facilities: MetaverseFacility[] = [
  facility("city-hall", METAVERSE_DISTRICT_IDS.civic, "City Hall", "Civic orientation and city simulation entry.", "district-civic-city-hall", ["city-hall"]),
  facility("council-chamber", METAVERSE_DISTRICT_IDS.civic, "Council Chamber", "Simulated council and elections.", "district-civic-council-chamber", ["council-chamber"]),
  facility("clerk-office", METAVERSE_DISTRICT_IDS.civic, "Clerk Office", "Future simulated clerk workflows.", "district-civic-clerk-office", ["clerk-office"]),
  facility("planning-department", METAVERSE_DISTRICT_IDS.civic, "Planning Department", "Planning and proposal exercises.", "district-civic-planning-department", ["planning-department"]),
  facility("public-works", METAVERSE_DISTRICT_IDS.civic, "Public Works", "Future service and infrastructure exercises.", "district-civic-public-works", ["public-works-office"]),
  facility("community-development-office", METAVERSE_DISTRICT_IDS.civic, "Community Development Office", "Future community development exercises.", "district-civic-community-development", ["community-development-office"]),
  facility("career-center", METAVERSE_DISTRICT_IDS.careerEducation, "Career Center", "Career exploration and career state entry.", "district-career-center", ["career-center"]),
  facility("learning-center", METAVERSE_DISTRICT_IDS.careerEducation, "Learning Center", "Curriculum learning entry.", "district-learning-center", ["learning-center"]),
  facility("credential-portfolio-center", METAVERSE_DISTRICT_IDS.careerEducation, "Credential / Portfolio Center", "Credential and portfolio projection entry.", "district-credential-portfolio-center", ["credential-portfolio-center"]),
  facility("career-pathway-center", METAVERSE_DISTRICT_IDS.careerEducation, "Career Pathway Center", "Career pathway navigation entry.", "district-career-pathway-center", ["career-pathway-center"]),
  facility("main-data-center", METAVERSE_DISTRICT_IDS.dataCenter, "Main Data Center", "Flagship Data Center district node.", "district-data-center-main", ["main-data-center"]),
  facility("network-operations-center", METAVERSE_DISTRICT_IDS.dataCenter, "Network Operations Center", "Networking and operations node.", "district-data-center-noc", ["network-operations-center"]),
  facility("power-electrical-facility", METAVERSE_DISTRICT_IDS.dataCenter, "Power & Electrical Facility", "Power and electrical reasoning node.", "district-data-center-power", ["power-electrical-facility"]),
  facility("cooling-mechanical-plant", METAVERSE_DISTRICT_IDS.dataCenter, "Cooling / Mechanical Plant", "Cooling and mechanical systems node.", "district-data-center-cooling", ["cooling-mechanical-plant"]),
  facility("security-operations-center", METAVERSE_DISTRICT_IDS.dataCenter, "Security Operations Center", "Security operations node.", "district-data-center-soc", ["security-operations-center"]),
  facility("ai-compute-facility", METAVERSE_DISTRICT_IDS.dataCenter, "AI Compute Facility", "AI/cloud infrastructure node.", "district-data-center-ai-compute", ["ai-compute-facility"]),
  facility("data-center-training-lab", METAVERSE_DISTRICT_IDS.dataCenter, "Data Center Training Lab", "Training and pathway entry.", "district-data-center-training-lab", ["data-center-training-lab"]),
  facility("arcade-hub", METAVERSE_DISTRICT_IDS.learningArcade, "Arcade Hub", "Learning Arcade home.", "district-arcade-hub", ["arcade-hub"]),
  facility("simulation-hall", METAVERSE_DISTRICT_IDS.learningArcade, "Simulation Hall", "Practice and simulations.", "district-arcade-simulation-hall", ["simulation-hall"]),
  facility("skills-challenge-center", METAVERSE_DISTRICT_IDS.learningArcade, "Skills Challenge Center", "Skills practice catalog.", "district-arcade-skills-center", ["skills-challenge-center"]),
  facility("treasury", METAVERSE_DISTRICT_IDS.treasuryCommerce, "Treasury", "Treasury projection entry.", "district-treasury", ["treasury"]),
  facility("student-economy-center", METAVERSE_DISTRICT_IDS.treasuryCommerce, "Student Economy Center", "Future student economy projection.", "district-student-economy-center", ["student-economy-center"]),
  facility("store-marketplace", METAVERSE_DISTRICT_IDS.treasuryCommerce, "Store / Marketplace", "Store/marketplace destination.", "district-store-marketplace", ["store-marketplace"]),
  facility("financial-literacy-lab", METAVERSE_DISTRICT_IDS.treasuryCommerce, "Financial Literacy Lab", "Future financial literacy learning.", "district-financial-literacy-lab", ["financial-literacy-lab"]),
  facility("oas-center", METAVERSE_DISTRICT_IDS.technologyInnovation, "OAS Center", "Autonomy standards context.", "district-oas-center", ["oas-center"]),
  facility("ai-agent-lab", METAVERSE_DISTRICT_IDS.technologyInnovation, "AI / Agent Lab", "Future student-safe AI/agent learning.", "district-ai-agent-lab", ["ai-agent-lab"]),
  facility("builder-studio", METAVERSE_DISTRICT_IDS.technologyInnovation, "Builder / Studio", "Student project builder entry.", "district-builder-studio", ["builder-studio"]),
  facility("innovation-lab", METAVERSE_DISTRICT_IDS.technologyInnovation, "Innovation Lab", "Future innovation projects.", "district-innovation-lab", ["innovation-lab"]),
  facility("community-center", METAVERSE_DISTRICT_IDS.community, "Community Center", "Future community program entry.", "district-community-center", ["community-center"]),
  facility("nonprofit-network-center", METAVERSE_DISTRICT_IDS.community, "Nonprofit Network Center", "Future nonprofit network entry.", "district-nonprofit-network", ["nonprofit-network-center"]),
  facility("program-incubator", METAVERSE_DISTRICT_IDS.community, "Program Incubator", "Future program incubation entry.", "district-program-incubator", ["program-incubator"]),
  facility("student-hub", METAVERSE_DISTRICT_IDS.studentLife, "Student Hub", "Future student home-base.", "district-student-hub", ["student-hub"]),
  facility("student-profile-access", METAVERSE_DISTRICT_IDS.studentLife, "Portfolio / Profile Access Point", "Profile and portfolio access point.", "district-student-profile-access", ["student-profile-portfolio-access"]),
  facility("central-plaza", METAVERSE_DISTRICT_IDS.publicRealm, "Central Plaza", "Orientation and gathering space.", "district-central-plaza", ["central-plaza"]),
  facility("park", METAVERSE_DISTRICT_IDS.publicRealm, "Park", "Public learning and events.", "district-park", ["city-park"]),
  facility("transit-wayfinding-hub", METAVERSE_DISTRICT_IDS.publicRealm, "Transit / Wayfinding Hub", "Accessible navigation hub.", "district-transit-wayfinding-hub", ["transit-wayfinding-hub"]),
];

const activities: MetaverseActivity[] = [
  activity(
    "data-center-foundations-introduction",
    METAVERSE_DISTRICT_IDS.dataCenter,
    "data-center-training-lab",
    "What Is a Data Center?",
    "Read-only mount of the real Data Center Foundations introductory lesson.",
    {
      canonical_ref: "src/content/lessons/data-center-foundations-student/data-center-foundations-introduction.json",
      route_reference: route("LIVE", "/curriculum.html#/curriculum/learning", "src/content/lessons/data-center-foundations-student/data-center-foundations-introduction.json", "Canonical lesson content exists; completion remains in curriculum flows."),
      tags: ["data-center", "curriculum", "lesson", "read-only"],
    },
  ),
  activity(
    "data-center-safety-simulation",
    METAVERSE_DISTRICT_IDS.dataCenter,
    "main-data-center",
    "Data Center Safety Simulation",
    "Future simulation hook requiring lesson and assessment authority before entry.",
    {
      canonical_ref: "future-curriculum-simulation:data-center-safety-simulation",
      route_reference: route("PLANNED", null, "MET-3 unlock policy", "No production simulation route exists yet."),
      activity_type: "simulation",
      unlock_requirement_reference: "data-center-safety-simulation",
      tags: ["data-center", "simulation", "safety"],
    },
  ),
  activity(
    "civic-council-session",
    METAVERSE_DISTRICT_IDS.civic,
    "council-chamber",
    "Civic Council Session",
    "Future SHF Civic-governed session hook; CivicSure is not authority.",
    {
      canonical_ref: "future-shf-civic:civic-council-session",
      route_reference: route("PLANNED", null, "SHF Civic unresolved adapter", "Dedicated SHF Civic eligibility source unresolved."),
      activity_type: "civic_session",
      unlock_requirement_reference: "shf-civic-eligibility",
      tags: ["civic", "session", "restricted"],
    },
  ),
  activity(
    "entitled-ai-agent-lab",
    METAVERSE_DISTRICT_IDS.technologyInnovation,
    "ai-agent-lab",
    "Entitled AI Agent Lab",
    "Future student-safe AI lab hook requiring canonical service entitlement.",
    {
      canonical_ref: "future-curriculum-lab:entitled-ai-agent-lab",
      route_reference: route("PLANNED", null, "service-catalog-entitlements", "No production student AI lab route exists yet."),
      unlock_requirement_reference: "metaverse-ai-lab-entitled",
      tags: ["ai", "entitlement", "planned"],
    },
  ),
  activity(
    "capstone-project-room",
    METAVERSE_DISTRICT_IDS.technologyInnovation,
    "builder-studio",
    "Capstone Project Room",
    "Future Studio/team project room hook.",
    {
      canonical_ref: "studio-team-domain:capstone-project-room",
      route_reference: route("PLANNED", null, "Studio team domain", "No metaverse room route exists yet."),
      activity_type: "project_room",
      unlock_requirement_reference: "capstone-team-member",
      tags: ["studio", "team", "project"],
    },
  ),
];

// MET-13 — Activities, Simulations + District Depth. Additive only: every
// entry below has a matching simulations/registry/simulation-registry.ts
// SimulationDefinition with the identical id, and reuses this same
// MET-3/MET-5 unlock+entry pipeline unmodified. canonical_owner/
// completion_authority are set per-entry (rather than through the MET-2
// `activity()` helper's curriculum-domain default) because several of
// these are original metaverse scenarios, not curriculum mounts.
function met13Activity(input: {
  id: string;
  district_id: string;
  facility_id: string;
  label: string;
  description: string;
  canonical_owner: string;
  canonical_ref: string;
  route_reference: MetaverseRouteReference;
  unlock_requirement_reference: string | null;
  completion_authority: string;
  tags: string[];
}): MetaverseActivity {
  return {
    id: input.id,
    version: "1.0.0",
    city_id: SILICON_HEARTLAND_CITY_ID,
    district_id: input.district_id,
    facility_id: input.facility_id,
    label: input.label,
    description: input.description,
    status: "ACTIVE",
    activity_type: "simulation",
    canonical_owner: input.canonical_owner,
    canonical_ref: input.canonical_ref,
    route_reference: input.route_reference,
    unlock_requirement_reference: input.unlock_requirement_reference,
    completion_authority: input.completion_authority,
    evidence_capability: "operational completion fact / evidence candidate only; simulation completion never creates verified skill, credential, course completion, career eligibility, or civic authority (see MET-13 simulation-contract.ts)",
    tags: input.tags,
  };
}

const met13Activities: MetaverseActivity[] = [
  met13Activity({
    id: "data-center-operations-simulation",
    district_id: METAVERSE_DISTRICT_IDS.dataCenter,
    facility_id: "main-data-center",
    label: "Data Center Operations: Rack to Recovery",
    description: "MET-13 flagship multi-step operations simulation: rack configuration, cooling balance, power redundancy, outage response.",
    canonical_owner: "curriculum-domain",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#data-center-operations-simulation",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["data-center", "flagship", "simulation"],
  }),
  met13Activity({
    id: "ai-agent-build-test-simulation",
    district_id: METAVERSE_DISTRICT_IDS.technologyInnovation,
    facility_id: "ai-agent-lab",
    label: "Build & Test an AI Agent",
    description: "MET-13 flagship simulation: define an agent task, configure guardrails, run adversarial test scenarios, review results.",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#ai-agent-build-test-simulation",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["ai", "flagship", "simulation"],
  }),
  met13Activity({
    id: "enterprise-service-delivery-simulation",
    district_id: METAVERSE_DISTRICT_IDS.technologyInnovation,
    facility_id: "builder-studio",
    label: "Student Enterprise: Client Intake to Delivery",
    description: "MET-13 flagship team simulation reusing MET-12 Student Enterprise/Studio team authority: intake, estimation, delivery, QA, presentation.",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#enterprise-service-delivery-simulation",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["enterprise", "flagship", "simulation", "team"],
  }),
  met13Activity({
    id: "civic-budget-tradeoff-simulation",
    district_id: METAVERSE_DISTRICT_IDS.civic,
    facility_id: "planning-department",
    label: "City Infrastructure & Budget Tradeoff",
    description: "MET-13 flagship bounded civic simulation: allocate a fixed simulated budget across infrastructure priorities. Not gated by SHF Civic eligibility; creates no civic authority.",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#civic-budget-tradeoff-simulation",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["civic", "flagship", "simulation", "budget"],
  }),
  met13Activity({
    id: "career-pathway-exploration-scenario",
    district_id: METAVERSE_DISTRICT_IDS.careerEducation,
    facility_id: "career-pathway-center",
    label: "Career Pathway Exploration Scenario",
    description: "MET-13 scenario grounded in the existing Data Center & AI Infrastructure pathway record; no career pathway required to attempt.",
    canonical_owner: "career-pathways-credentials-career-events-domains",
    canonical_ref: "docs/career/records/DATA_CENTER_AI_INFRASTRUCTURE.pathway-record.json",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["career", "simulation", "scenario"],
  }),
  met13Activity({
    id: "arcade-mission-prep-drill",
    district_id: METAVERSE_DISTRICT_IDS.learningArcade,
    facility_id: "simulation-hall",
    label: "Mission Prep Drill",
    description: "MET-13 practice-only concept drill; Arcade's own canonical result/mastery authority is untouched.",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#arcade-mission-prep-drill",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["arcade", "simulation", "practice"],
  }),
  met13Activity({
    id: "enterprise-budgeting-simulation",
    district_id: METAVERSE_DISTRICT_IDS.treasuryCommerce,
    facility_id: "student-economy-center",
    label: "Pricing & Resource Allocation Exercise",
    description: "MET-13 bounded pricing/allocation simulation; never touches a real Market listing, order, or Treasury balance (MET-1 economy boundary remains unresolved/blocked).",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#enterprise-budgeting-simulation",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["treasury", "commerce", "simulation"],
  }),
  met13Activity({
    id: "community-accessibility-audit-challenge",
    district_id: METAVERSE_DISTRICT_IDS.community,
    facility_id: "community-center",
    label: "Community Accessibility Audit",
    description: "MET-13 design-challenge simulation for community/service-learning and Side Mission use.",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#community-accessibility-audit-challenge",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["community", "accessibility", "simulation"],
  }),
  met13Activity({
    id: "team-time-management-challenge",
    district_id: METAVERSE_DISTRICT_IDS.studentLife,
    facility_id: "student-hub",
    label: "Team Time Management Challenge",
    description: "MET-13 SEL/scheduling simulation; never infers personality, mental health, or team-fit scores.",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#team-time-management-challenge",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["student-life", "sel", "simulation"],
  }),
  met13Activity({
    id: "city-scavenger-hunt-side-mission",
    district_id: METAVERSE_DISTRICT_IDS.publicRealm,
    facility_id: "central-plaza",
    label: "Silicon Heartland Scavenger Hunt",
    description: "MET-13 orientation Side Mission across city districts/facilities; no career pathway or program enrollment required.",
    canonical_owner: "metaverse-experience-orchestration",
    canonical_ref: "apps/shs-api/src/domain/metaverse/simulations/registry/simulation-registry.ts#city-scavenger-hunt-side-mission",
    route_reference: route("PLANNED", null, "MET-13 simulation registry", "Mounted within the metaverse city shell's activity view; no standalone app route exists."),
    unlock_requirement_reference: null,
    completion_authority: "metaverse-experience-orchestration",
    tags: ["public-realm", "side-mission", "simulation"],
  }),
];

const districts: MetaverseDistrict[] = [
  district(METAVERSE_DISTRICT_IDS.civic, "Civic District", "SHF Civic-backed simulated city government, proposals, elections, council, planning, public works, and community development.", "district-civic", ["city-hall", "council-chamber", "clerk-office", "planning-department", "public-works", "community-development-office"], ["civic", "shf-civic"]),
  district(METAVERSE_DISTRICT_IDS.careerEducation, "Career & Education District", "Career Center, curriculum, training, certifications/milestones projection, skill profile, portfolio, and workforce pathway navigation.", "district-career-education", ["career-center", "learning-center", "credential-portfolio-center", "career-pathway-center"], ["career", "curriculum", "portfolio"]),
  district(METAVERSE_DISTRICT_IDS.dataCenter, "Data Center District", "Flagship Data Center & AI Infrastructure district for future technical simulations across operations, networking, power, cooling, security, and AI compute.", "district-data-center", ["main-data-center", "network-operations-center", "power-electrical-facility", "cooling-mechanical-plant", "security-operations-center", "ai-compute-facility", "data-center-training-lab"], ["data-center", "flagship", "career-simulation-future"]),
  district(METAVERSE_DISTRICT_IDS.learningArcade, "Learning Arcade District", "Learning Arcade practice, games, simulations, and curriculum-linked play without duplicating Arcade backend authority.", "district-learning-arcade", ["arcade-hub", "simulation-hall", "skills-challenge-center"], ["arcade", "practice"]),
  district(METAVERSE_DISTRICT_IDS.treasuryCommerce, "Treasury & Commerce District", "Treasury, credits, SHF dollars, Store/marketplace, financial literacy, and simulated economic activity integration points only.", "district-treasury-commerce", ["treasury", "student-economy-center", "store-marketplace", "financial-literacy-lab"], ["treasury", "commerce", "economy-unresolved"]),
  district(METAVERSE_DISTRICT_IDS.technologyInnovation, "Technology & Innovation District", "OAS, AI, autonomous systems, agent learning, Studio/Builder, and technical project environments.", "district-technology-innovation", ["oas-center", "ai-agent-lab", "builder-studio", "innovation-lab"], ["technology", "innovation", "studio"]),
  district(METAVERSE_DISTRICT_IDS.community, "Community District", "Community programs, nonprofit/community initiatives, community development, service-learning, and incubator concepts.", "district-community", ["community-center", "nonprofit-network-center", "program-incubator"], ["community", "service-learning"]),
  district(METAVERSE_DISTRICT_IDS.studentLife, "Residential / Student Life District", "Learner presence, home-base, profile, and non-authoritative student community concepts without social-network implementation.", "district-student-life", ["student-hub", "student-profile-access"], ["student-life", "profile"]),
  district(METAVERSE_DISTRICT_IDS.publicRealm, "Public Realm", "Shared spaces, orientation, accessible navigation, events, public learning, and gathering spaces.", "district-public-realm", ["central-plaza", "park", "transit-wayfinding-hub"], ["public-realm", "accessibility", "orientation"]),
];

export const SILICON_HEARTLAND_CITY_REGISTRY: MetaverseCityRegistry = {
  city_id: SILICON_HEARTLAND_CITY_ID,
  version: "1.0.0",
  label: "Silicon Heartland",
  description: "Bounded Silicon Heartland city-scale educational metaverse registry.",
  status: "ACTIVE",
  canonical_owner: METAVERSE_CANONICAL_OWNER,
  scope: "bounded_city_scale_learning_environment",
  real_government_authority: false,
  state_or_national_simulation: false,
  declarative_only: true,
  authorization_authority: false,
  universe_relationship: "Universe is an ecosystem navigation shell that may later link into this city; it is not the metaverse city registry.",
  civic_sure_boundary: "CivicSure is excluded from the student civic district and remains a separate public-program assurance product.",
  economy_boundary: "Treasury/Commerce destinations are integration points only; MET-1 economy authority remains unresolved.",
  districts,
  facilities,
  destinations,
  activities: [...activities, ...met13Activities],
  access_requirements: ["MET-3 learner unlock projection required before gated access is enforced."],
  career_alignment: career(["career-center", "data-center-ai-infrastructure"], "Registry reads career pathways; career remains canonical."),
  curriculum_alignment: curriculum(["curriculum-learning", "data-center lesson content"], "Registry reads curriculum alignment; curriculum remains canonical."),
  civic_alignment: civic(["shf-civic"], "Registry reads SHF Civic alignment; SHF Civic remains canonical."),
  economy_participation: economy("none", "not_applicable", "City registry does not create balances, wallets, transfer rules, or ledger authority."),
  accessibility_alternatives: [
    "All districts and destinations must be reachable through a non-spatial list/search/tree view.",
    "Every future spatial activity must define keyboard, screen-reader, reduced-motion, and task-equivalent alternatives.",
  ],
  evidence_capabilities: [
    "Registry declares future evidence capability only.",
    "Operational event and verification authority remain outside this registry.",
  ],
};

export const METAVERSE_CITY_REGISTRIES = [SILICON_HEARTLAND_CITY_REGISTRY] as const;

export function getSiliconHeartlandCityRegistry(): MetaverseCityRegistry {
  return SILICON_HEARTLAND_CITY_REGISTRY;
}

export function getMetaverseCityProjection() {
  return {
    city_id: SILICON_HEARTLAND_CITY_REGISTRY.city_id,
    version: SILICON_HEARTLAND_CITY_REGISTRY.version,
    label: SILICON_HEARTLAND_CITY_REGISTRY.label,
    districts: SILICON_HEARTLAND_CITY_REGISTRY.districts.map(({ id, label, purpose, status, visual_asset_slot }) => ({ id, label, purpose, status, visual_asset_slot })),
    facilities: SILICON_HEARTLAND_CITY_REGISTRY.facilities.map(({ id, district_id, label, purpose, status, visual_asset_slot }) => ({ id, district_id, label, purpose, status, visual_asset_slot })),
    destinations: SILICON_HEARTLAND_CITY_REGISTRY.destinations.map(({ id, district_id, facility_id, label, status, destination_type, experience_type, route_reference, accessibility_alternative, tags }) => ({ id, district_id, facility_id, label, status, destination_type, experience_type, route_reference, accessibility_alternative, tags })),
    activities: SILICON_HEARTLAND_CITY_REGISTRY.activities.map(({ id, district_id, facility_id, label, status, activity_type, route_reference, tags }) => ({ id, district_id, facility_id, label, status, activity_type, route_reference, tags })),
  } as const;
}
