// SHF Lesson + Assignment + Curriculum — Phase 4.5A/4.5B.
//
// A minimal, server-safe reader for the existing SHF lesson JSON under
// src/content/lessons/*-student/*.json. This deliberately does NOT reuse
// or modify studentLoader.js (browser/Vite-only, uses import.meta.glob —
// not callable from Node) and does not duplicate the old importer's
// *-student folder resolution logic (resolveContentRoot is imported and
// reused, not copied, from curriculum-import-service.ts).
//
// Preserves the FULL original JSON verbatim in each lesson's `raw` field
// (Steps 22-23 of both phases: never discard source content merely
// because the relational catalog has no dedicated column for it yet).
//
// Phase 4.5B upgrade: real SHF curriculum is NOT flat. This module now
// groups lessons into real Units using actual, present-in-the-source
// evidence — never an invented instructional structure. Two independent
// grouping signals are used, in priority order, decided PER SOURCE
// (documented per branch below), plus one honest fallback:
//
//   1. `curriculum` field (Data Center): every Data Center lesson file
//      carries an explicit `curriculum` string. Grouping by this field's
//      exact value is what correctly SPLITS the `data-center-
//      specialization-12-student` folder into its six real specialization
//      tracks (electrical/ai-cloud/cybersecurity/mechanical-hvac/
//      networking-fiber/technical-operations — each has its own distinct
//      `curriculum` value despite sharing one folder) while still
//      correctly merging each of the other six DC folders into one unit
//      apiece (their lessons all share one `curriculum` value each).
//      `data-center-specialization-11-student`'s 58 lessons all share a
//      SINGLE `curriculum` value even though their nextSlug chains reveal
//      six disjoint narrative threads — those threads are NOT split into
//      separate units, because doing so would assert an instructional
//      grouping the source's own authoritative curriculum-identifier
//      field does not itself assert. The chain topology is used only for
//      lesson ORDERING within that one unit (see below), never for unit
//      splitting.
//
//   2. Title-embedded unit numeral (ASL): ASL lesson files carry no
//      `curriculum` field, but almost every title follows a real,
//      consistent "ASL {unit}.{lessonInUnit}" pattern (e.g. "ASL 3.4 —
//      Requests & Offers"), and capstone titles explicitly name their
//      unit ("ASL Unit 3 Capstone — ..."). This is genuine source
//      evidence, not an invented scheme — verified against all 72 real
//      files before this code was written (see the Phase 4.5B report,
//      section 4). One file (student.asl-64.json, title "ASL 64 —
//      Timeline Planning & Resource Sharing") matches neither pattern —
//      it is honestly placed in a separate "ungrouped" unit rather than
//      guessed into a real one.
//
//   3. Fallback: if NO lesson in the whole source carries either signal,
//      every lesson falls into one flat "all-lessons" unit — this is
//      Phase 4.5A's original behavior, preserved exactly for any source
//      (including this suite's own synthetic test fixtures) that carries
//      no real grouping evidence at all.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { resolveContentRoot, listImportableCurricula } from "./curriculum-import-service.js";
import { canonicalJsonStringify, sanitizeStableKey } from "./curriculum-catalog-service.js";

export { listImportableCurricula };

export class SourceAdapterError extends Error {
  constructor(message: string) { super(message); this.name = "SourceAdapterError"; }
}

// Phase 4.5D (Step 2-3): a lesson's real, evidence-backed media/game
// references, extracted for RESOURCE/ARCADE_LINK candidate generation.
// Evidence (see the Phase 4.5D report): ASL's `sections[].media` (56/72
// files, shapes {src,alt,caption} and rarely {type,url}) and top-level
// `games[]` (64/72 files, shape {id,title,route,estMinutes,xp,outcomes}).
// Zero occurrences of either in any real Data Center file — confirmed by
// direct grep, not assumed.
export interface StructuredSourceMedia {
  sourceReference: string;   // e.g. "asl-student/student.asl-01.json#sections[2].media"
  stableKey: string;         // sanitizeStableKey(src) — content-derived, deterministic identity (Step 5)
  title: string;
  description: string | null; // caption, when present — never fabricated
  externalUrl: string;       // media.src (or media.url for the rare {type,url} shape)
  sequence: number;
  sourceHash: string;
  accessibilityWarnings: string[]; // e.g. "MISSING_ALT_TEXT" — honest, never fabricated copy (Step 11)
  raw: Record<string, unknown>;
}

export interface StructuredSourceArcadeReference {
  sourceReference: string; // e.g. "asl-student/student.asl-02.json#games[0]"
  gameId: string;          // games[].id — the only deterministic matching key real source data provides (Step 22)
  title: string;
  sequence: number;
  sourceHash: string;
  raw: Record<string, unknown>;
}

