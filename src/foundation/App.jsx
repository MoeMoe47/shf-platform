import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import CountyDetail from "./pages/CountyDetail";
import FoundationLayout from "./layout/FoundationLayout";
import PublicInfoPage from "./pages/PublicInfoPage";
import { installGlobalButtonClickSound } from "../shared/ui/globalButtonClickSound.js";
import "./styles/foundation.css";
import "./styles/shf-home-mock.css";

function getRoute() {
  const hash = window.location.hash || "#/top";
  if (/^#\/county\/[^/]+$/i.test(hash)) return "county";
  if (hash === "#reports") return "top";
  const route = hash.replace(/^#\/?/, "").split("?")[0].replace(/\/$/, "");
  if (["mission", "about", "programs", "partners", "get-involved", "reports"].includes(route)) return route;
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
  if (route === "mission") page = <PublicInfoPage page="mission" />;
  if (route === "about") page = <PublicInfoPage page="about" />;
  if (["programs", "partners", "get-involved", "reports"].includes(route)) page = <PublicInfoPage page={route} />;

  return <FoundationLayout>{page}</FoundationLayout>;
}

installGlobalButtonClickSound();
