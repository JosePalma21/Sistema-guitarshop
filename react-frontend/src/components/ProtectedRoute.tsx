import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    // No hay token → mandar al login
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}
