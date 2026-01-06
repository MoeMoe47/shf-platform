export const L26 = {
  id: "L26",
  slug: "efficiency_throughput",
  name: "Efficiency & Throughput Optimization",
  purpose:
    "Keep SHF fast, affordable, and stable by controlling cost, latency, and operational load across apps, agents, and automations.",
  owns: [
    "Performance budgets (CPU, memory, network, bundle size)",
    "Cost controls (API usage, agent tokens, retries, backoff)",
    "Rate limits, circuit breakers, dedupe, batching",
    "Caching strategy (client, edge, server) + invalidation rules",
    "Queueing + workload shaping (pilot-mode vs system-mode)",
    "Operational SLAs (uptime targets, response times)",
  ],
  boundaries: [
    "Does NOT define policy or ethics (that belongs in Security/Ethics + Compliance layers)",
    "Does NOT make outcome decisions (that belongs to Outcomes + Director layers)",
    "Only optimizes execution of approved actions",
  ],
  artifacts: [
    "PerformanceBudget.json",
    "CostBudget.json",
    "QueuePolicy.json",
    "RetryBackoffPolicy.json",
    "PilotVsSystemModePolicy.json",
  ],
};
