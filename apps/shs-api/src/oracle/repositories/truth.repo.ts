import { OracleTruthRecord } from "../domain/types.js";

const STORE: Record<string, OracleTruthRecord> = {};

export function getTruth(entityId: string): OracleTruthRecord | null {
  return STORE[entityId] || null;
}

export function setTruth(record: OracleTruthRecord): OracleTruthRecord {
  STORE[record.entityId] = record;
  return record;
}
