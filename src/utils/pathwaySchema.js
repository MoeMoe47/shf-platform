// src/utils/pathwaySchema.js
// Validation & shapes for Career Pathways, Plans, Funding Plans, and Collaboration.
// Requires: npm i zod
import { z } from "zod";

/* --------------------------------------------
 * Small helpers / coercions
 * ------------------------------------------ */
const nonneg = z.coerce.number().min(0, "must be ≥ 0");
const percent01 = z.coerce.number().min(0).max(100);
const grPct = z.coerce.number().min(-100).max(200);
const urlOpt = z.string().url().optional();

/* --------------------------------------------
 * Sub-schemas
 * ------------------------------------------ */
const moduleSchema = z
  .object({
    slug: z.string().min(1, "module.slug required"),
    title: z.string().min(1).optional().default(""),
    minutes: nonneg.optional().default(0),
  })
  .passthrough();

const firstCredentialSchema = z
  .object({
    name: z.string().min(1, "firstCredential.name required"),
    examCode: z.string().optional(),
  })
  .passthrough();

const partnerSchema = z
  .object({
    name: z.string().min(1, "partner.name required"),
    url: urlOpt,
  })
  .passthrough();

const jobsMetaSchema = z
  .object({
    medianStart: nonneg.optional().default(0),
    openingsIndex: nonneg.optional().default(0),
    localEmployers: z.array(z.string()).default([]),
  })
  .passthrough();

/* --------------------------------------------
 * Pathway schema (canonical shape used by UI)
 * NOTE: .passthrough() must come BEFORE .transform()
 * ------------------------------------------ */
export const pathwaySchema = z
  .object({
    // IDs & labels
    id: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    title: z.string().min(1, "title required"),
    cluster: z.string().min(1).default("General"),

    // Time & cost
    estWeeks: nonneg.default(0),
    estCost: nonneg.default(0),
    years: z.coerce.number().min(0).max(50).optional(),

    // Income / growth (optional)
    avgIncome: nonneg.optional(),
    annualGrowthPct: grPct.optional(),

    // Curriculum
    modules: z.array(moduleSchema).default([]),
    firstCredential: firstCredentialSchema.optional(),

    // Funding & partners
    fundingHints: z.array(z.string()).default([]),
    partners: z.array(partnerSchema).default([]),

    // Jobs & demand
    jobsMeta: jobsMetaSchema.default({}),
    demand: z.union([z.string(), z.number(), z.boolean()]).optional(),

    // Progress / UX sugar
    progressPct: percent01.optional(),
    skills: z.array(z.string()).default([]),
    badges: z.array(z.string()).default([]),

    // Helpful for CTAs
    nextCohortDate: z.string().optional(),
  })
  .passthrough()
  .transform((p) => {
    const id = p.id || p.slug || slugify(p.title);
    return { ...p, id };
  });

/** Array of Pathways */
export const pathwayArraySchema = z.array(pathwaySchema);

/** Helper: Accepts {pathways:[]}|{data:[]}|[] and returns parsed array */
export function validatePathways(input) {
  const arr = Array.isArray(input)
    ? input
    : Array.isArray(input?.pathways)
    ? input.pathways
    : Array.isArray(input?.data)
    ? input.data
    : [];
  return pathwayArraySchema.parse(arr);
}

/* --------------------------------------------
 * Plan / Funding / Collaboration
 * ------------------------------------------ */
const planStepSchema = z
  .object({
    type: z.enum(["module", "exam", "apply", "enroll", "milestone", "other"]).default("other"),
    title: z.string().min(1),
    due: z.string().optional(),
  })
  .passthrough();

export const planSchema = z
  .object({
    pathwayId: z.string().min(1),
    strategy: z.enum(["fastest", "least_cost", "highest_placement"]),
    estWeeks: nonneg,
    netCostAfterAid: nonneg.optional().default(0),
    steps: z.array(planStepSchema).default([]),
    nextCohortDate: z.string().optional(),
  })
  .passthrough();

const fundingContactSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    url: urlOpt,
  })
  .partial()
  .passthrough();

const fundingStepSchema = z
  .object({
    program: z.string().min(1),
    action: z.string().min(1),
    docs: z.array(z.string()).default([]),
    contact: fundingContactSchema.optional(),
  })
  .passthrough();

export const fundingPlanSchema = z
  .object({
    steps: z.array(fundingStepSchema).default([]),
    estCoverage: z.enum(["partial", "full"]).default("partial"),
  })
  .passthrough();

const noteSchema = z.object({
  ts: z.coerce.number(),
  authorRole: z.enum(["student", "parent", "coach", "instructor", "admin"]).optional(),
  text: z.string().min(1),
});

const taskSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  assignee: z.enum(["student", "parent", "coach", "instructor"]).optional(),
  done: z.coerce.boolean().default(false),
  ts: z.coerce.number().optional(),
});

export const collabSchema = z
  .object({
    notes: z.array(noteSchema).default([]),
    tasks: z.array(taskSchema).default([]),
    coachBookings: z.array(z.unknown()).default([]),
  })
  .passthrough();

/* --------------------------------------------
 * Debug helper (optional)
 * ------------------------------------------ */
export function explainZodError(err) {
  if (!err?.issues) return "Invalid data";
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
}

/* --------------------------------------------
 * Local util
 * ------------------------------------------ */
function slugify(s = "") {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Default export for legacy imports
export default pathwaySchema;
