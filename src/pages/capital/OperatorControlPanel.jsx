import React from "react";
import BaseOperatorControlPanel from "./OperatorControlPanel.base";
import OperatorEventTimeline from "@/components/operator/OperatorEventTimeline";
import {
  fetchOperatorEvents,
  resolveOperatorDispute,
  createOperatorPool,
} from "@/lib/operatorApi";
import ContractsPanel from "@/components/operator/ContractsPanel";
import AllocationsPanel from "@/components/operator/AllocationsPanel";
import PoolsPanel from "@/components/operator/PoolsPanel";
import LedgerPanel from "@/components/operator/LedgerPanel";
import IssuancesPanel from "@/components/operator/IssuancesPanel";

function ActionCard({ title, children }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12, color: "#f8fafc" }}>{title}</h3>
      {children}
    </section>
  );
}

export default function OperatorControlPanel() {
  const [operatorEvents, setOperatorEvents] = React.useState([]);
  const [eventsLoading, setEventsLoading] = React.useState(false);
  const [eventsError, setEventsError] = React.useState("");
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState("");
  const [actionSuccess, setActionSuccess] = React.useState("");

  const [resolveForm, setResolveForm] = React.useState({
    disputeId: "test1",
    resolution: "approved",
    actor_id: "operator_admin",
  });

  const [poolForm, setPoolForm] = React.useState({
    name: "",
    program_id: "pilot",
    committed_amount: 100000,
    actor_id: "operator_admin",
  });

  const loadOperatorEvents = React.useCallback(async () => {
    try {
      setEventsLoading(true);
      setEventsError("");
      const data = await fetchOperatorEvents(50);
      setOperatorEvents(data.events || []);
    } catch (err) {
      setEventsError(err.message || "Failed to load operator events");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadOperatorEvents();
  }, [loadOperatorEvents]);

  React.useEffect(() => {
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.overflowX = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflowX = "hidden";
    document.body.style.background = "#020817";
  }, []);

  async function handleResolveDispute(event) {
    event.preventDefault();
    try {
      setActionBusy(true);
      setActionError("");
      setActionSuccess("");

      await resolveOperatorDispute(resolveForm.disputeId, {
        resolution: resolveForm.resolution,
        actor_id: resolveForm.actor_id,
      });

      setActionSuccess(`Dispute ${resolveForm.disputeId} resolved`);
      await loadOperatorEvents();
    } catch (err) {
      setActionError(err.message || "Resolve dispute failed");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCreatePool(event) {
    event.preventDefault();
    try {
      setActionBusy(true);
      setActionError("");
      setActionSuccess("");

      await createOperatorPool({
        ...poolForm,
        committed_amount: Number(poolForm.committed_amount),
      });

      setActionSuccess("Pool created");
      setPoolForm((prev) => ({ ...prev, name: "", committed_amount: 100000 }));
      await loadOperatorEvents();
    } catch (err) {
      setActionError(err.message || "Create pool failed");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          background: #020817;
        }
      `}</style>

      <div
        style={{
          display: "grid",
          gap: 20,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "hidden",
          boxSizing: "border-box",
          background: "#020817",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            overflowX: "auto",
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            style={{
              minWidth: 0,
              width: "100%",
            }}
          >
            <BaseOperatorControlPanel />
          </div>
        </div>

        <section
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(0, 1fr))",
            alignItems: "start",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            padding: "0 12px 12px",
          }}
        >
          <ActionCard title="Quick Resolve Dispute">
            <form onSubmit={handleResolveDispute}>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  value={resolveForm.disputeId}
                  onChange={(e) => setResolveForm((p) => ({ ...p, disputeId: e.target.value }))}
                  placeholder="Dispute ID"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                />
                <select
                  value={resolveForm.resolution}
                  onChange={(e) => setResolveForm((p) => ({ ...p, resolution: e.target.value }))}
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                >
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="needs_review">needs_review</option>
                </select>
                <input
                  value={resolveForm.actor_id}
                  onChange={(e) => setResolveForm((p) => ({ ...p, actor_id: e.target.value }))}
                  placeholder="Actor ID"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button type="submit" disabled={actionBusy}>
                  {actionBusy ? "Working..." : "Resolve Dispute"}
                </button>
              </div>
            </form>
          </ActionCard>

          <ActionCard title="Create Pool">
            <form onSubmit={handleCreatePool}>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  value={poolForm.name}
                  onChange={(e) => setPoolForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Pool name"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                />
                <input
                  value={poolForm.program_id}
                  onChange={(e) => setPoolForm((p) => ({ ...p, program_id: e.target.value }))}
                  placeholder="Program ID"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                />
                <input
                  type="number"
                  value={poolForm.committed_amount}
                  onChange={(e) => setPoolForm((p) => ({ ...p, committed_amount: e.target.value }))}
                  placeholder="Committed amount"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                />
                <input
                  value={poolForm.actor_id}
                  onChange={(e) => setPoolForm((p) => ({ ...p, actor_id: e.target.value }))}
                  placeholder="Actor ID"
                  style={{ width: "100%", minWidth: 0, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button type="submit" disabled={actionBusy}>
                  {actionBusy ? "Working..." : "Create Pool"}
                </button>
              </div>
            </form>
          </ActionCard>
        </section>

        {(actionSuccess || actionError) ? (
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.04)",
              margin: "0 12px",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            {actionSuccess ? <div style={{ color: "#7dffa1", marginBottom: actionError ? 8 : 0, wordBreak: "break-word" }}>{actionSuccess}</div> : null}
            {actionError ? <div style={{ color: "#ff8080", wordBreak: "break-word" }}>{actionError}</div> : null}
          </section>
        ) : null}

        <section
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "start",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            padding: "0 12px 12px",
          }}
        >
          <ContractsPanel />
          <AllocationsPanel />
          <PoolsPanel />
          <LedgerPanel />
          <IssuancesPanel />
        </section>

        <section
          style={{
            padding: "0 12px 20px",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <OperatorEventTimeline
            events={operatorEvents}
            loading={eventsLoading}
            error={eventsError}
          />
        </section>
      </div>
    </>
  );
}
