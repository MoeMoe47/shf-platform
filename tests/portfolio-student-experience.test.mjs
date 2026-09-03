import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../src/pages/career/Portfolio.jsx", import.meta.url), "utf8");
const client = await readFile(new URL("../src/lib/portfolio/api.js", import.meta.url), "utf8");
const bridge = await readFile(new URL("../src/pages/studio/StudioInstitutionalStatus.jsx", import.meta.url), "utf8");

test("Portfolio page uses the durable authenticated API and not browser storage", () => {
  assert.match(page, /getPortfolio\(role\)/);
  assert.match(page, /updatePortfolioArtifact/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.match(page, /What You Proved/);
  assert.match(page, /Private/);
  assert.match(page, /Visible to My Organization/);
  assert.doesNotMatch(page, /PUBLIC|UNLISTED/);
});

test("Portfolio client sends only supported presentation fields", () => {
  assert.match(client, /\/portfolio\/artifacts\/from-evidence/);
  assert.match(client, /evidenceId/);
  assert.match(client, /thumbnailRef/);
  assert.doesNotMatch(client, /learnerId.*organizationId.*tenantId/s);
});

test("Studio proof bridge exposes Add to Portfolio as an explicit action", () => {
  assert.match(bridge, /createPortfolioArtifactFromEvidence/);
  assert.match(bridge, /Add to Portfolio/);
  assert.match(bridge, /Already in/);
  assert.match(bridge, /\/curriculum\/asl\/portfolio/);
});
