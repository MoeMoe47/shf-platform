// src/pages/career/portfolio-sections/AvatarUploader.jsx
//
// Extracted from the pre-existing inline AvatarUploader in Portfolio.jsx.
// Same localStorage-backed upload/resize/validation logic, unchanged;
// now dispatches "sh-profile-photo-updated" so StudentProfileHero and
// ProfileStrength (which read the same storage key) update live.
import React from "react";

const STORAGE_KEY = "sh_profile_photo";

function earn(detail) {
  try {
    if (window.shfCredit?.earn) return window.shfCredit.earn(detail);
    window.dispatchEvent(new CustomEvent("shf-credit-earn", { detail }));
  } catch {}
}

async function resizeToDataURL(file, maxDim = 512) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  try {
    return c.toDataURL("image/webp", 0.9);
  } catch {
    return c.toDataURL("image/jpeg", 0.9);
  }
}

export default function AvatarUploader() {
  const [dataUrl, setDataUrl] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    try {
      const x = localStorage.getItem(STORAGE_KEY);
      if (x) setDataUrl(x);
    } catch {}
  }, []);

  const pick = () => inputRef.current?.click();
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }
  function onDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave() {
    setDragOver(false);
  }
  function onInput(e) {
    handleFiles(e.target.files);
    e.target.value = "";
  }
  function notifyUpdated() {
    try {
      window.dispatchEvent(new CustomEvent("sh-profile-photo-updated"));
    } catch {}
  }
  function clear() {
    setDataUrl(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    notifyUpdated();
  }

  async function handleFiles(list) {
    setError("");
    const f = list?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(f.type)) {
      setError("PNG/JPG/WEBP only.");
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      setError("Keep it under ~3 MB.");
      return;
    }
    try {
      const out = await resizeToDataURL(f, 512);
      setDataUrl(out);
      try {
        localStorage.setItem(STORAGE_KEY, out);
      } catch {}
      notifyUpdated();
      earn({ action: "profile.photo.upload", rewards: { heart: 1 }, scoreDelta: 3 });
    } catch (err) {
      console.error(err);
      setError("Couldn't process that image.");
    }
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>Profile photo</h3>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload profile photo"
        onClick={pick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        style={{
          display: "grid",
          gridTemplateColumns: "88px 1fr",
          gap: 16,
          alignItems: "center",
          border: "1px dashed var(--sp-ring, #e7e2d8)",
          borderRadius: 12,
          padding: 12,
          cursor: "pointer",
          userSelect: "none",
          background: dragOver ? "var(--sp-orange-tint, #fff1e8)" : "transparent",
        }}
      >
        <div style={{ width: 88, height: 88 }}>
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Profile preview"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 999 }}
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg,#f3f4f6,#e5e7eb)",
                border: "1px solid var(--sp-ring, #e7e2d8)",
                borderRadius: 999,
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.6">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c1.6-4 4.8-6 8-6s6.4 2 8 6" />
              </svg>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--sp-muted, #6b7280)", lineHeight: 1.4 }}>
            Drag &amp; drop, or <span style={{ textDecoration: "underline" }}>browse</span>.
            <br />
            <small>PNG/JPG/WEBP • up to ~3 MB</small>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="sp-btn sp-btnSecondary" style={{ minHeight: 36, padding: "6px 12px" }} onClick={pick}>
              Upload
            </button>
            {dataUrl && (
              <button type="button" className="sp-btn sp-btnSecondary" style={{ minHeight: 36, padding: "6px 12px" }} onClick={clear}>
                Remove
              </button>
            )}
          </div>
        </div>

        <input ref={inputRef} type="file" accept="image/*" onChange={onInput} hidden />
      </div>
      {error && (
        <p role="alert" style={{ color: "var(--sp-danger, #b91c1c)", marginTop: 8, fontSize: 13 }}>
          {error}
        </p>
      )}
    </div>
  );
}
