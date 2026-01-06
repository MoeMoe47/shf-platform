import React from "react";

export const LibraryCtx = React.createContext(null);

function readLocal(app){ try{ return JSON.parse(localStorage.getItem(`${app}:library`)||"[]"); }catch{return []} }
function writeLocal(app, arr){ try{ localStorage.setItem(`${app}:library`, JSON.stringify(arr)); }catch{} }

export default function LibraryProvider({ app, children }) {
  const files = React.useMemo(() => {
    try {
      const glob = import.meta.glob(`/src/content/${app}/lessons/*.json`, { eager: true });
      return Object.values(glob).map((m) => m.default).filter(Boolean);
    } catch {
      return [];
    }
  }, [app]);

  const [items, setItems] = React.useState(() => {
    const initial = readLocal(app);
    const byId = new Map(initial.map(x => [x.id, x]));
    files.forEach(f => { if (!byId.has(f.id)) byId.set(f.id, f); });
    return Array.from(byId.values());
  });

  React.useEffect(() => { writeLocal(app, items); }, [app, items]);

  const upsert = (obj) => {
    setItems(prev => {
      const i = prev.findIndex(x => x.id === obj.id);
      if (i >= 0) { const next=[...prev]; next[i] = { ...prev[i], ...obj }; return next; }
      return [obj, ...prev];
    });
  };
  const remove = (id) => setItems(prev => prev.filter(x => x.id !== id));
  const getById = (id) => items.find(x => String(x.id) === String(id));

  const value = { app, items, upsert, remove, getById };
  return <LibraryCtx.Provider value={value}>{children}</LibraryCtx.Provider>;
}

export const useLibrary = () => React.useContext(LibraryCtx);
