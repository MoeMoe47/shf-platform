/**
 * Tiny download helpers (no deps)
 */
export function download(filename, data, mime = "application/octet-stream") {
  try {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("download() failed", e);
    return false;
  }
}

export function downloadText(filename, text) {
  return download(filename, String(text ?? ""), "text/plain;charset=utf-8");
}

export function downloadJSON(filename, obj) {
  const json = JSON.stringify(obj, null, 2);
  return download(filename, json, "application/json;charset=utf-8");
}
