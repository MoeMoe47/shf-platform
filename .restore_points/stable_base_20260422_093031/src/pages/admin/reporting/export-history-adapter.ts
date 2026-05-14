const BASE = "http://localhost:8091";

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
