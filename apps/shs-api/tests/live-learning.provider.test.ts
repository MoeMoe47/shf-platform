// Phase 2A Secure Live Learning — provider adapter tests, independent of
// the curriculum UI and the HTTP layer. Pure unit tests, no server, no
// network calls (the Zoom provider's real HTTP calls are never reached
// because it throws ProviderNotConfiguredError before any fetch happens
// when credentials are absent — verified below).
import { test } from "node:test";
import assert from "node:assert/strict";
import { MockLiveLearningProvider } from "../src/domain/live-learning/providers/mock-provider";
import { ZoomLiveLearningProvider } from "../src/domain/live-learning/providers/zoom-provider";
import { ProviderNotConfiguredError } from "../src/domain/live-learning/providers/live-learning-provider";
import { getProvider, listProviders } from "../src/domain/live-learning/providers/provider-registry";

test("MockLiveLearningProvider: create -> retrieve -> issueJoinAccess -> cancel", async () => {
  const provider = new MockLiveLearningProvider();
  const created = await provider.createSession({ title: "t", startsAt: new Date().toISOString(), durationMinutes: 30, hostId: "h1" });
  assert.ok(created.providerSessionId);

  const fetched = await provider.getSession(created.providerSessionId);
  assert.ok(fetched);
  assert.equal(fetched!.providerSessionId, created.providerSessionId);

  const auth = await provider.issueJoinAccess(created.providerSessionId, "user_x");
  assert.equal(auth.allowed, true);
  assert.match(auth.launchUrl!, /^about:blank#mock-/);

  await provider.cancelSession(created.providerSessionId);
  const afterCancel = await provider.getSession(created.providerSessionId);
  assert.equal(afterCancel, null);
});

test("MockLiveLearningProvider: issueJoinAccess on an unknown session denies", async () => {
  const provider = new MockLiveLearningProvider();
  const auth = await provider.issueJoinAccess("does-not-exist", "user_x");
  assert.equal(auth.allowed, false);
});

test("MockLiveLearningProvider: healthCheck always reports available (never pretends to be real Zoom)", async () => {
  const provider = new MockLiveLearningProvider();
  assert.equal(provider.name, "mock");
  assert.equal(await provider.healthCheck(), "available");
});

test("MockLiveLearningProvider: getRecordingMetadata always returns null (no fabricated recordings)", async () => {
  const provider = new MockLiveLearningProvider();
  const created = await provider.createSession({ title: "t", startsAt: new Date().toISOString(), durationMinutes: 30, hostId: "h1" });
  assert.equal(await provider.getRecordingMetadata(created.providerSessionId), null);
});

test("ZoomLiveLearningProvider: healthCheck reports not_configured when credentials are absent", async () => {
  delete process.env.ZOOM_ACCOUNT_ID;
  delete process.env.ZOOM_CLIENT_ID;
  delete process.env.ZOOM_CLIENT_SECRET;
  const provider = new ZoomLiveLearningProvider();
  assert.equal(await provider.healthCheck(), "not_configured");
});

test("ZoomLiveLearningProvider: createSession throws ProviderNotConfiguredError (never attempts a network call) when credentials are absent", async () => {
  delete process.env.ZOOM_ACCOUNT_ID;
  delete process.env.ZOOM_CLIENT_ID;
  delete process.env.ZOOM_CLIENT_SECRET;
  const provider = new ZoomLiveLearningProvider();
  await assert.rejects(
    () => provider.createSession({ title: "t", startsAt: new Date().toISOString(), durationMinutes: 30, hostId: "h1" }),
    ProviderNotConfiguredError
  );
});

test("ZoomLiveLearningProvider: issueJoinAccess, cancelSession, getRecordingMetadata all throw ProviderNotConfiguredError when unconfigured", async () => {
  delete process.env.ZOOM_ACCOUNT_ID;
  delete process.env.ZOOM_CLIENT_ID;
  delete process.env.ZOOM_CLIENT_SECRET;
  const provider = new ZoomLiveLearningProvider();
  await assert.rejects(() => provider.issueJoinAccess("x", "user_x"), ProviderNotConfiguredError);
  await assert.rejects(() => provider.cancelSession("x"), ProviderNotConfiguredError);
  await assert.rejects(() => provider.getRecordingMetadata("x"), ProviderNotConfiguredError);
});

test("provider-registry: getProvider resolves mock and zoom by name, throws on unknown", () => {
  assert.equal(getProvider("mock").name, "mock");
  assert.equal(getProvider("zoom").name, "zoom");
  assert.throws(() => getProvider("webex" as any));
});

test("provider-registry: listProviders exposes exactly the two implemented providers (no undeclared providers)", () => {
  const names = listProviders().map((p) => p.name).sort();
  assert.deepEqual(names, ["mock", "zoom"]);
});
