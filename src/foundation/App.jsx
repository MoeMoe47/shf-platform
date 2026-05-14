import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import About from "./pages/About";
import Mission from "./pages/Mission";
import CountyDetail from "./pages/CountyDetail";
import { installGlobalButtonClickSound } from "../shared/ui/globalButtonClickSound.js";

function getRoute() {
  const hash = window.location.hash || "#/top";
  if (/^#\/county\/[^/]+$/i.test(hash)) return "county";
  if (hash === "#/mission") return "mission";
  if (hash === "#/about") return "about";
  return "top";
}

export default function FoundationApp() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (route === "county") return <CountyDetail />;
  if (route === "mission") return <Mission />;
  if (route === "about") return <About />;
  return <Home />;
}

installGlobalButtonClickSound();
