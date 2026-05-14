import React from "react";
import { COMMAND_CENTER_MODES, DEFAULT_MODE } from "./commandCenter.features";

const ModeContext = React.createContext();

export function ModeProvider({ children }) {
  const [mode, setMode] = React.useState(DEFAULT_MODE);

  const features = COMMAND_CENTER_MODES[mode] || {};

  return (
    <ModeContext.Provider value={{ mode, setMode, features }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return React.useContext(ModeContext);
}
