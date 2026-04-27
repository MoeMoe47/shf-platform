import React, { createContext, useContext, useMemo, useState } from "react";

const SelectedEntityContext = createContext({
  selectedEntity: null,
  setSelectedEntity: () => {},
  clearSelectedEntity: () => {},
});

export function SelectedEntityProvider({ children }) {
  const [selectedEntity, setSelectedEntity] = useState(null);

  const value = useMemo(
    () => ({
      selectedEntity,
      setSelectedEntity,
      clearSelectedEntity: () => setSelectedEntity(null),
    }),
    [selectedEntity]
  );

  return (
    <SelectedEntityContext.Provider value={value}>
      {children}
    </SelectedEntityContext.Provider>
  );
}

export function useSelectedEntity() {
  return useContext(SelectedEntityContext);
}

export default SelectedEntityContext;
