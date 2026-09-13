import { ExperienceStateRepo } from "../repo/experience-state-repo.js";
import type { ExperienceAction, ExperienceState, ExperienceStateInput } from "../model/experience-state.js";
import { isDevelopmentAcceptanceCatalogEnabled, SERVER_ORIENTATION_CATALOG } from "./orientation-context-service.js";

const transitions: Record<ExperienceAction, string[]> = {
  OFFER: ["OFFERED"], START: ["STARTED"], PROGRESS: ["STARTED", "PAUSED"], PAUSE: ["PAUSED"], RESUME: ["STARTED"],
  SKIP: ["SKIPPED"], DISMISS: ["DISMISSED"], COMPLETE: ["COMPLETED"], RESTART: ["STARTED"], WHATS_CHANGED_SEEN: ["OFFERED", "STARTED", "PAUSED", "SKIPPED", "DISMISSED", "COMPLETED"],
};

function validId(value: unknown, label: string): string | null {
  const result = String(value ?? "").trim();
  if (!result || result.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(result)) throw new Error(`${label}_INVALID`);
  return result;
}

export class ExperienceStateService {
  constructor(private readonly repo = new ExperienceStateRepo()) {}

  async get(scope: { userId: string; organizationId: string; tenantId: string }, input: ExperienceStateInput): Promise<ExperienceState | null> {
    const catalog = SERVER_ORIENTATION_CATALOG.find((entry) => (!entry.testOnly || isDevelopmentAcceptanceCatalogEnabled()) && entry.orientationId === String(input.orientationId) && entry.lifecycle === "ACTIVE");
    if (!catalog || catalog.version !== input.orientationVersion || (input.tourId && input.tourId !== catalog.tourId)) throw new Error("ORIENTATION_VERSION_NOT_ACTIVE");
    return this.repo.get(scope, input);
  }

  async apply(scope: { userId: string; organizationId: string; tenantId: string }, action: ExperienceAction, input: ExperienceStateInput): Promise<ExperienceState> {
    const orientationId = validId(input.orientationId, "ORIENTATION_ID");
    const catalog = SERVER_ORIENTATION_CATALOG.find((entry) => (!entry.testOnly || isDevelopmentAcceptanceCatalogEnabled()) && entry.orientationId === orientationId && entry.lifecycle === "ACTIVE");
    if (!catalog || catalog.version !== input.orientationVersion) throw new Error("ORIENTATION_VERSION_NOT_ACTIVE");
    if (input.tourId && input.tourId !== catalog.tourId) throw new Error("TOUR_NOT_BOUND_TO_ORIENTATION");
    const current = await this.repo.get(scope, input);
    if (current?.status === "COMPLETED" && action !== "RESTART" && action !== "WHATS_CHANGED_SEEN") return current;
    const status = action === "OFFER" ? "OFFERED" : action === "PAUSE" ? "PAUSED" : action === "SKIP" ? "SKIPPED" : action === "DISMISS" ? "DISMISSED" : action === "COMPLETE" ? "COMPLETED" : "STARTED";
    if (current && !transitions[action].includes(status) && action !== "WHATS_CHANGED_SEEN") throw new Error("EXPERIENCE_TRANSITION_INVALID");
    return this.repo.upsert(scope, input, { action, status: status as any, currentStepId: input.currentStepId, lastRoute: input.lastRoute, lastDestinationId: input.lastDestinationId, replay: action === "RESTART", markWhatsChanged: action === "WHATS_CHANGED_SEEN" });
  }
}
