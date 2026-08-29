export const SPECIALIZATION_REQUEST_STATUSES = ["PENDING", "CONFIRMED", "DECLINED", "SUPERSEDED"] as const;
export type SpecializationRequestStatus = typeof SPECIALIZATION_REQUEST_STATUSES[number];

export const SPECIALIZATION_REQUEST_TYPES = ["PRIMARY", "CHANGE"] as const;
export type SpecializationRequestType = typeof SPECIALIZATION_REQUEST_TYPES[number];
