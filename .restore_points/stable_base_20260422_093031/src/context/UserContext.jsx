// src/context/UserContext.jsx
import React from "react";

// ✅ export the context so other hooks/components can import it safely
export const UserContext = React.createContext({
  role: "student",   // 'student' | 'admin'
  name: "Student",
  email: "student@example.com",
  curriculum: "asl",
});

export function UserProvider({ children }) {
  // Allow any truthy ?admin to force admin view (e.g. ?admin, ?admin=1, ?admin=true)
  const params = new URLSearchParams(window.location.search);
  const adminQS = params.get("admin");
  const isAdmin = adminQS !== null && adminQS !== "0" && adminQS !== "false";

  // If the boot shim populated window.__user, respect it
  const bootUser = (window.__user || {});
  const role = (bootUser.role || (isAdmin ? "admin" : "student")).toLowerCase();
  const name = bootUser.name || (isAdmin ? "Admin" : "Student");
  const email = bootUser.email || (isAdmin ? "admin@example.com" : "student@example.com");
  const curriculum = (bootUser.curriculum || "asl").toLowerCase();

  const value = React.useMemo(() => ({
    role, name, email, curriculum
  }), [role, name, email, curriculum]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Optional helper if you like using a hook directly
export function useUser() {
  return React.useContext(UserContext);
}
