const API_BASE = "http://localhost:8091";

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getMe(token = "dev-token:user_operator_001") {
  const res = await fetch(`${API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}
