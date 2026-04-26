import React from "react";

function getInitials(name = "") {
  const parts = String(name || "Operator")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function OperatorIdentityBadge({ operator }) {
  const profile = operator || {};
  const name = profile.name || profile.displayName || "Senior Analyst";
  const role = profile.role || profile.title || "10:42 AM ET";
  const photoUrl = profile.photoUrl || profile.avatarUrl || profile.imageUrl || "";
  const initials = getInitials(name);

  return (
    <section className="shsOperatorIdentityBadge" aria-label="Operator identity">
      <div className="shsOperatorIdentityBadge__meta">
        <strong>{name}</strong>
        <small>{role}</small>
      </div>

      <div className="shsOperatorIdentityBadge__avatar" aria-hidden="true">
        {photoUrl ? (
          <img
            key={profile.photoUpdatedAt || photoUrl}
            src={photoUrl}
            alt=""
            draggable="false"
          />
        ) : (
          <span>{initials}</span>
        )}

        <i />
      </div>
    </section>
  );
}
