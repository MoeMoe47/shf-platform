import React from "react";

function getInitials(name = "Operator") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "O";
}

function formatRoleLabel(role = "Operator") {
  return String(role)
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Operator";
}

export default function OperatorIdentityBadge({ operator }) {
  const profile = {
    name: "Operator",
    role: "Operator",
    photoUrl: "",
    clearanceLevel: "Command Access",
    sessionStatus: "active",
    lastVerifiedAt: "10:42 AM ET",
    isCleared: true,
    ...operator,
  };

  const initials = getInitials(profile.name || profile.role);
  const isCleared =
    Boolean(profile.isCleared) &&
    String(profile.clearanceLevel || "").toLowerCase() !== "denied" &&
    String(profile.clearanceLevel || "").toLowerCase() !== "blocked";

  return (
    <div
      className={`utc-operator-identity ${isCleared ? "is-cleared" : "is-blocked"}`}
      title={`${profile.name} • ${profile.clearanceLevel}`}
      aria-label={`Operator identity: ${profile.name}, ${profile.clearanceLevel}`}
    >
      <div className="utc-operator-identity__copy">
        <strong>{formatRoleLabel(profile.role)}</strong>
        <small>{profile.lastVerifiedAt}</small>
      </div>

      <div className="utc-operator-identity__avatar" aria-hidden="true">
        {profile.photoUrl ? (
          <img
            key={profile.photoUpdatedAt || profile.photoUrl}
            src={profile.photoUrl}
            alt=""
          />
        ) : (
          <span>{initials}</span>
        )}
        <i />
      </div>
    </div>
  );
}
