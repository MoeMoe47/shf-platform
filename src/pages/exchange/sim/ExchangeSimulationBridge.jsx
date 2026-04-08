import React, { useEffect } from "react";
import useExchangeSimulation from "./useExchangeSimulation";

export default function ExchangeSimulationBridge({
  enabled = true,
  tickMs = 5000,
  onSimulationFrame,
}) {
  const sim = useExchangeSimulation({ enabled, tickMs });

  useEffect(() => {
    onSimulationFrame?.(sim);
  }, [sim, onSimulationFrame]);

  return null;
}