function extractMediaResources(raw: Record<string, unknown>, sourceReference: string): StructuredSourceMedia[] {
  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  const out: StructuredSourceMedia[] = [];
  sections.forEach((section: any, index: number) => {
    const media = section && typeof section === "object" ? section.media : null;
    if (!media || typeof media !== "object") return;
    const src = typeof media.src === "string" && media.src ? media.src : (typeof media.url === "string" && media.url ? media.url : null);
    if (!src) return;
    const caption = typeof media.caption === "string" && media.caption.trim() ? media.caption.trim() : null;
    const alt = typeof media.alt === "string" && media.alt.trim() ? media.alt.trim() : null;
    const warnings: string[] = [];
    if (!alt) warnings.push("MISSING_ALT_TEXT");
    if (!caption) warnings.push("MISSING_CAPTION");
    out.push({
      sourceReference: `${sourceReference}#sections[${index}].media`,
      stableKey: sanitizeStableKey(src),
      title: caption || alt || `Media ${index + 1}`,
      description: caption,
      externalUrl: src,
      sequence: index + 1,
      sourceHash: sourceHashOf(media),
      accessibilityWarnings: warnings,
      raw: media,
    });
  });
  return out;
}

function extractArcadeReferences(raw: Record<string, unknown>, sourceReference: string): StructuredSourceArcadeReference[] {
  const games = Array.isArray(raw.games) ? raw.games : [];
  const out: StructuredSourceArcadeReference[] = [];
  games.forEach((game: any, index: number) => {
    if (!game || typeof game !== "object" || typeof game.id !== "string" || !game.id) return;
    out.push({
      sourceReference: `${sourceReference}#games[${index}]`,
      gameId: game.id,
      title: typeof game.title === "string" && game.title.trim() ? game.title : game.id,
      sequence: index + 1,
      sourceHash: sourceHashOf(game),
      raw: game,
    });
  });
  return out;
}

export interface StructuredSourceLesson {
  sourceReference: string; // e.g. "asl-student/student.asl-01.json"
  stableKey: string;       // e.g. "student.asl-01" — the exact filename identity, UNCHANGED across re-import (Step 22)
  title: string;
  sequence: number;        // position within its unit
  sourceHash: string;      // SHA-256 of the canonicalized raw payload (Step 9)
  raw: Record<string, unknown>; // full original lesson JSON, verbatim
  resources: StructuredSourceMedia[];
  arcadeReferences: StructuredSourceArcadeReference[];
}

export interface StructuredSourceUnit {
  stableKey: string;
  title: string;
  sequence: number;        // position within the course
  sourceReference: string; // real folder(s) this unit's lessons came from
  lessons: StructuredSourceLesson[];
  sourceHash: string;
}

export interface StructuredCurriculumSource {
  sourceKey: string;
  courseStableKey: string;
  courseTitle: string;
  units: StructuredSourceUnit[];
  sourceHash: string;
}

// Explicit, evidence-based registry of multi-folder curricula (Step 4).
// "data-center" is the only real aggregate today — it combines all seven
// real data-center-*-student folders into the ONE Course a genuine
// Data Center migration needs, instead of leaving it as seven unrelated
// single-folder courses the way a naive per-folder import would.
const AGGREGATE_PACKAGES: Record<string, string[]> = {
  "data-center": [
    "data-center-foundations",
    "data-center-systems-7",
    "data-center-design-8",
    "data-center-technical-foundations-9",
    "data-center-reliable-operations-10",
    "data-center-specialization-11",
    "data-center-specialization-12",
  ],
};

interface RawFile {
  folder: string;   // e.g. "asl-student"
  filename: string; // e.g. "student.asl-01.json"
  raw: Record<string, unknown>;
}

function readFolder(root: string, folderKey: string): RawFile[] {
  const folderName = `${folderKey}-student`;
  const dir = path.join(root, folderName);
  if (!fs.existsSync(dir)) throw new SourceAdapterError(`no static content folder for source key "${folderKey}"`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  return files.map((filename) => {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, filename), "utf8"));
    } catch (err: any) {
      throw new SourceAdapterError(`malformed JSON in ${folderName}/${filename}: ${err?.message || "parse error"}`);
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new SourceAdapterError(`${folderName}/${filename} does not contain a JSON object`);
    }
    return { folder: folderName, filename, raw: raw as Record<string, unknown> };
  });
}

// Title-embedded "ASL {unit}.{lesson}" pattern — generalized beyond the
// literal word "ASL" so any similarly-authored curriculum benefits, but
// still requires a real decimal pairing, never a bare number (Step 3:
// honest evidence, not invention — see student.asl-64.json's title "ASL
// 64", which deliberately does NOT match this and is not force-fit).
const UNIT_DOT_LESSON = /\b([A-Za-z]+)\s+(\d+)\.(\d+)\b/;
const UNIT_WORD = /\bUnit\s+(\d+)\b/i;

