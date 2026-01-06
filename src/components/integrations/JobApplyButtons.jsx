import React from "react";
import { openIndeed } from "@/shared/integrations/indeed/client.js";
import { openZip } from "@/shared/integrations/zip/client.js";

export default function JobApplyButtons({ role="Intern", location="Columbus, OH" }){
  return (
    <div className="int-apply">
      <button className="int-btn int-btn-io" onClick={()=>openIndeed(role, location)}>Apply on Indeed</button>
      <button className="int-btn int-btn-outline" onClick={()=>openZip(role, location)}>Apply on ZipRecruiter</button>
    </div>
  );
}
