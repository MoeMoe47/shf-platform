import React, { createContext, useContext, useMemo, useState } from "react";

const SelectedEntityContext = createContext(null);

export function SelectedEntityProvider({ children }) {
  const [selectedEntityId, setSelectedEntityId] = useState("test_case_001");
  const [lastEntityAction, setLastEntityAction] = useState(null);
  const [entityActionVersion, setEntityActionVersion] = useState(0);

  function notifyEntityAction(payload) {
    setLastEntityAction({
      entityId: payload?.entityId || "unknown",
      action: payload?.action || "unknown",
      message: payload?.message || "",
      createdAt: payload?.createdAt || new Date().toISOString(),
    });
    setEntityActionVersion((v) => v + 1);
  }

  const value = useMemo(
    () => ({
      selectedEntityId,
      setSelectedEntityId,
      lastEntityAction,
      entityActionVersion,
      notifyEntityAction,
    }),
    [selectedEntityId, lastEntityAction, entityActionVersion]
  );

  return (
    <SelectedEntityContext.Provider value={value}>
      {children}
    </SelectedEntityContext.Provider>
  );
}

export function useSelectedEntity() {
  const ctx = useContext(SelectedEntityContext);

  if (!ctx) {
    return {
      selectedEntityId: "test_case_001",
      setSelectedEntityId: () => {},
      lastEntityAction: null,
      entityActionVersion: 0,
      notifyEntityAction: () => {},
      hasSelectedEntityProvider: false,
    };
  }

  return {
    ...ctx,
    hasSelectedEntityProvider: true,
  };
}
