export const SHS_REPORT_LAUNCH_POINTS = Object.freeze([
  {
    area: "SHS Hub / Builder Hub",
    route: "/ops/reports",
    actions: ["Open Reports Command", "Create Premium OS Report", "View Report History"],
    safe: true,
  },
  {
    area: "ClientOps Center",
    route: "/hub/reports",
    actions: ["Generate Client Report", "Open monthly review report"],
    safe: true,
    todo: "Attach inside individual client record when ClientOps record detail UI is formalized.",
  },
  {
    area: "QA + Delivery",
    route: "/ops/screenshot-qa",
    actions: ["Generate Delivery Readiness Report", "Attach QA Evidence to Report"],
    safe: true,
  },
  {
    area: "Production Projects",
    route: "/ops/projects",
    actions: ["Generate Project Status Report", "Open Project Report Status"],
    safe: true,
  },
  {
    area: "Development Team Library",
    route: "/ops/build-packet",
    actions: ["Attach Build Packet to Report", "Generate Build Packet Summary"],
    safe: true,
  },
  {
    area: "Sales Command Center",
    route: "/hub/sales-pipeline",
    actions: ["Generate Proposal Report", "Generate Client Discovery Summary"],
    safe: true,
  },
  {
    area: "Internal Ops",
    route: "/ops/production",
    actions: ["Generate Internal Ops Report"],
    safe: true,
  },
  {
    area: "Mock Review / Screenshot QA",
    route: "/ops/mock-review",
    actions: ["Generate Mock Review Report", "Generate Screenshot QA Report"],
    safe: true,
  },
  {
    area: "Brand Profile / Branding Engine",
    route: "/ops/brand-profile",
    actions: ["Open Report Branding Settings"],
    safe: true,
  },
  {
    area: "Data Binding / Reporting Layer",
    route: "/ops/data-binding",
    actions: ["Open Report Data Readiness Panel"],
    safe: true,
  },
]);
