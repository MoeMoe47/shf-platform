// SHF Lesson + Assignment + Curriculum — Phase 4.6.
//
// Deterministic-first structure detection (Step 17) — no AI is used or
// required here (Step 42: the pipeline must work without AI). Signals
// used, in order of trust:
//   1. Real heading markup (DOCX/Markdown heading levels) — HIGH
//      confidence, since it comes from the document's own semantic
//      structure, not a guess.
//   2. Explicit "Chapter/Unit/Lesson N" text patterns (PDF) — HIGH
//      confidence, an explicit authorial signal.
//   3. Bare numbered headings ("3.2 Something", "3 Something") — MEDIUM
//      confidence, a plausible but weaker signal.
//   4. No heading signal at all — LOW confidence, content is grouped by
//      size only (word-count / page-count), never guessed into a fake
//      hierarchy (Step 19: "do not pretend ambiguous headings are
//      authoritative").
//
// This module NEVER creates Course/Unit/Lesson catalog rows (Step 20) —
// it only produces a SourceStructure, a proposal the mapping engine
// (raw-document-import-service.ts) later turns into ordinary Import
// Candidates, same as every other source this domain already supports.
import type { ExtractedBlock, ExtractedDocument } from "./document-extraction-service.js";

export type StructureConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface SourceStructureLessonNode {
  nodeId: string;
  kind: "LESSON";
  title: string;
  confidence: StructureConfidence;
  confidenceReason: string;
  blockIds: string[];
  pageRange: { start: number; end: number } | null;
}

export interface SourceStructureUnitNode {
  nodeId: string;
  kind: "UNIT";
  title: string;
  confidence: StructureConfidence;
  confidenceReason: string;
  blockIds: string[];
  pageRange: { start: number; end: number } | null;
  lessons: SourceStructureLessonNode[];
}

export interface SourceStructure {
  courseTitle: string;
  units: SourceStructureUnitNode[];
  overallConfidence: StructureConfidence;
}

const TARGET_WORDS_PER_LESSON = 300;
const MAX_WORDS_PER_LESSON = 1200;

function wordCount(blocks: ExtractedBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);
}

function pageRangeOf(blocks: ExtractedBlock[]): { start: number; end: number } | null {
  const pages = blocks.map((b) => b.pageNumber).filter((p): p is number => typeof p === "number");
  if (!pages.length) return null;
  return { start: Math.min(...pages), end: Math.max(...pages) };
}

function isKeywordHeading(text: string): boolean {
  return /^\s*(chapter|unit|lesson)\s+\d+\b/i.test(text);
}

// Deterministic by construction. Two forms:
//  - a NAMED node (real heading text) derives its id from that text —
//    content-based, so a genuine re-import of a REVISED document (Step
//    46-48) still recognizes "Lesson 1: Deep Dive" as the same lesson
//    even though earlier content shifted its position in the document
//    and therefore its block ids (verified live: block-id-based ids
//    broke re-import continuity the moment preceding content changed).
//  - an UNNAMED/synthetic node (size-chunked, no heading of its own)
//    has no semantic anchor to key off, so it falls back to its first
//    block id — a documented, honest limitation: chunked lessons have
//    weaker re-import continuity than real headings do.
function namedNodeId(prefix: string, headingText: string, parentText?: string): string {
  const scoped = parentText ? `${parentText}-${headingText}` : headingText;
  return `${prefix}-${scoped.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "untitled"}`;
}
function chunkedNodeId(prefix: string, blockIds: string[]): string {
  return `${prefix}-chunk-${blockIds[0] ?? "empty"}`;
}

