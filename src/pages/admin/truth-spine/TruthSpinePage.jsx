import React from "react";
import "./truth-spine.css";

const API_ROOT = "/api/truth";

async function truthRequest(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `Truth Spine request failed: ${response.status}`);
  }
  return data;
}

function statusLabel(value) {
  return String(value || "unknown").replace(/_/g, " ");
}

function claimWarnings(claim) {
  const warnings = Array.isArray(claim?.warnings) ? claim.warnings : [];
  return warnings.length ? warnings : ["no warnings"];
}

export default function TruthSpinePage() {
  const [claims, setClaims] = React.useState([]);
  const [sources, setSources] = React.useState([]);
  const [auditEvents, setAuditEvents] = React.useState([]);
  const [coverage, setCoverage] = React.useState(null);
  const [drift, setDrift] = React.useState(null);
  const [federation, setFederation] = React.useState(null);
  const [selectedClaimId, setSelectedClaimId] = React.useState("");
  const [envelope, setEnvelope] = React.useState(null);
  const [readiness, setReadiness] = React.useState(null);
  const [truthPackage, setTruthPackage] = React.useState(null);
  const [replay, setReplay] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const selectedClaim = claims.find((claim) => claim.claim_id === selectedClaimId) || claims[0] || null;

  const loadTruth = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [claimPayload, sourcePayload, auditPayload, coveragePayload, driftPayload, federationPayload] = await Promise.all([
        truthRequest("/claims"),
        truthRequest("/sources"),
        truthRequest("/audit-feed?limit=12"),
        truthRequest("/coverage"),
        truthRequest("/drift"),
        truthRequest("/federation"),
      ]);
      const nextClaims = Array.isArray(claimPayload.claims) ? claimPayload.claims : [];
      setClaims(nextClaims);
      setSources(Array.isArray(sourcePayload.sources) ? sourcePayload.sources : []);
      setAuditEvents(Array.isArray(auditPayload.events) ? auditPayload.events : []);
      setCoverage(coveragePayload || null);
      setDrift(driftPayload || null);
      setFederation(federationPayload || null);
      setSelectedClaimId((current) => current || nextClaims[0]?.claim_id || "");
    } catch (nextError) {
      setError(nextError.message || "Truth Spine is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTruth();
  }, [loadTruth]);

  React.useEffect(() => {
    const claimId = selectedClaim?.claim_id;
    if (!claimId) {
      setEnvelope(null);
      setReadiness(null);
      setTruthPackage(null);
      setReplay(null);
      return;
    }

    let alive = true;
    Promise.all([
      truthRequest(`/envelope/${encodeURIComponent(claimId)}`),
      truthRequest(`/readiness/${encodeURIComponent(claimId)}`),
      truthRequest(`/package/${encodeURIComponent(claimId)}`),
      truthRequest(`/replay/${encodeURIComponent(claimId)}`),
    ])
      .then(([envelopePayload, readinessPayload, packagePayload, replayPayload]) => {
        if (!alive) return;
        setEnvelope(envelopePayload.envelope || null);
        setReadiness(readinessPayload.readiness || null);
        setTruthPackage(packagePayload.package || null);
        setReplay(replayPayload.replay || null);
      })
      .catch((nextError) => {
        if (!alive) return;
        setError(nextError.message || "Unable to load trust envelope.");
      });

    return () => {
      alive = false;
    };
  }, [selectedClaim?.claim_id]);

  const createSeedSource = async () => {
    await truthRequest("/sources", {
      method: "POST",
      body: JSON.stringify({
        source_type: "admin_sample",
        title: "Truth Spine V1 verified source",
        uri: "local://truth-spine-v1-source",
        evidence_type: "operator_record",
        verification_status: "verified",
      }),
    });
    await loadTruth();
  };

  const createSeedClaim = async () => {
    const sourceId = sources.find((source) => source.verification_status === "verified")?.source_id;
    await truthRequest("/claims", {
      method: "POST",
      body: JSON.stringify({
        app_id: "admin",
        project_id: "truth-spine-v1",
        client_id: "internal",
        program_id: "shs-admin",
        claim_type: "report_readiness",
        claim_text: "Truth Spine V1 admin route can verify a report-ready claim.",
        metric_name: "trace_coverage",
        metric_value: 92,
        source_ids: sourceId ? [sourceId] : [],
        trace_coverage: sourceId ? 92 : 0,
      }),
    });
    await loadTruth();
  };

  const togglePublicApproval = async (claim) => {
    if (!claim?.claim_id) return;
    await truthRequest(`/public-approval/${encodeURIComponent(claim.claim_id)}`, {
      method: "PATCH",
      body: JSON.stringify({ public_approved: !claim.public_approved }),
    });
    await loadTruth();
  };

  const verifiedCount = claims.filter((claim) => claim.verification_status === "verified").length;
  const reportReadyCount = claims.filter((claim) => claim.report_ready).length;
  const publicCount = claims.filter((claim) => claim.public_approved).length;
  const severityCounts = drift?.severity_counts || {};
  const driftFindings = Array.isArray(drift?.findings) ? drift.findings : [];
  const federatedSystems = Array.isArray(federation?.systems) ? federation.systems : [];
  const replayTimeline = Array.isArray(replay?.timeline) ? replay.timeline : [];

  return (
    <main className="truth-spine-page">
      <section className="truth-spine-hero">
        <div>
          <p className="truth-spine-kicker">SHS Admin Control Plane</p>
          <h1>SHS Truth Spine V1</h1>
          <p>
            Truth Spine verifies what is true. Reports communicate only verified and readiness-approved information.
          </p>
        </div>
        <div className="truth-spine-actions">
          <button type="button" onClick={loadTruth}>Refresh</button>
          <button type="button" onClick={createSeedSource}>Create Source</button>
          <button type="button" onClick={createSeedClaim}>Create Claim</button>
        </div>
      </section>

      {error ? <div className="truth-spine-alert">{error}</div> : null}

      <section className="truth-spine-metrics" aria-label="Truth Spine summary">
        <article><span>Claims</span><strong>{claims.length}</strong></article>
        <article><span>Sources</span><strong>{sources.length}</strong></article>
        <article><span>Verified</span><strong>{verifiedCount}</strong></article>
        <article><span>Report Ready</span><strong>{reportReadyCount}</strong></article>
        <article><span>Public Approved</span><strong>{publicCount}</strong></article>
        <article><span>Federated</span><strong>{Number(federation?.active_count || 0)}</strong></article>
      </section>

      <section className="truth-spine-grid truth-spine-grid--lower truth-spine-grid--hardening">
        <div className="truth-spine-panel">
          <div className="truth-spine-panel-head">
            <div>
              <span>Truth Coverage</span>
              <strong>{statusLabel(coverage?.coverage_status || "loading")}</strong>
            </div>
          </div>
          <div className="truth-spine-coverage-grid">
            <article><span>Verified</span><strong>{Number(coverage?.verified_percent || 0)}%</strong></article>
            <article><span>Public</span><strong>{Number(coverage?.public_approved_percent || 0)}%</strong></article>
            <article><span>Ready</span><strong>{Number(coverage?.report_ready_percent || 0)}%</strong></article>
            <article><span>Missing</span><strong>{Number(coverage?.missing_source_percent || 0)}%</strong></article>
            <article><span>Trace Avg</span><strong>{Number(coverage?.average_trace_coverage || 0)}%</strong></article>
            <article><span>Packages</span><strong>{Number(coverage?.total_packages_available || 0)}</strong></article>
          </div>
        </div>

        <div className="truth-spine-panel">
          <div className="truth-spine-panel-head">
            <div>
              <span>Drift Findings</span>
              <strong>{Number(drift?.total_findings || 0)} findings</strong>
            </div>
          </div>
          <div className="truth-spine-severity-grid">
            <article><span>Critical</span><strong>{Number(severityCounts.CRITICAL || 0)}</strong></article>
            <article><span>Warning</span><strong>{Number(severityCounts.WARNING || 0)}</strong></article>
            <article><span>Info</span><strong>{Number(severityCounts.INFO || 0)}</strong></article>
          </div>
          <div className="truth-spine-drift-list">
            {driftFindings.slice(0, 5).map((finding) => (
              <article key={finding.finding_id}>
                <span className={`truth-severity truth-severity--${String(finding.severity || "INFO").toLowerCase()}`}>
                  {finding.severity || "INFO"}
                </span>
                <strong>{statusLabel(finding.category)}</strong>
                <p>{finding.message}</p>
                <small>{finding.suggested_fix}</small>
              </article>
            ))}
            {!driftFindings.length ? <p>No drift findings.</p> : null}
          </div>
        </div>
      </section>

      <section className="truth-spine-grid">
        <div className="truth-spine-panel truth-spine-panel--wide">
          <div className="truth-spine-panel-head">
            <div>
              <span>Claims Table</span>
              <strong>{loading ? "Loading" : `${claims.length} records`}</strong>
            </div>
          </div>
          <div className="truth-spine-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Status</th>
                  <th>Trace</th>
                  <th>Report</th>
                  <th>Public</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr
                    key={claim.claim_id}
                    className={selectedClaim?.claim_id === claim.claim_id ? "is-selected" : ""}
                    onClick={() => setSelectedClaimId(claim.claim_id)}
                  >
                    <td>
                      <button type="button" onClick={() => setSelectedClaimId(claim.claim_id)}>
                        {claim.claim_text || claim.claim_id}
                      </button>
                      <small>{claim.app_id || "shs"} / {claim.program_id || "no program"}</small>
                    </td>
                    <td><span className={`truth-pill truth-pill--${claim.verification_status}`}>{statusLabel(claim.verification_status)}</span></td>
                    <td>{Number(claim.trace_coverage || 0)}%</td>
                    <td>{claim.report_ready ? "Ready" : "Blocked"}</td>
                    <td>
                      <label className="truth-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(claim.public_approved)}
                          onChange={() => togglePublicApproval(claim)}
                        />
                        <span>{claim.public_approved ? "Approved" : "Off"}</span>
                      </label>
                    </td>
                    <td>{claimWarnings(claim).join(", ")}</td>
                  </tr>
                ))}
                {!claims.length && !loading ? (
                  <tr><td colSpan="6">No claims yet. Create a verified source, then create a claim.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="truth-spine-panel">
          <div className="truth-spine-panel-head">
            <div>
              <span>Trust Envelope</span>
              <strong>{selectedClaim?.claim_id || "No claim selected"}</strong>
            </div>
          </div>
          <dl className="truth-spine-envelope">
            <div><dt>Verification</dt><dd>{statusLabel(envelope?.verification_status)}</dd></div>
            <div><dt>Trust</dt><dd>{statusLabel(envelope?.trust_level)}</dd></div>
            <div><dt>Trace Coverage</dt><dd>{Number(envelope?.trace_coverage || 0)}%</dd></div>
            <div><dt>Report Ready</dt><dd>{readiness?.ready_for_reports ? "Yes" : "No"}</dd></div>
            <div><dt>Sources</dt><dd>{Number(envelope?.source_count || 0)}</dd></div>
          </dl>
          <div className="truth-spine-warning-list">
            {(envelope?.warnings || ["missing_source"]).map((warning) => (
              <span key={warning}>{statusLabel(warning)}</span>
            ))}
          </div>
          <div className="truth-spine-package-card">
            <span>Truth Package</span>
            <strong>{truthPackage?.signature_status || "No package"}</strong>
            <p>{truthPackage?.package_hash || "Select a claim to view its deterministic package hash."}</p>
            <small>{statusLabel(truthPackage?.display_scope || "internal")} / {truthPackage?.issued_by || "shs-truth-spine-v1"}</small>
          </div>
        </aside>
      </section>

      <section className="truth-spine-grid truth-spine-grid--lower">
        <div className="truth-spine-panel">
          <div className="truth-spine-panel-head">
            <div>
              <span>Replay Timeline</span>
              <strong>{replayTimeline.length} events</strong>
            </div>
          </div>
          <div className="truth-spine-replay-list">
            {replayTimeline.slice(0, 8).map((event, index) => (
              <article key={`${event.event_type}-${event.ts}-${index}`}>
                <strong>{statusLabel(event.event_type)}</strong>
                <span>{event.summary}</span>
                <small>{event.ts || "no timestamp"}</small>
              </article>
            ))}
            {!replayTimeline.length ? <p>No replay events yet.</p> : null}
          </div>
        </div>

        <div className="truth-spine-panel">
          <div className="truth-spine-panel-head">
            <div>
              <span>Federation Registry</span>
              <strong>{Number(federation?.active_count || 0)} active / {Number(federation?.count || 0)} total</strong>
            </div>
          </div>
          <div className="truth-spine-federation-list">
            {federatedSystems.slice(0, 8).map((system) => (
              <article key={system.system_id}>
                <strong>{system.display_name || system.system_id}</strong>
                <span>{statusLabel(system.trust_mode)} / {system.active ? "active" : "inactive"}</span>
                <small>{system.system_id} / {system.system_type}</small>
              </article>
            ))}
            {!federatedSystems.length ? <p>No federation systems registered.</p> : null}
          </div>
        </div>
      </section>

      <section className="truth-spine-grid truth-spine-grid--lower">
        <div className="truth-spine-panel">
          <div className="truth-spine-panel-head">
            <div>
              <span>Sources Table</span>
              <strong>{sources.length} records</strong>
            </div>
          </div>
          <div className="truth-spine-source-list">
            {sources.map((source) => (
              <article key={source.source_id}>
                <strong>{source.title}</strong>
                <span>{source.evidence_type} / {statusLabel(source.verification_status)}</span>
                <small>{source.uri || source.source_id}</small>
              </article>
            ))}
            {!sources.length ? <p>No sources yet.</p> : null}
          </div>
        </div>

        <div className="truth-spine-panel">
          <div className="truth-spine-panel-head">
            <div>
              <span>Audit Feed</span>
              <strong>{auditEvents.length} events</strong>
            </div>
          </div>
          <div className="truth-spine-audit-list">
            {auditEvents.map((event) => (
              <article key={`${event.ts}-${event.entity_id}-${event.action}`}>
                <strong>{event.action}</strong>
                <span>{event.entity_type} / {event.entity_id}</span>
                <small>{event.ts}</small>
              </article>
            ))}
            {!auditEvents.length ? <p>No audit events yet.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
