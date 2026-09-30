import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_ACCESSIBILITY_CONTRACT,
  SPATIAL_COMMAND_CENTER_RESPONSIVE_CONTRACT,
} from "../src/pages/spatial-command-center/SpatialCommandCenterPage.jsx";

test("W8D-A11Y-01 freezes semantic accessibility requirements", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_ACCESSIBILITY_CONTRACT, {
    semanticPageLandmarks: true,
    keyboardWorkspaceSwitching: true,
    visibleFocus: true,
    screenReaderWorkspaceLabel: true,
    coordinateSpaceTextEquivalent: true,
    nonColorOnlyQualificationState: true,
    nonColorOnlyIntelligenceState: true,
    semanticLoadingState: true,
    semanticEmptyState: true,
    semanticUnavailableState: true,
    reducedMotionCompatible: true,
    mapSummaryText: true,
    selectedFeatureAnnouncement: true,
    contextualPanelAccessibleLabel: true,
  });
});

test("W8D-A11Y-02 freezes responsive behavior without overlapping controls", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_RESPONSIVE_CONTRACT, {
    desktop: {
      workspaceSwitcherVisible: true,
      spatialCanvasDominant: true,
      contextualPanelOptional: true,
    },
    tablet: {
      compactWorkspaceSwitcher: true,
      contextualPanelCollapsible: true,
    },
    smallScreens: {
      noOverlappingControls: true,
      workspaceRemainsUsable: true,
      contextualPanelDrawerOrStack: true,
      coreTasksRequireHorizontalOverflow: false,
    },
  });
});
