import React from "react";
import GuidanceCenter from "./GuidanceCenter.jsx";
import { useAuthContext } from "@/auth/auth-context.jsx";
import { useLocation } from "react-router-dom";

const ACTIVE_ENTRY_POINTS = Object.freeze({
  curriculum: {
    destinationId: "curriculum",
    routeId: "curriculum.dashboard",
    orientationId: "orientation:curriculum:student-dashboard",
    tourId: "tour:curriculum:student-dashboard",
    title: "Curriculum guidance",
  },
  "curriculum-instructor": {
    destinationId: "curriculum",
    routeId: "curriculum.instructor.operations",
    orientationId: "orientation:curriculum:instructor-operations",
    tourId: "tour:curriculum:instructor-operations",
    title: "Instructor curriculum guidance",
  },
  "curriculum-studio": {
    destinationId: "curriculum",
    routeId: "curriculum.dashboard",
    orientationId: "orientation:curriculum:student-dashboard",
    tourId: "tour:curriculum:student-dashboard",
    title: "Studio guidance",
  },
  civic: {
    destinationId: "civic",
    routeId: "civicsure.provider.workspace",
    orientationId: "orientation:civicsure:provider",
    tourId: "tour:civicsure:provider",
    title: "CivicSure guidance",
  },
  "agent-fabric": {
    destinationId: "agent-fabric",
    routeId: "agent-fabric.operator.workspace",
    orientationId: "orientation:agent-fabric:operator",
    tourId: "tour:agent-fabric:operator",
    title: "Agent Fabric guidance",
  },
  "civic-operator": {
    destinationId: "civic",
    routeId: "civicsure.operator.verification",
    orientationId: "orientation:civicsure:operator",
    tourId: "tour:civicsure:operator",
    title: "CivicSure operator guidance",
  },
  "executive-command": {
    destinationId: "shs-bos-executive-command",
    routeId: "shs.bos.executive-command",
    orientationId: "orientation:shs-bos:executive-command",
    tourId: "tour:shs-bos:executive-command",
    title: "Executive Command guidance",
  },
  sales: {
    destinationId: "sales",
    routeId: "sales.pipeline",
    orientationId: "orientation:sales:pipeline",
    tourId: "tour:sales:pipeline",
    title: "Sales guidance",
  },
});

// Only published, server-resolvable contracts get a live entry point. Public
// pages and draft contracts remain out of the authenticated Guidance Center.
export default function OglGuidanceEntryPoint({ appScope }) {
  const auth = useAuthContext();
  const location = useLocation();
  const isStudio = appScope === "curriculum" && location.pathname.startsWith("/studio");
  const resolvedScope = isStudio ? "curriculum-studio" : appScope === "curriculum" && ["instructor", "shf_admin"].includes(auth.role)
    ? "curriculum-instructor"
    : appScope;
  const config = ACTIVE_ENTRY_POINTS[resolvedScope];
  return config ? <GuidanceCenter {...config} /> : null;
}
