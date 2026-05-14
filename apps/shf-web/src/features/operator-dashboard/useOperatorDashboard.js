import { useEffect, useState } from "react";
import { listPrograms } from "../../services/programs-client";
import { listCases } from "../../services/cases-client";

export default function useOperatorDashboard() {
  const [programs, setPrograms] = useState([]);
  const [cases, setCases] = useState([]);

  useEffect(() => {
    async function load() {
      const p = await listPrograms();
      const c = await listCases();
      setPrograms(p.data.items || []);
      setCases(c.data.items || []);
    }
    load();
  }, []);

  return { programs, cases };
}
