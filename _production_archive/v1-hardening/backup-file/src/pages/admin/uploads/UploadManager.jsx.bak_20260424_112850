import React, { useState } from "react";
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

function isImageUpload(upload) {
  return Boolean(upload?.mime_type?.startsWith?.("image/") || upload?.preview_url);
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

  const authDebug = {
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    memberships: auth.memberships,
    permissions: auth.permissions,
    hasUploadsInternal: auth.hasPermission("uploads.internal"),
    hasUploadsEvidence: auth.hasPermission("uploads.evidence"),
    hasUploadsVideo: auth.hasPermission("uploads.video"),
  };

  async function handleUpload(e) {
    e.preventDefault();
    setStatus("");

    if (!file) {
      setStatus("Please choose a file first.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("visibility", visibility);

      const res = await fetch(`${API_BASE}/uploads`, {
        method: "POST",
        body: fd,
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Upload failed.");

      setStatus(`Upload completed for ${data?.upload?.file_name || file.name}.`);
      setRecentUploads((prev) => [data.upload, ...prev]);
      setFile(null);

      const input = document.getElementById("real-upload-input");
      if (input) input.value = "";
    } catch (err) {
      setStatus(err?.message || "Upload failed.");
    }
  }

  if (!canUpload) {
    return (
      <div style={{ padding: 24, color: "#fca5a5" }}>
        <div style={{ marginBottom: 12 }}>You do not have upload access.</div>
        <pre style={{ color: "#cbd5e1", whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.4 }}>
          {JSON.stringify(authDebug, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: "#e2e8f0" }}>
      <h1>Upload Manager</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        Manage documents, evidence, media, and video uploads.
      </p>

      <form
        onSubmit={handleUpload}
        style={{
          display: "grid",
          gap: 12,
          maxWidth: 900,
          padding: 16,
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>Upload File</h2>

        <input
          id="real-upload-input"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          style={{ padding: 12, borderRadius: 10 }}
        >
          <option value="public">public</option>
          <option value="internal">internal</option>
          <option value="org_only">org_only</option>
          <option value="restricted_case">restricted_case</option>
          <option value="leadership_only">leadership_only</option>
        </select>

        <button
          type="submit"
          disabled={!file}
          style={{
            padding: 12,
            borderRadius: 10,
            cursor: "pointer",
            opacity: !file ? 0.6 : 1,
          }}
        >
          Upload
        </button>

        {status ? (
          <div
            style={{
              color: status.toLowerCase().includes("failed") || status.toLowerCase().includes("please")
                ? "#fca5a5"
                : "#86efac",
              fontWeight: 600,
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            {status}
          </div>
        ) : null}
      </form>

      <div
        style={{
          marginBottom: 24,
          padding: 16,
          border: "1px solid rgba(148,163,184,0.2)",
          borderRadius: 16,
          maxWidth: 900,
        }}
      >
        <h2>Recent Uploads</h2>
        {recentUploads.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No uploads created in this session yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {recentUploads.map((upload, idx) => (
              <div
                key={upload?.id || idx}
                style={{
                  padding: 12,
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 12,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  {upload?.file_name || "unknown"}
                </div>

                <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 10 }}>
                  {upload?.visibility || "internal"} — {upload?.status || "uploaded"}
                </div>

                {isImageUpload(upload) && upload?.preview_url ? (
                  <div style={{ marginBottom: 10 }}>
                    <img
                      src={upload.preview_url}
                      alt={upload.file_name || "uploaded image"}
                      style={{
                        maxWidth: 320,
                        maxHeight: 220,
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.2)",
                        display: "block",
                      }}
                    />
                  </div>
                ) : null}

                {upload?.url ? (
                  <a
                    href={upload.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#93c5fd" }}
                  >
                    Open uploaded file
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
