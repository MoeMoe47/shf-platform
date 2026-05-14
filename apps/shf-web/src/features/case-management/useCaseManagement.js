import { useEffect, useState } from "react";
import {
  listCases,
  createCase,
  assignCase,
  transitionCase,
} from "../../services/cases-client";
import { listAudit } from "../../services/audit-client";

export default function useCaseManagement() {
  const [cases, setCases] = useState([]);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const c = await listCases();
      const a = await listAudit();
      setCases(c?.data?.items || []);
      setAudit(a?.data?.items || []);
    } catch (err) {
      setError(err.message || "Failed to load cases.");
    }
  }

  async function createSampleCase() {
    const res = await createCase({
      program_id: "program_seed_001",
      case_type: "participant_support",
      priority: "medium",
    });
    if (!res.ok) {
      setError(res?.error?.message || "Failed to create case.");
      return;
    }
    await load();
  }

  async function assignSampleCase(caseId) {
    const res = await assignCase(caseId, {
      assigned_user_id: "user_operator_001",
      assigned_team_id: "team_ops_001",
      reason_text: "Assigned from UI.",
    });
    if (!res.ok) {
      setError(res?.error?.message || "Failed to assign case.");
      return;
    }
    await load();
  }

  async function moveCaseToReview(caseId, currentStatus = "assigned") {
    const res = await transitionCase(caseId, {
      current_status: currentStatus,
      next_status: "in_review",
      reason_text: "Moved to review from UI.",
    });
    if (!res.ok) {
      setError(res?.error?.message || "Failed to transition case.");
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return {
    cases,
    audit,
    error,
    load,
    createSampleCase,
    assignSampleCase,
    moveCaseToReview,
  };
}
