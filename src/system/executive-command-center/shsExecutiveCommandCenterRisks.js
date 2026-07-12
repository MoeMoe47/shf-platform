export function summarizeExecutiveRisks(layers = []) {
  const risks = [];
  layers.forEach((layer) => {
    if (layer.blockers?.length) {
      risks.push({
        risk_id: `risk_${layer.layer_id}_blocker`,
        title: `${layer.layer_name} blocker`,
        risk_level: layer.status === "blocked" ? "critical" : "high",
        summary: layer.blockers.join(", "),
        source_layer: layer.layer_name,
        route: layer.route,
        data_posture: layer.data_posture,
      });
    }
    if (layer.warnings?.length) {
      risks.push({
        risk_id: `risk_${layer.layer_id}_warning`,
        title: `${layer.layer_name} warning`,
        risk_level: layer.category === "governance" ? "high" : "medium",
        summary: layer.warnings[0],
        source_layer: layer.layer_name,
        route: layer.route,
        data_posture: layer.data_posture,
      });
    }
  });
  risks.push({
    risk_id: "risk_shs_shf_boundary",
    title: "SHS / SHF boundary",
    risk_level: "medium",
    summary: "Boundary is intact; continue using Data Approval controls before any public surface.",
    source_layer: "Governance",
    route: "admin.html#/truth-spine",
    data_posture: "derived_local",
  });
  return risks.slice(0, 12);
}
