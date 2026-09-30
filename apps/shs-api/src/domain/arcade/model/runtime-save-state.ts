export const ARCADE_RUNTIME_SAVE_STATE_MAX_BYTES = 64 * 1024;

export interface ArcadeRuntimeSaveState {
  sessionId: string;
  revision: number;
  payload: Record<string, unknown>;
  savedAt: string;
  updatedAt: string;
}
