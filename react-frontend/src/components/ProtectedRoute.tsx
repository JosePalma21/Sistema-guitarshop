import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("auth_token");

  // Si NO hay token → login inmediato
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Validar expiración del token
  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));
    const now = Date.now() / 1000;

    if (payload.exp < now) {
      // Token expirado
      localStorage.removeItem("auth_token");
      return <Navigate to="/login" replace />;
    }
  } catch {
    // Token inválido o roto
    localStorage.removeItem("auth_token");
    return <Navigate to="/login" replace />;
  }

  // Si está OK → renderizar rutas hijas
  return <Outlet />;
}
