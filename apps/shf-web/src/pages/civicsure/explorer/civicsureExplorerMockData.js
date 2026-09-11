// apps/shf-web/src/pages/civicsure/explorer/civicsureExplorerMockData.js
//
// DEMO / FRAME DATA — NOT PRODUCTION ASSURANCE DATA.
//
// Static view-model fixtures for the CivicSure Explorer page FRAME
// (visual/UI build only — see docs/ui/CIVICSURE_EXPLORER_FRAME.md).
// Nothing here is wired to GPA data models, the Truth Spine, Evidence
// authority, Metric Registry, Public Disclosure, or any other
// CivicSure assurance system. Every number, name, and status below is
// a placeholder chosen to reproduce the approved mock's layout — none
// of it is a real CivicSure fact. Do not import this file from
// anything outside the Explorer page frame, and do not let it drift
// into real reporting/assurance code paths.

export const EXPLORER_NAV_ITEMS = [
  { key: "overview", label: "Overview" },
  { key: "explorer", label: "Explorer", active: true },
  { key: "how-it-works", label: "How It Works" },
  { key: "reports", label: "Reports" },
  { key: "for-government", label: "For Government" },
  { key: "providers", label: "Providers" },
  { key: "public-trust", label: "Public Trust" },
];

export const POPULAR_SEARCHES = ["Homeless Services", "Youth Programs", "Mental Health", "Workforce Training", "Franklin County"];

export const EXPLORER_CATEGORY_TABS = [
  { key: "programs", label: "Programs", icon: "grid" },
  { key: "funding", label: "Funding", icon: "bank" },
  { key: "providers", label: "Providers", icon: "people" },
  { key: "outcomes", label: "Outcomes", icon: "trend" },
  { key: "evidence", label: "Evidence", icon: "book" },
  { key: "geography", label: "Geography", icon: "pin" },
];

export const EXPLORER_METRICS = [
  { key: "programs", value: "248", label: "Active Programs", delta: "12% from last year", icon: "plus", tone: "blue" },
  { key: "providers", value: "312", label: "Providers", delta: "8% from last year", icon: "people", tone: "blue" },
  { key: "funding", value: "$428M", label: "Total Funding", delta: "15% from last year", icon: "bank", tone: "blue" },
  { key: "on-track", value: "89%", label: "On Track", delta: "4% from last year", icon: "target", tone: "blue" },
  { key: "verified", value: "76%", label: "Verified Outcomes", delta: "10% from last year", icon: "shieldCheck", tone: "green" },
];

export const EXPLORER_FILTERS = [
  { key: "county", label: "County", options: ["All Counties"] },
  { key: "category", label: "Program Category", options: ["All Categories"] },
  { key: "fundingSource", label: "Funding Source", options: ["All Sources"] },
  { key: "status", label: "Status", options: ["Active"] },
];

export const PROGRAM_RESULTS = [
  {
    id: "summer-stem-initiative",
    name: "Summer STEM Initiative",
    status: "Active",
    county: "Franklin County",
    category: "Education",
    description: "Hands-on STEM learning for underserved youth, building critical skills for the future.",
    tags: ["Youth", "Education", "Workforce Pathways"],
    thumbnailIcon: "students",
  },
  {
    id: "supportive-housing-program",
    name: "Supportive Housing Program",
    status: "Active",
    county: "Franklin County",
    category: "Housing",
    description: "Permanent supportive housing for individuals and families experiencing homelessness.",
    tags: ["Housing", "Homeless Services", "Health"],
    thumbnailIcon: "housing",
  },
  {
    id: "community-mental-health-access",
    name: "Community Mental Health Access",
    status: "Active",
    county: "Franklin County",
    category: "Health",
    description: "Expanding access to mental health services through community partnerships.",
    tags: ["Mental Health", "Community Support", "Wellness"],
    thumbnailIcon: "counseling",
  },
  {
    id: "clean-energy-workforce-training",
    name: "Clean Energy Workforce Training",
    status: "Active",
    county: "Franklin County",
    category: "Workforce Development",
    description: "Training and certification for clean energy careers in partnership with local employers.",
    tags: ["Workforce", "Clean Energy", "Economic Opportunity"],
    thumbnailIcon: "workforce",
  },
];

export const COUNTY_SUMMARY = {
  name: "Franklin County",
  stats: [
    { key: "programs", label: "Active Programs", value: "248" },
    { key: "funding", label: "Total Funding", value: "$428M" },
    { key: "onTrack", label: "On Track", value: "89%" },
    { key: "verified", label: "Verified Outcomes", value: "76%" },
  ],
};

// x/y positions keep clear of the top-left county overlay card
// (roughly the 0-38% x / 0-46% y region of the panel).
export const MAP_PLACE_LABELS = [
  { key: "dublin", label: "Dublin", x: 46, y: 10 },
  { key: "westerville", label: "Westerville", x: 76, y: 14 },
  { key: "hilliard", label: "Hilliard", x: 16, y: 50 },
  { key: "upper-arlington", label: "Upper Arlington", x: 28, y: 58 },
  { key: "columbus", label: "Columbus", x: 52, y: 58, emphasis: true },
  { key: "bexley", label: "Bexley", x: 70, y: 62 },
  { key: "gahanna", label: "Gahanna", x: 86, y: 46 },
  { key: "whitehall", label: "Whitehall", x: 78, y: 68 },
];

// Purely decorative marker positions (percent of the map panel box) —
// not tied to real coordinates or real program locations. Kept clear
// of the top-left county overlay card (roughly x<38 / y<46).
export const MAP_MARKERS = [
  { x: 44, y: 18 }, { x: 54, y: 16 }, { x: 44, y: 30 }, { x: 56, y: 24 },
  { x: 62, y: 34 }, { x: 40, y: 44 }, { x: 50, y: 50 }, { x: 60, y: 46 },
  { x: 66, y: 56 }, { x: 30, y: 58 }, { x: 20, y: 66 }, { x: 46, y: 70 },
  { x: 58, y: 74 }, { x: 70, y: 40 },
];

export const HIGHWAY_MARKERS = [
  { key: "i270", label: "270", x: 12, y: 78 },
  { key: "i71", label: "71", x: 62, y: 20 },
  { key: "i70a", label: "70", x: 14, y: 88 },
  { key: "i670", label: "670", x: 86, y: 76 },
];

export const FOLLOW_THE_MONEY_STEPS = [
  { key: "funding-source", label: "Funding Source", icon: "bank" },
  { key: "program", label: "Program", icon: "building" },
  { key: "provider", label: "Provider", icon: "people" },
  { key: "obligation", label: "Obligation", icon: "document" },
  { key: "delivery", label: "Delivery", icon: "box" },
  { key: "evidence", label: "Evidence", icon: "user-check" },
  { key: "outcome", label: "Outcome", icon: "shield-check", tone: "green" },
];
