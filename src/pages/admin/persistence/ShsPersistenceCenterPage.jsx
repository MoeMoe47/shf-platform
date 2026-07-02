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
import PersistenceOverviewPanel from "./components/PersistenceOverviewPanel";
import PersistenceRepositoryPanel from "./components/PersistenceRepositoryPanel";
import PersistenceTransactionHistory from "./components/PersistenceTransactionHistory";
import PersistenceVersionHistory from "./components/PersistenceVersionHistory";
import PersistenceSessionSnapshots from "./components/PersistenceSessionSnapshots";
import PersistenceMigrationPanel from "./components/PersistenceMigrationPanel";
import PersistenceSafetyPanel from "./components/PersistenceSafetyPanel";
import "./shsPersistenceCenter.css";

export default function ShsPersistenceCenterPage() {
  const [metrics, setMetrics] = React.useState(() => calculatePersistenceMetrics());
  const [snapshots, setSnapshots] = React.useState(() => listSessionSnapshots());
  const [selectedMigrationId, setSelectedMigrationId] = React.useState("agents_local_v1_to_persistence_v1");
  const [migrationResult, setMigrationResult] = React.useState(null);
  const [safetyResult, setSafetyResult] = React.useState(() => summarizePersistenceSafety([]));
  const [restorePreview, setRestorePreview] = React.useState(null);

  const migrations = React.useMemo(() => listPersistenceMigrations(), []);
  const transactions = defaultPersistenceService.adapter.read("transaction_history", []);
  const versions = defaultPersistenceService.adapter.read("version_history", []);

  function refresh() {
    setMetrics(calculatePersistenceMetrics());
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
        <PersistenceTransactionHistory transactions={transactions} />
        <PersistenceVersionHistory versions={versions} />
      </section>
    </main>
  );
}

