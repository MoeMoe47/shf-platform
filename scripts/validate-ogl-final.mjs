import { OGL_ORIENTATION_CONTRACTS } from "../src/system/orientation/orientationRegistry.js";
import { OGL_ROLLOUT_COVERAGE } from "../src/system/orientation/rolloutCoverage.js";
import { readFile } from "node:fs/promises";

const active = OGL_ORIENTATION_CONTRACTS.filter((item) => item.lifecycle === "ACTIVE");
const errors = [];
if (!active.length) errors.push("no active canonical orientation contracts");
if (OGL_ROLLOUT_COVERAGE.some((item) => ["PARTIAL", "MISSING"].includes(item.status))) errors.push("rollout contains partial or missing status");
if (active.some((item) => item.capabilities?.guidedTour && !item.accessibility?.nonTourAlternative)) errors.push("critical active tour is missing an accessible alternative");
const migration = await readFile(new URL("../apps/shs-api/migrations/140_ogl_authoring_analytics.sql", import.meta.url), "utf8");
if (!migration.includes("ogl_orientation_versions") || !migration.includes("ogl_telemetry_events")) errors.push("OGL-6 migration objects are missing");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`OGL final validation OK (${active.length} active contracts; migration 140 present; no partial/missing rollout entries).`);
