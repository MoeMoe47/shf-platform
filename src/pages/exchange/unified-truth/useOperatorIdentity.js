import { useMemo } from "react";
import useAuth from "../../../auth/useAuth";

function safeReadStorage(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      window.localStorage.getItem(key) ||
      window.sessionStorage.getItem(key);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function deriveDisplayName(user) {
  return pickFirst(
    user?.name,
    user?.displayName,
    user?.fullName,
    user?.profile?.name,
    user?.profile?.displayName,
    user?.email,
    "Operator"
  );
}

function derivePhotoUrl(user) {
  return pickFirst(
    user?.photoUrl,
    user?.avatarUrl,
    user?.profilePhoto,
    user?.profile_photo,
    user?.picture,
    user?.image,
    user?.profile?.photoUrl,
    user?.profile?.avatarUrl,
    user?.profile?.profilePhoto,
    user?.profile?.picture,
    ""
  );
}

function deriveRole(auth, user, stored) {
  const memberships = Array.isArray(auth?.memberships) ? auth.memberships : [];
  const firstMembershipRole =
    memberships[0]?.role ||
    memberships[0]?.role_name ||
    memberships[0]?.title;

  return pickFirst(
    stored?.role,
    user?.role,
    user?.profile?.role,
    firstMembershipRole,
    "Operator"
  );
}

function deriveClearance(auth, user, stored) {
  const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];
  const role = String(deriveRole(auth, user, stored) || "").toLowerCase();

  const hasCommandPermission =
    permissions.includes("shs.command.access") ||
    permissions.includes("exchange.command.access") ||
    permissions.includes("command.access") ||
    permissions.includes("admin") ||
    permissions.includes("operator");

  const roleImpliesAccess =
    role.includes("admin") ||
    role.includes("operator") ||
    role.includes("command") ||
    role.includes("verifier");

  return pickFirst(
    stored?.clearanceLevel,
    user?.clearanceLevel,
    user?.profile?.clearanceLevel,
    hasCommandPermission || roleImpliesAccess ? "Command Access" : "Pending Clearance"
  );
}

export default function useOperatorIdentity() {
  const auth = useAuth();
  const stored = safeReadStorage("shs.operatorProfile") || {};
  const user = auth?.user || stored?.user || {};

  return useMemo(() => {
    const name = pickFirst(stored.name, deriveDisplayName(user));
    const role = deriveRole(auth, user, stored);
    const photoUrl = pickFirst(stored.photoUrl, derivePhotoUrl(user));
    const clearanceLevel = deriveClearance(auth, user, stored);

    const isAuthenticated =
      Boolean(auth?.isAuthenticated) ||
      Boolean(user?.id) ||
      Boolean(user?.email) ||
      Boolean(stored?.sessionStatus === "active");

    const isCleared =
      String(clearanceLevel || "").toLowerCase() !== "denied" &&
      String(clearanceLevel || "").toLowerCase() !== "blocked";

    return {
      name,
      role,
      photoUrl,
      clearanceLevel,
      sessionStatus: isAuthenticated ? "active" : "demo",
      lastVerifiedAt: stored.lastVerifiedAt || "10:42 AM ET",
      isCleared,
      authLoading: Boolean(auth?.loading),
      authError: auth?.error || null,
    };
  }, [auth, user, stored]);
}
