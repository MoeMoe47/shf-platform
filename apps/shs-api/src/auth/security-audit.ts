import { writeAuditEvent } from "../domain/audit/service/audit-helper";

function nowId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getAuditActor(req: any) {
  const user = req?.user || {};
  return {
    actor_user_id: user.user_id || user.id || "system",
    organization_id: user.organization_id || "shs-core",
  };
}

export async function writeSecurityAuditEvent(req: any, input: {
  action_type: string;
  target_object_type: string;
  target_object_id: string;
  previous_state_json?: unknown;
  new_state_json?: unknown;
  reason_code?: string | null;
  reason_text?: string | null;
}) {
  const actor = getAuditActor(req);

  try {
    return await writeAuditEvent({
      audit_event_id: nowId("audit"),
      organization_id: actor.organization_id,
      actor_user_id: actor.actor_user_id,
      target_object_type: input.target_object_type,
      target_object_id: input.target_object_id,
      action_type: input.action_type,
      previous_state_json: input.previous_state_json,
      new_state_json: input.new_state_json,
      reason_code: input.reason_code || null,
      reason_text: input.reason_text || null,
      correlation_id: nowId("corr"),
      source_channel: "shs-api",
    });
  } catch (error) {
    console.warn("[security-audit] write failed", {
      action_type: input.action_type,
      target_object_type: input.target_object_type,
      target_object_id: input.target_object_id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
