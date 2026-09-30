import assert from "node:assert/strict";
import test from "node:test";

import {
  COMMAND_CENTER_PRIVACY_EXCLUDED_FIELDS,
  COMMAND_CENTER_PRIVACY_POLICY,
  sanitizeCommandCenterSpatialView,
} from "../src/system/spatial/commandCenter/privacy.js";

test("W8B-PRIV-01 freezes fields Command Center must never expose", () => {
  assert.deepEqual(COMMAND_CENTER_PRIVACY_EXCLUDED_FIELDS, [
    "raw source records",
    "unrestricted geometry",
    "raw provenance",
    "evidenceReferences",
    "hidden feature IDs",
    "restricted identifiers",
    "approval metadata",
    "reviewer identities",
    "authoring metadata",
    "filesystem paths",
    "internal diagnostics",
    "authentication tokens",
    "authorization objects",
    "domain authority objects",
    "policy decision objects",
    "arbitrary backend errors",
  ]);
});

test("W8B-PRIV-02 freezes compose-only sanitizer behavior", () => {
  assert.deepEqual(COMMAND_CENTER_PRIVACY_POLICY, {
    composesExistingSanitizers: true,
    furtherRestrictsExistingSanitizers: true,
    broadensExistingSanitizers: false,
  });
});

test("W8B-PRIV-03 sanitization never broadens restricted spatial payloads", () => {
  const sanitized = sanitizeCommandCenterSpatialView({
    kind: "CommandCenterSpatialView",
    hiddenFeatureId: "hidden-oil-rig-point",
    evidenceReferences: [{ sourceRecordId: "restricted" }],
    filesystemPath: "/private/source.json",
    authorization: { token: "secret" },
    backendError: new Error("private stack"),
  });
  assert.equal(JSON.stringify(sanitized).includes("hidden-oil-rig-point"), false);
  assert.equal(JSON.stringify(sanitized).includes("/private/source.json"), false);
  assert.equal(JSON.stringify(sanitized).includes("secret"), false);
});
