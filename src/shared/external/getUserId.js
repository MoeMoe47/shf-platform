import { useContext } from "react";
import { UserContext } from "@/context/UserContext.jsx";
export function useUserId() {
  try {
    const ctx = useContext(UserContext);
    return ctx?.user?.id || "u_demo";
  } catch {
    return "u_demo";
  }
}
