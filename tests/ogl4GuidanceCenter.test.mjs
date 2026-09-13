import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/system/guidance/GuidanceCenter.jsx", import.meta.url), "utf8");

test("Guidance Center composes OGL context, tour, DGAL, Companion, and safe actions", () => {
  for (const marker of ["/orientation/context", "/orientation/experience", "Your next steps", "Documentation", "Common questions", "Related workflows", "Ask Companion", "What's changed", "dgal:tour-request", "useCompanion", "guidance_context"]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(source, /safeRoute\(item\.actionTarget\)/);
  assert.doesNotMatch(source, /window\.location|dangerouslySetInnerHTML/);
});

test("Guidance Center remains a bounded presentation surface", () => {
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /setOpen\(false\)/);
  assert.match(source, /companion\.openCoach\(\)/);
  assert.match(source, /resolution\.documentation\?\.status/);
});
