import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("FE-2 representative shells retain their shared family markers", () => {
  assert.match(read("src/layouts/AppShellLayout.jsx"), /data-shell-family="product"/);
  assert.match(read("src/layouts/AdminLayout.jsx"), /data-shell-family="operator"/);
  assert.match(read("src/layouts/CurriculumLayout.jsx"), /data-shell-family="learning"/);
});

test("FE-2 Agent Fabric table exposes keyboard selection and semantic headers", () => {
  const page = read("src/pages/admin/agent-fabric/AgentFabricPage.jsx");
  const styles = read("src/pages/admin/agent-fabric/agent-fabric.css");

  assert.match(page, /<th scope="col">Agent<\/th>/);
  assert.match(page, /tabIndex="0"/);
  assert.match(page, /aria-label={`Select \$\{agent\.name\}`}/);
  assert.match(page, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(styles, /\.agent-fabric-table-wrap tr:focus-visible/);
  assert.match(styles, /@media \(max-width: 560px\)/);
});

test("FE-2 preserves locked destinations and product-preservation boundaries", () => {
  const report = read("docs/architecture/FE-1_SHARED_DESIGN_SYSTEM_APPLICATION_SHELL_REPORT.md");
  assert.match(report, /OAS/);
  assert.match(report, /Universe/);
  assert.match(report, /CivicSure/);
  assert.match(read("src/router/AdminRoutes.jsx"), /path="\/agent-fabric"/);
});
