import React from "react";

export default function ProfileHeader({
  name = "Student Name",
  avatarUrl = "",
  onUploadPhoto,
  onRemovePhoto,
  notes = "",
  onChangeNotes,
  meta = {
    totalArtifacts: 0,
    streak: "—",
    types: "—",
    lastUpdate: "—",
    progressToTarget: 0,   // 0–100
    growthPct: 0,          // 0–100
  },
}) {
  return (
    <section className="sh-card" role="group" aria-labelledby="profile-header">
      <div className="sh-cardStripe" />
      <div className="sh-cardBody">
        <h2 id="profile-header" className="sh-cardTitle">Profile</h2>

        <div className="sh-profWrap">
          {/* left: avatar + actions */}
          <div className="sh-profLeft">
            <div className="sh-profAvatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${name} avatar`} />
              ) : (
                <div className="sh-profAvatarPh">SH</div>
              )}
            </div>

            <div className="sh-profActions">
              <button className="sh-btn sh-btn--secondary" onClick={onUploadPhoto}>Upload photo</button>
              <button className="sh-btn sh-btn--secondary" onClick={onRemovePhoto}>Remove photo</button>
            </div>
          </div>

          {/* middle: name + quick toggles/notes */}
          <div className="sh-profMid">
            <div className="sh-profName">{name}</div>
            <div className="sh-profToggles">
              {/* examples, wire-only for now */}
              <label><input type="checkbox" /> Media Release OK</label>
              <label><input type="checkbox" /> IEP</label>
              <label><input type="checkbox" /> ELL</label>
            </div>

            <input
              className="sh-profNotes"
              placeholder="Accessibility notes…"
              value={notes}
              onChange={(e)=>onChangeNotes?.(e.target.value)}
            />
          </div>

          {/* right: metrics */}
          <div className="sh-profMetaGrid">
            <MetaBox label="Total" value={meta.totalArtifacts} />
            <MetaBox label="Streak" value={meta.streak} />
            <MetaBox label="Types" value={meta.types} />
            <MetaBox label="Last update" value={meta.lastUpdate} />

            <div className="sh-metaBox">
              <div className="sh-metaLabel">Progress to target</div>
              <div className="sh-progressWrap" aria-label={`Progress ${meta.progressToTarget}%`}>
                <div className="sh-progressBar" style={{ width: `${meta.progressToTarget ?? 0}%` }} />
              </div>
            </div>

            <MetaBox label="Avg Growth (Pre→Post)" value={`${meta.growthPct ?? 0}%`} />
          </div>
        </div>
      </div>

      <style>{`
        .sh-profWrap{display:grid;grid-template-columns:auto 1fr 420px;gap:16px;align-items:flex-start}
        .sh-profLeft{display:flex;flex-direction:column;gap:10px;align-items:center}
        .sh-profAvatar{width:84px;height:84px;border-radius:999px;overflow:hidden;border:1px solid var(--line);background:#fff}
        .sh-profAvatar img{width:100%;height:100%;object-fit:cover}
        .sh-profAvatarPh{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:var(--orange)}
        .sh-profActions{display:flex;flex-direction:column;gap:8px}

        .sh-profMid{display:flex;flex-direction:column;gap:8px}
        .sh-profName{font-size:20px;font-weight:700;color:var(--slate)}
        .sh-profToggles{display:flex;gap:14px;color:#6b7280;font-size:14px}
        .sh-profNotes{border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit}

        .sh-profMetaGrid{
          display:grid;grid-template-columns:1fr 1fr;gap:10px;
          background:var(--beige);border:1px solid var(--line);border-radius:12px;padding:10px;
        }
        .sh-metaBox{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px}
        .sh-metaLabel{font-size:12px;color:#6b7280;margin-bottom:4px}
        .sh-metaValue{font-weight:700;color:var(--slate)}
        @media(max-width:1100px){ .sh-profWrap{grid-template-columns:1fr} }
      `}</style>
    </section>
  );
}

function MetaBox({ label, value }) {
  return (
    <div className="sh-metaBox">
      <div className="sh-metaLabel">{label}</div>
      <div className="sh-metaValue">{value}</div>
    </div>
  );
}
/* --- SHF: Profile completion (once) --- */
(() => {
  if (typeof window === "undefined") return;
  if (window.__shfHook_profileComplete) return;
  window.__shfHook_profileComplete = true;

  const KEY = "shf.award.profile.complete.v1";

  // Fire this once when required fields are all present:
  //   window.dispatchEvent(new CustomEvent("profile:completed", { detail:{ fields: ["name","email","city"] }}))
  window.addEventListener("profile:completed", (e) => {
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, "1");
    const d = (e && e.detail) || {};
    try {
      window.shfCredit?.earn?.({
        action: "profile.complete",
        rewards: { heart: 1 },
        scoreDelta: 5,
        meta: { fields: d.fields || [] }
      });
      window.shToast?.("✅ Profile complete · +1 ❤️ · +5 score");
    } catch {}
  });
})();
