import { buildPriorityQueue } from "./priority-engine";

export async function runOraclePriority(entityIds: string[]) {
  return await buildPriorityQueue(entityIds);
}
