import React from "react";
import { LinkedInConnectButton, LinkedInShareCredentialButton, LinkedInAddToProfileButton } from "@/components/integrations/LinkedInButtons.jsx";
import JobApplyButtons from "@/components/integrations/JobApplyButtons.jsx";
import "@/styles/integrations.css";

export default function IntegrationsStrip(){
  const demoCredential = location.origin + "/verifier.html"; // placeholder link
  return (
    <section style={{padding:16, background:"#fff", borderRadius:14, boxShadow:"0 8px 24px rgba(0,0,0,.08)"}}>
      <h3 style={{marginTop:0}}>Career Integrations</h3>
      <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
        <LinkedInConnectButton />
        <LinkedInShareCredentialButton credentialUrl={demoCredential}/>
        <LinkedInAddToProfileButton />
        <JobApplyButtons role="IT Support" location="Columbus, OH" />
      </div>
    </section>
  );
}
