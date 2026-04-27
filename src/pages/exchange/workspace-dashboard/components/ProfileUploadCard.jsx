import React, { useRef, useState } from "react";
import { writeProfile } from "../dashboardUtils";

const DEFAULT_PROFILE = {
  name: "Alex Morgan",
  role: "Senior Analyst",
  clearanceLevel: "Tier 3 - High",
  workspace: "Silicon Heartland Solutions",
  accountStatus: "Active",
  memberSince: "Jan 14, 2025",
  photoUrl: "",
};

export default function ProfileUploadCard({ profile = {}, setProfile }) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const mergedProfile = {
    ...DEFAULT_PROFILE,
    ...profile,
  };

  function updateProfile(nextProfile) {
    writeProfile(nextProfile);
    if (typeof setProfile === "function") {
      setProfile(nextProfile);
    }
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();

    reader.onload = () => {
      const nextProfile = {
        ...mergedProfile,
        photoUrl: String(reader.result || ""),
      };

      updateProfile(nextProfile);
      setIsUploading(false);
    };

    reader.onerror = () => {
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  }

  function openPhotoPicker() {
    fileInputRef.current?.click();
  }

  return (
    <section className="shsDash-card shsDash-profileCardV2">
      <div className="shsDash-profileCardV2__head">
        <div>
          <span>👤</span>
          <small>My Account</small>
        </div>

        <b>{mergedProfile.accountStatus}</b>
      </div>

      <div className="shsDash-profileCardV2__hero">
        <button
          className="shsDash-profileCardV2__photoButton"
          type="button"
          onClick={openPhotoPicker}
          aria-label="Change profile photo"
        >
          {mergedProfile.photoUrl ? (
            <img src={mergedProfile.photoUrl} alt={`${mergedProfile.name} profile`} />
          ) : (
            <span>{mergedProfile.name?.slice(0, 1) || "A"}</span>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          hidden
        />

        <strong>{mergedProfile.name}</strong>
        <p>{mergedProfile.role}</p>

        <em>{mergedProfile.clearanceLevel} Clearance</em>

        <small>
          {isUploading
            ? "Uploading photo..."
            : "Upload or change your operator identity photo."}
        </small>
      </div>

      <div className="shsDash-profileCardV2__actions">
        <button type="button" onClick={openPhotoPicker}>
          Change Photo
        </button>

        <button type="button">
          Edit Profile
        </button>

        <button type="button">
          Manage Security
        </button>
      </div>

      <div className="shsDash-profileCardV2__details">
        <article>
          <span>Name</span>
          <strong>{mergedProfile.name}</strong>
        </article>

        <article>
          <span>Role</span>
          <strong>{mergedProfile.role}</strong>
        </article>

        <article>
          <span>Workspace</span>
          <strong>{mergedProfile.workspace}</strong>
        </article>

        <article>
          <span>Clearance Level</span>
          <strong>{mergedProfile.clearanceLevel}</strong>
        </article>

        <article>
          <span>Account Status</span>
          <strong>{mergedProfile.accountStatus}</strong>
        </article>

        <article>
          <span>Member Since</span>
          <strong>{mergedProfile.memberSince}</strong>
        </article>
      </div>
    </section>
  );
}
