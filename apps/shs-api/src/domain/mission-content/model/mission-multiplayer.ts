// Phase 5 — declarative multiplayer envelope carried inside the immutable MissionDefinition.
//
// Multiplayer coordinates participants; it does not create a second Mission authority.
// Mission roles are participation roles declared here, never platform/RBAC roles: assigning
// one grants no admin, organization, instructor, Evidence or governance permission.
// Missions without this block remain single-player and behave exactly as before.

// Hard system bound on team size regardless of declaration.
export const MISSION_TEAM_SYSTEM_MAX_PARTICIPANTS = 8;
export const MISSION_TEAM_MAX_ROLES = 6;
export const MISSION_TEAM_MODES = Object.freeze(["SINGLE_TEAM"] as const);
export const MISSION_LATE_JOIN_POLICIES = Object.freeze(["NONE", "ALLOW_WHILE_ACTIVE"] as const);

export interface MissionTeamRole {
  roleId: string;
  label: string;
  // Team activation requires at least one JOINED participant in every required role.
  required: boolean;
  maxParticipants: number;
}

export interface MissionMultiplayerDeclaration {
  enabled: true;
  minParticipants: number;
  maxParticipants: number;
  teamMode: (typeof MISSION_TEAM_MODES)[number];
  roles: MissionTeamRole[];
  // Conservative default: NONE (join only while the team is FORMING).
  lateJoinPolicy: (typeof MISSION_LATE_JOIN_POLICIES)[number];
}

const ROLE_ID = /^[A-Z][A-Z0-9_]{1,47}$/;
const EXECUTABLE_TEXT = /<\s*script\b|javascript\s*:|\beval\s*\(|\bnew\s+Function\b/i;

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function add(errors: string[], condition: boolean, message: string) {
  if (!condition) errors.push(message);
}

export function declaredMissionRoles(definition: { multiplayer?: MissionMultiplayerDeclaration }) {
  return new Set((definition.multiplayer?.roles ?? []).map((role) => role.roleId));
}

export function validateMissionMultiplayerDeclaration(value: Record<string, any>, errors: string[]) {
  if (value.multiplayer === undefined) return;
  const multiplayer = value.multiplayer;
  add(errors, isRecord(multiplayer), "multiplayer must be an object");
  if (!isRecord(multiplayer)) return;
  for (const key of Object.keys(multiplayer)) {
    add(errors, ["enabled", "minParticipants", "maxParticipants", "teamMode", "roles", "lateJoinPolicy"].includes(key), `multiplayer.${key}: unsupported field`);
  }
  add(errors, multiplayer.enabled === true, "multiplayer.enabled must be true when declared (omit the block for single-player)");
  add(errors, MISSION_TEAM_MODES.includes(multiplayer.teamMode), "multiplayer.teamMode must be SINGLE_TEAM (multi-team Missions are deferred)");
  add(errors, MISSION_LATE_JOIN_POLICIES.includes(multiplayer.lateJoinPolicy), "multiplayer.lateJoinPolicy is invalid");
  const min = multiplayer.minParticipants;
  const max = multiplayer.maxParticipants;
  add(errors, Number.isInteger(min) && min >= 1, "multiplayer.minParticipants must be a positive integer");
  add(errors, Number.isInteger(max) && max >= min && max <= MISSION_TEAM_SYSTEM_MAX_PARTICIPANTS,
    `multiplayer.maxParticipants must be between minParticipants and ${MISSION_TEAM_SYSTEM_MAX_PARTICIPANTS}`);
  const roles = Array.isArray(multiplayer.roles) ? multiplayer.roles : [];
  add(errors, roles.length >= 1 && roles.length <= MISSION_TEAM_MAX_ROLES, `multiplayer.roles must declare 1-${MISSION_TEAM_MAX_ROLES} roles`);
  const seen = new Set<string>();
  let requiredSeats = 0;
  roles.forEach((role: any, index: number) => {
    const path = `multiplayer.roles[${index}]`;
    if (!isRecord(role)) return void errors.push(`${path} must be an object`);
    for (const key of Object.keys(role)) add(errors, ["roleId", "label", "required", "maxParticipants"].includes(key), `${path}.${key}: unsupported field`);
    add(errors, typeof role.roleId === "string" && ROLE_ID.test(role.roleId), `${path}.roleId must be UPPER_SNAKE`);
    add(errors, !seen.has(role.roleId), `${path}.roleId is duplicated`);
    seen.add(role.roleId);
    add(errors, typeof role.label === "string" && role.label.trim().length > 0 && role.label.length <= 80 && !EXECUTABLE_TEXT.test(role.label), `${path}.label must be bounded safe text`);
    add(errors, typeof role.required === "boolean", `${path}.required must be boolean`);
    add(errors, Number.isInteger(role.maxParticipants) && role.maxParticipants >= 1 && role.maxParticipants <= MISSION_TEAM_SYSTEM_MAX_PARTICIPANTS, `${path}.maxParticipants is invalid`);
    if (role.required === true) requiredSeats += 1;
  });
  add(errors, requiredSeats <= (Number.isInteger(max) ? max : 0), "multiplayer: required roles exceed maxParticipants");
  // minParticipants must be seatable: the declared role capacity has to reach it (maxParticipants stays an upper bound).
  const seats = roles.reduce((total: number, role: any) => total
    + (isRecord(role) && Number.isInteger(role.maxParticipants) && role.maxParticipants >= 1 && role.maxParticipants <= MISSION_TEAM_SYSTEM_MAX_PARTICIPANTS ? role.maxParticipants : 0), 0);
  add(errors, !Number.isInteger(min) || seats >= min, `multiplayer: declared role capacity (${seats}) cannot seat minParticipants (${min})`);
}
