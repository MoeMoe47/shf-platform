import { API_BASE as SHS_API_BASE } from "@/lib/apiClient.js";

const BASE = SHS_API_BASE;

export async function saveExport(record: any) {
  await fetch(`${BASE}/reporting/exports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(record),
  });
}

export async function fetchExports() {
  const res = await fetch(`${BASE}/reporting/exports`);
  const data = await res.json();
  return data.items || [];
}