// Chunks a flat run of non-heading blocks into size-bounded synthetic
// lessons — used both for CASE B (one heading level: unit body needs
// lesson-sized pieces) and CASE C (no headings at all). Never produces
// one lesson spanning the whole document nor one lesson per paragraph
// (Step 22): boundaries are chosen at the nearest paragraph break once
// the running word count crosses TARGET_WORDS_PER_LESSON, and forced
// once MAX_WORDS_PER_LESSON is reached even mid-run.
function chunkBySize(blocks: ExtractedBlock[], titlePrefix: string, reason: string, confidence: StructureConfidence): SourceStructureLessonNode[] {
  if (!blocks.length) return [];
  const lessons: SourceStructureLessonNode[] = [];
  let current: ExtractedBlock[] = [];
  let currentWords = 0;
  const flush = () => {
    if (!current.length) return;
    const blockIds = current.map((b) => b.blockId);
    lessons.push({
      nodeId: chunkedNodeId("lesson", blockIds), kind: "LESSON",
      title: `${titlePrefix} ${lessons.length + 1}`,
      confidence, confidenceReason: reason,
      blockIds,
      pageRange: pageRangeOf(current),
    });
    current = [];
    currentWords = 0;
  };
  for (const block of blocks) {
    current.push(block);
    currentWords += block.text.split(/\s+/).filter(Boolean).length;
    if (currentWords >= MAX_WORDS_PER_LESSON || (currentWords >= TARGET_WORDS_PER_LESSON && block.type !== "LIST_ITEM")) flush();
  }
  flush();
  return lessons;
}

