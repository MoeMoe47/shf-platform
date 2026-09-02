import assert from "node:assert/strict";
import test from "node:test";
import { canView, getOperationalOverview, isAdmin } from "../src/domain/operations/operational-service.ts";

const instructor = {
  user_id: "instructor-a", organization_id: "org-a", active_organization_id: "org-a",
  tenant_id: "tenant:org-a", roles: ["instructor"], permissions: ["cohort.view", "assignment.view"],
};

test("operational access reuses existing staff/admin permissions", () => {
  assert.equal(canView(instructor), true);
  assert.equal(isAdmin({ ...instructor, roles: ["org_admin"] }), true);
  assert.equal(isAdmin(instructor), false);
  assert.equal(canView({ ...instructor, permissions: [] }), false);
});

test("operational overview rejects mismatched organization context before querying", async () => {
  await assert.rejects(
    () => getOperationalOverview({ ...instructor, tenant_id: "tenant:org-b" } as any),
    (error: any) => error.statusCode === 403 && error.message === "ORG_CONTEXT_REQUIRED",
  );
});
