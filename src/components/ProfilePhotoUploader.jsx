// src/components/ProfilePhotoUploader.jsx
import React, { useEffect, useRef, useState } from "react";

export default function ProfilePhotoUploader({
  storageKey = "sh_profile_photo",
  label = "Profile photo",
  hint = "PNG or JPG, up to ~3 MB",
  onChange,
  circle = true,
}) {
  const [dataUrl, setDataUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey); if (saved) setDataUrl(saved); } catch {}
  }, [storageKey]);

  function handleClick(){ inputRef.current?.click(); }

  async function handleFiles(fileList){
    setError("");
    const file = fileList?.[0];
    if(!file) return;
    if(!/^image\/(png|jpe?g|webp)$/i.test(file.type)){ setError("Please choose a PNG, JPG, or WEBP image."); return; }
    if(file.size > 3*1024*1024){ setError("File is too large. Please keep it under ~3 MB."); return; }
    try{
      const resized = await toDataUrlResized(file, 512);
      setDataUrl(resized);
      try { localStorage.setItem(storageKey, resized); } catch {}
      onChange?.(resized);
      // ping same-tab listeners (header avatar) by forcing a focus event read later
    } catch(e){ setError("Sorry, we couldn't process that image."); console.error(e); }
  }

  function onInputChange(e){ handleFiles(e.target.files); e.target.value=""; }
  function onDrop(e){ e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }
  function onDragOver(e){ e.preventDefault(); setDragOver(true); }
  function onDragLeave(){ setDragOver(false); }
  function clearPhoto(){ setDataUrl(null); try{ localStorage.removeItem(storageKey); }catch{} onChange?.(null); }

  return (
    <div className="sh-card" style={{ border: "1px solid var(--line,#e5e7eb)", borderRadius: 14 }}>
      <div className="sh-cardBody" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontWeight: 600 }}>{label}</label>
          {dataUrl ? <button type="button" className="sh-link" onClick={clearPhoto} style={{ background:"none", border:0, cursor:"pointer" }}>Remove</button> : null}
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-label="Upload profile photo"
          onClick={handleClick}
          onKeyDown={(e)=> (e.key==="Enter"||e.key===" ")&&handleClick()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            display: "grid",
            gridTemplateColumns: "96px 1fr",
            gap: 16,
            alignItems: "center",
            border: "1px dashed var(--line,#e5e7eb)",
            borderRadius: 12,
            padding: 12,
            cursor: "pointer",
            userSelect: "none",
            background: dragOver ? "rgba(37,99,235,.06)" : "transparent",
          }}
        >
          <div style={{ width: 96, height: 96 }}>
            {dataUrl ? (
              <img src={dataUrl} alt="Profile preview" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius: circle ? 999 : 10 }} />
            ) : (
              <div
                aria-hidden
                style={{
                  width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                  background:"linear-gradient(180deg,#f3f4f6,#e5e7eb)", border:"1px solid var(--line,#e5e7eb)", borderRadius: circle ? 999 : 10
                }}
              >
                <span style={{ fontSize: 40, opacity: .7 }}>👤</span>
              </div>
            )}
          </div>

          <div style={{ display:"grid", gap: 8 }}>
            <div className="sh-muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
              Drag & drop, or <span className="sh-link" style={{ textDecoration:"underline" }}>browse</span>.<br/>
              <small className="sh-muted">{hint}</small>
            </div>
            <div style={{ display:"flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="sh-btn" onClick={handleClick} style={{ padding:"8px 12px", borderRadius: 10, border:"1px solid var(--line,#e5e7eb)", background:"#fff" }}>
                Upload
              </button>
              {dataUrl ? (
                <button type="button" className="sh-btn sh-btn--soft" onClick={clearPhoto} style={{ padding:"8px 12px", borderRadius:10, border:"1px solid var(--line,#e5e7eb)", background:"rgba(0,0,0,.03)" }}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <input ref={inputRef} type="file" accept="image/*" capture="user" onChange={onInputChange} hidden />
        </div>

        {error ? <div className="sh-error" style={{ color:"#b91c1c", fontSize:13 }}>{error}</div> : null}
      </div>
    </div>
  );
}

async function toDataUrlResized(file, maxDim = 512) {
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let out;
  try { out = canvas.toDataURL("image/webp", 0.9); }
  catch { out = canvas.toDataURL("image/jpeg", 0.9); }
  return out;
}
/* --- SHF: Profile photo upload award --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_profilePhoto) return;
  window.__shfHook_profilePhoto = true;

  const DAILY = 24 * 60 * 60 * 1000;
  const ok = () => {
    const tag = "shf.award.profile.photo";
    const last = Number(localStorage.getItem(tag) || 0);
    if (Date.now() - last < DAILY) return false; // once per day
    localStorage.setItem(tag, String(Date.now()));
    return true;
  };

  window.addEventListener("profile:photo-uploaded", (e) => {
    if (!ok()) return;
    const { bytes = 0, type = "" } = (e && e.detail) || {};
    try {
      window.shfCredit?.earn?.({
        action: "profile.photo",
        rewards: { corn: 2 }, // 🌽
        scoreDelta: 4,
        meta: { bytes, type }
      });
      window.shToast?.("🖼️ Photo updated · +2 🌽 · +4 score");
    } catch {}
  });

  // helper
  window.shfAward = Object.assign({}, window.shfAward || {}, {
    profilePhotoUploaded: (bytes, type) =>
      window.dispatchEvent(new CustomEvent("profile:photo-uploaded", { detail: { bytes, type } }))
  });
})();
/* --- SHF: Profile photo set (once) --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_profilePhoto) return;
  window.__shfHook_profilePhoto = true;

  const KEY = "shf.award.profile.photo.v1";

  // Fire this in your photo save handler:
  //   window.dispatchEvent(new CustomEvent("profile:photo:set"))
  window.addEventListener("profile:photo:set", () => {
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, "1");
    try {
      window.shfCredit?.earn?.({
        action: "profile.photo.set",
        rewards: { corn: 2 },
        scoreDelta: 2,
        meta: { via: "uploader" }
      });
      window.shToast?.("🖼️ Profile photo set · +2 🌽 · +2 score");
    } catch {}
  });
})();
