import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ACCESSIBILITY_CAPABILITIES,
  ACCESSIBILITY_RUNTIME_OWNER,
  EFFECTIVE_PREFERENCE_PRECEDENCE,
} from "../src/system/accessibility/accessibilityConstitution.js";

const read = (file) => fs.readFileSync(file, "utf8");
const provider = read("src/context/AccessibilityProfileContext.jsx");
const panel = read("src/components/lessons/AccessibilityPreferencesPanel.jsx");

test("AX-2 keeps the existing profile store and canonical runtime", () => {
  assert.equal(ACCESSIBILITY_RUNTIME_OWNER.persistenceOwner, "accessibility-profile-domain");
  assert.match(provider, /getProfile\(role\)/);
  assert.match(provider, /patchProfile\(role/);
  assert.match(provider, /resetProfile\(role/);
  assert.match(provider, /ANONYMOUS_SESSION_KEY/);
});

test("authenticated identity changes reset in-memory preferences before loading", () => {
  assert.match(provider, /const identityKey =/);
  assert.match(provider, /setState\(\{ loading: true, error: null, preferences: DEFAULT_PREFERENCES/);
  assert.match(provider, /\}, \[identityKey, load\]\)/);
});

test("anonymous preference behavior is session-only and never calls profile API", () => {
  assert.match(provider, /if \(!isAuthenticated\)/);
  assert.match(provider, /sessionStorage\.getItem\(ANONYMOUS_SESSION_KEY\)/);
  assert.match(provider, /sessionStorage\.setItem\(ANONYMOUS_SESSION_KEY/);
  assert.match(provider, /sessionStorage\.removeItem\(ANONYMOUS_SESSION_KEY/);
});

test("save, reset, unavailable and anonymous states are visible to the settings surface", () => {
  for (const status of ["LOADING", "SAVING", "SAVED", "ANONYMOUS", "UNAVAILABLE", "ERROR"]) assert.match(panel, new RegExp(status));
  assert.match(panel, /role="status"/);
});

test("profile patch errors are isolated and do not claim success", () => {
  assert.match(provider, /status: "SAVING"/);
  assert.match(provider, /status: "ERROR"/);
  assert.match(provider, /throw error/);
  assert.match(panel, /could not be saved/);
});

test("effective precedence remains explicit profile, session, system, then default", () => {
  assert.deepEqual(EFFECTIVE_PREFERENCE_PRECEDENCE, ["USER_PROFILE", "SESSION", "SYSTEM", "ORGANIZATION_DEFAULT", "PRODUCT_DEFAULT"]);
});

test("unsupported capabilities remain honestly classified", () => {
  const future = new Set(ACCESSIBILITY_CAPABILITIES.filter((item) => item.status === "FUTURE_PHASE").map((item) => item.key));
  assert.ok(future.has("lineHeight"));
  assert.ok(future.has("readingWidth"));
  assert.ok(future.has("audioDescription"));
});

test("preference runtime has no accommodation or domain-authority fields", () => {
  assert.doesNotMatch(provider, /authorized_accommodations/);
  assert.doesNotMatch(provider, /Evidence|Truth|attendance|completion/);
});
