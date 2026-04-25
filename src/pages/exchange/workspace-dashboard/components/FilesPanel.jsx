import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createWorkspaceFile,
  formatFileSize,
  readWorkspaceFiles,
} from "../dashboardUtils";

const starterFiles = [
  {
    id: "starter-file-1",
    name: "Franklin_County_Evidence_Package.zip",
    type: "ZIP",
    size: "24.2 MB",
    category: "Evidence",
    status: "Uploaded",
    source: "Workspace",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "starter-file-2",
    name: "Hamilton_Providers_List_2025.xlsx",
    type: "XLSX",
    size: "782 KB",
    category: "Provider Data",
    status: "Uploaded",
    source: "Workspace",
    uploadedAt: new Date().toISOString(),
  },
  {
    id: "starter-file-3",
    name: "Q2_Contradictions_Log.pdf",
    type: "PDF",
    size: "1.8 MB",
    category: "Audit",
    status: "Uploaded",
    source: "Workspace",
    uploadedAt: new Date().toISOString(),
  },
];

function fileTypeLabel(file) {
  const rawType = file?.type || "";
  if (rawType.includes("/")) return rawType.split("/").pop().toUpperCase();
  if (rawType) return rawType.toUpperCase();

  const ext = String(file?.name || "").split(".").pop();
  return ext ? ext.toUpperCase() : "FILE";
}

function formatUploadedAt(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

export default function FilesPanel() {
  const inputRef = useRef(null);

  const [files, setFiles] = useState(() => {
    const stored = readWorkspaceFiles();
    return stored.length ? stored : starterFiles;
  });

  const [category, setCategory] = useState("Evidence");
  const [status, setStatus] = useState("Uploaded");

  useEffect(() => {
    function handleFilesUpdate(event) {
      if (Array.isArray(event.detail)) setFiles(event.detail);
    }

    window.addEventListener("shsDash:filesUpdated", handleFilesUpdate);
    return () => window.removeEventListener("shsDash:filesUpdated", handleFilesUpdate);
  }, []);

  const recentFiles = useMemo(() => files.slice(0, 8), [files]);

  function openFilePicker() {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  function handleFile(file) {
    if (!file) return;

    const next = createWorkspaceFile({
      name: file.name,
      type: fileTypeLabel(file),
      size: formatFileSize(file.size),
      category,
      status,
      source: "Dashboard upload",
    });

    setFiles((current) => [next, ...current].slice(0, 40));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="shsDash-card shsDash-filesPanel">
      <div className="shsDash-workspaceHead">
        <div>
          <h2>Files</h2>
          <p>Upload and manage workspace files before they become evidence, imports, reports, or audit material.</p>
        </div>
      </div>

      <div className="shsDash-filesGrid">
        <article className="shsDash-fileUploader">
          <div className="shsDash-sectionHead">
            <h2>📁 Upload File</h2>
            <button type="button" onClick={openFilePicker}>Choose File</button>
          </div>

          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <button
            className="shsDash-fileDrop"
            type="button"
            onClick={openFilePicker}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files?.[0]);
            }}
          >
            <span>☁</span>
            <strong>Drag & drop file here</strong>
            <small>or click to select from your computer</small>
          </button>

          <div className="shsDash-fileFields">
            <label>
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="Evidence">Evidence</option>
                <option value="Provider Data">Provider Data</option>
                <option value="County Data">County Data</option>
                <option value="Report">Report</option>
                <option value="Audit">Audit</option>
                <option value="Workspace">Workspace</option>
              </select>
            </label>

            <label>
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="Uploaded">Uploaded</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Ready for Import">Ready for Import</option>
                <option value="Evidence Candidate">Evidence Candidate</option>
              </select>
            </label>
          </div>

          <section className="shsDash-fileRule">
            <strong>Files Rule</strong>
            <p>
              Files live in the Workspace Dashboard until they are promoted into evidence,
              import records, audit material, analyst memo context, or Command Surface decision context.
            </p>
          </section>
        </article>

        <article className="shsDash-fileList">
          <div className="shsDash-sectionHead">
            <h2>Recent Workspace Files</h2>
            <button type="button">View All →</button>
          </div>

          {recentFiles.map((file) => (
            <div className="shsDash-fileItem" key={file.id}>
              <span>📁</span>
              <div>
                <strong>{file.name}</strong>
                <p>{file.category} · {file.status} · {file.size}</p>
                <small>{file.source || "Workspace"} · {formatUploadedAt(file.uploadedAt)}</small>
              </div>
              <b>{file.type}</b>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
