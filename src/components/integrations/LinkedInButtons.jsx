import React from "react";
import { buildOAuthUrl, openShare, openAddCertification } from "@/shared/integrations/linkedin/client.js";

export function LinkedInConnectButton(){
  return (
    <button className="int-btn int-btn-io" onClick={()=>location.href = buildOAuthUrl()}>
      Connect LinkedIn
    </button>
  );
}

export function LinkedInShareCredentialButton({ credentialUrl }){
  return (
    <button className="int-btn int-btn-outline" onClick={()=>openShare({ url: credentialUrl })}>
      Share to LinkedIn
    </button>
  );
}

export function LinkedInAddToProfileButton(){
  return (
    <button className="int-btn" onClick={openAddCertification}>
      Add to LinkedIn Profile
    </button>
  );
}
