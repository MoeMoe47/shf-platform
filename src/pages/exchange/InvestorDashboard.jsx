import React from "react";
import { fetchExchangeFundingCommitmentCountReport } from "@/shared/reporting/exchangeFundingCommitmentReportingClient";

function useExchangeFundingCommitmentCount() {
  const [state, setState] = React.useState({ status: "loading", value: null });

  React.useEffect(() => {
    let active = true;
    fetchExchangeFundingCommitmentCountReport()
      .then((report) => {
        if (active) setState({ status: "ready", value: report.metric_results[0].value });
      })
      .catch(() => {
        if (active) setState({ status: "unavailable", value: null });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export default function InvestorDashboard() {
  const commitmentCount = useExchangeFundingCommitmentCount();

  return (
    <section
      style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h2 style={{ marginTop: 0 }}>Investor Dashboard</h2>
      <p style={{ color: "#cbd5e1", lineHeight: 1.6, marginBottom: 0 }}>
        This surface will show pool performance, capital deployment, verified outcomes,
        rankings, risk monitoring, and allocation controls for funders and investors.
      </p>
      <div
        aria-label="Funding commitments recorded"
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 700 }}>Funding Commitments</div>
        <div aria-live="polite" style={{ color: "#f8fafc", fontSize: 28, fontWeight: 800, marginTop: 6 }}>
          {commitmentCount.status === "ready" ? commitmentCount.value : commitmentCount.status === "loading" ? "Loading" : "Unavailable"}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
          Commitments that entered the committed state.
        </div>
      </div>
    </section>
  );
}
