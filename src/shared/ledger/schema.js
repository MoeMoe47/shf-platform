// Minimal schema reference for consistency
export const LedgerEventSchema = {
    id: "string",               // unique
    actorId: "string",          // user id or system
    app: "credit|debt|treasury|career|curriculum|sales",
    type: "earn|spend|debt|badge|progress|treasury",
    amount: 0,                  // number (can be 0 for badge/proof)
    tags: [],                   // ["evu","lesson.completed"]
    impact_tag: null,           // "education" | "equity" | "civic" | "workforce"
    meta: {},                   // free-form
    proof: { batchId: null, rootHash: null },
    ts: "",                     // ISO string
  };
  