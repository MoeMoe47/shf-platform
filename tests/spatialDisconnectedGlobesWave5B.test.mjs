import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const candidates = [
  ["OperationalGlobe", "../src/components/globe/OperationalGlobe.jsx"],
  ["RealGlobe", "../src/components/globe/RealGlobe.jsx"],
  ["OutcomeGlobe", "../src/components/exchange/OutcomeGlobe.jsx"],
  ["SHFOhioMapEngine", "../src/pages/shf-command/SHFOhioMapEngine.jsx"],
];

for (const [name, path] of candidates) {
  test(`W5B ${name} source exists and is inspectable`, () => {
    assert.equal(existsSync(new URL(path, import.meta.url)), true);
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /export default/);
  });
}

test("W5B disconnected globe candidates are not registered as Spatial adapters", () => {
  for (const [, path] of candidates) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /createProjectionAdapterRegistry|registerProjectionAdapter/);
  }
});

test("W5B OperationalGlobe and RealGlobe expose external geographic dependencies", () => {
  const operational = readFileSync(new URL("../src/components/globe/OperationalGlobe.jsx", import.meta.url), "utf8");
  const real = readFileSync(new URL("../src/components/globe/RealGlobe.jsx", import.meta.url), "utf8");
  assert.match(operational, /fetch\("\/geo\//);
  assert.match(real, /raw\.githubusercontent\.com/);
});

test("W5B OutcomeGlobe remains presentation-only and does not claim route authority", () => {
  const source = readFileSync(new URL("../src/components/exchange/OutcomeGlobe.jsx", import.meta.url), "utf8");
  assert.match(source, /arcs/);
  assert.doesNotMatch(source, /navigate|destinationId|sourceAuthority/);
});
