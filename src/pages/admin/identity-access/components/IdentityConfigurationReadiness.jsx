import React from "react";

export default function IdentityConfigurationReadiness({ readiness = {} }) {
  const config = readiness.configuration || {};
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Readiness</p><h2>Production Configuration</h2></div>
      <div className="identityAccess-scoreInline">{readiness.score ?? "NA"}</div>
      <div className="identityAccess-list compact">
        {(config.blockers || []).map((item) => <article key={item}><strong>Blocker</strong><span>{item}</span></article>)}
        {(config.warnings || []).map((item) => <article key={item}><strong>Warning</strong><span>{item}</span></article>)}
        {!config.blockers?.length && <article><strong>Fail-closed</strong><span>Production blockers stop startup.</span></article>}
      </div>
    </section>
  );
}

