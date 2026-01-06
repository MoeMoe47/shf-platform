// src/utils/downloads.js

/** Download a string as a file. */
export function downloadText(
  text,
  filename = "download.txt",
  mime = "text/plain;charset=utf-8"
) {
  const blob = new Blob([text], { type: mime });
  downloadBlob(blob, filename);
}

/** Download a Blob as a file. */
export function downloadBlob(blob, filename = "download.bin") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  // in case the element isn't added to the DOM in some browsers
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download a data URL (e.g., canvas.toDataURL()) as a file. */
export function downloadDataURL(dataUrl, filename = "download") {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Optional default export so both import styles work:
//   import { downloadText } from "../utils/downloads.js"
//   import dl from "../utils/downloads.js"; dl.downloadText(...)
export default { downloadText, downloadBlob, downloadDataURL };
