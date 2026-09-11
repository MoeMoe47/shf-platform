export function isPublicOpportunityCandidate(opportunity: {
  status: string;
  publicVisibility: string;
  audienceScope: string;
  programId?: string | null;
  cohortId?: string | null;
  actionUrl?: string | null;
  actionRoute?: string | null;
  applicationDeadline?: string | null;
}, today = new Date().toISOString().slice(0, 10)): boolean {
  return opportunity.publicVisibility === "PUBLIC"
    && opportunity.status === "OPEN"
    && opportunity.audienceScope === "ORGANIZATION"
    && !opportunity.programId
    && !opportunity.cohortId
    && !!(opportunity.actionUrl || opportunity.actionRoute)
    && !!opportunity.applicationDeadline
    && opportunity.applicationDeadline >= today;
}
