import React from "react";
import { groupStudioResources, normalizeStudioResources } from "@/lib/studio/resources.js";

function ResourceList({ items }) {
  return <ul className="studio-resourceList">{items.map((resource) => <li className="studio-resourceItem" key={resource.id}><div><h3>{resource.title}</h3>{resource.description && <p>{resource.description}</p>}<span className="studio-resourceMeta">{resource.type}</span></div>{resource.href ? <a className="studio-textLink" href={resource.href} target="_blank" rel="noreferrer">Open resource <span aria-hidden="true">↗</span><span className="studio-srOnly"> (opens in a new tab)</span></a> : <span className="studio-resourceUnavailable">Resource link unavailable</span>}</li>)}</ul>;
}

export default function StudioProjectResources({ project, resources = [], loading = false, error = null }) {
  const visibleResources = normalizeStudioResources({ resources });
  const groups = groupStudioResources(visibleResources, project);
  return <section className="studio-resources" aria-labelledby="studio-resources-heading"><div className="studio-sectionHeading"><div><p className="studio-eyebrow">{project?.origin === "ASSIGNMENT" ? "Supporting material" : "Helpful material"}</p><h2 id="studio-resources-heading">Project Resources</h2></div><span>Use these references as you build.</span></div>{loading ? <p className="studio-muted" role="status">Loading project resources…</p> : error ? <p className="studio-error" role="alert">Project resources are unavailable right now. Your project is still safe. Please try again.</p> : visibleResources.length === 0 ? <div className="studio-empty"><p><strong>No project resources are available yet.</strong><span>{project?.origin === "ASSIGNMENT" ? "No assignment-specific resources have been published for this project." : "Resources will appear here when they are explicitly connected to this project."}</span></p></div> : <div className="studio-resourceGroups">{groups.assignment.length > 0 && <div><h3>From your assignment</h3><ResourceList items={groups.assignment} /></div>}{groups.other.length > 0 && <div><h3>{project?.origin === "ASSIGNMENT" ? "More resources" : "Resources for this project"}</h3><ResourceList items={groups.other} /></div>}</div>}</section>;
}