function parseTitleUnit(title: string): { unitNumber: number; lessonNumber: number | null } | null {
  const dotMatch = UNIT_DOT_LESSON.exec(title);
  if (dotMatch) return { unitNumber: Number(dotMatch[2]), lessonNumber: Number(dotMatch[3]) };
  const wordMatch = UNIT_WORD.exec(title);
  if (wordMatch) return { unitNumber: Number(wordMatch[1]), lessonNumber: null };
  return null;
}

function sourceHashOf(raw: Record<string, unknown>): string {
  return createHash("sha256").update(canonicalJsonStringify(raw)).digest("hex");
}

function humanizeGroupKey(key: string): string {
  return key.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
}

// Reconstructs order within one group via its nextSlug chain(s), when
// every lesson in the group has a usable `slug` and no nextSlug points
// outside the group (Data Center: reliable). Returns null — never a
// partial/guessed chain — if the data doesn't cleanly support it, so the
// caller can fall back to a different, still-deterministic signal
// (Step 6: never silently depend on unreliable data).
function reconstructChainOrder(files: RawFile[]): RawFile[] | null {
  const bySlug = new Map<string, RawFile>();
  for (const f of files) {
    const slug = f.raw.slug;
    if (typeof slug !== "string" || !slug) return null;
    if (bySlug.has(slug)) return null; // duplicate identity makes chain order ambiguous
    bySlug.set(slug, f);
  }
  const nextOf = new Map<string, string | null>();
  for (const f of files) {
    const next = f.raw.nextSlug;
    if (next !== null && next !== undefined) {
      if (typeof next !== "string" || (!bySlug.has(next))) return null; // dangling reference — data isn't reliable enough
      nextOf.set(f.raw.slug as string, next);
    } else {
      nextOf.set(f.raw.slug as string, null);
    }
  }
  const targets = new Set([...nextOf.values()].filter((v): v is string => v !== null));
  const heads = [...bySlug.keys()].filter((slug) => !targets.has(slug)).sort();
  if (!heads.length) return null; // pure cycle, no valid start — bail to fallback

  const ordered: RawFile[] = [];
  const seen = new Set<string>();
  for (const head of heads) {
    let cur: string | null = head;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      ordered.push(bySlug.get(cur)!);
      cur = nextOf.get(cur) ?? null;
    }
  }
  if (ordered.length !== files.length) return null; // chain didn't cover every lesson — unreliable, bail
  return ordered;
}

function orderWithinGroup(files: RawFile[]): RawFile[] {
  const chainOrdered = reconstructChainOrder(files);
  if (chainOrdered) return chainOrdered;

  const withTitleNumber = files.every((f) => parseTitleUnit(String(f.raw.title || ""))?.lessonNumber != null || parseTitleUnit(String(f.raw.title || ""))?.unitNumber != null);
  if (withTitleNumber) {
    return [...files].sort((a, b) => {
      const pa = parseTitleUnit(String(a.raw.title || ""));
      const pb = parseTitleUnit(String(b.raw.title || ""));
      const la = pa?.lessonNumber ?? Number.POSITIVE_INFINITY;
      const lb = pb?.lessonNumber ?? Number.POSITIVE_INFINITY;
      if (la !== lb) return la - lb;
      return a.filename.localeCompare(b.filename);
    });
  }

  // Final fallback: an explicit, deterministic sort — not raw filesystem
  // enumeration order (Step 6 explicitly forbids depending on that).
  return [...files].sort((a, b) => a.filename.localeCompare(b.filename));
}

