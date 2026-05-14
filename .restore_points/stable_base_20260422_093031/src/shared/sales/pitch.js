import { defaultGoals, loadGoals, mergeGoals } from "@/shared/sales/goals.js";
import catalog from "@/data/marketplace.json"; // falls back if present

export function buildPitchPack(opts = {}) {
  const goals = mergeGoals(defaultGoals(), loadGoals());
  const plan = {
    monthTarget: goals.monthTarget,
    quarterTarget: goals.quarterTarget,
    winRate: goals.winRate,
    avgDeal: goals.avgDeal,
    cycleDays: goals.cycleDays,
  };

  const items = Array.isArray(catalog?.bundles)
    ? catalog.bundles.slice(0, 3).map((b) => ({
        id: b.id,
        name: b.name,
        summary: b.summary || b.description || "",
        price: Number(b.price || 0),
        qty: 1,
      }))
    : [
        { id: "shf-core", name: "SHF Core Pack", summary: "Core curriculum & dashboards", price: 15000, qty: 1 },
        { id: "employer-bridge", name: "Employer Bridge", summary: "Internship & wage capture", price: 8000, qty: 1 },
        { id: "credit-coach", name: "Credit Coach", summary: "Credit + Debt literacy suite", price: 5000, qty: 1 },
      ];

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const discount = opts.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  return {
    meta: {
      createdAt: new Date().toISOString(),
      version: 1,
      currency: "USD",
    },
    client: opts.client || { name: "Prospect School District", contact: "TBD" },
    plan,
    items,
    subtotal,
    discount,
    total,
    notes: opts.notes || "Pricing valid 30 days. Implementation timeline 4–6 weeks.",
  };
}