export function detectStructure(doc: ExtractedDocument, fallbackTitle: string): SourceStructure {
  const headings = doc.blocks.filter((b) => b.type === "HEADING" && typeof b.headingLevel === "number");
  const allLevels = [...new Set(headings.map((h) => h.headingLevel!))].sort((a, b) => a - b);
  const courseTitle = doc.title || fallbackTitle;

  // A heading level used exactly once behaves like a document TITLE
  // (already captured in courseTitle above), not a repeating structural
  // boundary — using it as the unit level would produce one confusing
  // "unit" whose title duplicates the course title (observed live with a
  // single top-level H1 document title followed by repeating H2
  // sections). Only levels that recur are trusted as real boundaries;
  // singleton levels are used only if NO level recurs at all.
  const levelCounts = new Map<number, number>();
  for (const h of headings) levelCounts.set(h.headingLevel!, (levelCounts.get(h.headingLevel!) ?? 0) + 1);
  const recurringLevels = allLevels.filter((l) => (levelCounts.get(l) ?? 0) >= 2);
  const distinctLevels = recurringLevels.length > 0 ? recurringLevels : allLevels;

  if (distinctLevels.length === 0) {
    // CASE C — no structural signal at all (Step 19: honest LOW).
    const lessons = chunkBySize(doc.blocks, "Section", "no heading structure was detected in this source; grouped by content size only", "LOW");
    const allBlockIds = doc.blocks.map((b) => b.blockId);
    const unit: SourceStructureUnitNode = {
      nodeId: namedNodeId("unit", "All Content"), kind: "UNIT", title: "All Content",
      confidence: "LOW", confidenceReason: "no heading structure was detected; a single unit was used to hold all content",
      blockIds: allBlockIds, pageRange: pageRangeOf(doc.blocks), lessons,
    };
    return { courseTitle, units: [unit], overallConfidence: "LOW" };
  }

  const unitLevel = distinctLevels[0];
  const lessonLevel = distinctLevels.length > 1 ? distinctLevels[1] : null;

  // Split the flat block list at unitLevel heading boundaries.
  const unitRuns: Array<{ heading: ExtractedBlock | null; blocks: ExtractedBlock[] }> = [];
  let currentRun: ExtractedBlock[] = [];
  let currentHeading: ExtractedBlock | null = null;
  for (const block of doc.blocks) {
    if (block.type === "HEADING" && block.headingLevel === unitLevel) {
      unitRuns.push({ heading: currentHeading, blocks: currentRun });
      currentHeading = block;
      currentRun = [];
    } else {
      currentRun.push(block);
    }
  }
  unitRuns.push({ heading: currentHeading, blocks: currentRun });
  const namedUnitRuns = unitRuns.filter((r) => r.heading !== null);

  let anyHigh = false;
  let anyMedium = false;
  const units: SourceStructureUnitNode[] = namedUnitRuns.map((run, unitIndex) => {
    const heading = run.heading!;
    const unitConfidence: StructureConfidence = isKeywordHeading(heading.text) ? "HIGH" : "MEDIUM";
    if (unitConfidence === "HIGH") anyHigh = true; else anyMedium = true;
    const unitReason = unitConfidence === "HIGH"
      ? `heading "${heading.text}" matched an explicit structural keyword`
      : `heading level ${unitLevel} was used consistently but without an explicit Chapter/Unit keyword`;

    let lessons: SourceStructureLessonNode[];
    if (lessonLevel !== null) {
      const lessonRuns: Array<{ heading: ExtractedBlock | null; blocks: ExtractedBlock[] }> = [];
      let lCurrent: ExtractedBlock[] = [];
      let lHeading: ExtractedBlock | null = null;
      for (const block of run.blocks) {
        if (block.type === "HEADING" && block.headingLevel === lessonLevel) {
          lessonRuns.push({ heading: lHeading, blocks: lCurrent });
          lHeading = block;
          lCurrent = [];
        } else {
          lCurrent.push(block);
        }
      }
      lessonRuns.push({ heading: lHeading, blocks: lCurrent });
      const namedLessonRuns = lessonRuns.filter((r) => r.heading !== null);
      if (namedLessonRuns.length) {
        lessons = namedLessonRuns.map((lRun) => {
          const lConfidence: StructureConfidence = isKeywordHeading(lRun.heading!.text) ? "HIGH" : "MEDIUM";
          return {
            nodeId: namedNodeId("lesson", lRun.heading!.text, heading.text), kind: "LESSON", title: lRun.heading!.text,
            confidence: lConfidence,
            confidenceReason: lConfidence === "HIGH" ? `heading "${lRun.heading!.text}" matched an explicit structural keyword` : `heading level ${lessonLevel} was used consistently but without an explicit Lesson keyword`,
            blockIds: lRun.blocks.map((b) => b.blockId), pageRange: pageRangeOf(lRun.blocks),
          };
        });
      } else {
        // The unit's body never used the deeper heading level at all — fall back to size chunking within this unit.
        lessons = chunkBySize(run.blocks, `${heading.text} — Part`, `unit body did not use heading level ${lessonLevel}; grouped by content size only`, "MEDIUM");
      }
    } else {
      lessons = chunkBySize(run.blocks, `${heading.text} — Part`, "only one heading level exists in this source; the unit body was grouped by content size only", "MEDIUM");
    }

    return {
      nodeId: namedNodeId("unit", heading.text), kind: "UNIT", title: heading.text,
      confidence: unitConfidence, confidenceReason: unitReason,
      blockIds: [heading, ...run.blocks].map((b) => b.blockId),
      pageRange: pageRangeOf([heading, ...run.blocks]),
      lessons,
    };
  });

  // Any content before the first recognized unit heading is preserved,
  // never dropped (Step 20/48's spirit: nothing that exists in the
  // source silently disappears from the proposal).
  const preamble = unitRuns[0]?.heading === null ? unitRuns[0].blocks : [];
  if (preamble.length && wordCount(preamble) > 20) {
    const preambleBlockIds = preamble.map((b) => b.blockId);
    units.unshift({
      nodeId: namedNodeId("unit", "Preamble"), kind: "UNIT", title: "Preamble",
      confidence: "LOW", confidenceReason: "content appeared before the first detected heading and has no heading of its own",
      blockIds: preambleBlockIds, pageRange: pageRangeOf(preamble),
      lessons: chunkBySize(preamble, "Preamble — Part", "ungrouped preamble content; grouped by content size only", "LOW"),
    });
  }

  const overallConfidence: StructureConfidence = anyHigh && !anyMedium ? "HIGH" : anyMedium || anyHigh ? "MEDIUM" : "LOW";
  return { courseTitle, units, overallConfidence };
}
