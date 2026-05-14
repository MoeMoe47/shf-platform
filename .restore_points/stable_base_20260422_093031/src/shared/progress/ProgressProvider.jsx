import React from "react";
import { markLessonComplete as mark, getProgress as get } from "./progressClient.js";

const Ctx = React.createContext({ markLessonComplete: () => {}, getProgress: () => [] });
export function useProgress(){ return React.useContext(Ctx); }

export default function ProgressProvider({ children }) {
  const api = React.useMemo(() => ({
    markLessonComplete: mark,
    getProgress: get,
  }), []);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
