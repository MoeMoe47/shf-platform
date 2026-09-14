import React from "react";
import PageHeader from "../../components/PageHeader";
import DetailPanel from "../../components/DetailPanel";
import useOperatorDashboard from "../../features/operator-dashboard/useOperatorDashboard";
import ExrJourneyContext from "@/components/exr/ExrJourneyContext.jsx";

export default function OperatorDashboard() {
  const { programs, cases } = useOperatorDashboard();

  return (
    <div>
      <PageHeader title="Operator Dashboard" subtitle="Pack 1 operational shell" />
      <ExrJourneyContext journeyId="bos-customer-operator" actor="org_operator" roleLabel="Organization operator" state="ACTIVE" currentWork={cases.length ? `${cases.length} cases need attention` : "No current cases"} nextAction={cases.length ? "Open current work" : "Review entitled services"} nextActionSource="DOMAIN_PROJECTION" />
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
