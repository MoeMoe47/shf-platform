import test from "node:test";
import assert from "node:assert/strict";
import { createExperienceState, experienceStorageKey, isStaleExperienceState, transitionExperienceState } from "../src/system/orientation/runtime/experienceState.js";
import { emitOrientationExperienceEvent } from "../src/system/orientation/runtime/telemetry.js";
import { createRouteTransition, requiresContextResolution, transitionRoute, waitForTarget } from "../src/system/orientation/runtime/routeOrchestration.js";

test("experience state transitions remain separate from institutional state", () => {
  const started = transitionExperienceState(createExperienceState(), "START", { currentStepId: "intro" });
  const completed = transitionExperienceState(started, "COMPLETE");
  const replay = transitionExperienceState(completed, "RESTART", { currentStepId: "intro" });
  assert.equal(started.status, "STARTED"); assert.equal(completed.status, "COMPLETED"); assert.equal(replay.status, "STARTED"); assert.equal(replay.replayCount, 1);
});

test("experience state is scoped and versions are exact", () => {
  assert.equal(experienceStorageKey({ userId: "u1", organizationId: "org-a", orientationId: "o", orientationVersion: 1, tourId: "t", tourVersion: 1 }), "ogl:experience:u1:org-a:o:1:t:1");
  assert.equal(isStaleExperienceState({ orientationVersion: 1, tourVersion: 1 }, 2, 1), true); assert.equal(isStaleExperienceState({ orientationVersion: 2, tourVersion: 1 }, 2, 1), false);
});

test("telemetry is allowlisted and strips protected payloads", () => {
  const events = []; assert.equal(emitOrientationExperienceEvent("tour.completed", { orientationId: "o", body: "secret", stepId: "s" }, (event) => events.push(event)), true); assert.equal(events[0].body, undefined); assert.equal(emitOrientationExperienceEvent("truth.updated", {}, (event) => events.push(event)), false);
});

test("route orchestration preserves scope and resumes when delayed target appears", async () => {
  const route = transitionRoute(createRouteTransition({ orientationId: "o", orientationVersion: 1, tourId: "t", tourVersion: 1, organizationId: "org-a", nextStepId: "step-b" }), "WAITING_FOR_TARGET", { fromRoute: "/a", toRoute: "/b" });
  let available = false;
  const resultPromise = waitForTarget(() => available ? { id: "target-b" } : null, { timeoutMs: 500, intervalMs: 5 });
  setTimeout(() => { available = true; }, 15);
  const result = await resultPromise;
  assert.equal(transitionRoute(route, result.state).state, "TARGET_READY");
  assert.equal(route.organizationId, "org-a"); assert.equal(route.nextStepId, "step-b");
});

test("route readiness times out deterministically", async () => {
  const result = await waitForTarget(() => null, { timeoutMs: 10, intervalMs: 2 });
  assert.equal(result.state, "TARGET_TIMEOUT"); assert.equal(result.target, null);
});

test("route, org, destination, and workflow changes require fresh OGL context", () => {
  const base = { organizationId: "org-a", destinationId: "student", serviceKey: "curriculum", workflowRevision: 1, permissionRevision: 1 };
  assert.equal(requiresContextResolution(base, { ...base, organizationId: "org-b" }), true);
  assert.equal(requiresContextResolution(base, { ...base, destinationId: "admin" }), true);
  assert.equal(requiresContextResolution(base, { ...base, workflowRevision: 2 }), true);
  assert.equal(requiresContextResolution(base, base), false);
});
