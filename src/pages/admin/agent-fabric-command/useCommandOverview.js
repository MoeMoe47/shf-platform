// src/pages/admin/agent-fabric-command/useCommandOverview.js
import React from "react";
import { createOverviewCoordinator, initialOverviewSnapshot } from "./overviewCoordinator.js";

// Single subscription point for every Command Overview panel.
export default function useCommandOverview(options) {
  const [snapshot, setSnapshot] = React.useState(initialOverviewSnapshot);
  const [refreshing, setRefreshing] = React.useState(false);
  const coordinatorRef = React.useRef(null);

  React.useEffect(() => {
    const coordinator = createOverviewCoordinator({ ...options, onUpdate: setSnapshot });
    coordinatorRef.current = coordinator;
    coordinator.start();
    return () => coordinator.stop();
    // The coordinator is created once per mount; options are static.
  }, []);

  const refresh = React.useCallback(async () => {
    if (!coordinatorRef.current) return;
    setRefreshing(true);
    try {
      await coordinatorRef.current.refreshAll();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { snapshot, refresh, refreshing };
}
