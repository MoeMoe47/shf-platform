export const CANON_DOCTRINES = [
  {
    key: "human_authority_override",
    title: "Human Authority Override",
    locked: true,
    rule:
      "Any AI insight, efficiency recommendation, or automated workflow must be overrideable by an authorized human role without penalty, friction, or negative consequence.",
  },
  {
    key: "metric_stability_drift_protection",
    title: "Metric Stability & Drift Protection",
    locked: true,
    rule:
      "Metrics may inform decisions but may not redefine success criteria without explicit governance review and version change.",
  },
  {
    key: "silence_as_default",
    title: "Silence-as-Default",
    locked: true,
    rule:
      "Silence is a valid and preferred system state unless action is necessary to preserve safety, integrity, or explicit user intent.",
  },
  {
    key: "efficiency_domain_separation",
    title: "Efficiency Domain Separation",
    locked: true,
    rule:
      "Operational efficiency and funding efficiency are separate domains and may not be merged in dashboards, analytics, or narratives.",
  },
  {
    key: "negative_capability",
    title: "Negative Capability",
    locked: true,
    rule:
      "The system must allow intentional inefficiency when it protects trust, equity, human judgment, or ethical outcomes.",
  },
  {
    key: "triple_layer_non_bypass",
    title: "Triple-Layer Non-Bypass Rule",
    locked: true,
    rule:
      "Efficiency may inform AI, AI may inform humans, and humans may trigger automation — but the system may never skip a layer.",
  },
  {
    key: "ai_no_direct_automation",
    title: "AI → Automation Human Gate",
    locked: true,
    rule:
      "AI output may never directly trigger automated actions without an explicit human confirmation step.",
  },
];
