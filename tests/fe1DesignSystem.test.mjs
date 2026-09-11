import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("FE-1 shared foundation exposes namespaced tokens and primitives", () => {
  const tokens = read("src/design-system/tokens.css");
  const primitives = read("src/design-system/primitives.css");
  const component = read("src/components/shared/DesignSystemPrimitives.jsx");

  assert.match(tokens, /--ds-color-brand/);
  assert.match(tokens, /--ds-space-4/);
  assert.match(tokens, /--ds-focus-ring/);
  assert.match(primitives, /prefers-reduced-motion/);
  assert.match(primitives, /\.ds-button--primary/);
  assert.match(primitives, /\.ds-status--danger/);
  assert.match(primitives, /\.ds-pageHeader/);
  assert.match(component, /export function PageHeader/);
  assert.match(component, /export function StatusBadge/);
});

test("FE-1 shell families are attached without replacing existing app shells", () => {
  assert.match(read("src/layouts/AdminLayout.jsx"), /data-shell-family="operator"/);
  assert.match(read("src/layouts/CurriculumLayout.jsx"), /data-shell-family="learning"/);
  assert.match(read("src/layouts/AppShellLayout.jsx"), /data-shell-family="product"/);
  assert.match(read("src/pages/admin/agent-fabric/AgentFabricPage.jsx"), /StatusBadge/);
});
