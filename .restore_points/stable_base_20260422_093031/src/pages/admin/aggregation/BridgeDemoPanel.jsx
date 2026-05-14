import React from "react";
import { buildHubReferralBridgeDemo } from "./bridge-demo";

export default function BridgeDemoPanel() {
  const demo = buildHubReferralBridgeDemo();

  return (
    <section className="admin-aggregation-bridge">
      <div className="admin-aggregation-bridge__header">
        <div>
          <p className="admin-aggregation-bridge__eyebrow">Hub → Aggregation → Verification/Reporting</p>
          <h2 className="admin-aggregation-bridge__title">Bridge Demo Panel</h2>
          <p className="admin-aggregation-bridge__subtitle">
            Example flow proving one Hub referral can become a canonical referral, verification package,
            and reporting package inside the shared bridge system.
          </p>
        </div>
      </div>

      <div className="admin-aggregation-bridge__grid">
        <article className="admin-aggregation-bridge__card">
          <span className="admin-aggregation-bridge__label">Hub Source</span>
          <pre className="admin-aggregation-bridge__code">
{JSON.stringify(demo.source, null, 2)}
          </pre>
        </article>

        <article className="admin-aggregation-bridge__card">
          <span className="admin-aggregation-bridge__label">Canonical Referral</span>
          <pre className="admin-aggregation-bridge__code">
{JSON.stringify(demo.canonicalReferral, null, 2)}
          </pre>
        </article>

        <article className="admin-aggregation-bridge__card">
          <span className="admin-aggregation-bridge__label">Verification Package</span>
          <pre className="admin-aggregation-bridge__code">
{JSON.stringify(demo.verificationPackage, null, 2)}
          </pre>
        </article>

        <article className="admin-aggregation-bridge__card">
          <span className="admin-aggregation-bridge__label">Reporting Package</span>
          <pre className="admin-aggregation-bridge__code">
{JSON.stringify(demo.reportingPackage, null, 2)}
          </pre>
        </article>
      </div>
    </section>
  );
}
