import React from "react";
import {
  createSessionSnapshot,
  listSessionSnapshots,
  restoreSessionSnapshot,
} from "@/system/persistence/sessionSnapshots";
import {
  dryRunPersistenceMigration,
  listPersistenceMigrations,
} from "@/system/persistence/migrationRegistry";
import { summarizePersistenceSafety } from "@/system/persistence/persistenceSafety";
import { calculatePersistenceMetrics } from "@/system/persistence/persistenceMetrics";
import { defaultPersistenceService } from "@/system/persistence/persistenceService";
import { listCriticalStateMigrations } from "@/system/persistence/migrations/criticalStateMigrationRegistry";
import { buildCriticalStateMigrationPlan } from "@/system/persistence/migrations/criticalStateMigrationPlanner";
import { applyCriticalStateMigration, createCriticalStateMigrationBackup } from "@/system/persistence/migrations/criticalStateMigrationRunner";
import { previewCriticalStateRollback, applyCriticalStateRollback } from "@/system/persistence/migrations/criticalStateMigrationRollback";
import { calculateCriticalStateMigrationMetrics } from "@/system/persistence/migrations/criticalStateMigrationMetrics";
import { listMigrationBackups } from "@/system/persistence/migrations/criticalStateMigrationStorage";
import PersistenceOverviewPanel from "./components/PersistenceOverviewPanel";
import PersistenceRepositoryPanel from "./components/PersistenceRepositoryPanel";
import PersistenceTransactionHistory from "./components/PersistenceTransactionHistory";
import PersistenceVersionHistory from "./components/PersistenceVersionHistory";
import PersistenceSessionSnapshots from "./components/PersistenceSessionSnapshots";
import PersistenceMigrationPanel from "./components/PersistenceMigrationPanel";
import PersistenceSafetyPanel from "./components/PersistenceSafetyPanel";
import CriticalStateMigrationOverview from "./components/CriticalStateMigrationOverview";
import CriticalStateMigrationDomainTable from "./components/CriticalStateMigrationDomainTable";
import CriticalStateMigrationPlanPanel from "./components/CriticalStateMigrationPlanPanel";
import CriticalStateMigrationVerificationPanel from "./components/CriticalStateMigrationVerificationPanel";
import CriticalStateMigrationBackupPanel from "./components/CriticalStateMigrationBackupPanel";
import CriticalStateMigrationRollbackPanel from "./components/CriticalStateMigrationRollbackPanel";
import CriticalStateMigrationSafetyPanel from "./components/CriticalStateMigrationSafetyPanel";
import CriticalStateMigrationCompatibilityPanel from "./components/CriticalStateMigrationCompatibilityPanel";
import "./shsPersistenceCenter.css";

