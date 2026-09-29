import assert from "node:assert/strict";
import test from "node:test";

async function runtime() {
  return import("../src/system/spatial/intelligence/reasoning.js");
}

test("only GEOMETRIC_FACT and PRESENTATION_DERIVATION are allowed reasoning classes", async () => {
  const { REASONING_CLASSES } = await runtime();

  assert.deepEqual(Object.values(REASONING_CLASSES).sort(), ["GEOMETRIC_FACT", "PRESENTATION_DERIVATION"]);
});

test("successful geometry reasoning declares GEOMETRIC_FACT explicitly", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence({ reasoningClass: "GEOMETRIC_FACT", operation: "RELATIONSHIP" });

  assert.equal(result.reasoningClass, "GEOMETRIC_FACT");
  assert.equal(result.authorityBoundary, "GEOMETRIC_FACT_ONLY");
});

test("PRESENTATION_DERIVATION is allowed only as a bounded presentation result", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence({ reasoningClass: "PRESENTATION_DERIVATION", operation: "FRESHNESS" });

  assert.equal(result.reasoningClass, "PRESENTATION_DERIVATION");
  assert.equal(result.domainFact, undefined);
  assert.equal(result.policyDecision, undefined);
});

for (const prohibited of ["DOMAIN_FACT", "POLICY_DECISION"]) {
  test(`rejects ${prohibited} requests without silent escalation`, async () => {
    const { evaluateSpatialIntelligence } = await runtime();
    const result = evaluateSpatialIntelligence({ reasoningClass: prohibited, operation: "RELATIONSHIP" });

    assert.equal(result.ok, false);
    assert.match(result.reason, /authority|unsupported|prohibited/i);
  });
}

test("geometry cannot become provider service-area or jurisdiction authority", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  for (const operation of ["PROVIDER_SERVES_COUNTY", "ASSIGNS_STUDENT_DISTRICT", "ASSIGNS_DISPATCH_UNIT", "AUTHORIZES_ORGANIZATION", "DECIDES_ELIGIBILITY"]) {
    const result = evaluateSpatialIntelligence({ reasoningClass: "DOMAIN_FACT", operation });
    assert.equal(result.ok, false);
  }
});

test("reasoning cannot create publication, metric, navigation, or transform authority", async () => {
  const { evaluateSpatialIntelligence } = await runtime();
  const result = evaluateSpatialIntelligence({ reasoningClass: "GEOMETRIC_FACT", operation: "RELATIONSHIP" });

  assert.equal(result.publicationAuthority, undefined);
  assert.equal(result.metricAuthority, undefined);
  assert.equal(result.navigationAuthority, undefined);
  assert.equal(result.transformAuthority, undefined);
});
