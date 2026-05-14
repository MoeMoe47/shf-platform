import React from "react";
import { useRole } from "@/context/RoleCtx.jsx";

export default function RoleSwitch({ compact = true }) {
  const { role, setRole } = useRole();
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {!compact && <span className="db-subtitle">Role</span>}
      <select
        className="sh-input"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ padding: "3px 8px", height: 28 }}
      >
        <option value="student">Student</option>
        <option value="counselor">Counselor</option>
        <option value="admin">Admin</option>
      </select>
    </label>
  );
}
