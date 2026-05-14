import React from "react";
import PageHeader from "../../components/PageHeader";
import DetailPanel from "../../components/DetailPanel";
import useOperatorDashboard from "../../features/operator-dashboard/useOperatorDashboard";

export default function OperatorDashboard() {
  const { programs, cases } = useOperatorDashboard();

  return (
    <div>
      <PageHeader title="Operator Dashboard" subtitle="Pack 1 operational shell" />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
        <DetailPanel title="Recent Programs">
          <ul>{programs.map((p) => <li key={p.program_id}>{p.name} — {p.status}</li>)}</ul>
        </DetailPanel>
        <DetailPanel title="Recent Cases">
          <ul>{cases.map((c) => <li key={c.case_id}>{c.case_id} — {c.status}</li>)}</ul>
        </DetailPanel>
      </div>
    </div>
  );
}