export function readStructuredSource(sourceKey: string): StructuredCurriculumSource {
  const root = resolveContentRoot();
  if (!root) throw new SourceAdapterError("static lesson content directory not found");

  const folderKeys = AGGREGATE_PACKAGES[sourceKey] ?? [sourceKey];
  const allFiles: RawFile[] = folderKeys.flatMap((key) => readFolder(root, key));
  const sourceStableKeys = new Set<string>();
  for (const file of allFiles) {
    const stableKey = file.filename.replace(/\.json$/, "");
    if (sourceStableKeys.has(stableKey)) throw new SourceAdapterError(`duplicate lesson stable key "${stableKey}" in source "${sourceKey}"`);
    sourceStableKeys.add(stableKey);
  }

  // ---------------- Grouping (unit assignment) ----------------
  interface GroupInfo { key: string; sourceKind: "curriculum-field" | "title-unit" | "flat"; folders: Set<string>; minGrade: number | null; unitNumber: number | null; files: RawFile[] }
  const groups = new Map<string, GroupInfo>();
  let anySignalFound = false;

  for (const file of allFiles) {
    const curriculumField = file.raw.curriculum;
    const titleParsed = parseTitleUnit(String(file.raw.title || ""));
    let key: string;
    let sourceKind: GroupInfo["sourceKind"];
    let unitNumber: number | null = null;
    let minGrade: number | null = null;

    if (typeof curriculumField === "string" && curriculumField.trim()) {
      key = curriculumField.trim();
      sourceKind = "curriculum-field";
      const gradeBand = file.raw.gradeBand as { minGrade?: unknown } | undefined;
      minGrade = gradeBand && typeof gradeBand.minGrade === "number" ? gradeBand.minGrade : null;
      anySignalFound = true;
    } else if (titleParsed) {
      key = `unit-${String(titleParsed.unitNumber).padStart(2, "0")}`;
      sourceKind = "title-unit";
      unitNumber = titleParsed.unitNumber;
      anySignalFound = true;
    } else {
      key = "__pending__"; // resolved below once we know whether ANY signal exists anywhere in this source
      sourceKind = "flat";
    }

    const existing = groups.get(key);
    if (existing) {
      existing.files.push(file);
      existing.folders.add(file.folder);
    } else {
      groups.set(key, { key, sourceKind, folders: new Set([file.folder]), minGrade, unitNumber, files: [file] });
    }
  }

  // Resolve the "__pending__" bucket: if the WHOLE source has no grouping
  // signal anywhere, it becomes the one flat "all-lessons" unit (Phase
  // 4.5A's exact original behavior). If other lessons DID find real
  // groups, the ungrouped remainder is honestly labeled "ungrouped"
  // rather than merged into a real unit's name.
  const pending = groups.get("__pending__");
  if (pending) {
    groups.delete("__pending__");
    const finalKey = anySignalFound ? "ungrouped" : "all-lessons";
    const existing = groups.get(finalKey);
    if (existing) {
      existing.files.push(...pending.files);
      pending.folders.forEach((f) => existing.folders.add(f));
    } else {
      groups.set(finalKey, { ...pending, key: finalKey });
    }
  }

  // ---------------- Unit sequencing ----------------
  const groupList = [...groups.values()];
  const sortKey = (g: GroupInfo): [number, number, string] => {
    if (g.key === "all-lessons" || g.key === "ungrouped") return [2, 0, g.key];
    if (g.sourceKind === "curriculum-field" && g.minGrade !== null) return [0, g.minGrade, g.key];
    if (g.sourceKind === "title-unit" && g.unitNumber !== null) return [0, g.unitNumber, g.key];
    return [1, 0, g.key];
  };
  groupList.sort((a, b) => {
    const [ta, na, ka] = sortKey(a);
    const [tb, nb, kb] = sortKey(b);
    if (ta !== tb) return ta - tb;
    if (na !== nb) return na - nb;
    return ka.localeCompare(kb);
  });

  const units: StructuredSourceUnit[] = groupList.map((group, unitIndex) => {
    const ordered = orderWithinGroup(group.files);
    const lessons: StructuredSourceLesson[] = ordered.map((file, lessonIndex) => {
      const stableKey = file.filename.replace(/\.json$/, "");
      const sourceReference = `${file.folder}/${file.filename}`;
      return {
        sourceReference,
        stableKey,
        title: typeof file.raw.title === "string" && file.raw.title.trim() ? file.raw.title : stableKey,
        sequence: lessonIndex + 1,
        sourceHash: sourceHashOf(file.raw),
        raw: file.raw,
        resources: extractMediaResources(file.raw, sourceReference),
        arcadeReferences: extractArcadeReferences(file.raw, sourceReference),
      };
    });
    const title = group.key === "all-lessons" ? "All Lessons"
      : group.key === "ungrouped" ? "Ungrouped Lessons"
      : group.sourceKind === "title-unit" ? `Unit ${group.unitNumber}`
      : humanizeGroupKey(group.key);
    const unit = {
      stableKey: group.key,
      title,
      sequence: unitIndex + 1,
      sourceReference: [...group.folders].sort().join(","),
      lessons,
      sourceHash: sourceHashOf({ stableKey: group.key, title, lessons: lessons.map((lesson) => ({ stableKey: lesson.stableKey, raw: lesson.raw })) }),
    };
    return unit;
  });

  return {
    sourceKey,
    courseStableKey: sourceKey.toLowerCase(),
    courseTitle: `${humanizeGroupKey(sourceKey)} Curriculum`,
    units,
    sourceHash: sourceHashOf({ sourceKey, units: units.map((unit) => ({ stableKey: unit.stableKey, sourceHash: unit.sourceHash })) }),
  };
}
