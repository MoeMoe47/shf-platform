const REVIEW_PERMISSION = "organization.onboarding.review";
const SUBMIT_PERMISSION = "organization.onboarding.submit";

export function resolveOnboardingExperience(authPayload = {}) {
  const permissions = Array.isArray(authPayload.permissions)
    ? authPayload.permissions
    : Array.isArray(authPayload.active_organization_context?.permissions)
      ? authPayload.active_organization_context.permissions
      : Array.isArray(authPayload.user?.permissions)
        ? authPayload.user.permissions
        : [];

  if (permissions.includes(REVIEW_PERMISSION)) return "REVIEWER";
  if (permissions.includes(SUBMIT_PERMISSION)) return "APPLICANT";
  return "UNAUTHORIZED";
}

export const ONBOARDING_ROLE_PERMISSIONS = Object.freeze({
  review: REVIEW_PERMISSION,
  submit: SUBMIT_PERMISSION,
});
