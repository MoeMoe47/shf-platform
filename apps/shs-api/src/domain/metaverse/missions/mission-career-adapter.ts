// MET-7 — career connection projection (build brief §14/§18).
//
// Read-only wrapper over the canonical career-pathways domain
// (apps/shs-api/src/domain/career-pathways/service/career-pathway-service.ts).
// Never asserts job/credential eligibility — only surfaces which real
// Program->Career links already exist for the mission's program, so the
// UI can display "related career context" honestly.
import { listCareersForProgram } from "../../career-pathways/service/career-pathway-service.js";
import type { MissionCareerContext } from "./mission-contract.js";

export async function resolveMissionCareerContext(organizationId: string, programId: string | null): Promise<MissionCareerContext | null> {
  if (!programId) return null;
  try {
    const careers = await listCareersForProgram(organizationId, programId);
    if (!careers.length) {
      return { pathwayIds: [programId], careerIds: [], notes: "This program has no linked career pathway yet." };
    }
    return {
      pathwayIds: [programId],
      careerIds: careers.map((c: any) => c.career_id).filter(Boolean),
      notes: "Career context is a read-time projection of existing Program-Career links; it is not an employment or credential claim.",
    };
  } catch {
    // Fail honest/empty — career context is decorative, never a gate.
    return null;
  }
}
