import assert from "node:assert/strict";
import test from "node:test";
import pkg from "pg";

const { Pool } = pkg;
const databaseUrl = process.env.SHS_TEST_DATABASE_URL;

test("Portfolio durable backend passes PostgreSQL acceptance and containment checks", {
  timeout: 60_000,
  skip: databaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable Portfolio PostgreSQL acceptance",
}, async (t) => {
  process.env.DATABASE_URL = databaseUrl;
  const { discoverMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { pool } = await import("../src/db/client.ts");
  const { PortfolioService } = await import("../src/domain/portfolio/service/portfolio-service.ts");
  const org = `org_portfolio_${process.pid}_${Date.now()}`;
  const otherOrg = `${org}_other`;
  const learner = `user_portfolio_${process.pid}_${Date.now()}`;
  const otherLearner = `${learner}_other`;
  const foreignLearner = `${learner}_foreign`;
  const project = `project_portfolio_${process.pid}_${Date.now()}`;
  const qaRun = `qa_portfolio_${process.pid}_${Date.now()}`;
  const submission = `submission_portfolio_${process.pid}_${Date.now()}`;
  const decision = `decision_portfolio_${process.pid}_${Date.now()}`;
  const delivery = `delivery_portfolio_${process.pid}_${Date.now()}`;
  const evidence = `evidence_portfolio_${process.pid}_${Date.now()}`;

  const app = new Pool({ connectionString: databaseUrl });
  const migrations = await discoverMigrations(new URL("../migrations", import.meta.url).pathname);
  const migrationClient = await app.connect();
  try { await runMigrations(migrationClient, migrations); } finally { migrationClient.release(); }

  await app.query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1,$2,$2,'SHF','active'),($3,$4,$4,'Partner','active')`,
    [org, "Portfolio Acceptance", otherOrg, "Foreign Portfolio Acceptance"],
  );
  await app.query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1,$2,$3,'Portfolio Learner','active','test'),
            ($4,$2,$5,'Other Learner','active','test'),
            ($6,$7,$8,'Foreign Learner','active','test')`,
    [learner, org, `${learner}@test.invalid`, otherLearner, `${otherLearner}@test.invalid`, foreignLearner, otherOrg, `${foreignLearner}@test.invalid`],
  );
  await app.query(
    `INSERT INTO projects (
       project_id, organization_id, tenant_id, title, project_type, status, created_by_user_id,
       studio_origin, studio_learner_id, studio_project_type, studio_destination, studio_status,
       studio_qa_status, studio_review_status, studio_delivery_status
     ) VALUES ($1,$2,$3,'Portfolio Acceptance Website','WEBSITE','ACTIVE',$4,
       'STUDENT_IDEA',$4,'WEBSITE','STUDENT','DELIVERED','PASSED','APPROVED','DELIVERED')`,
    [project, org, `tenant:${org}`, learner],
  );
  await app.query(
    `INSERT INTO studio_qa_runs (qa_run_id, project_id, organization_id, tenant_id, project_type, workspace_revision, status, ruleset_version, created_by_user_id)
     VALUES ($1,$2,$3,$4,'WEBSITE',4,'PASSED','phase7-v1',$5)`,
    [qaRun, project, org, `tenant:${org}`, learner],
  );
  await app.query(
    `INSERT INTO studio_review_submissions (review_submission_id, project_id, organization_id, tenant_id, project_type, workspace_revision, qa_run_id, status, submitted_by_user_id)
     VALUES ($1,$2,$3,$4,'WEBSITE',4,$5,'APPROVED',$6)`,
    [submission, project, org, `tenant:${org}`, qaRun, learner],
  );
  await app.query(
    `INSERT INTO studio_review_decisions (review_decision_id, review_submission_id, project_id, organization_id, tenant_id, decision, reviewed_by_user_id)
     VALUES ($1,$2,$3,$4,$5,'APPROVED',$6)`,
    [decision, submission, project, org, `tenant:${org}`, otherLearner],
  );
  await app.query(
    `INSERT INTO studio_delivery_records (delivery_record_id, project_id, organization_id, tenant_id, submission_id, review_decision_id, qa_run_id, workspace_revision, project_type, destination, status, requested_by_user_id, finalized_by_user_id, finalized_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,4,'WEBSITE','STUDENT','FINALIZED',$8,$8,NOW())`,
    [delivery, project, org, `tenant:${org}`, submission, decision, qaRun, learner],
  );
  await app.query(
    `INSERT INTO prepare_prove_evidence (
       evidence_id, source_domain, source_record_id, user_id, organization_id, tenant_id,
       activity_id, criterion, status, provenance_json, source_type, evidence_rule_version
     ) VALUES ($1,'STUDIO_DELIVERY',$2,$3,$4,$5,'studio-project','portfolio','REVIEWABLE',$6,'STUDIO_DELIVERY',1)`,
    [evidence, delivery, learner, org, `tenant:${org}`, JSON.stringify({ source_type: "STUDIO_DELIVERY", source_record_id: delivery, project_id: project, workspace_revision: 4 })],
  );

  const actor = { user_id: learner, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`, roles: ["student"], permissions: ["studio.project.view", "studio.project.update"] };
  const otherActor = { user_id: otherLearner, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`, roles: ["student"], permissions: ["studio.project.view", "studio.project.update"] };
  const foreignActor = { user_id: foreignLearner, organization_id: otherOrg, active_organization_id: otherOrg, tenant_id: `tenant:${otherOrg}`, roles: ["student"], permissions: ["studio.project.view", "studio.project.update"] };
  const service = new PortfolioService();

  try {
    const [first, second] = await Promise.all([
      service.createFromEvidence(actor, { evidenceId: evidence, title: "Canonical Website" }),
      service.createFromEvidence(actor, { evidenceId: evidence, title: "Retry" }),
    ]);
    assert.equal((await app.query("SELECT COUNT(*) FROM portfolio_profiles WHERE organization_id=$1 AND learner_id=$2 AND status='ACTIVE'", [org, learner])).rows[0].count, "1");
    assert.equal((await app.query("SELECT COUNT(*) FROM portfolio_artifacts WHERE organization_id=$1 AND evidence_id=$2 AND status <> 'REMOVED'", [org, evidence])).rows[0].count, "1");
    assert.equal(new Set([first.artifact.artifactId, second.artifact.artifactId]).size, 1);
    assert.equal([first.idempotent, second.idempotent].filter(Boolean).length, 1);
    assert.equal((await app.query("SELECT COUNT(*) FROM integration_outbox WHERE organization_id=$1 AND subject_type IN ('portfolio','portfolio_artifact')", [org])).rows[0].count, "2");

    await assert.rejects(() => service.createFromEvidence(otherActor, { evidenceId: evidence }), /PORTFOLIO_SOURCE_NOT_ELIGIBLE/);
    await assert.rejects(() => service.createFromEvidence(foreignActor, { evidenceId: evidence }), /PORTFOLIO_SOURCE_NOT_ELIGIBLE/);
    await assert.rejects(() => service.getArtifact(foreignActor, first.artifact.artifactId), /PORTFOLIO_ARTIFACT_NOT_FOUND/);
    await assert.rejects(() => service.createFromEvidence(actor, { evidenceId: evidence, learnerId: otherLearner }), /PORTFOLIO_FIELD_NOT_ALLOWED/);
    await assert.rejects(() => service.createFromEvidence(actor, { evidenceId: evidence, visibility: "PUBLIC" }), /not available/);
    await assert.rejects(() => service.createFromEvidence(actor, { evidenceId: evidence, thumbnailRef: "javascript:alert(1)" }), /PORTFOLIO_THUMBNAIL_REFERENCE_UNSAFE/);

    const artifact = first.artifact;
    const updated = await service.updateArtifact(actor, artifact.artifactId, { summary: "Learner presentation", visibility: "ORGANIZATION" });
    assert.equal(updated.presentation.summary, "Learner presentation");
    assert.equal(updated.provenance.workspaceRevision, 4);
    assert.equal((await service.getArtifact(otherActor, artifact.artifactId)).presentation.visibility, "ORGANIZATION");
    const beforeCounts = await app.query(`SELECT
      (SELECT COUNT(*) FROM projects WHERE project_id=$1) AS projects,
      (SELECT COUNT(*) FROM studio_delivery_records WHERE delivery_record_id=$2) AS deliveries,
      (SELECT COUNT(*) FROM prepare_prove_evidence WHERE evidence_id=$3) AS evidence`, [project, delivery, evidence]);
    await service.updateArtifact(actor, artifact.artifactId, { status: "REMOVED" });
    const afterCounts = await app.query(`SELECT
      (SELECT COUNT(*) FROM projects WHERE project_id=$1) AS projects,
      (SELECT COUNT(*) FROM studio_delivery_records WHERE delivery_record_id=$2) AS deliveries,
      (SELECT COUNT(*) FROM prepare_prove_evidence WHERE evidence_id=$3) AS evidence`, [project, delivery, evidence]);
    assert.deepEqual(afterCounts.rows[0], beforeCounts.rows[0]);
    await assert.rejects(() => service.updateArtifact(actor, artifact.artifactId, { status: "ACTIVE" }), /PORTFOLIO_STATUS_TRANSITION_INVALID/);

    await app.query("UPDATE prepare_prove_evidence SET status='SUPERSEDED' WHERE evidence_id=$1", [evidence]);
    await assert.rejects(() => service.createFromEvidence(actor, { evidenceId: evidence }), /PORTFOLIO_SOURCE_NOT_ELIGIBLE/);
    const provenance = (await app.query("SELECT evidence_id, studio_delivery_id, workspace_revision FROM portfolio_artifacts WHERE artifact_id=$1", [artifact.artifactId])).rows[0];
    assert.deepEqual(provenance, { evidence_id: evidence, studio_delivery_id: delivery, workspace_revision: 4 });
  } finally {
    await app.query("DELETE FROM integration_outbox WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM portfolio_artifacts WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM portfolio_profiles WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM prepare_prove_evidence WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM studio_delivery_records WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM studio_review_decisions WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM studio_review_submissions WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM studio_qa_runs WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM projects WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.query("DELETE FROM users WHERE user_id IN ($1,$2,$3)", [learner, otherLearner, foreignLearner]);
    await app.query("DELETE FROM organizations WHERE organization_id IN ($1,$2)", [org, otherOrg]);
    await app.end();
    await pool.end();
  }
  t.diagnostic(`database=${new URL(databaseUrl).hostname}:${new URL(databaseUrl).port || "default"}`);
});
