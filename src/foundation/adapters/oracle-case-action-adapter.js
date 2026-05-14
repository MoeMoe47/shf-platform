const BASE = "http://127.0.0.1:8091";

export async function promoteCase(entityId) {
  try {
    const res = await fetch(`${BASE}/oracle/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entityId,
        action: "promote_case",
      }),
    });

    if (!res.ok) {
      throw new Error("Oracle action failed");
    }

    const data = await res.json();
    return {
      success: true,
      message: data?.message || "Case promoted successfully",
      data,
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || "Failed to promote case",
    };
  }
}
