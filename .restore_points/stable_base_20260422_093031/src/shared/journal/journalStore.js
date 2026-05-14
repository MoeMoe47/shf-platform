const KEY = "shf.journal.v1";

function safeParse(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function nowISO() {
  return new Date().toISOString();
}

function uid(prefix = "j") {
  const rnd = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now().toString(16)}_${rnd}`;
}

function normalizeFundingTag(tag) {
  if (!tag) return null;
  const v = String(tag).toLowerCase().trim();
  if (!v) return null;
  if (v.startsWith("perkins")) return "perkins";
  if (v.startsWith("wioa")) return "wioa";
  if (v.startsWith("essa")) return "essa";
  if (v.includes("medicaid")) return "medicaid";
  if (v.startsWith("idea")) return "idea";
  if (v.includes("workforce")) return "workforce";
  if (v.includes("civic")) return "civics";
  if (v.includes("philanth")) return "philanthropy";
  return v.replace(/\s+/g, "-");
}

function readAll() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  const data = safeParse(raw, []);
  return Array.isArray(data) ? data : [];
}

function writeAll(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function createEntry(payload = {}) {
  const entry = {
    id: payload.id || uid("jrnl"),
    createdAt: payload.createdAt || nowISO(),
    updatedAt: payload.updatedAt || nowISO(),
    appId: payload.appId || "civic",
    siteId: payload.siteId || "default",
    userId: payload.userId || "local",
    promptId: payload.promptId || "",
    title: payload.title || "",
    body: payload.body || "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    fundingStreams: Array.isArray(payload.fundingStreams)
      ? payload.fundingStreams.map(normalizeFundingTag).filter(Boolean)
      : [],
    evidence: Array.isArray(payload.evidence) ? payload.evidence : [],
    outcome: payload.outcome || "",
    visibility: payload.visibility || "private",
  };

  const all = readAll();
  writeAll([entry, ...all]);
  return entry;
}

export function updateEntry(id, patch = {}) {
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;

  const prev = all[idx];
  const next = {
    ...prev,
    ...patch,
    updatedAt: nowISO(),
  };

  if (patch.tags && !Array.isArray(patch.tags)) next.tags = prev.tags;
  if (patch.fundingStreams && !Array.isArray(patch.fundingStreams)) {
    next.fundingStreams = prev.fundingStreams;
  }
  if (Array.isArray(next.fundingStreams)) {
    next.fundingStreams = next.fundingStreams
      .map(normalizeFundingTag)
      .filter(Boolean);
  }

  const out = [...all];
  out[idx] = next;
  writeAll(out);
  return next;
}

export function deleteEntry(id) {
  const all = readAll();
  const out = all.filter((x) => x.id !== id);
  writeAll(out);
  return out.length !== all.length;
}

export function listEntries(filters = {}) {
  const {
    appId,
    siteId,
    userId,
    funding,
    tag,
    q,
    limit = 500,
  } = filters;

  let items = readAll();

  if (appId && appId !== "all") items = items.filter((x) => x.appId === appId);
  if (siteId && siteId !== "all") items = items.filter((x) => x.siteId === siteId);
  if (userId && userId !== "all") items = items.filter((x) => x.userId === userId);

  if (funding && funding !== "all") {
    items = items.filter((x) => (x.fundingStreams || []).includes(normalizeFundingTag(funding)));
  }

  if (tag && tag !== "all") {
    const t = String(tag).toLowerCase().trim();
    items = items.filter((x) => (x.tags || []).some((z) => String(z).toLowerCase().trim() === t));
  }

  if (q && String(q).trim()) {
    const needle = String(q).toLowerCase().trim();
    items = items.filter((x) => {
      const hay = `${x.title || ""} ${x.body || ""} ${(x.tags || []).join(" ")} ${(x.fundingStreams || []).join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }

  items.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return items.slice(0, Math.max(1, Number(limit || 500)));
}

export function getStats(filters = {}) {
  const items = listEntries(filters);
  const byFunding = {};
  const byApp = {};
  const bySite = {};

  for (const e of items) {
    byApp[e.appId] = (byApp[e.appId] || 0) + 1;
    bySite[e.siteId] = (bySite[e.siteId] || 0) + 1;
    for (const f of e.fundingStreams || []) {
      byFunding[f] = (byFunding[f] || 0) + 1;
    }
  }

  return {
    count: items.length,
    byFunding,
    byApp,
    bySite,
  };
}

export function exportJSON(filters = {}) {
  const items = listEntries(filters);
  const payload = {
    meta: {
      exportedAt: nowISO(),
      filters,
      count: items.length,
      schema: "shf.journal.v1",
    },
    items,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportMarkdown(filters = {}) {
  const items = listEntries(filters);

  const lines = [];
  lines.push(`# Journal Export`);
  lines.push(``);
  lines.push(`Exported: ${nowISO()}`);
  lines.push(`Count: ${items.length}`);
  lines.push(``);

  for (const e of items) {
    lines.push(`## ${e.title || "Untitled"}`);
    lines.push(`- id: ${e.id}`);
    lines.push(`- app: ${e.appId}`);
    lines.push(`- site: ${e.siteId}`);
    lines.push(`- updated: ${e.updatedAt || e.createdAt || ""}`);
    if ((e.fundingStreams || []).length) lines.push(`- funding: ${(e.fundingStreams || []).join(", ")}`);
    if ((e.tags || []).length) lines.push(`- tags: ${(e.tags || []).join(", ")}`);
    if (e.outcome) lines.push(`- outcome: ${e.outcome}`);
    lines.push(``);
    if (e.body) lines.push(e.body.trim());
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  return lines.join("\n");
}

export function downloadText(filename, text, mime = "text/plain;charset=utf-8;") {
  if (typeof window === "undefined") return;
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
