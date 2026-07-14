import React, { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/auth/auth-context";
import { fetchIdentityAccessCenterData } from "@/system/identity/authClient";
import IdentitySecurityOverview from "./components/IdentitySecurityOverview";
import IdentitySessionPanel from "./components/IdentitySessionPanel";
import IdentityRolePermissionMatrix from "./components/IdentityRolePermissionMatrix";
import IdentityRouteAccessMatrix from "./components/IdentityRouteAccessMatrix";
import IdentityAuditTimeline from "./components/IdentityAuditTimeline";
import IdentityConfigurationReadiness from "./components/IdentityConfigurationReadiness";
import IdentityThreatModelPanel from "./components/IdentityThreatModelPanel";
import IdentityDemoModePanel from "./components/IdentityDemoModePanel";
import IdentitySafetyPanel from "./components/IdentitySafetyPanel";
import IdentityActiveSessionsPanel from "./components/IdentityActiveSessionsPanel";
import "./shsIdentityAccessCenter.css";

export default function ShsIdentityAccessCenterPage() {
  const auth = useAuthContext();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchIdentityAccessCenterData().then((next) => {
      if (!mounted) return;
      setData(next);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => ({
    auth,
    readiness: data.readiness || {},
    permissionMatrix: data.permissionMatrix || {},
    routeMatrix: data.routeMatrix || {},
    audit: data.audit || {},
    users: data.users || {},
  }), [auth, data]);

  return (
    <main className="identityAccess-page">
      <section className="identityAccess-header">
        <div>
          <p>Production Authentication</p>
          <h1>Identity & Access Center</h1>
          <span>Backend session authority, route policy, and safe operator visibility.</span>
        </div>
        <div className="identityAccess-score">
          <span>Readiness</span>
          <strong>{summary.readiness.score ?? (loading ? "..." : "NA")}</strong>
        </div>
      </section>

      <section className="identityAccess-grid">
        <IdentitySecurityOverview summary={summary} />
        <IdentityConfigurationReadiness readiness={summary.readiness} />
        <IdentitySessionPanel auth={auth} onRefresh={auth.rotateSession} onLogout={auth.logout} />
        <IdentityActiveSessionsPanel sessions={summary.readiness.active_sessions || []} />
        <IdentityRolePermissionMatrix matrix={summary.permissionMatrix} />
        <IdentityRouteAccessMatrix matrix={summary.routeMatrix} />
        <IdentityAuditTimeline events={summary.audit.events || []} />
        <IdentityThreatModelPanel />
        <IdentityDemoModePanel configuration={summary.readiness.configuration || {}} />
        <IdentitySafetyPanel reviewed={reviewed} onReview={() => setReviewed(true)} />
      </section>
    </main>
  );
}

