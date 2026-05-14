// src/utils/eventSchema.js
// Canonical keys + minimal shape so all apps publish consistent events.

export const Events = {
  ATTENDANCE_LOGGED: "edu.attendance.logged",          // { present:boolean }
  GRADE_POSTED: "edu.grade.posted",                    // { pct:number } 0..100
  MICROCERT_EARNED: "edu.microcert.earned",            // { id:string, level?:1|2|3 }
  ASSIGNMENT_SUBMITTED: "eng.assignment.submitted",    // { onTime:boolean }
  SOCIAL_ACTION: "social.action",                      // { platform:string, action:"follow"|"like"|"share", proofRef?:string }
  PAYMENT_POSTED: "credit.payment.posted",             // { amount:number, onTime:boolean }
  DISPUTE_RESOLVED: "credit.dispute.resolved",         // { outcome:"deleted"|"updated"|"verified" }
  DEROG_ADDED: "credit.derog.added",                   // { type:"late"|"chargeoff"|"collection" }
};

export function isEventKey(key) {
  return Object.values(Events).includes(key);
}

export function normalizeEvent(ev) {
  const ts = Number(ev?.ts ?? Date.now());
  const key = String(ev?.key || "");
  return { key, ts, meta: ev?.meta ?? {}, source: ev?.source ?? "app", userId: ev?.userId ?? null };
}
