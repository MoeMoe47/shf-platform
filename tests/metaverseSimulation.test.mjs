// MET-13 — Activities, Simulations + District Depth frontend focused tests.
// Follows this repo's established frontend convention (see
// tests/metaverseStudentEnterprise.test.mjs): static source-text
// assertions over the real component/client files, since there is no
// rendered-component test harness configured in this repo for the
// metaverse frontend.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseSimulationClient.js", import.meta.url), "utf8");
const mountSource = readFileSync(new URL("../src/components/metaverse/MetaverseActivityMount.jsx", import.meta.url), "utf8");
const shellSource = readFileSync(new URL("../src/components/metaverse/simulation/MetaverseSimulationShell.jsx", import.meta.url), "utf8");
const objectiveSource = readFileSync(new URL("../src/components/metaverse/simulation/SimulationObjective.jsx", import.meta.url), "utf8");
const taskSource = readFileSync(new URL("../src/components/metaverse/simulation/SimulationTaskPanel.jsx", import.meta.url), "utf8");
const stepSource = readFileSync(new URL("../src/components/metaverse/simulation/SimulationStepProgress.jsx", import.meta.url), "utf8");
const retrySource = readFileSync(new URL("../src/components/metaverse/simulation/SimulationRetryState.jsx", import.meta.url), "utf8");
const teamSource = readFileSync(new URL("../src/components/metaverse/simulation/SimulationTeamPanel.jsx", import.meta.url), "utf8");
const evidenceSource = readFileSync(new URL("../src/components/metaverse/simulation/SimulationEvidencePanel.jsx", import.meta.url), "utf8");
const accessibleSource = readFileSync(new URL("../src/components/metaverse/simulation/SimulationAccessibleAlternative.jsx", import.meta.url), "utf8");
const navModelSource = readFileSync(new URL("../src/system/metaverse/metaverseNavigationModel.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

const DATA_CENTER_FLAGSHIP = "data-center-operations-simulation";
const AI_FLAGSHIP = "ai-agent-build-test-simulation";
const ENTERPRISE_FLAGSHIP = "enterprise-service-delivery-simulation";
const BUDGET_FLAGSHIP = "civic-budget-tradeoff-simulation";
const SIDE_MISSION = "city-scavenger-hunt-side-mission";

test("MET-13 client never sends learner/org identity, unlock state, or completion truth from the browser", () => {
  assert.match(clientSource, /credentials: "include"/);
  assert.match(clientSource, /clientAuthorityFieldsSent:\s*false/);
  assert.doesNotMatch(clientSource, /organization_id\s*:/i);
  assert.doesNotMatch(clientSource, /verified_skill\s*:\s*true/i);
});

test("MET-13 one reusable shell renders every simulation; no per-simulation bespoke page component", () => {
  for (const id of [DATA_CENTER_FLAGSHIP, AI_FLAGSHIP, ENTERPRISE_FLAGSHIP, BUDGET_FLAGSHIP, SIDE_MISSION]) {
    assert.match(mountSource, new RegExp(id.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")), `${id} must be routed through MetaverseSimulationShell`);
  }
  assert.match(mountSource, /MetaverseSimulationShell/);
  for (const id of [DATA_CENTER_FLAGSHIP, AI_FLAGSHIP, ENTERPRISE_FLAGSHIP, BUDGET_FLAGSHIP, SIDE_MISSION]) {
    assert.match(navModelSource, new RegExp(id.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")));
  }
});

test("MET-13 shell shows objective, prerequisites, task steps, and retry state, driven by server data", () => {
  assert.match(shellSource, /SimulationObjective/);
  assert.match(shellSource, /SimulationTaskPanel/);
  assert.match(shellSource, /SimulationStepProgress/);
  assert.match(shellSource, /SimulationRetryState/);
  assert.match(objectiveSource, /simulation\.objective/);
  assert.match(objectiveSource, /prerequisites/);
  assert.match(taskSource, /currentStep\.instructions/);
  assert.match(stepSource, /completedStepIds/);
  assert.match(retrySource, /retryPolicy/);
});

test("MET-13 evidence boundary is labeled honestly and never claims verified skill from a raw completion", () => {
  assert.match(evidenceSource, /isVerifiedSkill/);
  assert.match(evidenceSource, /never from this runtime/);
  assert.doesNotMatch(evidenceSource, /isVerifiedSkill\s*\?\s*"yes"\s*:\s*"yes"/);
  assert.match(shellSource, /No verified skill, credential, course completion, career eligibility, or civic authority was created/);
  assert.doesNotMatch(shellSource, /verified\s*skill\s*[:=]\s*true/i);
});

test("MET-13 team mode is clear and team membership is never client-self-declared", () => {
  assert.match(teamSource, /Participation mode/);
  assert.match(teamSource, /server (independently )?verifies this against your real, active Studio team membership/);
  assert.doesNotMatch(teamSource, /localStorage.*team/i);
});

test("MET-13 accessible alternative is available for every simulation and describes a non-spatial equivalent", () => {
  assert.match(accessibleSource, /nonSpatialAlternative/);
  assert.match(accessibleSource, /Keyboard operable/);
  assert.match(accessibleSource, /Reduced-motion support/);
  assert.match(accessibleSource, /Mobile\/tablet support/);
});

test("MET-13 UI is keyboard operable and screen-reader labeled, not mouse/spatial only", () => {
  for (const source of [shellSource, taskSource, teamSource, evidenceSource, retrySource, accessibleSource]) {
    assert.doesNotMatch(source, /<div[^>]*onClick=/, "interactive elements must be real buttons/inputs, not div onClick handlers");
  }
  assert.match(shellSource, /aria-label=/);
  assert.match(taskSource, /aria-label=/);
  assert.match(evidenceSource, /aria-label="Evidence and assessment boundary"/);
  assert.match(retrySource, /aria-label="Retry status"/);
  assert.match(teamSource, /aria-label=/);
});

test("MET-13 mobile/tablet layout is inherited from the shared .met-activity container, not a bespoke panel", () => {
  assert.match(mountSource, /className="met-activity"|met-activity met-simulation/);
  assert.match(shellSource, /className="met-activity met-simulation"/);
  assert.match(cssSource, /\.met-simulation__steps\s*\{/);
});

test("MET-13 locked/unavailable simulations cannot open and direct-route failure is handled without a crash or fake success", () => {
  assert.match(shellSource, /canEnter/);
  assert.match(shellSource, /!state\.canEnter/);
  assert.match(shellSource, /state\.error \|\| !state\.simulation/, "load failure renders an explicit unavailable state rather than a silent fallback");
  assert.doesNotMatch(shellSource, /can_enter:\s*true(?!\s*[,}])/);
});

test("MET-13 completion and retry are always server round trips, never set optimistically as true locally", () => {
  assert.match(shellSource, /completeSimulationSession/);
  assert.match(shellSource, /retrySimulationSession/);
  assert.doesNotMatch(shellSource, /setSession\(\{[^}]*status:\s*"COMPLETED"/, "completion must come from the server response, not a locally constructed object");
  assert.doesNotMatch(shellSource, /setCompleted\(true\)/, "completion must carry the server's evidence boundary, not a bare boolean");
});
