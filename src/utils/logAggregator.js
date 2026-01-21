/* Unified analytics spine for AdminAnalytics / GrantBinder / InvestorNorthstar */

const ADMIN_LOG_KEY = "shf.adminToolLogs.v1";
const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";

export const APP_CONFIG = [
  { id: "civic", label: "Civic", emoji: "🏛" },
  { id: "career", label: "Career", emoji: "💼" },
  { id: "curriculum", label: "Curriculum", emoji: "📚" },
  { id: "arcade", label: "Arcade", emoji: "🕹️" },
];

export const FUNDING_STREAM_LABELS = {
  perkins: "Perkins V",
  wioa: "WIOA",
  essa: "ESSA Title IV",
  medicaid: "Medicaid",
  idea: "IDEA",
  workforce: "Workforce",
  philanthropy: "Philanthropy",
  civics: "Civics / Democracy",
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) || typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeAppId(raw) {
  if (!raw) return null;
  const v = String(raw).toLowerCase();
  if (v.includes("civic")) return "civic";
  if (v.includes("career")) return "career";
  if (v.includes("curriculum")) return "curriculum";
  if (v.includes("arcade")) return "arcade";
  return null;
}

function normalizeFundingTag(tag) {
  if (!tag) return null;
  const v = String(tag).toLowerCase().trim();

  if (v.startsWith("perkins")) return "perkins";
  if (v.startsWith("wioa")) return "wioa";
  if (v.startsWith("essa")) return "essa";
  if (v.includes("medicaid")) return "medicaid";
  if (v.startsWith("idea")) return "idea";
  if (v.includes("workforce")) return "workforce";
  if (v.includes("civic")) return "civics";
  if (v.includes("philanth")) return "philanthropy";

  return null;
}

function getSite(log) {
  return (
    log.site ||
    log.siteId ||
    log.program ||
    log.programId ||
    log.org ||
    log.orgId ||
    ""
  );
}

function getTags(log) {
  const tags =
    log.fundingStreams ||
    log.fundingTags ||
    log.fundingStream ||
    log.tags ||
    [];
  return Array.isArray(tags) ? tags : [tags];
}

function applyFilters(allLogs, { app, site, funding } = {}) {
  let out = allLogs;

  if (app) {
    const a = String(app).toLowerCase().trim();
    out = out.filter((l) => String(l._app || "").toLowerCase() === a);
  }

  if (site) {
    const s = String(site).trim();
    out = out.filter((l) => getSite(l) === s);
  }

  if (funding) {
    const f = String(funding).toLowerCase().trim();
    out = out.filter((l) => {
      const tags = getTags(l);
      return tags.some((t) => normalizeFundingTag(t) === f || String(t).toLowerCase().includes(f));
    });
  }

  return out;
}

function summarize(allLogs) {
  const totalMinutes = allLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0);
  const totalEntries = allLogs.length;

  const appSummaries = {};
  APP_CONFIG.forEach((a) => {
    appSummaries[a.id] = {
      id: a.id,
      label: a.label,
      emoji: a.emoji,
      minutes: 0,
      entries: 0,
      sharePct: 0,
      fundingTop: [],
    };
  });

  const fundingTotals = {};

  for (const log of allLogs) {
    const appId = log._app;
    const duration = Number(log.duration || 0);

    if (appSummaries[appId]) {
      const s = appSummaries[appId];
      s.minutes += duration;
      s.entries += 1;

      const tags = getTags(log);
      tags.forEach((t) => {
        const norm = normalizeFundingTag(t);
        if (!norm) return;

        if (!s._funding) s._funding = {};
        s._funding[norm] = (s._funding[norm] || 0) + duration;

        fundingTotals[norm] = (fundingTotals[norm] || 0) + duration;
      });
    }
  }

  Object.values(appSummaries).forEach((s) => {
    s.sharePct = totalMinutes > 0 ? Math.round((s.minutes / totalMinutes) * 1000) / 10 : 0;
    const ft = s._funding || {};
    s.fundingTop = Object.entries(ft)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id, minutes]) => ({ id, label: FUNDING_STREAM_LABELS[id] || id, minutes }));
    delete s._funding;
  });

  return { totalMinutes, totalEntries, appSummaries, fundingTotals };
}

export function buildUnifiedLogSummary(filters = {}) {
  const adminLogs = readJSON(ADMIN_LOG_KEY, []);
  const civicLogs = readJSON(CIVIC_LOG_KEY, []);

  const civicTagged = (civicLogs || []).map((log) => ({ ...log, _app: "civic" }));

  const adminTagged = (adminLogs || []).map((log) => {
    const fallbackApp =
      normalizeAppId(
        log.appId ||
          log.app ||
          log.siteId ||
          log.sourceApp ||
          log.appSlug ||
          log.source
      ) || "admin";

    return { ...log, _app: fallbackApp };
  });

  const merged = [...civicTagged, ...adminTagged].filter(Boolean);

  const filtered = applyFilters(merged, filters);

  const s = summarize(filtered);

  return {
    ...s,
    logs: filtered,
  };
}

export function listSitesFromLogs(logs) {
  const set = new Set();
  (logs || []).forEach((l) => {
    const s = getSite(l);
    if (s) set.add(s);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
