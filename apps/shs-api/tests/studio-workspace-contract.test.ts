import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStudioWorkspaceWork, emptyStudioWorkspace } from "../src/domain/studio/model/studio-workspace.ts";

test("workspace payloads are project-type specific and bounded", () => {
  assert.deepEqual(emptyStudioWorkspace("WEBSITE"), { pages: [{ path: "/", title: "Home", content: "" }] });
  assert.deepEqual(validateStudioWorkspaceWork("AI_AGENT", { name: "Guide", instructions: "Help", tools: [] }), { name: "Guide", instructions: "Help", tools: [] });
  assert.throws(() => validateStudioWorkspaceWork("WEBSITE", { pages: [{ path: "../secret", title: "x", content: "" }] }), /WORKSPACE_PAYLOAD_INVALID/);
  assert.throws(() => validateStudioWorkspaceWork("AI_AGENT", { name: "x", instructions: "", tools: [], completed: true }), /authority_field_forbidden/);
});
