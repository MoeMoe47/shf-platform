export const CAPSTONE_ENTRY_POLICY_VERSION = "grade12-capstone-entry-v1";

export const GRADE12_SHARED_CORE_LESSONS = [
  "data-center-specialization-12-advanced-technical-communication",
  "data-center-specialization-12-change-risk-escalation",
  "data-center-specialization-12-cross-team-collaboration",
  "data-center-specialization-12-evidence-quality-defense",
  "data-center-specialization-12-career-postsecondary-transition",
] as const;

export const CAPSTONE_BRANCH_REQUIREMENTS: Record<string, { courseId: string; lessons: string[]; proofActivity: string; competencySlug: string; role: string }> = {
  "technical-operations": { courseId: "data-center-technical-operations-12", lessons: ["data-center-specialization-12-monitoring-proof", "data-center-specialization-12-runbooks-operational-handoffs", "data-center-specialization-12-advanced-technical-operations-project"], proofActivity: "grade12-technical-operations-multi-system-operations-analysis", competencySlug: "grade12-technical-operations-multi-system-operations-analysis", role: "Operations" },
  "networking-fiber": { courseId: "data-center-networking-fiber-12", lessons: ["data-center-specialization-12-network-architecture-dependencies", "data-center-specialization-12-network-incident-coordination", "data-center-specialization-12-advanced-networking-project"], proofActivity: "grade12-networking-fiber-resilient-network-path-analysis", competencySlug: "grade12-networking-fiber-resilient-network-path-analysis", role: "Networking" },
  "electrical-infrastructure": { courseId: "data-center-electrical-infrastructure-12", lessons: ["data-center-specialization-12-critical-power-architecture", "data-center-specialization-12-critical-power-incident-coordination", "data-center-specialization-12-advanced-electrical-infrastructure-project"], proofActivity: "grade12-electrical-infrastructure-critical-power-reliability-analysis", competencySlug: "grade12-electrical-infrastructure-critical-power-reliability-analysis", role: "Power" },
  "mechanical-hvac": { courseId: "data-center-mechanical-hvac-12", lessons: ["data-center-specialization-12-advanced-thermal-infrastructure", "data-center-specialization-12-environmental-monitoring-trends", "data-center-specialization-12-advanced-mechanical-hvac-project"], proofActivity: "grade12-mechanical-hvac-thermal-capacity-reliability-analysis", competencySlug: "grade12-mechanical-hvac-thermal-capacity-reliability-analysis", role: "Cooling/Mechanical" },
  "cybersecurity-security": { courseId: "data-center-cybersecurity-security-12", lessons: ["data-center-specialization-12-advanced-identity-access-governance", "data-center-specialization-12-incident-evidence-preservation", "data-center-specialization-12-advanced-security-project"], proofActivity: "grade12-cybersecurity-security-access-governance-analysis", competencySlug: "grade12-cybersecurity-security-access-governance-analysis", role: "Security" },
  "ai-cloud-infrastructure": { courseId: "data-center-ai-cloud-infrastructure-12", lessons: ["data-center-specialization-12-advanced-multi-node-compute", "data-center-specialization-12-reliability-redundancy-observability", "data-center-specialization-12-advanced-ai-cloud-infrastructure-project"], proofActivity: "grade12-ai-cloud-infrastructure-capacity-bottleneck-analysis", competencySlug: "grade12-ai-cloud-infrastructure-capacity-bottleneck-analysis", role: "Compute/AI Infrastructure" },
};
