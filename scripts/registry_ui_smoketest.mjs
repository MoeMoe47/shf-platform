import { validateRegistryPayload, RegistryValidationError } from "../src/contracts/registry_entity.client.ts";

function logOk(name) {
  console.log("OK:", name);
}

function logFail(err) {
  console.log("FAIL:", err.message);
  if (err instanceof RegistryValidationError) {
    console.log("violations:", err.violations);
  } else {
    console.log(err);
  }
  process.exitCode = 1;
}

const agentPayload = {
  entity: {
    kind: "agent",
    id: "Layer10IntakeAgent",
    name: "Layer10IntakeAgent",
    title: "Layer10 Intake Agent",
    layer: "L10",
    lifecycle: { status: "active" },
    policy: { humanApproval: false, maxSteps: 6, notes: "Intake support. No eligibility calls." },
    legal: {
      classification: "internal",
      dataCategory: ["none"],
      authority: { approvedBy: "shf-admin", basis: "operational" },
      jurisdiction: "US-OH",
      termsRef: "legal/terms/shf-registry-terms@1.0.0",
      disclaimerRef: "legal/disclaimers/default@1.0.0",
      retention: { artifactsDays: 365, auditLogsDays: 365, deletionPolicy: "retire_only" },
      attestations: []
    },
    agentId: "L10-INTAKE-001"
  },
  reason: "ui_upsert_agent"
};

const appPayload = {
  entity: {
    kind: "app",
    id: "registry-ui",
    name: "registry-ui",
    title: "Registry UI",
    layer: "L00",
    lifecycle: { status: "active" },
    legal: {
      classification: "internal",
      dataCategory: ["none"],
      authority: { approvedBy: "shf-admin", basis: "operational" },
      jurisdiction: "US-OH",
      termsRef: "legal/terms/shf-registry-terms@1.0.0",
      disclaimerRef: "legal/disclaimers/default@1.0.0",
      retention: { artifactsDays: 365, auditLogsDays: 365, deletionPolicy: "retire_only" },
      attestations: []
    },
    entry: "/admin.html#/alignment/app-registry",
    home: "/admin.html",
    capabilities: ["registry.upsert", "registry.read"]
  },
  reason: "ui_upsert_app"
};

try {
  validateRegistryPayload(agentPayload);
  logOk("agentPayload");
} catch (e) {
  logFail(e);
}

try {
  validateRegistryPayload(appPayload);
  logOk("appPayload");
} catch (e) {
  logFail(e);
}

if (!process.exitCode) console.log("SMOKETEST PASS");
