import React, { useEffect, useMemo, useState } from "react";
import "@/styles/opsLaunchWorkflow.css";
import { createMockLaunchWorkflowRecords } from "@/data/mockLaunchWorkflowData";
import {
  SHS_LAUNCH_LEDGER_STORAGE_KEY,
  computeLaunchGateStatus,
  createLaunchLedgerRecord,
  createSignoffRecord,
  createVersionRecord,
  getLaunchBlockers,
  getLaunchWarnings,
  isClientOpsActivationAllowed,
  loadLaunchLedger,
  saveLaunchLedger,
  upsertLaunchLedgerRecord,
} from "@/system/launch/shsLaunchLedger";

const statusLabels = {
  blocked: "Blocked",
  needs_review: "Needs Review",
  private_beta_ready: "Private Beta Ready",
  paid_launch_ready: "Paid Launch Ready",
};

const emptyRecord = {
  project_id: "launch_new_project",
  client_name: "New Private Beta Client",
  project_name: "New SHS Launch",
  package_name: "",
  support_tier: "",
  launch_status: "draft",
};

const BACKEND_LEDGER_BASE = "/shs-launch-ledger";

async function requestBackendLedger(path, options = {}) {
  const response = await fetch(`${BACKEND_LEDGER_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Launch ledger request failed: ${response.status}`);
  }
  return response.json();
}

function formatStatus(value) {
  return statusLabels[value] || value || "Needs Review";
}

