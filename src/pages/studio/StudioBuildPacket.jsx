import React from "react";
import { useStudioExperience } from "./StudioExperience.jsx";
import { buildPacketDeliverableItems, buildPacketRequirementItems } from "@/lib/studio/buildPacket.js";

function PacketList({ items, empty }) {
  return items.length ? <ul className="studio-packetList">{items.map((item, index) => <li key={`${item.label}-${index}`}><strong>{item.label}</strong>{item.detail && <span>{item.detail}</span>}</li>)}</ul> : <p className="studio-muted">{empty}</p>;
}

export default function StudioBuildPacket({ packet, loading = false, error = null }) {
  const { mode } = useStudioExperience();
  if (loading) return <section className="studio-packet" aria-labelledby="studio-packet-heading"><h2 id="studio-packet-heading">Project Plan / Requirements</h2><p className="studio-muted" role="status">Loading your project plan…</p></section>;
  if (error) return <section className="studio-packet" aria-labelledby="studio-packet-heading"><h2 id="studio-packet-heading">Project Plan / Requirements</h2><p className="studio-error" role="alert">Your project plan is unavailable right now. Your project is still safe. Please try again.</p></section>;
  if (!packet) return null;
  const requirements = buildPacketRequirementItems(packet.requirements);
  const deliverables = buildPacketDeliverableItems(packet.deliverables);
  return <section className="studio-packet" aria-labelledby="studio-packet-heading"><div className="studio-sectionHeading"><div><p className="studio-eyebrow">Project context</p><h2 id="studio-packet-heading">Project Plan / Requirements</h2></div><span>What this project is asking you to build.</span></div><div className="studio-packetGrid"><div><h3>What you’re building</h3><p><strong>{packet.project?.title}</strong></p><p>{packet.project?.type === "AI_AGENT" ? "AI Agent" : "Website"} project</p></div><div><h3>What it needs</h3><PacketList items={requirements} empty="No formal requirements are available yet." /></div><div><h3>What you’ll turn in</h3><PacketList items={deliverables} empty="No formal deliverables are available yet." /></div></div>{mode === "ADVANCED" && <details className="studio-packetAdvanced"><summary>Technical project context</summary><dl className="studio-facts"><div><dt>Assignment</dt><dd>{packet.lineage?.assignmentId || "Independent project"}</dd></div><div><dt>Release</dt><dd>{packet.lineage?.curriculumReleaseId || "Not applicable"}</dd></div><div><dt>Packet version</dt><dd>{packet.version}</dd></div></dl></details>}<p className="studio-packetNote">This plan describes the work. It does not mark requirements complete or approve the project.</p></section>;
}
