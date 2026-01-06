import { matchPrograms, estimateReimbursement } from "@/shared/employer/eligibility.js";

export function buildPitchPack({ pathway="tech", wage=16, hours=120, programIds=[], state="OH" }) {
  const programs = matchPrograms({ state, pathway, plannedHours: hours, isW2: true })
    .filter(p => programIds.length ? programIds.includes(p.id) : true);

  const items = programs.map(p => ({
    id: p.id,
    name: p.name,
    ratePct: Math.round((p.reimbursementPercent || 0) * 100),
    cap: p.maxPerIntern || null,
    est: estimateReimbursement({ program: p, wage, hours }),
    notes: p.notes || ""
  }));
  const best = items.length ? Math.max(...items.map(i => i.ratePct)) : 0;

  return {
    headline: best ? `Unlock up to ${best}% wage reimbursement for ${pathway} interns.` : `Map roles to Ohio reimbursement programs.`,
    bullets: [
      `Estimated payout shown at $${wage}/hr × ${hours}h`,
      `We handle compliance & paperwork; you focus on the work.`,
      `Public recognition on SHF Investor Dashboard.`
    ],
    items
  };
}
