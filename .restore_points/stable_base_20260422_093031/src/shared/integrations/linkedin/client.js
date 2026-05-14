/**
 * LINKEDIN INTEGRATION (stubbed)
 * - OAuth: we surface a Sign-in link you configure in the backend later.
 * - Share: we build a prefilled share URL; app opens a new tab.
 * - Add-to-Profile: we render a deep-link to edit "Licenses & certifications".
 */

const APP = {
  oauthAuthorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
  clientId: "SHF_LINKEDIN_CLIENT_ID",          // replace in env later
  redirectUri: "https://shf.example.com/lnk/callback", // your backend callback
  scope: "r_liteprofile r_emailaddress w_member_social"
};

export function buildOAuthUrl(state="shf"){
  const p = new URL(APP.oauthAuthorizeUrl);
  p.searchParams.set("response_type","code");
  p.searchParams.set("client_id",APP.clientId);
  p.searchParams.set("redirect_uri",APP.redirectUri);
  p.searchParams.set("scope",APP.scope);
  p.searchParams.set("state",state);
  return p.toString();
}

/** Open a LinkedIn share dialog (w_member_social alternative) */
export function openShare({ text, url }){
  const share = new URL("https://www.linkedin.com/sharing/share-offsite/");
  if (url) share.searchParams.set("url", url);
  window.open(share.toString(), "_blank", "noopener");
  // fire event locally
  try { window.dispatchEvent(new CustomEvent("shf:li:share", { detail: { url } })); } catch {}
}

/** Helper: deep-link to edit "Licenses & certifications"  */
export function openAddCertification(){
  window.open("https://www.linkedin.com/in/me/edit/forms/certification/new/", "_blank", "noopener");
}
