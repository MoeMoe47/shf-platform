import { useEffect, useState } from "react";
import { createStore } from "@/utils/storage";

const store = createStore("sh");

export function useStoreSignal(key, fallback) {
  const [val, setVal] = useState(() => store.get(key, fallback));
  useEffect(() => {
    const off = store.subscribe(key, () => setVal(store.get(key, fallback)));
    return off;
  }, [key, fallback]);
  return val;
}
