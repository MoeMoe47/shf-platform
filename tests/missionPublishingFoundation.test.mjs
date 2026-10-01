import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("Mission Builder submits only persisted revisions and shows submitted versus current revision", async () => {
  const [builder, client] = await Promise.all([
    read("../src/pages/studio/StudioMissionBuilder.jsx"),
    read("../src/lib/studio/missionDraftApi.js"),
  ]);
  assert.match(builder, /Submit for Review/);
  assert.match(builder, /disabled=\{view\.saving \|\| dirty \|\| !draftId\}/);
  assert.match(builder, /submitted revision \{submission\.draftRevision\}/);
  assert.match(builder, /Current draft revision: \{revision\}/);
  assert.match(client, /credentials: "include"/);
  assert.match(client, /\/submit/);
});

test("Review and publisher surfaces require distinct existing governance permissions", async () => {
  const [page, permissions, routes] = await Promise.all([
    read("../src/pages/studio/StudioMissionGovernance.jsx"),
    read("../src/system/security/security-permissions.js"),
    read("../src/router/CurriculumRoutes.jsx"),
  ]);
  assert.match(page, /STUDIO_REVIEW_QUEUE_VIEW/);
  assert.match(page, /PROJECT_SUBMISSION_REVIEW/);
  assert.match(page, /CURRICULUM_CATALOG_PUBLISH/);
  assert.match(page, /CURRICULUM_CATALOG_RETIRE/);
  assert.match(page, /Mission Review/);
  assert.match(page, /Mission Releases/);
  assert.match(page, /Approved · awaiting publication/);
  assert.match(page, /listApprovedMissionsForPublication/);
  assert.match(page, /IMMUTABLE RELEASE/);
  assert.match(page, /Confirm retirement/);
  assert.match(permissions, /STUDIO_REVIEW_QUEUE_VIEW: "studio\.review\.queue\.view"/);
  assert.match(permissions, /PROJECT_SUBMISSION_REVIEW: "project\.submission\.review"/);
  assert.match(routes, /path="missions\/review"/);
  assert.match(routes, /path="missions\/releases"/);
});

test("Review renders frozen content as text and separates approval from publication", async () => {
  const page = await read("../src/pages/studio/StudioMissionGovernance.jsx");
  assert.match(page, /FROZEN REVIEW SNAPSHOT/);
  assert.match(page, /A decision does not publish the Mission/);
  assert.match(page, /Approve/);
  assert.match(page, /Reject/);
  assert.match(page, /Approved, not runtime-authorized/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
});

test("Retirement requires a note and explicit confirmation, preserving active runtime sessions", async () => {
  const page = await read("../src/pages/studio/StudioMissionGovernance.jsx");
  assert.match(page, /Retirement note/);
  assert.match(page, /Confirm retirement of this immutable release/);
  assert.match(page, /Active Mission Runtime sessions will continue unchanged/);
  assert.match(page, /disabled=\{!notes\[release\.releaseId\]\?\.trim\(\) \|\| state\.busy\}/);
});

test("Governance controls preserve keyboard focus and minimum 44px targets", async () => {
  const css = await read("../src/styles/studio-mission-builder.css");
  assert.match(css, /\.mission-governance \.studio-primaryButton, \.mission-governance \.studio-secondaryButton \{ min-height: 44px/);
  assert.match(css, /\.mission-governance button:focus-visible/);
});

test("Mission lifecycle client has no publish-content mutation or runtime launch shortcut", async () => {
  const client = await read("../src/lib/studio/missionDraftApi.js");
  const builder = await read("../src/pages/studio/StudioMissionBuilder.jsx");
  assert.match(client, /publishMissionSubmission/);
  assert.match(client, /retireMissionRelease/);
  assert.doesNotMatch(builder, /startMissionRuntime|\/arcade\/mission-runtimes/);
  assert.doesNotMatch(client, /\/arcade\/mission-runtimes/);
});

test("publication lifecycle writes only Mission-owned records and preserves external authorities", async () => {
  const [service, repo, resolver] = await Promise.all([
    read("../apps/shs-api/src/domain/mission-content/service/mission-publication-service.ts"),
    read("../apps/shs-api/src/domain/mission-content/repo/mission-publication-repo.ts"),
    read("../apps/shs-api/src/domain/mission-content/catalog/published-mission-catalog.ts"),
  ]);
  assert.doesNotMatch(service, /deriveMastery|submitResult|arcade\.resulted|verified-evidence|trusted-reporting|Truth Spine|Treasury|metaverse|Agent Fabric/i);
  assert.doesNotMatch(repo, /arcade_results|arcade_attempts|verified_evidence|truth_spine|treasury|metaverse|agent_fabric/i);
  assert.match(repo, /mission_review_submissions/);
  assert.match(repo, /mission_published_releases/);
  assert.match(repo, /mission_publication_events/);
  assert.match(resolver, /resolvePublishedMission\(scope, identity\.missionId, identity\.version\)/);
  assert.match(repo, /status\s*=\s*'PUBLISHED'/);
});
