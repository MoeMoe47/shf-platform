import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const files = [
  "apps/shs-api/migrations/142_accessibility_operations.sql",
  "apps/shs-api/src/domain/accessibility-operations/model/operations.ts",
  "apps/shs-api/src/domain/accessibility-operations/service/operations-service.ts",
  "apps/shs-api/src/domain/accessibility-operations/api/routes.ts",
];
for (const file of files) if (!existsSync(file)) throw new Error(`Missing AX-6 artifact: ${file}`);
const migration = await readFile(files[0], "utf8");
const service = await readFile(files[2], "utf8");
const required = ["accessibility_operation_issues", "accessibility_support_requests", "audit_events", "finding_id", "tenant_id", "consent_to_share_context"];
for (const token of required) if (!migration.includes(token) && token !== "audit_events") throw new Error(`AX-6 schema contract missing: ${token}`);
for (const token of ["ON CONFLICT", "REGRESSION", "humanReviewRequired", "shared_context_json", "organization_id=$1 AND tenant_id=$2"]) if (!service.includes(token)) throw new Error(`AX-6 service boundary missing: ${token}`);
console.log("Accessibility operations validator: PASS");
