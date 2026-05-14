const allowed: Record<string, string[]> = {
  draft: ["open"],
  open: ["assigned"],
  assigned: ["in_review"],
  in_review: ["on_hold", "resolved"],
  on_hold: [],
  resolved: ["closed"],
  closed: ["reopened"],
  reopened: [],
};

export function canTransitionCase(currentStatus: string, nextStatus: string) {
  return (allowed[currentStatus] || []).includes(nextStatus);
}
