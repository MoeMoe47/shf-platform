import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import About from "./pages/About";
import Mission from "./pages/Mission";
import CountyDetail from "./pages/CountyDetail";
import FoundationLayout from "./layout/FoundationLayout";
import { installGlobalButtonClickSound } from "../shared/ui/globalButtonClickSound.js";
import "./styles/foundation.css";
import "./styles/shf-home-mock.css";

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

  let page = <Home />;
  if (route === "county") page = <CountyDetail />;
  if (route === "mission") page = <Mission />;
  if (route === "about") page = <About />;

  return <FoundationLayout>{page}</FoundationLayout>;
}

installGlobalButtonClickSound();
