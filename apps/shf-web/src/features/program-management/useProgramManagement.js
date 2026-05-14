import { useEffect, useState } from "react";
import {
  listPrograms,
  createProgram,
  transitionProgram,
} from "../../services/programs-client";

export default function useProgramManagement() {
  const [programs, setPrograms] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const res = await listPrograms();
      setPrograms(res?.data?.items || []);
    } catch (err) {
      setError(err.message || "Failed to load programs.");
    }
  }

  async function createSampleProgram() {
    const res = await createProgram({
      name: "New Pack 1 Program",
      program_type: "education",
      owner_team_id: "team_prog_001",
    });
    if (!res.ok) {
      setError(res?.error?.message || "Failed to create program.");
      return;
    }
    await load();
  }

  async function activateProgram(programId, currentStatus = "draft") {
    const res = await transitionProgram(programId, {
      current_status: currentStatus,
      next_status: "active",
      reason_text: "Activated from UI.",
    });
    if (!res.ok) {
      setError(res?.error?.message || "Failed to transition program.");
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return { programs, error, load, createSampleProgram, activateProgram };
}
