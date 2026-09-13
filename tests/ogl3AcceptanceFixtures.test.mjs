import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routes = readFileSync(new URL("../src/system/orientation/acceptance/OglAcceptanceRoutes.jsx", import.meta.url), "utf8");
const adminRoutes = readFileSync(new URL("../src/router/AdminRoutes.jsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../apps/shs-api/src/domain/orientation/service/orientation-context-service.ts", import.meta.url), "utf8");

test("OGL acceptance fixtures are dev-only and use the canonical runtime", () => {
  assert.match(routes, /import\.meta\.env\.DEV/);
  assert.match(routes, /<TourProvider/);
  assert.match(routes, /ogl-acceptance-anchor-a/);
  assert.match(routes, /ogl-acceptance-anchor-b/);
  assert.match(routes, /ogl-acceptance-anchor-c/);
  assert.match(routes, /setTimeout\(\(\) => setReady\(true\), 900\)/);
  assert.match(adminRoutes, /import\.meta\.env\.DEV \? <Route path="\/ogl-acceptance\/\*"/);
  assert.match(catalog, /orientation:ogl-acceptance:cross-route/);
  assert.match(catalog, /orientation:ogl-acceptance:delayed/);
  assert.equal((catalog.match(/testOnly: true/g) || []).length, 2);
  assert.match(catalog, /isDevelopmentAcceptanceCatalogEnabled/);
});
