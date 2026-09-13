import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AX3_AUTHORITY_BOUNDARIES,
  REPRESENTATION_SUPPORT,
  REPRESENTATION_TYPES,
  SOURCE_TYPES,
  SUPPORT_STATUS,
  TRANSFORMATION_STATUS,
  VALIDATION_STATUS,
} from "../src/system/accessibility/accessibilityContentEngine.js";

assert.equal(REPRESENTATION_TYPES.length, Object.keys(REPRESENTATION_SUPPORT).length, "each representation needs one support entry");
for (const type of REPRESENTATION_TYPES) {
  const entry = REPRESENTATION_SUPPORT[type];
  assert.ok(SUPPORT_STATUS.includes(entry.status), `${type} has invalid support status`);
  assert.ok(entry.sources.length > 0, `${type} needs source eligibility`);
  for (const source of entry.sources) assert.ok(SOURCE_TYPES.includes(source), `${type} references unknown source ${source}`);
}
assert.ok(TRANSFORMATION_STATUS.includes("STALE"));
assert.ok(VALIDATION_STATUS.includes("VERIFIED_ACCESSIBLE"));
assert.match(AX3_AUTHORITY_BOUNDARIES.permissionRule, /never more open/);
assert.match(AX3_AUTHORITY_BOUNDARIES.preferenceRule, /does not imply/);
for (const forbidden of ["Evidence", "Truth", "accommodation", "DGAL lifecycle", "signature"]) assert.ok(AX3_AUTHORITY_BOUNDARIES.forbiddenWrites.includes(forbidden));
const service = await readFile(new URL("../apps/shs-api/src/domain/accessibility-content/service/accessibility-content-service.ts", import.meta.url), "utf8");
const routes = await readFile(new URL("../apps/shs-api/src/domain/accessibility-content/api/routes.ts", import.meta.url), "utf8");
for (const marker of ["resolveSource", "requestRepresentation", "listRepresentations", "readRepresentation", "ReportFileStorage"]) assert.match(service, new RegExp(marker));
for (const marker of ["/accessibility/content/representations", "registerAccessibilityContentRoutes"]) assert.match(routes, new RegExp(marker.replaceAll("/", "\\/")));
assert.match(service, /sourceVersion/);
assert.match(service, /validationStatus/);
assert.match(service, /SOURCE_ACCESS_DENIED|DELIVERY_DENIED/);
console.log(`Accessibility content engine validation: PASS (${REPRESENTATION_TYPES.length} live representations; ${SOURCE_TYPES.length} source types)`);
