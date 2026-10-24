import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import Donation from "./pages/Donation.jsx";
import DonationReturn from "./pages/DonationReturn.jsx";
import CountyDetail from "./pages/CountyDetail";
import FoundationLayout from "./layout/FoundationLayout";
import PublicInfoPage from "./pages/PublicInfoPage";
import { installGlobalButtonClickSound } from "../shared/ui/globalButtonClickSound.js";
import "./styles/foundation.css";
import "./styles/shf-home-mock.css";

function getRoute(currentHash) {
  const hash = currentHash || "#/top";
  if (/^#\/county\/[^/]+$/i.test(hash)) return "county";
  if (hash === "#reports" || hash.startsWith("#reports?")) return "top";
  const route = hash.replace(/^#\/?/, "").split("?")[0].replace(/\/$/, "");
  if (["get-involved/success", "get-involved/canceled"].includes(route))
    return route;
  if (
    [
      "mission",
      "about",
      "programs",
      "partners",
      "get-involved",
      "reports",
    ].includes(route)
  )
    return route;
  return "top";
}

export default function FoundationApp() {
  const [hash, setHash] = useState(() => window.location.hash);
  const route = getRoute(hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  let page = <Home />;
  if (route === "county") page = <CountyDetail />;
  if (route === "mission") page = <PublicInfoPage page="mission" />;
  if (route === "about") page = <PublicInfoPage page="about" />;
  if (route === "get-involved") page = <Donation />;
  if (route === "get-involved/success") page = <DonationReturn key={hash} />;
  if (route === "get-involved/canceled")
    page = <DonationReturn key={hash} canceled />;
  if (["programs", "partners", "reports"].includes(route))
    page = <PublicInfoPage page={route} />;

  return <FoundationLayout>{page}</FoundationLayout>;
}

installGlobalButtonClickSound();
