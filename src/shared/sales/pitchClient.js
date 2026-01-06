const KEY = "sales:proposal:draft";

export async function fetchPitchPack() {
  // Mock endpoint already logged by your dev server:
  // GET /__mock/api/sales/pitch-pack
  const r = await fetch("/__mock/api/sales/pitch-pack");
  if (!r.ok) throw new Error("pitch-pack request failed");
  return r.json();
}

export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function saveDraft(draft) {
  try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch {}
}
export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function draftFromPack(pack = {}) {
  const now = new Date().toLocaleString();
  return {
    meta: {
      title: `Proposal for ${pack.client?.name || "Client"} — ${now}`,
      createdAt: Date.now(),
      version: 1,
    },
    client: pack.client || {},
    offers: pack.offers || [],
    pricing: pack.pricing || {},
    impact: pack.impact || {},
    summary: [
      `• Outcomes: ${pack.impact?.summary || "TBD"}`,
      `• Bundle: ${pack.offers?.map(o => o.name).join(", ") || "TBD"}`,
      `• Investment: ${pack.pricing?.total ? "$"+pack.pricing.total : "TBD"}`
    ].join("\n"),
    notes: "",
  };
}