function isPresent(value) {
  if (!value || typeof value !== "object") return false;
  if (value.completed === true || value.signed === true || value.approved === true) return true;
  return ["approved", "approved_with_exceptions", "complete", "completed", "signed", "signed_off", "ready"].includes(
    String(value.status || "").toLowerCase()
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="launch-workflow__field">
      <span>{label}</span>
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function StatusPill({ status }) {
  return <span className={`launch-workflow__pill is-${status || "needs_review"}`}>{formatStatus(status)}</span>;
}

function CheckRow({ label, present }) {
  return (
    <div className="launch-workflow__check-row">
      <span>{label}</span>
      <strong className={present ? "is-present" : "is-missing"}>{present ? "Present" : "Missing"}</strong>
    </div>
  );
}

function createStageSignoff(type, owner) {
  return createSignoffRecord({
    type,
    status: "approved",
    owner,
    role: "SHS Launch Workflow",
    signed_at: new Date().toISOString(),
  });
}

function mergeRecord(record, updates) {
  return createLaunchLedgerRecord({
    ...record,
    ...updates,
    public_approved: false,
    mutated_shf_impact_data: false,
    published_report: false,
  });
}

export default function OpsLaunchWorkflowPage() {
  const [records, setRecords] = useState(() => loadLaunchLedger());
  const [selectedId, setSelectedId] = useState(() => records[0]?.ledger_id || "");
  const [notice, setNotice] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function loadBackendLedger() {
      try {
        const result = await requestBackendLedger("/records");
        if (!active) return;
        const backendRecords = Array.isArray(result.records) ? result.records.map(createLaunchLedgerRecord) : [];
        setBackendStatus("connected");
        if (backendRecords.length) {
          const saved = saveLaunchLedger(backendRecords);
          setRecords(saved);
          setSelectedId((current) => current || saved[0]?.ledger_id || "");
        }
      } catch {
        if (active) setBackendStatus("local_fallback");
      }
    }

    loadBackendLedger();

    return () => {
      active = false;
    };
  }, []);

  const selectedRecord = useMemo(
    () => records.find((record) => record.ledger_id === selectedId) || records[0] || null,
    [records, selectedId]
  );
  const selectedGate = selectedRecord ? computeLaunchGateStatus(selectedRecord) : null;
  const selectedBlockers = selectedRecord ? getLaunchBlockers(selectedRecord) : [];
  const selectedWarnings = selectedRecord ? getLaunchWarnings(selectedRecord) : [];
  const clientOpsAllowed = selectedRecord ? isClientOpsActivationAllowed(selectedRecord) : false;

  const metrics = useMemo(() => {
    const gates = records.map((record) => computeLaunchGateStatus(record));
    return {
      total: records.length,
      launchReady: records.filter((record) => ["launch_ready", "launched"].includes(record.launch_status)).length,
      privateBetaReady: gates.filter((gate) => ["private_beta_ready", "paid_launch_ready"].includes(gate.status)).length,
      paidLaunchReady: gates.filter((gate) => gate.status === "paid_launch_ready").length,
      blocked: gates.filter((gate) => gate.status === "blocked" || gate.status === "needs_review").length,
    };
  }, [records]);

  function persist(nextRecords, nextSelectedId = selectedId) {
    const saved = saveLaunchLedger(nextRecords);
    setRecords(saved);
    setSelectedId(nextSelectedId || saved[0]?.ledger_id || "");
  }

  async function syncRecordToBackend(record) {
    if (backendStatus !== "connected") return null;
    try {
      const result = await requestBackendLedger("/records", {
        method: "POST",
        body: JSON.stringify(record),
      });
      return result.record ? createLaunchLedgerRecord(result.record) : null;
    } catch {
      setBackendStatus("local_fallback");
      setNotice("Backend ledger unavailable. Local fallback preserved.");
      return null;
    }
  }

  async function syncRecordsToBackend(nextRecords) {
    if (backendStatus !== "connected") return;
    await Promise.all(nextRecords.map((record) => syncRecordToBackend(record)));
  }

  function updateSelected(updates, message = "Record updated.") {
    if (!selectedRecord) return;
    const nextRecord = mergeRecord(selectedRecord, updates);
    const nextRecords = records.map((record) => (record.ledger_id === nextRecord.ledger_id ? nextRecord : record));
    persist(nextRecords, nextRecord.ledger_id);
    void syncRecordToBackend(nextRecord);
    setNotice(message);
  }

  function createSampleRecord() {
    const record = createLaunchLedgerRecord(emptyRecord);
    persist([record, ...records], record.ledger_id);
    void syncRecordToBackend(record);
    setNotice("Sample launch record created.");
  }

  function loadSampleRecords() {
    const samples = createMockLaunchWorkflowRecords();
    persist(samples, samples[0]?.ledger_id || "");
    void syncRecordsToBackend(samples);
    setNotice("Sample launch records loaded.");
  }

  async function saveSelectedRecord() {
    if (!selectedRecord) return;
    const saved = upsertLaunchLedgerRecord(selectedRecord);
    const backendRecord = await syncRecordToBackend(saved);
    const nextRecords = loadLaunchLedger();
    const mergedRecords = backendRecord
      ? nextRecords.map((record) => (record.ledger_id === backendRecord.ledger_id ? backendRecord : record))
      : nextRecords;
    saveLaunchLedger(mergedRecords);
    setRecords(mergedRecords);
    setSelectedId((backendRecord || saved).ledger_id);
    setNotice(backendRecord ? "Record saved to backend launch ledger." : "Record saved to local launch ledger.");
  }

  function recalculateGate() {
    if (!selectedRecord) return;
    updateSelected({}, `Gate recalculated: ${formatStatus(computeLaunchGateStatus(selectedRecord).status)}.`);
  }

  function advance(stage) {
    if (!selectedRecord) return;
    const stageUpdates = {
      qa_ready: {
        launch_status: "qa_review",
        qa_signoff: createStageSignoff("qa", "QA Lead"),
      },
      delivery_ready: {
        launch_status: "delivery_ready",
        qa_signoff: isPresent(selectedRecord.qa_signoff) ? selectedRecord.qa_signoff : createStageSignoff("qa", "QA Lead"),
        operator_signoff: createStageSignoff("operator", "Launch Operator"),
        delivery_signoff: createStageSignoff("delivery", "Delivery Owner"),
      },
      launch_ready: {
        launch_status: "launch_ready",
        qa_signoff: isPresent(selectedRecord.qa_signoff) ? selectedRecord.qa_signoff : createStageSignoff("qa", "QA Lead"),
        operator_signoff: isPresent(selectedRecord.operator_signoff) ? selectedRecord.operator_signoff : createStageSignoff("operator", "Launch Operator"),
        delivery_signoff: isPresent(selectedRecord.delivery_signoff) ? selectedRecord.delivery_signoff : createStageSignoff("delivery", "Delivery Owner"),
        version_record: selectedRecord.version_record?.version_id
          ? selectedRecord.version_record
          : createVersionRecord({
              version_label: "V1 Launch",
              launch_date: new Date().toISOString().slice(0, 10),
              summary: "Launch workflow baseline.",
              owner: "Launch Operator",
            }),
      },
      launched: {
        launch_status: "launched",
        private_beta_only: false,
        client_signoff: createStageSignoff("client", "Client Approver"),
        rollback_plan: {
          owner: "Release Owner",
          last_known_good_version: selectedRecord.version_record?.version_id || "v1-launch",
          trigger_conditions: ["Critical route failure", "Client approval reversal"],
        },
      },
      clientops_active: {
        launch_status: "launched",
        support_tier: selectedRecord.support_tier || "Priority",
        clientops_activation: {
          ...selectedRecord.clientops_activation,
          owner: selectedRecord.clientops_activation?.owner || "ClientOps Owner",
          status: "complete",
          activated_at: new Date().toISOString(),
          support_tier: selectedRecord.support_tier || "Priority",
        },
      },
    };

    updateSelected(stageUpdates[stage], "Workflow stage updated.");
  }

  return (
    <main className="launch-workflow">
      <section className="launch-workflow__hero">
        <div>
          <p className="launch-workflow__eyebrow">SHS Launch Gate</p>
          <h1>SHS Launch Workflow</h1>
          <p>Launch Readiness, Signoffs, Version Control, and ClientOps Activation</p>
        </div>
        <div className="launch-workflow__storage">
          <span>Backend Ledger</span>
          <strong>{backendStatus === "connected" ? "Connected" : "Local Fallback"}</strong>
          <small>{SHS_LAUNCH_LEDGER_STORAGE_KEY}</small>
        </div>
      </section>

      <section className="launch-workflow__metrics" aria-label="Launch workflow metrics">
        <div><span>Total Projects</span><strong>{metrics.total}</strong></div>
        <div><span>Launch Ready</span><strong>{metrics.launchReady}</strong></div>
        <div><span>Private Beta Ready</span><strong>{metrics.privateBetaReady}</strong></div>
        <div><span>Paid Launch Ready</span><strong>{metrics.paidLaunchReady}</strong></div>
        <div><span>Blocked</span><strong>{metrics.blocked}</strong></div>
      </section>

      <section className="launch-workflow__actions" aria-label="Launch workflow actions">
        <button type="button" onClick={createSampleRecord}>Create Sample Record</button>
        <button type="button" onClick={loadSampleRecords}>Load Sample Records</button>
        <button type="button" onClick={saveSelectedRecord} disabled={!selectedRecord}>Save Record</button>
        <button type="button" onClick={recalculateGate} disabled={!selectedRecord}>Recalculate Gate</button>
        {notice && <span>{notice}</span>}
      </section>

      <section className="launch-workflow__layout">
        <div className="launch-workflow__table-card">
          <div className="launch-workflow__card-head">
            <div>
              <p className="launch-workflow__eyebrow">Workflow Queue</p>
              <h2>Launch Records</h2>
            </div>
          </div>
          <div className="launch-workflow__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Package</th>
                  <th>Support Tier</th>
                  <th>Launch Status</th>
                  <th>Private Beta Status</th>
                  <th>Paid Launch Status</th>
                  <th>ClientOps Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length ? records.map((record) => {
                  const gate = computeLaunchGateStatus(record);
                  const clientOpsStatus = isClientOpsActivationAllowed(record) ? "private_beta_ready" : "needs_review";
                  return (
                    <tr
                      className={record.ledger_id === selectedRecord?.ledger_id ? "is-selected" : ""}
                      key={record.ledger_id}
                      onClick={() => setSelectedId(record.ledger_id)}
                    >
                      <td>{record.project_name || "Untitled project"}</td>
                      <td>{record.client_name || "Missing client"}</td>
                      <td>{record.package_name || "Not set"}</td>
                      <td>{record.support_tier || "Not set"}</td>
                      <td>{record.launch_status}</td>
                      <td><StatusPill status={gate.status === "paid_launch_ready" ? "private_beta_ready" : gate.status} /></td>
                      <td><StatusPill status={gate.status === "paid_launch_ready" ? "paid_launch_ready" : "needs_review"} /></td>
                      <td><StatusPill status={clientOpsStatus} /></td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8">No launch records yet. Create or load a sample record to begin.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="launch-workflow__detail">
          {selectedRecord ? (
            <>
              <div className="launch-workflow__card">
                <p className="launch-workflow__eyebrow">Project Detail</p>
                <h2>{selectedRecord.project_name || "Launch Record"}</h2>
                <div className="launch-workflow__form-grid">
                  <Field label="Client Name" value={selectedRecord.client_name} onChange={(client_name) => updateSelected({ client_name })} />
                  <Field label="Project Name" value={selectedRecord.project_name} onChange={(project_name) => updateSelected({ project_name })} />
                  <Field label="Package" value={selectedRecord.package_name} onChange={(package_name) => updateSelected({ package_name })} />
                  <Field label="Support Tier" value={selectedRecord.support_tier} onChange={(support_tier) => updateSelected({ support_tier })} />
                </div>
              </div>

              <div className="launch-workflow__card">
                <p className="launch-workflow__eyebrow">Stage Controls</p>
                <div className="launch-workflow__stage-actions">
                  <button type="button" onClick={() => advance("qa_ready")}>QA Ready</button>
                  <button type="button" onClick={() => advance("delivery_ready")}>Delivery Ready</button>
                  <button type="button" onClick={() => advance("launch_ready")}>Launch Ready</button>
                  <button type="button" onClick={() => advance("launched")}>Launched</button>
                  <button type="button" onClick={() => advance("clientops_active")}>ClientOps Active</button>
                </div>
              </div>

              <div className="launch-workflow__card">
                <p className="launch-workflow__eyebrow">Signoff Evidence</p>
                <CheckRow label="QA Signoff" present={isPresent(selectedRecord.qa_signoff)} />
                <CheckRow label="Operator Signoff" present={isPresent(selectedRecord.operator_signoff)} />
                <CheckRow label="Delivery Signoff" present={isPresent(selectedRecord.delivery_signoff)} />
                <CheckRow label="Client Signoff" present={isPresent(selectedRecord.client_signoff)} />
                <CheckRow label="Version Record" present={Boolean(selectedRecord.version_record?.version_id || selectedRecord.version_record?.version_label)} />
                <CheckRow label="Rollback Plan" present={Boolean(selectedRecord.rollback_plan?.owner && selectedRecord.rollback_plan?.last_known_good_version)} />
                <CheckRow label="ClientOps Activation" present={clientOpsAllowed} />
              </div>

              <div className="launch-workflow__card">
                <p className="launch-workflow__eyebrow">Launch Gate</p>
                <StatusPill status={selectedGate?.status} />
                <p className="launch-workflow__muted">
                  ClientOps activation is {clientOpsAllowed ? "Allowed" : "Blocked"}.
                </p>
              </div>

              <div className="launch-workflow__card">
                <p className="launch-workflow__eyebrow">Critical Blockers</p>
                {selectedBlockers.length ? (
                  <ul className="launch-workflow__list is-critical">
                    {selectedBlockers.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : <p className="launch-workflow__empty">No critical blockers.</p>}
              </div>

              <div className="launch-workflow__card">
                <p className="launch-workflow__eyebrow">Warnings</p>
                {selectedWarnings.length ? (
                  <ul className="launch-workflow__list">
                    {selectedWarnings.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : <p className="launch-workflow__empty">No warnings.</p>}
                {selectedGate?.paid_launch_blockers?.length ? (
                  <>
                    <p className="launch-workflow__eyebrow">Paid Launch Warnings</p>
                    <ul className="launch-workflow__list">
                      {selectedGate.paid_launch_blockers.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </>
                ) : null}
              </div>
            </>
          ) : (
            <div className="launch-workflow__card">
              <h2>No launch record selected</h2>
              <p>Create or load sample records to start the official launch readiness workflow.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
