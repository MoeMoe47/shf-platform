import React, { useState } from "react";
import {
  approveEnterprise,
  closeEnterprise,
  pauseEnterprise,
  resumeEnterprise,
  returnEnterprise,
  submitEnterpriseForApproval,
  suspendEnterprise,
} from "@/system/metaverse/metaverseEnterpriseClient.js";
import EnterpriseCatalog from "./EnterpriseCatalog.jsx";
import EnterpriseHistory from "./EnterpriseHistory.jsx";

const STATUS_LABEL = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  ACTIVE: "Active",
  PAUSED: "Paused",
  SUSPENDED: "Suspended",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

// canReview: instructor/program/admin review authority (server-enforced;
// this only hides actions the server would reject anyway).
export default function MetaverseEnterpriseProfile({ enterprise, history, canManage, canReview, onRefresh }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const run = async (action, label) => {
    setBusy(label);
    setError("");
    try {
      await action();
      await onRefresh?.();
    } catch (err) {
      setError(err?.message || "Action could not be completed.");
    } finally {
      setBusy("");
    }
  };

  if (!enterprise) return null;
  const status = enterprise.lifecycleStatus;

  return (
    <section className="met-enterprise__profile" aria-label={`${enterprise.name} profile`}>
      <header>
        <h2>{enterprise.name}</h2>
        <span className={`met-enterprise__status met-enterprise__status--${status.toLowerCase()}`}>{STATUS_LABEL[status] || status}</span>
      </header>
      <p className="met-enterprise__boundary" role="note">Educational/simulated Student Enterprise — not a legal business, employer, payroll entity, tax entity, licensed contractor, registered company, or independent organization.</p>
      <p>{enterprise.description}</p>
      <p className="met-enterprise__meta">{enterprise.enterpriseCategory.replace(/_/g, " ").toLowerCase()} · {enterprise.operatingMode.toLowerCase()} · {enterprise.visibility.toLowerCase()} visibility</p>

      <div className="met-enterprise__team" aria-label="Team">
        <h3>Team</h3>
        <ul>
          {(enterprise.roles || []).map((role) => (
            <li key={role.enterpriseRoleId}>{role.userId} — {role.enterpriseRole.replace(/_/g, " ").toLowerCase()}</li>
          ))}
        </ul>
      </div>

      {error ? <p role="alert">{error}</p> : null}

      <div className="met-enterprise__actions" aria-label="Enterprise actions">
        {canManage && status === "DRAFT" ? <button type="button" disabled={Boolean(busy)} onClick={() => run(() => submitEnterpriseForApproval(enterprise.enterpriseId), "submit")}>{busy === "submit" ? "Submitting…" : "Submit for approval"}</button> : null}
        {canReview && status === "PENDING_APPROVAL" ? <button type="button" disabled={Boolean(busy)} onClick={() => run(() => approveEnterprise(enterprise.enterpriseId), "approve")}>{busy === "approve" ? "Approving…" : "Approve"}</button> : null}
        {canReview && status === "PENDING_APPROVAL" ? <button type="button" disabled={Boolean(busy)} onClick={() => run(() => returnEnterprise(enterprise.enterpriseId, "Needs revision."), "return")}>{busy === "return" ? "Returning…" : "Return for revision"}</button> : null}
        {canManage && status === "ACTIVE" ? <button type="button" disabled={Boolean(busy)} onClick={() => run(() => pauseEnterprise(enterprise.enterpriseId), "pause")}>{busy === "pause" ? "Pausing…" : "Pause"}</button> : null}
        {canManage && status === "PAUSED" ? <button type="button" disabled={Boolean(busy)} onClick={() => run(() => resumeEnterprise(enterprise.enterpriseId), "resume")}>{busy === "resume" ? "Resuming…" : "Resume"}</button> : null}
        {canReview && (status === "ACTIVE" || status === "PAUSED") ? <button type="button" disabled={Boolean(busy)} onClick={() => run(() => suspendEnterprise(enterprise.enterpriseId, "Suspended by review authority."), "suspend")}>{busy === "suspend" ? "Suspending…" : "Suspend"}</button> : null}
        {canManage && (status === "ACTIVE" || status === "PAUSED" || status === "SUSPENDED") ? <button type="button" disabled={Boolean(busy)} onClick={() => run(() => closeEnterprise(enterprise.enterpriseId), "close")}>{busy === "close" ? "Closing…" : "Close"}</button> : null}
      </div>

      <EnterpriseCatalog enterpriseId={enterprise.enterpriseId} items={enterprise.catalog} canManage={canManage} onRefresh={onRefresh} />
      <EnterpriseHistory entries={history} />
    </section>
  );
}
