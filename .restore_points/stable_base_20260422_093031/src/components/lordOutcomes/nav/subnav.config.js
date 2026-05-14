// src/components/lordOutcomes/nav/subnav.config.js

export const TOP_TABS = [
  { key: "home", label: "Overview", path: "/" },
  { key: "states", label: "States", path: "/states" },
  { key: "programs", label: "Programs", path: "/programs" },
  { key: "employers", label: "Employers", path: "/employers" },
  { key: "funding", label: "Funding", path: "/funding" },
  { key: "pilots", label: "Pilots", path: "/pilots/launch" },
];

// "Fundable containers" (can expand later)
export const STATES = [
  { key: "OH", label: "Ohio" },
  { key: "MI", label: "Michigan" },
  { key: "IN", label: "Indiana" },
  { key: "PA", label: "Pennsylvania" },
  { key: "WV", label: "West Virginia" },
];

export const PROGRAMS = [
  { key: "workforce", label: "Workforce" },
  { key: "education", label: "Education" },
  { key: "recovery", label: "Recovery" },
  { key: "youth", label: "Youth" },
  { key: "civic", label: "Civic" },
  { key: "credentials", label: "Skills Credentials" },
];

export const FUNDING_SUB = [
  { key: "streams", label: "Grant Streams" },
  { key: "allowables", label: "Budget + Allowables" },
  { key: "match", label: "Match + Leverage" },
  { key: "reporting", label: "Reporting Pack" },
  { key: "ledger", label: "Ledger" },
];

export const EMPLOYER_SUB = [
  { key: "partners", label: "Hiring Partners" },
  { key: "placements", label: "Placements" },
  { key: "retention", label: "Retention" },
  { key: "credentials", label: "Credentials" },
  { key: "roi", label: "ROI" },
];

export const PILOTS_SUB = [
  { key: "launch", label: "Launchpad", path: "/pilots/launch" },
  { key: "active", label: "Active", path: "/pilots/active" },
  { key: "templates", label: "Templates", path: "/pilots/templates" },
  { key: "readiness", label: "Readiness", path: "/pilots/readiness" }, // optional route
  { key: "outcomes", label: "Outcomes", path: "/pilots/outcomes" },     // optional route
];

// Section → subnav rules
export function getSubnavForTopTab(topKey) {
  switch (topKey) {
    case "home":
      return {
        type: "chips",
        param: "focus",
        items: [
          { key: "national", label: "National" },
          { key: "state", label: "State Spotlight" },
          { key: "program", label: "Program Spotlight" },
          { key: "pilot", label: "Pilot Spotlight" },
        ],
        defaultKey: "national",
      };

    case "states":
      return { type: "stateRail", param: "state", items: STATES, defaultKey: "OH" };

    case "programs":
      return { type: "chips", param: "program", items: PROGRAMS, defaultKey: "workforce" };

    case "employers":
      return { type: "chips", param: "employerView", items: EMPLOYER_SUB, defaultKey: "partners" };

    case "funding":
      return { type: "chips", param: "fundingView", items: FUNDING_SUB, defaultKey: "streams" };

    case "pilots":
      return { type: "routes", items: PILOTS_SUB, defaultKey: "launch" };

    default:
      return null;
  }
}
