// src/utils/buildFundingPlan.js

/**
 * buildFundingPlan(profile) -> FundingPlan
 * Normalizes simple eligibility signals into an actionable checklist.
 *
 * Input profile (all optional):
 * {
 *   state: "OH" | "MI" | ...,
 *   unemployed: boolean,
 *   veteran: boolean,
 *   hsGrad: boolean,
 *   age: number | null,
 *   householdSize: number | null,
 * }
 *
 * Output shape:
 * {
 *   id: string,
 *   estCoverage: "full" | "partial" | "none",
 *   steps: [{ id, program, action, docs: string[], contact?: string }],
 *   contacts: [{ program, urlHint?: string, phone?: string }],
 *   notes: string[],
 *   meta: { createdAt: string, profile }
 * }
 */

export default function buildFundingPlan(profile = {}) {
  const p = normalize(profile);
  const steps = [];
  const contacts = [];
  const notes = [];

  // ---- Rule: WIOA / ETPL (unemployed or low-income or youth 16–24) ----
  const youth = isYouth(p.age);
  if (p.unemployed || youth) {
    const stateRes = stateResources(p.state);
    steps.push(step({
      program: "WIOA / Eligible Training (ETPL)",
      action: `Contact your local workforce board and ask about Individual Training Accounts (ITAs) for approved programs.`,
      docs: ["Government ID", "Resume", "Proof of address", "Selective Service (if required)"],
      contact: stateRes.oneStopLabel,
    }));
    contacts.push({
      program: "WIOA / ETPL",
      urlHint: stateRes.oneStopUrl,
      phone: stateRes.oneStopPhone || undefined,
    });

    // Youth track (optional)
    if (youth) {
      notes.push("You may also qualify for WIOA Youth (16–24). Ask for youth services and supportive services (transport, exam fees).");
    }
  }

  // ---- Rule: Veterans (GI Bill® / VR&E) ----
  if (p.veteran) {
    steps.push(step({
      program: "VA Education (GI Bill® / VR&E)",
      action: "Check your benefits eligibility and request a Certificate of Eligibility (COE).",
      docs: ["DD-214", "COE (if available)"],
      contact: "VA Education Benefits",
    }));
    contacts.push({
      program: "VA Education",
      urlHint: "https://www.va.gov/education/",
      phone: "888-442-4551",
    });
  }

  // ---- Rule: State short-term workforce grants (varies by state) ----
  const stateGrant = shortTermGrantByState(p.state);
  if (stateGrant) {
    steps.push(step({
      program: stateGrant.name,
      action: stateGrant.action,
      docs: ["ID", "Proof of residency", "Program quote (cost & weeks)"],
      contact: stateGrant.label,
    }));
    contacts.push({
      program: stateGrant.name,
      urlHint: stateGrant.url,
    });
  }

  // ---- Rule: SNAP E&T (often funds short training & supports) ----
  // Heuristic: If unemployed OR householdSize >= 2, show as an option.
  if (p.unemployed || (Number(p.householdSize) || 0) >= 2) {
    steps.push(step({
      program: "SNAP Employment & Training",
      action: "Ask your county Job & Family Services about SNAP E&T eligible training providers and support services.",
      docs: ["ID", "Income verification"],
      contact: "County JFS / human services",
    }));
    contacts.push({
      program: "SNAP E&T",
      urlHint: "https://www.fns.usda.gov/snap/et",
    });
  }

  // ---- Rule: Employer tuition (always suggest) ----
  steps.push(step({
    program: "Employer tuition / apprenticeship",
    action: "Ask HR about tuition assistance or apprenticeship sponsors for this pathway.",
    docs: ["Offer letter (if applicable)"],
  }));

  // ---- Estimate coverage tier ----
  const coverage = estimateCoverage({
    unemployed: p.unemployed,
    veteran: p.veteran,
    stateGrant: !!stateGrant,
    snapET: p.unemployed || (Number(p.householdSize) || 0) >= 2,
  });

  return {
    id: `funding-${rand(6)}`,
    estCoverage: coverage,
    steps,
    contacts,
    notes,
    meta: { createdAt: new Date().toISOString(), profile: p },
  };
}

/* ---------------- helpers ---------------- */

