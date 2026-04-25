import React, { useRef } from "react";
import { writeProfile } from "../dashboardUtils";

export default function ProfileUploadCard({ profile, setProfile }) {
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...profile, photoUrl: String(reader.result || "") };
      setProfile(next);
      writeProfile(next);
    };
    reader.readAsDataURL(file);
  }

  return (
    <aside className="shsDash-card shsDash-account">
      <div className="shsDash-cardTitle">
        <span>♙</span>
        <h2>My Account</h2>
      </div>

      <div
        className="shsDash-uploadBox"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          hidden
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        <div className="shsDash-uploadAvatar">
          {profile.photoUrl ? <img src={profile.photoUrl} alt="" /> : <span>AM</span>}
          <b>📷</b>
        </div>

        <p>Drag & drop image here</p>
        <button type="button">or click to upload</button>
      </div>

      <div className="shsDash-accountActions">
        <button type="button" onClick={() => inputRef.current?.click()}>📷 Change Photo</button>
        <button type="button">•••</button>
      </div>

      <div className="shsDash-accountRows">
        <div><span>Name</span><strong>{profile.name || "Alex Morgan"} <b>Verified</b></strong></div>
        <div><span>Role</span><strong>{profile.role || "Senior Analyst"}</strong></div>
        <div><span>Workspace</span><strong>Silicon Heartland Solutions</strong></div>
        <div><span>Clearance Level</span><strong><em>Tier 3 – High</em></strong></div>
        <div><span>Account Status</span><strong className="is-green">● Active</strong></div>
        <div><span>Member Since</span><strong>Jan 12, 2023</strong></div>
      </div>

      <footer>
        <button type="button">Edit Profile</button>
        <button type="button">Manage Security</button>
      </footer>
    </aside>
  );
}
