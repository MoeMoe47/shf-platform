export async function sendOracleAction(entityId, action) {
  const res = await fetch("http://localhost:8091/oracle/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ entityId, action }),
  });

  if (!res.ok) {
    throw new Error("Oracle action request failed");
  }

  return res.json();
}
