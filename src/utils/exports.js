/**
 * saveArtifact — stores a portfolio artifact in localStorage.
 * Shape is flexible; we minimally set id, createdAt, app, and title.
 */
export function saveArtifact(artifact) {
  try {
    const key = "portfolio:items";
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    const entry = {
      id: artifact?.id || `art-${Date.now()}`,
      createdAt: Date.now(),
      app: artifact?.app || "civic",
      title: artifact?.title || "Artifact",
      ...artifact,
    };
    items.unshift(entry);
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("portfolio:update"));
    return entry;
  } catch (e) {
    console.error("saveArtifact failed", e);
    return null;
  }
}

/**
 * downloadCSV — minimal CSV downloader for arrays of objects.
 */
export function downloadCSV(rows, filename = "export.csv") {
  try {
    if (!Array.isArray(rows) || rows.length === 0) {
      const blob = new Blob([""], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      return;
    }
    const keys = Array.from(
      rows.reduce((s, r) => {
        Object.keys(r).forEach((k) => s.add(k));
        return s;
      }, new Set())
    );
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = keys.map(esc).join(",");
    const body = rows.map((r) => keys.map((k) => esc(r[k])).join(",")).join("\n");
    const csv = header + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  } catch (e) {
    console.warn("downloadCSV failed", e);
  }
}
