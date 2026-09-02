// Presentation-only helpers for the derived Build Packet response.
// Unknown requirement shapes stay unavailable instead of being guessed.
export function buildPacketRequirementItems(requirements) {
  if (Array.isArray(requirements)) return requirements.filter(Boolean).map((item) => typeof item === "string" ? { label: item } : item?.label || item?.title ? { label: item.label || item.title, detail: item.description || null } : null).filter(Boolean);
  if (Array.isArray(requirements?.items)) return buildPacketRequirementItems(requirements.items);
  return [];
}

export function buildPacketDeliverableItems(deliverables) {
  if (!Array.isArray(deliverables)) return [];
  return deliverables.filter(Boolean).map((item) => typeof item === "string" ? { label: item } : item?.label || item?.title ? { label: item.label || item.title, detail: item.description || null } : null).filter(Boolean);
}
