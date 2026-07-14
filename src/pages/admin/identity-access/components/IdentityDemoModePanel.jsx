import React from "react";

export default function IdentityDemoModePanel({ configuration = {} }) {
  return (
    <section className="identityAccess-panel span-3">
      <div className="panel-heading"><p>Demo</p><h2>Isolation</h2></div>
      <p className="identityAccess-boundary">
        Demo fixtures are non-production only and authenticate through the backend session service.
      </p>
      <strong className={configuration.demo_identity_enabled ? "warn" : "ok"}>
        {configuration.demo_identity_enabled ? "Enabled locally" : "Disabled"}
      </strong>
    </section>
  );
}

