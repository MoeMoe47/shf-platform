import { HashRouter as Router, Routes, Route } from "react-router-dom";

// EXISTING PAGE
import SHSExchangeMissionControl from "@/pages/exchange/SHSExchangeMissionControl.jsx";

// NEW SHF PAGE
import SHFImpactCommandCenter from "./pages/shf-command/SHFImpactCommandCenter";

export default function App() {
  return (
    <Router>
      <Routes>

        {/* EXISTING ROUTE */}
        <Route path="/exchange-mission" element={<SHSExchangeMissionControl />} />

        {/* NEW SHF COMMAND CENTER */}
        <Route path="/shf-command" element={<SHFImpactCommandCenter />} />

      </Routes>
    </Router>
  );
}
