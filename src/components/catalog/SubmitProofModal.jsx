import React from "react";
import { submitProof } from "@/shared/external/proofStore.js";
import { useUserId } from "@/shared/external/getUserId.js";

export default function SubmitProofModal({ open, onClose, courseId }) {
  const userId = useUserId();
  const [url, setUrl] = React.useState("");

  if (!open) return null;
  function handleSubmit(e){
    e.preventDefault();
    submitProof({ userId, courseId, method:"certificate-url", payload:{url} });
    onClose(true);
  }
  return (
    <div role="dialog" aria-modal="true" className="cat-modal">
      <div className="cat-modal-card">
        <h3>Submit Certificate Link</h3>
        <p>Paste your public certificate URL to request verification.</p>
        <form onSubmit={handleSubmit} className="cat-form">
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://...verify/ABC123" required className="cat-input"/>
          <div className="cat-actions">
            <button type="button" onClick={()=>onClose(false)} className="cat-btn-outline">Cancel</button>
            <button type="submit" className="cat-btn">Submit Proof</button>
          </div>
        </form>
      </div>
    </div>
  );
}
