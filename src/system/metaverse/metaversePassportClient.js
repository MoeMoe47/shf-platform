const API_BASE = import.meta.env.VITE_SHS_API_BASE || "http://localhost:8091";

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.ok === false) {
    const error = new Error(json?.error?.message || "Work Passport is unavailable.");
    error.status = response.status;
    error.code = json?.error?.code;
    throw error;
  }
  return json.data;
}

// MET-10 client is read-only: no learner_user_id, verification_level,
// credential, evidence, reliability, or source-authority fields are sent.
export function getMyWorkPassport({ publicSafe = false } = {}) {
  return request(`/metaverse/passport/me${publicSafe ? "?view=public" : ""}`);
}

export function getSponsorPassport(learnerUserId) {
  return request(`/metaverse/passport/sponsor/${encodeURIComponent(learnerUserId)}`);
}

export function getPassportEligibilityProjection(learnerUserId) {
  return request(`/metaverse/passport/eligibility/${encodeURIComponent(learnerUserId)}`);
}

export const metaversePassportClientContract = {
  readOnlyProjection: true,
  clientAuthorityFieldsSent: false,
  noCreditsAsCapability: true,
  noGlobalRanking: true,
};
