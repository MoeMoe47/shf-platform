import React from "react";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import DetailPanel from "../../components/DetailPanel";
import AuditSnippet from "../../components/AuditSnippet";
import ErrorBanner from "../../components/ErrorBanner";
import useCaseManagement from "../../features/case-management/useCaseManagement";

export default function CaseManagement() {
  const {
    cases,
    audit,
    error,
    createSampleCase,
    assignSampleCase,
    moveCaseToReview,
  } = useCaseManagement();

  const columns = [
    { key: "case_id", label: "Case ID" },
    { key: "case_type", label: "Type" },
    { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} /> },
    { key: "priority", label: "Priority" },
    { key: "program_id", label: "Program" },
    { key: "updated_at", label: "Updated" },
    {
      key: "assign",
      label: "Assign",
      render: (row) => (
        <button onClick={() => assignSampleCase(row.case_id)}>Assign</button>
      ),
    },
    {
      key: "review",
      label: "Move to Review",
      render: (row) => (
        <button onClick={() => moveCaseToReview(row.case_id, row.status)}>
          Review
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Case Management" subtitle="Governed case workflow" />
      <ErrorBanner message={error} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={createSampleCase}>Create Sample Case</button>
      </div>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr" }}>
        <DataTable columns={columns} rows={cases} />
        <DetailPanel title="Audit Activity">
          <AuditSnippet items={audit} />
        </DetailPanel>
      </div>
    </div>
  );
}
