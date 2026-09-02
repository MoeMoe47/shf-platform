import test from "node:test";
import assert from "node:assert/strict";
import { groupStudioResources, normalizeStudioResources } from "../src/lib/studio/resources.js";
import { buildPacketDeliverableItems, buildPacketRequirementItems } from "../src/lib/studio/buildPacket.js";
import { toStudioCompanionContext } from "../src/pages/studio/experience.js";

test("canonical assignment resources are normalized without adding authority", () => {
  const data = { projectId: "project-a", resources: [{ id: "resource-a", title: "Build guide", type: "DOCUMENT", description: "Use this guide.", href: "https://example.test/guide", origin: "ASSIGNMENT", sourceLabel: "From your assignment" }] };
  const resources = normalizeStudioResources(data);
  assert.deepEqual(resources[0], data.resources[0]);
  assert.equal("completed" in resources[0], false);
  assert.equal("required" in resources[0], false);
});

test("independent projects do not inherit assignment resources", () => {
  const resources = [{ id: "resource-a", title: "Assignment guide", origin: "ASSIGNMENT" }];
  assert.deepEqual(groupStudioResources(resources, { origin: "STUDENT_IDEA" }), { assignment: [], other: resources });
});

test("assignment resources retain canonical assignment grouping", () => {
  const resources = [{ id: "a", title: "Required guide", origin: "ASSIGNMENT" }, { id: "b", title: "Other guide", origin: null }];
  const groups = groupStudioResources(resources, { origin: "ASSIGNMENT" });
  assert.deepEqual(groups.assignment.map((item) => item.id), ["a"]);
  assert.deepEqual(groups.other.map((item) => item.id), ["b"]);
});

test("resource companion context is read-only and metadata-limited", () => {
  const context = toStudioCompanionContext({ project: { projectId: "p", projectType: "WEBSITE", title: "Site", origin: "ASSIGNMENT", status: "DRAFT" }, resources: [{ id: "r", title: "Guide", type: "DOCUMENT", description: "Helpful", href: "https://example.test", internalSecret: "hidden" }] });
  assert.deepEqual(context.resources, [{ id: "r", title: "Guide", type: "DOCUMENT", description: "Helpful", sourceLabel: undefined }]);
  assert.equal(context.authority, "read-only");
  assert.equal("completed" in context, false);
});

test("resource adapter does not mutate source data", () => {
  const data = { resources: [{ id: "r", title: "Guide" }] };
  const before = JSON.stringify(data);
  normalizeStudioResources(data);
  assert.equal(JSON.stringify(data), before);
});

test("Build Packet presentation preserves available requirements and empty unsupported deliverables", () => {
  assert.deepEqual(buildPacketRequirementItems({ items: [{ label: "Use the brief", description: "Follow the assigned brief." }] }), [{ label: "Use the brief", detail: "Follow the assigned brief." }]);
  assert.deepEqual(buildPacketDeliverableItems([]), []);
});
