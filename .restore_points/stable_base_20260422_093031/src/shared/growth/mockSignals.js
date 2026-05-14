export const SEED_CLAIMS = [
  {
    title: "Partner outreach → 2 qualified meetings booked (14 days)",
    thesis: "If we run a structured outreach sprint (20 targets, 2 follow-ups), we should book at least 2 qualified meetings.",
    probability: 0.72,
    horizon: "14d",
    evidence: ["Pipeline targets list", "Outreach cadence plan", "Calendar booking proof"],
    tags: ["partnerships", "pipeline", "execution"],
  },
  {
    title: "Watchtower Postgres dev: attestations flowing end-to-end",
    thesis: "Once Postgres is installed and the docker path is stable, daily attestations should be appended with zero mismatches.",
    probability: 0.64,
    horizon: "7d",
    evidence: ["Watchtower schema", "Nightly export job stub", "Integrity monitor hash checks"],
    tags: ["watchtower", "postgres", "integrity"],
  },
  {
    title: "Arcade engagement: +25% sessions after Tower market ships",
    thesis: "Adding the Claims Market will increase curiosity/return visits; expect session count lift within a week.",
    probability: 0.58,
    horizon: "7d",
    evidence: ["Baseline analytics snapshot", "Release notes", "Session count delta"],
    tags: ["engagement", "arcade", "growth"],
  },
  {
    title: "Funding narrative: one grant-ready one-pager drafted (48h)",
    thesis: "With current assets, we can produce a crisp grant one-pager and attach proof-of-work from Watchtower exports.",
    probability: 0.70,
    horizon: "48h",
    evidence: ["Grant template", "Impact metrics", "Export link"],
    tags: ["funding", "narrative", "ops"],
  },
];
