import { randomUUID } from "crypto";
import { ProgramRepo } from "../repo/program-repo";
import { canTransitionProgram } from "./program-transitions";

export class ProgramService {
  private repo = new ProgramRepo();

  async listPrograms() {
    return this.repo.listPrograms();
  }

  async createProgram(input: any, actor?: any) {
    if (!input?.name) throw new Error("Program name is required");
    if (!input?.program_type) throw new Error("Program type is required");

    return this.repo.createProgram({
      program_id: `prog_${randomUUID()}`,
      organization_id: actor?.organization_id || "org_shf_001",
      status: "draft",
      created_by_user_id: actor?.user_id || null,
      ...input,
    });
  }

  async transitionProgram(programId: string, currentStatus: string, nextStatus: string, _actor?: any, _reasonText?: string) {
    if (!canTransitionProgram(currentStatus, nextStatus)) {
      throw new Error(`Invalid program transition: ${currentStatus} -> ${nextStatus}`);
    }

    const updated = await this.repo.updateProgramStatus(programId, nextStatus);
    if (!updated) throw new Error("Program not found");
    return updated;
  }

  async listTaxonomy() {
    return this.repo.listTaxonomy();
  }
}
