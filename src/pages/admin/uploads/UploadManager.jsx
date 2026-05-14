import React, { useState } from "react";
import "@/styles/admin.appRegistry.css";
import useAuth from "../../../auth/useAuth";

const API_BASE =
  window.__SHS_API_BASE__ ||
  (import.meta.env.VITE_SHS_API_BASE || "/api");

async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export default function UploadManager() {
  const auth = useAuth();
  const [file, setFile] = useState(null);
  const [visibility, setVisibility] = useState("internal");
  const [status, setStatus] = useState("");
  const [recentUploads, setRecentUploads] = useState([]);

  const canUpload =
    auth.hasPermission("uploads.internal") ||
    auth.hasPermission("uploads.evidence") ||
    auth.hasPermission("uploads.video");

  if (!canUpload) {
    return (
      <div className="ar-wrap">
        <div className="ar-card">
          <div className="ar-sub" style={{ color: "#fca5a5" }}>You do not have upload access.</div>
        </div>
      </div>
    );
  }

  async function handleUpload(e) {
    e.preventDefault();
    setStatus("");

    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          visibility,
        }),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Upload failed.");

      setStatus(`Upload completed for ${data?.upload?.file_name || file.name}.`);
      setRecentUploads((prev) => [data.upload, ...prev]);
      setFile(null);

      const input = document.getElementById("upload-demo-input");
      if (input) input.value = "";
    } catch (err) {
      setStatus(err?.message || "Upload failed.");
    }
  }

  return (
    <div className="ar-wrap">
      <header className="ar-head">
        <div>
          <div className="ar-kicker">System</div>
          <h1 className="ar-title">Upload Manager</h1>
          <div className="ar-sub">Demo upload surface using metadata-backed uploads for V1 testing.</div>
        </div>
      </header>

      <section className="ar-card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Upload File</h3>
        <form onSubmit={handleUpload} style={{ display: "grid", gap: 12, maxWidth: 840 }}>
          <input
            id="upload-demo-input"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(10,14,24,0.45)", color: "#e8eefc" }}
          />

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(10,14,24,0.45)", color: "#e8eefc" }}
          >
            <option value="public">public</option>
            <option value="internal">internal</option>
            <option value="org_only">org_only</option>
            <option value="restricted_case">restricted_case</option>
            <option value="leadership_only">leadership_only</option>
          </select>

          <div>
            <button className="ar-btn" type="submit" disabled={!file}>
              Upload
            </button>
          </div>

          {status ? (
            <div className="ar-sub" style={{ color: status.toLowerCase().includes("failed") ? "#fca5a5" : "#86efac" }}>
              {status}
            </div>
          ) : null}
        </form>
      </section>

      <section className="ar-card">
        <h3 style={{ marginTop: 0, marginBottom: 14 }}>Recent Uploads</h3>
        {recentUploads.length === 0 ? (
          <div className="ar-sub">No uploads created in this session yet.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {recentUploads.map((upload, idx) => (
              <li key={upload?.id || idx} style={{ marginBottom: 8 }}>
                {upload?.file_name || "unknown"} — {upload?.visibility || "internal"} — {upload?.status || "uploaded"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
