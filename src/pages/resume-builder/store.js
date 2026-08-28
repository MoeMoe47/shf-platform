// src/pages/resume-builder/store.js
// Shared, presentation-free logic for the Resume Builder: persistence,
// readability, ATS/Career Intelligence keyword analysis, and the
// resume-export reward hook. Kept out of the responsive UI components so
// the same behavior powers desktop, tablet, and mobile without duplication.
import { emptyResume, validateResume, migrateResume } from "../../utils/resumeSchema.js";

export const deepClone = (x) => JSON.parse(JSON.stringify(x));
export const safeNumber = (v, f = 100) => (Number.isFinite(+v) ? +v : f);
export const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));

/* ---------- Readability (Flesch–Kincaid grade) ---------- */
function countWords(t = "") {
  return (t.trim().match(/\b[\w’'-]+\b/g) || []).length;
}
function countSentences(t = "") {
  return (t.trim().match(/[.!?]+/g) || []).length || (t.trim() ? 1 : 0);
}
function countSyllablesWord(w = "") {
  const x = w.toLowerCase().replace(/[^a-z]/g, "");
  if (!x) return 0;
  let syl = (x.match(/[aeiouy]+/g) || []).length;
  if (x.endsWith("e")) syl--;
  return Math.max(1, syl);
}
function countSyllables(t = "") {
  const words = t.match(/\b[\w’'-]+\b/g) || [];
  return words.reduce((s, w) => s + countSyllablesWord(w), 0);
}
export function fkGrade(t = "") {
  const W = countWords(t), S = countSentences(t), Y = countSyllables(t);
  if (!W || !S) return 0;
  return Math.max(0, +(0.39 * (W / S) + 11.8 * (Y / W) - 15.59).toFixed(1));
}
export function readabilityLabel(grade) {
  return grade <= 6 ? "Very easy" : grade <= 9 ? "Easy" : grade <= 12 ? "OK" : "Hard (simplify)";
}

/* ===========================================================
   Constants / LocalStorage
   =========================================================== */
export const LS_KEY = "sh_resume_doc_v1";
const LEGACY_KEYS = ["sh_resume_doc", "resume_doc", "resume"];
const BACKUP_PREFIX = `${LS_KEY}__backup_`;
const BACKUP_MAX = 8; // bounded rolling retention — see saveResume()

function pickFirstExistingKey() {
  const current = localStorage.getItem(LS_KEY);
  if (current) return LS_KEY;
  for (const k of LEGACY_KEYS) {
    if (localStorage.getItem(k)) return k;
  }
  return LS_KEY;
}

export const TEMPLATES = [
  { id: "clean", name: "Clean", desc: "Single column, high ATS match" },
  { id: "modern", name: "Modern", desc: "Two-tone headings, subtle accents" },
  { id: "compact", name: "Executive", desc: "Space-efficient, for 10+ bullets" },
];

/* ensure every section has a `hidden` boolean (default false) */
export function withVisibility(doc) {
  const next = { ...doc };
  next.sections = (doc.sections || []).map((s) => ({ hidden: false, ...s }));
  return next;
}

let LAST_LOAD_ERROR = null;

export function loadResume() {
  LAST_LOAD_ERROR = null;
  try {
    const key = pickFirstExistingKey();
    const raw = localStorage.getItem(key);
    if (!raw) return withVisibility(emptyResume());
    const parsed = migrateResume(JSON.parse(raw));
    const v = validateResume(parsed);
    if (key !== LS_KEY && v.ok) {
      localStorage.setItem(LS_KEY, JSON.stringify(parsed));
    }
    if (!v.ok) {
      LAST_LOAD_ERROR = `Saved resume didn’t match the current schema: ${v.errors.join(", ")}`;
      return withVisibility(parsed);
    }
    return withVisibility(parsed);
  } catch (e) {
    LAST_LOAD_ERROR = `Resume load error: ${e?.message || e}`;
    return withVisibility(emptyResume());
  }
}

export function getLoadError() {
  return LAST_LOAD_ERROR;
}

/* Bounded rolling backup: keep only the newest BACKUP_MAX snapshots so
   localStorage can't grow without limit across long-running sessions. */
function pruneBackups() {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(BACKUP_PREFIX));
    if (keys.length <= BACKUP_MAX) return;
    keys.sort(); // timestamp suffix sorts chronologically
    const toRemove = keys.slice(0, keys.length - BACKUP_MAX);
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function saveResume(doc) {
  try {
    const json = JSON.stringify(doc);
    localStorage.setItem(LS_KEY, json);
    localStorage.setItem(`${BACKUP_PREFIX}${Date.now()}`, json);
    pruneBackups();
  } catch {}
  // Every save path (autosave, reset, import, restore) funnels through here,
  // so this is the one place that needs to notify other independently-
  // mounted components (e.g. CareerSidebar's readiness widget) that resume
  // data changed — same body-attribute/event coordination pattern already
  // used for dark-scope and Ask Coach suppression, avoids prop-drilling
  // across sibling subtrees under AppShellLayout.
  try { window.dispatchEvent(new Event("resume:updated")); } catch {}
}

export function listBackups() {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(BACKUP_PREFIX))
      .map((k) => ({ key: k, ts: Number(k.slice(BACKUP_PREFIX.length)) || 0 }))
      .sort((a, b) => b.ts - a.ts);
  } catch {
    return [];
  }
}

export function readBackup(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ===========================================================
   Career Intelligence (ATS / Job Match) keyword analysis
   =========================================================== */
const STOP = new Set([
  "and", "or", "the", "a", "an", "of", "for", "to", "with", "in", "on", "at", "by", "from", "as", "into", "over", "via",
  "is", "are", "was", "were", "be", "being", "been", "that", "this", "these", "those", "it", "its", "you", "your",
  "we", "our", "they", "their", "i", "me", "my", "us", "them",
  // generic job-post filler that isn't a meaningful keyword on its own
  "years", "year", "experience", "including", "preferred", "required", "requirements", "ability", "abilities",
  "strong", "working", "knowledge", "understanding", "must", "plus", "etc", "looking", "join", "team", "company",
  "opportunity", "role", "responsibilities", "qualifications", "skills", "will", "have", "has", "can", "who",
  "what", "when", "where", "about", "than", "other", "such", "all", "any", "more", "most", "job", "work",
]);

const HARD_SKILLS = new Set([
  "excel", "sql", "python", "javascript", "typescript", "react", "node", "aws", "azure", "gcp", "docker",
  "kubernetes", "git", "figma", "photoshop", "crm", "salesforce", "quickbooks", "tableau", "powerbi", "ai", "ml",
  "c++", "c#", "java", "html", "css", "linux", "api", "rest", "graphql", "sass", "webpack", "jira",
]);

const SOFT_SKILLS = new Set([
  "communication", "leadership", "teamwork", "collaboration", "collaborative", "adaptability", "creativity",
  "organization", "organized", "mentoring", "presentation", "negotiation", "empathy", "initiative", "reliable",
  "reliability", "flexible", "flexibility", "proactive", "detail-oriented", "problem-solving", "critical-thinking",
  "time-management", "multitasking", "interpersonal",
]);

function tokenize(str = "") {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9+.#/ -]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/\.+$/, "")) // drop sentence-ending periods (keeps "node.js", not "skills.")
    .filter(Boolean);
}
function isGoodToken(tok) {
  if (STOP.has(tok)) return false;
  if (tok.length < 3 && !["c", "go", "js", "ai"].includes(tok)) return false;
  if (/^\d+$/.test(tok)) return false;
  return true;
}
function keywordSetFromJD(jd = "") {
  return Array.from(new Set(tokenize(jd).filter(isGoodToken)));
}
function textOfResume(doc) {
  const bits = [];
  if (doc.name) bits.push(doc.name);
  if (doc.title) bits.push(doc.title);
  if (doc.summary) bits.push(doc.summary);
  (doc.skills || []).forEach((s) => bits.push(s));
  (doc.sections || []).forEach((s) => {
    (s.items || []).forEach((it) => {
      Object.values(it || {}).forEach((v) => {
        if (Array.isArray(v)) v.forEach((x) => bits.push(x));
        else if (typeof v === "string") bits.push(v);
      });
    });
  });
  return bits.join(" ").toLowerCase();
}

export function analyzeMatch(doc, jd) {
  const keywords = keywordSetFromJD(jd);
  const resumeText = textOfResume(doc);
  const used = [];
  const missing = [];
  keywords.forEach((kw) => {
    const safe = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${safe}([^a-z0-9]|$)`, "i");
    if (re.test(resumeText)) used.push(kw);
    else missing.push(kw);
  });
  const coverage = keywords.length ? Math.round((used.length / keywords.length) * 100) : 0;
  const hardUsed = used.filter((w) => HARD_SKILLS.has(w));
  const softUsed = used.filter((w) => SOFT_SKILLS.has(w));
  return {
    coveragePct: coverage,
    totalKeywords: keywords.length,
    used,
    missing,
    hardUsed,
    softUsed,
    highlightTerms: used.slice(0, 60),
  };
}

/* ===========================================================
   Resume-strength (real, derived from actual field completeness —
   not a fabricated score; every input below is genuine saved data)
   =========================================================== */
export function computeStrength(doc) {
  const checks = [
    !!doc.name,
    !!doc.title,
    !!(doc.contact?.email && doc.contact?.phone),
    (doc.summary || "").trim().length >= 40,
    (doc.skills || []).length >= 3,
    (doc.sections || []).some(
      (s) => s.type === "experience" && (s.items || []).some((it) => (it.bullets || []).length > 0)
    ),
    (doc.sections || []).some((s) => s.type === "education" && (s.items || []).length > 0),
    (doc.sections || [])
      .filter((s) => s.type === "experience")
      .some((s) => (s.items || []).some((it) => (it.bullets || []).some((b) => /\d/.test(b)))),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
export function readinessLabel(strength) {
  if (strength >= 80) return "Strong";
  if (strength >= 50) return "On track";
  return "Getting started";
}

/* ===========================================================
   Export reward hook — anchored to the real export actions
   (called directly from the export handlers), not to DOM text
   or icon labels. Guards against duplicate awards from rapid
   double-invocation of the same handler.
   =========================================================== */
let lastAwardTs = 0;
export function awardResumeExport(format) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastAwardTs < 1500) return; // prevent duplicate awards from double-fires
  lastAwardTs = now;
  try {
    const payload = {
      action: "resume.export",
      rewards: { heart: 1 },
      scoreDelta: 5,
      meta: { surface: "ResumeBuilder", format },
    };
    if (window.shfCredit?.earn) {
      window.shfCredit.earn(payload);
    } else {
      window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail: payload }));
    }
    window.shToast?.("Exported: +1 ❤️ · +5 score");
  } catch {}
}
