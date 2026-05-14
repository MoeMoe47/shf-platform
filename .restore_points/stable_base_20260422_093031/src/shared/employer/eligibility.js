import programsOH from "@/data/employer/programs.ohio.json";

export function matchPrograms({ state="OH", pathway, plannedHours=0, isW2=true }) {
  const pool = state === "OH" ? programsOH : [];
  return pool.filter(p => {
    const pathwayOk = p.eligiblePathways?.includes("any") || p.eligiblePathways?.includes(pathway);
    const hoursOk = plannedHours >= (p.minHours || 0);
    const w2Ok = p.requiresW2 ? isW2 : true;
    return pathwayOk && hoursOk && w2Ok;
  });
}

export function estimateReimbursement({ program, wage=0, hours=0 }) {
  const base = (program.reimbursementPercent || 0) * wage * hours;
  return program.maxPerIntern ? Math.min(base, program.maxPerIntern) : base;
}
