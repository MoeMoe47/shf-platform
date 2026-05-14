// src/utils/binderMerge.js
import { MASTER_GRANT_NARRATIVE_TEMPLATE } from "@/utils/grantNarrativeTemplate.js";

/**
 * Normalize admin + civic logs into grouped buckets
 * for the master grant narrative.
 *
 * NOTE: Identity fields (userId, role, siteId, programId, fundingStreams, etc.)
 * are preserved on `raw` and can be used by GrantBinder and analytics.
 */
export function mergeAdminAndCivicLogs(adminLogs = [], civicLogs = []) {
  const normalizedAdmin = (adminLogs || []).map((log) => ({
    when: log.when,
    org: log.org || "Foundation",
    category: log.category,
    duration: Number(log.duration || 0),
    headline: log.outcome || log.notes || "",
    type: "admin",
    tool: log.tool,
    toolOrMission: log.tool,
    raw: log, // contains identity + fundingStreams if present
  }));

  const normalizedCivic = (civicLogs || []).map((log) => ({
    when: log.when,
    org: log.org || "Foundation",
    category: "Civic mission",
    duration: Number(log.duration || 0),
    headline: log.summary || log.outcome || "",
    type: "civic",
    mission: log.mission,
    toolOrMission: log.mission,
    raw: log, // contains identity + fundingStreams if present
  }));

  const all = [...normalizedAdmin, ...normalizedCivic];

  const totalTimeHours =
    all.reduce((sum, item) => sum + (item.duration || 0), 0) / 60;

  const byCategory = {
    Funding: normalizedAdmin.filter((x) => x.category === "Funding & grants"),
    Sales: normalizedAdmin.filter((x) =>
      [
        "Sales & outreach",
        "Employer / internships",
        "Storytelling & marketing",
      ].includes(x.category)
    ),
    Curriculum: normalizedAdmin.filter(
      (x) => x.category === "Curriculum build"
    ),
    Product: normalizedAdmin.filter((x) =>
      ["Product & UX"].includes(x.category)
    ),
    Civic: normalizedCivic,
  };

  return {
    adminCount: normalizedAdmin.length,
    civicCount: normalizedCivic.length,
    totalTimeHours: Number(totalTimeHours.toFixed(1)),

    fundingCount: byCategory.Funding.length,
    salesCount: byCategory.Sales.length,
    curriculumCount: byCategory.Curriculum.length,
    productCount: byCategory.Product.length,
    civicMissionCount: byCategory.Civic.length,

    all,
    byCategory,
  };
}

/**
 * Very simple template filler for MASTER_GRANT_NARRATIVE_TEMPLATE.
 * Loops are rendered in JS, not with Mustache.
 */
export function buildGrantNarrative(merged) {
  const {
    adminCount,
    civicCount,
    totalTimeHours,
    fundingCount,
    salesCount,
    curriculumCount,
    productCount,
    civicMissionCount,
    all,
    byCategory,
  } = merged || {};

  const updatedAt = new Date().toISOString().slice(0, 10);

  const renderList = (items, type) =>
    (items || [])
      .map((item) => {
        if (type === "civic") {
          return `- **${item.when}** — _Mission: ${item.mission}_ (${item.duration} min):  ${item.headline}`;
        }
        return `- **${item.when}** — _${item.tool}_ (${item.duration} min): ${item.headline}`;
      })
      .join("\n");

  const fundingLines = renderList(byCategory?.Funding || [], "admin");
  const salesLines = renderList(byCategory?.Sales || [], "admin");
  const curriculumLines = renderList(byCategory?.Curriculum || [], "admin");
  const productLines = renderList(byCategory?.Product || [], "admin");
  const civicLines = renderList(byCategory?.Civic || [], "civic");

  const allLines = (all || [])
    .map((item) => {
      return `- **${item.when}** — _${item.toolOrMission}_ — ${item.org} — ${item.category} — ${item.duration} min  
  ${item.headline || "—"}`;
    })
    .join("\n");

  let md = MASTER_GRANT_NARRATIVE_TEMPLATE;

  // Scalar replacements
  md = md.replace("{{updatedAt}}", updatedAt);
  md = md.replace("{{adminCount}}", String(adminCount ?? 0));
  md = md.replace("{{civicCount}}", String(civicCount ?? 0));
  md = md.replace(/{{totalTimeHours}}/g, String(totalTimeHours ?? 0));

  md = md.replace("{{fundingCount}}", String(fundingCount ?? 0));
  md = md.replace("{{salesCount}}", String(salesCount ?? 0));
  md = md.replace("{{curriculumCount}}", String(curriculumCount ?? 0));
  md = md.replace("{{productCount}}", String(productCount ?? 0));
  md = md.replace("{{civicMissionCount}}", String(civicMissionCount ?? 0));

  // Loop sections → inject rendered lists or fallback lines
  md = md.replace(
    "{{#Funding}}\n- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}\n{{/Funding}}",
    fundingLines || "- _No funding sessions logged yet._"
  );

  md = md.replace(
    "{{#Sales}}\n- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}\n{{/Sales}}",
    salesLines || "- _No sales sessions logged yet._"
  );

  md = md.replace(
    "{{#Curriculum}}\n- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}\n{{/Curriculum}}",
    curriculumLines || "- _No curriculum sessions logged yet._"
  );

  md = md.replace(
    "{{#Product}}\n- **{{when}}** — _{{tool}}_ ({{duration}} min): {{headline}}\n{{/Product}}",
    productLines || "- _No product sessions logged yet._"
  );

  md = md.replace(
    "{{#Civic}}\n- **{{when}}** — _Mission: {{mission}}_ ({{duration}} min):  \n  {{summary}}\n{{/Civic}}",
    civicLines || "- _No civic missions logged yet._"
  );

  md = md.replace(
    "{{#All}}\n- **{{when}}** — _{{toolOrMission}}_ — {{org}} — {{category}} — {{duration}} min  \n  {{notes}}\n{{/All}}",
    allLines || "- _No AI-assisted sessions logged yet._"
  );

  // Impact placeholders
  md = md.replace(
    "{{impactFunding}}",
    "- AI is used to regularly draft, revise, and polish grant narratives."
  );
  md = md.replace(
    "{{impactSales}}",
    "- AI supports outreach templates, employer one-pagers, and follow-up messages."
  );
  md = md.replace(
    "{{impactCurriculum}}",
    "- AI accelerates curriculum drafting while keeping standards-aligned."
  );
  md = md.replace(
    "{{impactProduct}}",
    "- AI is used for UX reviews and product copy polish."
  );
  md = md.replace(
    "{{impactCivic}}",
    "- AI helps students analyze real-world issues and draft civic proposals."
  );

  return md;
}

/**
 * Store the final master narrative for later display / export.
 */
const MASTER_STORAGE_KEY = "shf_master_grant_narrative_v1";

export function saveMasterNarrativeToStorage(markdown, meta = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    markdown: markdown || "",
    meta: meta || {},
  };

  try {
    window.localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[binderMerge] Failed to store master narrative", err);
  }
}

export function loadMasterNarrativeFromStorage() {
  if (typeof window === "undefined") {
    return { markdown: "", meta: {} };
  }

  try {
    const raw = window.localStorage.getItem(MASTER_STORAGE_KEY);
    if (!raw) return { markdown: "", meta: {} };

    const parsed = JSON.parse(raw);
    return {
      markdown: parsed.markdown || "",
      meta: parsed.meta || {},
    };
  } catch (err) {
    console.warn("[binderMerge] Failed to load master narrative", err);
    return { markdown: "", meta: {} };
  }
}
