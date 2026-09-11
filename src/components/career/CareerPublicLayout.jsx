import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import CareerPublicHeader from "@/components/career/CareerPublicHeader.jsx";
import CareerPublicFooter from "@/components/career/CareerPublicFooter.jsx";

export default function CareerPublicLayout() {
  useEffect(() => {
    document.body.dataset.careerPublic = "true";
    return () => { delete document.body.dataset.careerPublic; };
  }, []);

  return <div className="career-public"><CareerPublicHeader /><div className="career-public__main"><Outlet /></div><CareerPublicFooter /></div>;
}
