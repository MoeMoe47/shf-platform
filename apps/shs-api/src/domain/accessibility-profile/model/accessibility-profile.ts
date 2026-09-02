// SHF AIEL Phase 3 — canonical Personal Accessibility Profile contract.
//
// This is the exact, locked shape from docs/SHF_AIEL_PROFILE_CONTRACT_V1.md
// §5 — no field exists here that was not already named in that document.
// Every enum reserves an AUTO/DEFAULT value for forward compatibility
// (docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md §12/§19).
export const TEXT_SCALE_VALUES = ["DEFAULT", "LARGE", "EXTRA_LARGE"] as const;
export type TextScale = typeof TEXT_SCALE_VALUES[number];

export const CONTRAST_MODE_VALUES = ["DEFAULT", "HIGH"] as const;
export type ContrastMode = typeof CONTRAST_MODE_VALUES[number];

export const FOCUS_EMPHASIS_VALUES = ["DEFAULT", "ENHANCED"] as const;
export type FocusEmphasis = typeof FOCUS_EMPHASIS_VALUES[number];

export const TARGET_SIZE_VALUES = ["DEFAULT", "LARGE"] as const;
export type TargetSize = typeof TARGET_SIZE_VALUES[number];

export const MEDIA_PREFERENCE_VALUES = ["AUTO", "PREFER", "DO_NOT_AUTO_SHOW"] as const;
export type MediaPreference = typeof MEDIA_PREFERENCE_VALUES[number];

export const MOTION_PREFERENCE_VALUES = ["AUTO", "REDUCED", "FULL"] as const;
export type MotionPreference = typeof MOTION_PREFERENCE_VALUES[number];

export const CELEBRATION_INTENSITY_VALUES = ["FULL", "SUBTLE", "OFF"] as const;
export type CelebrationIntensityPreference = typeof CELEBRATION_INTENSITY_VALUES[number];

export const READING_SUPPORT_VALUES = ["CORE", "SIMPLE", "ADVANCED"] as const;
export type ReadingSupport = typeof READING_SUPPORT_VALUES[number];

export const READ_ALOUD_PREFERENCE_VALUES = ["AUTO", "PROMINENT", "HIDDEN"] as const;
export type ReadAloudPreference = typeof READ_ALOUD_PREFERENCE_VALUES[number];

export interface AccessibilityPreferences {
  presentation: {
    textScale: TextScale;
    contrastMode: ContrastMode;
  };
  interaction: {
    focusEmphasis: FocusEmphasis;
    targetSize: TargetSize;
  };
  media: {
    captionPreference: MediaPreference;
    transcriptPreference: MediaPreference;
  };
  sensory: {
    motionPreference: MotionPreference;
    celebrationIntensity: CelebrationIntensityPreference;
  };
  learningSupport: {
    preferredReadingSupport: ReadingSupport;
    readAloudPreference: ReadAloudPreference;
  };
}

// Canonical platform default (docs/SHF_AIEL_PROFILE_CONTRACT_V1.md §5's
// Default column) — the authoritative schema source, never the legacy
// Accessibility page's own field names or defaults.
export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  presentation: { textScale: "DEFAULT", contrastMode: "DEFAULT" },
  interaction: { focusEmphasis: "DEFAULT", targetSize: "DEFAULT" },
  media: { captionPreference: "AUTO", transcriptPreference: "AUTO" },
  sensory: { motionPreference: "AUTO", celebrationIntensity: "FULL" },
  learningSupport: { preferredReadingSupport: "CORE", readAloudPreference: "AUTO" },
};

export interface AccessibilityProfileRow {
  id: string;
  userId: string;
  profileVersion: number;
  revision: number;
  preferences: AccessibilityPreferences;
  createdAt: string;
  updatedAt: string;
}

// The GET shape when no row exists yet (Phase 2 §15 — never persisted).
export interface DefaultAccessibilityProfile {
  userId: string;
  profileVersion: 1;
  revision: null;
  preferences: AccessibilityPreferences;
  isDefault: true;
}