function normalize(x) {
  return {
    state: (x.state || "").trim().toUpperCase(),
    unemployed: !!x.unemployed,
    veteran: !!x.veteran,
    hsGrad: x.hsGrad !== false, // default true
    age: isFiniteNum(x.age) ? Number(x.age) : null,
    householdSize: isFiniteNum(x.householdSize) ? Number(x.householdSize) : null,
  };
}

function isYouth(age) {
  return isFiniteNum(age) && age >= 16 && age <= 24;
}

function isFiniteNum(n) {
  const v = Number(n);
  return Number.isFinite(v);
}

function step({ program, action, docs = [], contact }) {
  return {
    id: `s_${rand(8)}`,
    program,
    action,
    docs: Array.isArray(docs) ? docs : [],
    ...(contact ? { contact } : {}),
  };
}

function estimateCoverage(flags) {
  // naive points model -> full/partial/none
  // WIOA and VA are strongest; state grants + SNAP E&T add weight
  let pts = 0;
  if (flags.unemployed) pts += 2;  // WIOA likely
  if (flags.veteran) pts += 2;     // VA likely
  if (flags.stateGrant) pts += 1;
  if (flags.snapET) pts += 1;

  if (pts >= 3) return "full";     // multiple strong sources
  if (pts >= 1) return "partial";  // at least one path
  return "none";
}

// Minimal state resources; expand as needed
function stateResources(state) {
  const S = (state || "").toUpperCase();
  // One-stop locator defaults
  const defaultRes = {
    oneStopLabel: "Find your local workforce center",
    oneStopUrl: "https://www.careeronestop.org/LocalHelp/local-help.aspx",
    oneStopPhone: undefined,
  };
  const map = {
    OH: {
      oneStopLabel: "OhioMeansJobs (local center)",
      oneStopUrl: "https://ohiojobhelp.ohio.gov/wps/portal/gov/oomj/local-offices",
    },
    MI: {
      oneStopLabel: "Michigan Works! (local office)",
      oneStopUrl: "https://www.michiganworks.org/our-network",
    },
    PA: {
      oneStopLabel: "PA CareerLink®",
      oneStopUrl: "https://www.pacareerlink.pa.gov/",
    },
    IN: {
      oneStopLabel: "WorkOne (Indiana)",
      oneStopUrl: "https://www.in.gov/dwd/WorkOne/",
    },
    IL: {
      oneStopLabel: "Illinois workNet",
      oneStopUrl: "https://www.illinoisworknet.com/",
    },
    NY: {
      oneStopLabel: "NYS Career Centers",
      oneStopUrl: "https://dol.ny.gov/career-centers",
    },
    KY: {
      oneStopLabel: "Kentucky Career Centers",
      oneStopUrl: "https://kcc.ky.gov/Pages/default.aspx",
    },
    WV: {
      oneStopLabel: "WorkForce West Virginia",
      oneStopUrl: "https://workforcewv.org/job-seekers",
    },
  };
  return map[S] || defaultRes;
}

function shortTermGrantByState(state) {
  const S = (state || "").toUpperCase();
  const map = {
    OH: {
      name: "Ohio Short-Term Certificate grants",
      label: "Ohio Dept. Higher Education programs",
      url: "https://highered.ohio.gov/",
      action: "Ask your training provider which short-term certificate grants apply and how to apply.",
    },
    MI: {
      name: "Michigan Reconnect (short-term pathways)",
      label: "Michigan Reconnect",
      url: "https://www.michigan.gov/reconnect",
      action: "Check eligibility for tuition-free options or last-dollar aid for short-term credentials.",
    },
    PA: {
      name: "PA workforce training grants",
      label: "PA CareerLink® / local board",
      url: "https://www.pacareerlink.pa.gov/",
      action: "Ask about short-term training grants and supportive services in your county.",
    },
    IN: {
      name: "Next Level Jobs (Workforce Ready Grant)",
      label: "Indiana DWD",
      url: "https://www.nextleveljobs.org/",
      action: "See if your program is Workforce Ready eligible for tuition coverage.",
    },
  };
  return map[S] || null;
}

function rand(len = 6) {
  try { return crypto.randomUUID().slice(0, len); }
  catch { return Math.random().toString(36).slice(2, 2 + len); }
}