export default function ShsPersistenceCenterPage() {
  const [metrics, setMetrics] = React.useState(() => calculatePersistenceMetrics());
  const [snapshots, setSnapshots] = React.useState(() => listSessionSnapshots());
  const [selectedMigrationId, setSelectedMigrationId] = React.useState("agents_local_v1_to_persistence_v1");
  const [migrationResult, setMigrationResult] = React.useState(null);
  const [safetyResult, setSafetyResult] = React.useState(() => summarizePersistenceSafety([]));
  const [restorePreview, setRestorePreview] = React.useState(null);
  const [criticalMetrics, setCriticalMetrics] = React.useState(() => calculateCriticalStateMigrationMetrics());
  const [selectedCriticalDomain, setSelectedCriticalDomain] = React.useState("orchestrator");
  const [criticalPlan, setCriticalPlan] = React.useState(null);
  const [criticalRun, setCriticalRun] = React.useState(null);
  const [criticalRollbackPreview, setCriticalRollbackPreview] = React.useState(null);
  const [criticalRollbackResult, setCriticalRollbackResult] = React.useState(null);

  const migrations = React.useMemo(() => listPersistenceMigrations(), []);
  const criticalDomains = React.useMemo(() => listCriticalStateMigrations(), []);
  const selectedCriticalConfig = criticalDomains.find((domain) => domain.domain === selectedCriticalDomain);
  const transactions = defaultPersistenceService.adapter.read("transaction_history", []);
  const versions = defaultPersistenceService.adapter.read("version_history", []);
  const criticalBackups = listMigrationBackups();

  function refresh() {
    setMetrics(calculatePersistenceMetrics());
    setCriticalMetrics(calculateCriticalStateMigrationMetrics());
    setSnapshots(listSessionSnapshots());
  }

  function handleCreateSnapshot(scope = "all_safe") {
    createSessionSnapshot(scope);
    refresh();
  }

  function handleDryRunRestore(snapshotId) {
    setRestorePreview(restoreSessionSnapshot(snapshotId, { confirmRestore: false }));
  }

  function handleDryRunMigration() {
    setMigrationResult(dryRunPersistenceMigration(selectedMigrationId, []));
  }

  function handleSafetyScan() {
    const repositoryPayloads = metrics.repositories.map((repository) => ({
      repository: repository.repository,
      record_count: repository.record_count,
    }));
    setSafetyResult(summarizePersistenceSafety(repositoryPayloads));
  }

  function handleCriticalPlan() {
    const plan = buildCriticalStateMigrationPlan(selectedCriticalDomain);
    setCriticalPlan(plan);
    setCriticalRun(null);
    refresh();
  }

  function handleCriticalBackup() {
    const result = createCriticalStateMigrationBackup(selectedCriticalDomain);
    setCriticalPlan(result.backup || result);
    refresh();
  }

  function handleCriticalApply() {
    const run = applyCriticalStateMigration(selectedCriticalDomain, { confirmMigration: true });
    setCriticalRun(run);
    setCriticalPlan(run);
    refresh();
  }

  function handleCriticalVerify() {
    const verification = criticalRun?.verification || null;
    setCriticalRun({ ...(criticalRun || {}), verification });
    refresh();
  }

  function handleRollbackPreview() {
    setCriticalRollbackPreview(previewCriticalStateRollback(selectedCriticalDomain));
  }

  function handleRollbackApply() {
    setCriticalRollbackResult(applyCriticalStateRollback(selectedCriticalDomain, { confirmRollback: true }));
    refresh();
  }

  return (
    <main className="shs-persistence-page">
      <section className="persistence-hero">
        <div>
          <p>SHS Durable Persistence Layer V1</p>
          <h1>Persistence Center</h1>
          <span>Safe V1.1 bridge for repositories, snapshots, transaction history, version history, and dry-run migrations.</span>
        </div>
        <button type="button" onClick={() => handleCreateSnapshot("all_safe")}>Create Local Snapshot</button>
      </section>

      <section className="persistence-grid">
        <PersistenceOverviewPanel metrics={metrics} />
        <PersistenceSafetyPanel safetyResult={safetyResult} onSafetyScan={handleSafetyScan} />
        <PersistenceRepositoryPanel repositories={metrics.repositories} />
        <PersistenceSessionSnapshots
          snapshots={snapshots}
          restorePreview={restorePreview}
          onCreateSnapshot={handleCreateSnapshot}
          onDryRunRestore={handleDryRunRestore}
        />
        <PersistenceMigrationPanel
          migrations={migrations}
          selectedMigrationId={selectedMigrationId}
          migrationResult={migrationResult}
          onSelectMigration={setSelectedMigrationId}
          onDryRunMigration={handleDryRunMigration}
        />
        <CriticalStateMigrationOverview metrics={criticalMetrics} />
        <CriticalStateMigrationDomainTable
          domains={criticalDomains}
          selectedDomain={selectedCriticalDomain}
          onSelectDomain={setSelectedCriticalDomain}
        />
        <CriticalStateMigrationPlanPanel
          plan={criticalPlan}
          onPlan={handleCriticalPlan}
          onBackup={handleCriticalBackup}
          onApply={handleCriticalApply}
          onVerify={handleCriticalVerify}
        />
        <CriticalStateMigrationVerificationPanel verification={criticalRun?.verification} />
        <CriticalStateMigrationBackupPanel backups={criticalBackups} />
        <CriticalStateMigrationRollbackPanel
          rollbackPreview={criticalRollbackPreview}
          rollbackResult={criticalRollbackResult}
          onPreviewRollback={handleRollbackPreview}
          onApplyRollback={handleRollbackApply}
        />
        <CriticalStateMigrationSafetyPanel plan={criticalPlan} />
        <CriticalStateMigrationCompatibilityPanel domain={selectedCriticalConfig} />
        <PersistenceTransactionHistory transactions={transactions} />
        <PersistenceVersionHistory versions={versions} />
      </section>
    </main>
  );
}
