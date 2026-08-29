export const GRADE12_POLICY_VERSION = "grade12-entry-v1";
export const GRADE12_PROGRAM_ID = "data-center-specialization-11";

export const SHARED_CORE_LESSONS = [
  "data-center-specialization-11-safety-professional-practice",
  "data-center-specialization-11-technical-communication",
  "data-center-specialization-11-reliability-systems-thinking",
  "data-center-specialization-11-evidence-and-feedback",
  "data-center-specialization-11-career-transition-planning",
] as const;

export const BRANCH_REQUIREMENTS: Record<string, { lessons: string[]; competencies: string[] }> = {
  "technical-operations": {
    lessons: ["data-center-specialization-11-monitoring-proof", "data-center-specialization-11-linux-inspection", "data-center-specialization-11-telemetry-troubleshooting"],
    competencies: ["interpret-monitoring-data-and-document-safe-finding", "inspect-linux-system-state-safely", "document-structured-infrastructure-troubleshooting"],
  },
  "networking-fiber": {
    lessons: ["data-center-specialization-11-network-topology", "data-center-specialization-11-connectivity-troubleshooting", "data-center-specialization-11-networking-fiber-project"],
    competencies: ["interpret-network-topology", "network-connectivity-troubleshooting", "structured-cabling-fiber-documentation"],
  },
  "electrical-infrastructure": {
    lessons: ["data-center-specialization-11-power-paths", "data-center-specialization-11-load-capacity", "data-center-specialization-11-electrical-incident-project"],
    competencies: ["electrical-power-path-interpretation", "electrical-load-capacity-reasoning", "electrical-infrastructure-incident-analysis"],
  },
  "mechanical-hvac": {
    lessons: ["data-center-specialization-11-airflow-management", "data-center-specialization-11-cooling-capacity", "data-center-specialization-11-thermal-incident-project"],
    competencies: ["mechanical-hvac-thermal-airflow-interpretation", "mechanical-hvac-cooling-capacity-reliability", "mechanical-hvac-cooling-incident-analysis"],
  },
  "cybersecurity-security": {
    lessons: ["data-center-specialization-11-authorization-least-privilege", "data-center-specialization-11-security-monitoring-logs", "data-center-specialization-11-security-incident-project"],
    competencies: ["security-access-control-analysis", "security-log-alert-interpretation", "security-incident-documentation-escalation"],
  },
  "ai-cloud-infrastructure": {
    lessons: ["data-center-specialization-11-cpu-gpu-workloads", "data-center-specialization-11-capacity-bottlenecks", "data-center-specialization-11-ai-cloud-project"],
    competencies: ["ai-cloud-workload-infrastructure-analysis", "ai-cloud-capacity-bottleneck-analysis", "ai-cloud-reliability-operations-analysis"],
  },
};

export const CAPSTONE_ROLE_BY_SPECIALIZATION: Record<string, string> = {
  "technical-operations": "Operations",
  "networking-fiber": "Networking",
  "electrical-infrastructure": "Power",
  "mechanical-hvac": "Cooling/Mechanical",
  "cybersecurity-security": "Security",
  "ai-cloud-infrastructure": "Compute/AI Infrastructure",
};
