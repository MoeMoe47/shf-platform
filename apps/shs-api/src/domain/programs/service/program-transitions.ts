const allowed: Record<string, string[]> = {
  draft: ["active"],
  active: ["paused", "closed"],
  paused: ["active", "closed"],
  closed: [],
  archived: [],
};

export function canTransitionProgram(currentStatus: string, nextStatus: string) {
  return (allowed[currentStatus] || []).includes(nextStatus);
}
