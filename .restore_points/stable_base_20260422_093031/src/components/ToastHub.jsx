// src/components/ToastHub.jsx
import React from "react";
import { useToasts } from "@/context/Toasts.jsx";

export default function ToastHub() {
  const { toast } = useToasts();

  // Show a toast any time points are earned (+N)
  React.useEffect(() => {
    const onEarn = (e) => {
      const p = Number(e?.detail?.points || 0);
      if (p > 0) {
        toast(`+${p} Points Earned!`, { type: "success", timeout: 1500 });
      }
    };
    window.addEventListener("rewards:earned", onEarn);
    return () => window.removeEventListener("rewards:earned", onEarn);
  }, [toast]);

  return null; // Hub only wires global listeners
}
