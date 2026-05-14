import React from "react";
import PageHeader from "../../components/PageHeader";
import DataTable from "../../components/DataTable";
import StatusChip from "../../components/StatusChip";
import ErrorBanner from "../../components/ErrorBanner";
import useProgramManagement from "../../features/program-management/useProgramManagement";

export default function ProgramManagement() {
  const { programs, error, createSampleProgram, activateProgram } = useProgramManagement();

  const columns = [
    { key: "name", label: "Name" },
    { key: "program_type", label: "Type" },
    { key: "status", label: "Status", render: (row) => <StatusChip value={row.status} /> },
    { key: "owner_team_id", label: "Owner Team" },
    { key: "updated_at", label: "Updated" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button onClick={() => activateProgram(row.program_id, row.status)}>
          Activate
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Program Management" subtitle="Governed program workflow" />
      <ErrorBanner message={error} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={createSampleProgram}>Create Sample Program</button>
      </div>
      <DataTable columns={columns} rows={programs} />
    </div>
  );
}
