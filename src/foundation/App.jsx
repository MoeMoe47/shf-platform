import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import Donation from "./pages/Donation.jsx";
import CountyDetail from "./pages/CountyDetail";
import FoundationLayout from "./layout/FoundationLayout";
import PublicInfoPage from "./pages/PublicInfoPage";
import DataCenterCommunityImpact from "./pages/DataCenterCommunityImpact";
import { installGlobalButtonClickSound } from "../shared/ui/globalButtonClickSound.js";
import "./styles/foundation.css";
import "./styles/shf-home-mock.css";

function getRoute() {
  const hash = window.location.hash || "#/top";
  if (/^#\/county\/[^/]+$/i.test(hash)) return "county";
  if (hash === "#reports" || hash.startsWith("#reports?")) return "top";
  const route = hash.replace(/^#\/?/, "").split("?")[0].replace(/\/$/, "");
  if (["mission", "about", "programs", "partners", "get-involved", "reports", "data-center-community-impact"].includes(route)) return route;
  return "top";
}

export default function FoundationApp() {
  const [route, setRoute] = useState(getRoute());
  const [hash, setHash] = useState(() => window.location.hash || "#/top");

  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash || "#/top");
      setRoute(getRoute());
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    if (route !== "data-center-community-impact") return;
    const query = hash.split("?")[1] || "";
    const section = new URLSearchParams(query).get("section");
    if (!section) return;
    requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ block: "start" }));
  }, [hash, route]);

  let page = <Home />;
  if (route === "county") page = <CountyDetail />;
  if (route === "mission") page = <PublicInfoPage page="mission" />;
  if (route === "about") page = <PublicInfoPage page="about" />;
  if (route === "get-involved") page = <Donation />;
  if (["programs", "partners", "reports"].includes(route)) page = <PublicInfoPage page={route} />;
  if (route === "data-center-community-impact") {
    page = <DataCenterCommunityImpact />;
  }

  return <FoundationLayout>{page}</FoundationLayout>;
}

installGlobalButtonClickSound();
