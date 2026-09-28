import React, { useEffect, useMemo, useRef, useState } from "react";
import { fabricUrl } from "@/system/fabric/fabricConfig";

export default function CountyInteractionLayer({
  county = null,
  profile,
  isOpen = false,
  onClose,
  onOpenDetail,
}) {
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState("");
  const [simResult, setSimResult] = useState(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      previousFocusRef.current = document.activeElement;
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else if (!isOpen && wasOpenRef.current) {
      previousFocusRef.current?.focus?.();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const countyName = county || profile?.label || "Unknown county";
  const risk = profile?.riskStatus || "High Risk";
  const confidence = profile?.confidence || "91%";
  const funding = profile?.funding || "$1.2M";
  const status = profile?.mapMetrics?.status || "Monitored";
  const recommendedAction = profile?.recommendedAction || "Open County Detail";

  const analystSummary = useMemo(() => {
    return (
      profile?.analystSummary ||
      `${countyName} is showing elevated intervention pressure, documentation sensitivity, and stalled reading recovery.`
    );
  }, [profile, countyName]);

  const sim = simResult?.output || null;

  const riskColor =
    /high/i.test(risk) ? "#ff7070" :
    /attention|warn|moderate/i.test(risk) ? "#f3b14f" :
    "#7fe0a1";

  async function handleRunSimulation() {
    setSimLoading(true);
    setSimError("");
    setSimResult(null);

    try {
      const res = await fetch(fabricUrl("/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "Layer09CaseSupportAgent",
          input: {
            region: countyName,
            countyFips: profile?.countyFips || null,
            issue: "Education Risk",
            priority: /high/i.test(risk) ? "High" : "Normal",
            confidence,
            funding,
            status,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Simulation request failed (${res.status})`);
      }

      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      setSimError(err?.message || "Simulation failed");
    } finally {
      setSimLoading(false);
    }
  }

  const panelStyle = {
    borderRadius: "14px",
    border: "1px solid rgba(120, 162, 224, 0.14)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.015) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            pointerEvents: "auto",
          }}
        >
          <div
            onClick={onClose}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(4, 10, 18, 0.62)",
              backdropFilter: "blur(5px)",
            }}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="iep-county-drawer-title"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(560px, calc(100vw - 24px))",
              borderLeft: "1px solid rgba(120, 162, 224, 0.18)",
              background:
                "linear-gradient(180deg, rgba(7, 13, 24, 0.985) 0%, rgba(4, 9, 18, 0.995) 100%)",
              padding: "22px",
              color: "#eef4ff",
              overflowY: "auto",
            }}
          >
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close county details">
              Close
            </button>
            <h2 id="iep-county-drawer-title">{countyName}</h2>
            <p>{analystSummary}</p>

            <button onClick={handleRunSimulation}>
              {simLoading ? "Running..." : "Run Simulation"}
            </button>

            {simError && <p style={{ color: "red" }}>{simError}</p>}
            {sim && <pre>{JSON.stringify(sim, null, 2)}</pre>}
          </aside>
        </div>
      )}
    </>
  );
}
